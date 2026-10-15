
"use client";

import React, { useEffect, useRef, useState } from "react";
import type { TemplateFolder } from "@/features/playground/lib/path-to-json";
import { transformToWebContainerFormat } from "../hooks/transformer";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import TerminalComponent, { type TerminalRef } from "./terminal";
import type {
  WebContainer,
  WebContainerProcess,
} from "@webcontainer/api";

interface WebContainerPreviewProps {
  templateData: TemplateFolder;
  serverUrl: string;
  isLoading: boolean;
  error: string | null;
  instance: WebContainer | null;
  writeFileSync: (path: string, content: string) => Promise<void>;
  forceResetup?: boolean;
}

type LoadingState = {
  transforming: boolean;
  mounting: boolean;
  installing: boolean;
  starting: boolean;
  ready: boolean;
};

type StartCommand = {
  script: string;
  args: string[];
};

const INITIAL_LOADING_STATE: LoadingState = {
  transforming: false,
  mounting: false,
  installing: false,
  starting: false,
  ready: false,
};

const WebContainerPreview: React.FC<WebContainerPreviewProps> = ({
  templateData,
  error,
  instance,
  isLoading,
  serverUrl,
  forceResetup = false,
}) => {
  const [previewUrl, setPreviewUrl] = useState("");
  const [loadingState, setLoadingState] =
    useState<LoadingState>(INITIAL_LOADING_STATE);
  const [currentStep, setCurrentStep] = useState(0);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [isSetupInProgress, setIsSetupInProgress] = useState(false);

  const terminalRef = useRef<TerminalRef>(null);
  const serverProcessRef = useRef<WebContainerProcess | null>(null);
  const removeServerReadyListenerRef = useRef<(() => void) | null>(null);

  const setupCompleteRef = useRef(false);
  const lastTemplateRef = useRef<TemplateFolder | null>(null);
  const setupRunIdRef = useRef(0);
  const setupTaskRef = useRef<Promise<void>>(Promise.resolve());

  const totalSteps = 4;

  const writeTerminal = (message: string) => {
    terminalRef.current?.writeToTerminal(message);
  };

  const resetLoadingState = () => {
    setLoadingState(INITIAL_LOADING_STATE);
  };

  const setStep = (step: number, active: keyof LoadingState) => {
    setCurrentStep(step);
    setLoadingState({
      ...INITIAL_LOADING_STATE,
      [active]: true,
    });
  };

  const clearServerReadyListener = () => {
    removeServerReadyListenerRef.current?.();
    removeServerReadyListenerRef.current = null;
  };

  const stopActiveServer = () => {
    try {
      serverProcessRef.current?.kill();
    } catch {
      // The process may already have stopped.
    }

    serverProcessRef.current = null;
  };

  const streamProcessOutput = async (
    process: WebContainerProcess,
    label: string
  ) => {
    const reader = process.output.getReader();

    try {
      while (true) {
        const { value, done } = await reader.read();

        if (done) break;

        if (value) {
          writeTerminal(value);
        }
      }
    } catch (streamError) {
      console.debug(`WebContainer ${label} output ended:`, streamError);
    } finally {
      try {
        reader.releaseLock();
      } catch {
        // The stream may already have been released.
      }
    }
  };

  const withTimeout = async <T,>(
    promise: Promise<T>,
    timeoutMs: number,
    message: string
  ): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
        }),
      ]);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  };

  const getStartCommand = async (
    container: WebContainer
  ): Promise<StartCommand> => {
    const packageJsonText = await container.fs.readFile(
      "package.json",
      "utf-8"
    );

    let packageJson: { scripts?: Record<string, unknown> };

    try {
      packageJson = JSON.parse(packageJsonText);
    } catch {
      throw new Error("The mounted package.json is not valid JSON.");
    }

    const scripts = packageJson.scripts ?? {};

    const script = ["dev", "start", "serve"].find(
      (name) => typeof scripts[name] === "string" && scripts[name].trim()
    );

    if (!script) {
      throw new Error(
        'No usable "dev", "start", or "serve" script was found in package.json.'
      );
    }

    const scriptCommand = scripts[script] as string;

    // Expose common development servers to WebContainer.
    if (/\bnext\s+(dev|start)\b/.test(scriptCommand)) {
      return {
        script,
        args: ["--", "--hostname", "0.0.0.0"],
      };
    }

    if (
      /\b(vite|astro|webpack-dev-server|ng\s+serve)\b/.test(scriptCommand)
    ) {
      return {
        script,
        args: ["--", "--host", "0.0.0.0"],
      };
    }

    return { script, args: [] };
  };

  useEffect(() => {
    if (serverUrl) {
      setPreviewUrl(serverUrl);
    }
  }, [serverUrl]);

  useEffect(() => {
    if (!forceResetup) return;

    setupRunIdRef.current += 1;
    setupCompleteRef.current = false;
    lastTemplateRef.current = null;

    clearServerReadyListener();
    stopActiveServer();

    setPreviewUrl("");
    setSetupError(null);
    setCurrentStep(0);
    setIsSetupInProgress(false);
    resetLoadingState();
  }, [forceResetup]);

  useEffect(() => {
    if (!instance || !templateData || Object.keys(templateData).length === 0) {
      return;
    }

    const isSameCompletedTemplate =
      setupCompleteRef.current && lastTemplateRef.current === templateData;

    if (isSameCompletedTemplate && !forceResetup) {
      return;
    }

    let cancelled = false;
    const runId = ++setupRunIdRef.current;
    const previousTask = setupTaskRef.current;

    const isCurrentRun = () =>
      !cancelled && setupRunIdRef.current === runId;

    const setupContainer = async () => {
      // Wait for an in-flight setup to finish before mounting another starter.
      await previousTask.catch(() => undefined);

      if (!isCurrentRun()) return;

      clearServerReadyListener();
      stopActiveServer();

      setIsSetupInProgress(true);
      setSetupError(null);
      setPreviewUrl("");
      setCurrentStep(0);
      setupCompleteRef.current = false;

      try {
        writeTerminal("\r\nPreparing project...\r\n");

        setStep(1, "transforming");
        writeTerminal("Transforming template data...\r\n");

        const files = transformToWebContainerFormat(templateData);

        if (!isCurrentRun()) return;

        setStep(2, "mounting");
        writeTerminal("Mounting project files...\r\n");

        // Always mount the selected starter. Do not use an existing
        // package.json as evidence that this starter is already running.
        await withTimeout(
          instance.mount(files),
          30_000,
          "Mounting project files timed out. Check the starter file structure."
        );

        if (!isCurrentRun()) return;

        writeTerminal("Files mounted successfully.\r\n");

        setStep(3, "installing");
        writeTerminal("\r\nInstalling dependencies...\r\n");

        const installProcess = await instance.spawn("npm", ["install"]);
        const installOutput = streamProcessOutput(
          installProcess,
          "npm install"
        );

        const installExitCode = await installProcess.exit;
        await installOutput;

        if (!isCurrentRun()) return;

        if (installExitCode !== 0) {
          throw new Error(
            `Dependency installation failed with exit code ${installExitCode}.`
          );
        }

        writeTerminal("\r\nDependencies installed successfully.\r\n");

        setStep(4, "starting");

        const startCommand = await getStartCommand(instance);

        writeTerminal(
          `\r\nStarting: npm run ${startCommand.script}${
            startCommand.args.length
              ? ` ${startCommand.args.join(" ")}`
              : ""
          }\r\n`
        );

        let serverReady = false;
        let resolveServerReady!: (url: string) => void;

        const serverReadyPromise = new Promise<string>((resolve) => {
          resolveServerReady = resolve;
        });

        // Register before spawning so fast starters cannot miss the event.
        removeServerReadyListenerRef.current = instance.on(
          "server-ready",
          (_port, url) => {
            if (!isCurrentRun()) return;

            serverReady = true;
            resolveServerReady(url);
          }
        );

        const startProcess = await instance.spawn("npm", [
          "run",
          startCommand.script,
          ...startCommand.args,
        ]);

        serverProcessRef.current = startProcess;

        const serverOutput = streamProcessOutput(
          startProcess,
          "development server"
        );

        const startupResult = await Promise.race([
          serverReadyPromise.then((url) => ({
            type: "ready" as const,
            url,
          })),
          startProcess.exit.then((exitCode) => ({
            type: "exit" as const,
            exitCode,
          })),
        ]);

        if (!isCurrentRun()) return;

        if (startupResult.type === "exit") {
          await serverOutput;

          if (!serverReady) {
            throw new Error(
              `The "${startCommand.script}" script exited with code ${startupResult.exitCode} before the preview server became ready. Check the terminal output.`
            );
          }

          return;
        }

        clearServerReadyListener();

        setPreviewUrl(startupResult.url);
        setLoadingState({
          ...INITIAL_LOADING_STATE,
          ready: true,
        });

        setupCompleteRef.current = true;
        lastTemplateRef.current = templateData;

        writeTerminal(`\r\nPreview ready: ${startupResult.url}\r\n`);

        void serverOutput;

        void startProcess.exit.then((exitCode) => {
          if (serverProcessRef.current !== startProcess) return;

          serverProcessRef.current = null;

          if (exitCode !== 0) {
            writeTerminal(
              `\r\nDevelopment server exited with code ${exitCode}.\r\n`
            );
            setSetupError(
              `The development server exited with code ${exitCode}.`
            );
            setupCompleteRef.current = false;
            setIsSetupInProgress(false);
            resetLoadingState();
          }
        });
      } catch (setupFailure) {
        if (!isCurrentRun()) return;

        const message =
          setupFailure instanceof Error
            ? setupFailure.message
            : String(setupFailure);

        console.error("WebContainer setup failed:", setupFailure);
        writeTerminal(`\r\nError: ${message}\r\n`);

        clearServerReadyListener();
        stopActiveServer();

        setSetupError(message);
        setPreviewUrl("");
        setCurrentStep(0);
        setupCompleteRef.current = false;
        resetLoadingState();
      } finally {
        if (isCurrentRun()) {
          setIsSetupInProgress(false);
        }
      }
    };

    const task = setupContainer();
    setupTaskRef.current = task;

    return () => {
      cancelled = true;
      clearServerReadyListener();
    };
  }, [instance, templateData, forceResetup]);

  const getStepIcon = (stepIndex: number) => {
    if (loadingState.ready || stepIndex < currentStep) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }

    if (stepIndex === currentStep && isSetupInProgress) {
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    }

    return (
      <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
    );
  };

  const getStepText = (stepIndex: number, label: string) => {
    const isComplete = loadingState.ready || stepIndex < currentStep;
    const isActive =
      stepIndex === currentStep &&
      isSetupInProgress &&
      !loadingState.ready;

    return (
      <span
        className={`text-sm font-medium ${
          isComplete
            ? "text-green-600"
            : isActive
              ? "text-blue-600"
              : "text-gray-500"
        }`}
      >
        {label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="max-w-md space-y-4 rounded-lg bg-gray-50 p-6 text-center dark:bg-gray-900">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <h3 className="text-lg font-medium">Initializing WebContainer</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Setting up the environment for your project...
          </p>
        </div>
      </div>
    );
  }

  if (error || setupError) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex flex-1 items-center justify-center">
          <div className="max-w-md rounded-lg bg-red-50 p-6 text-red-600 dark:bg-red-900/20 dark:text-red-400">
            <div className="mb-3 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              <h3 className="font-semibold">Preview Error</h3>
            </div>
            <p className="text-sm">{error || setupError}</p>
          </div>
        </div>

        <div className="h-64 shrink-0 border-t">
          <TerminalComponent
            ref={terminalRef}
            webContainerInstance={instance}
            webcontainerUrl={previewUrl}
            theme="dark"
            className="h-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      {!previewUrl ? (
        <div className="flex h-full min-h-0 flex-col">
          <div className="mx-auto m-5 w-full max-w-md rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-800">
            <Progress
              value={(currentStep / totalSteps) * 100}
              className="mb-6 h-2"
            />

            <div className="mb-6 space-y-4">
              <div className="flex items-center gap-3">
                {getStepIcon(1)}
                {getStepText(1, "Transforming template data")}
              </div>

              <div className="flex items-center gap-3">
                {getStepIcon(2)}
                {getStepText(2, "Mounting files")}
              </div>

              <div className="flex items-center gap-3">
                {getStepIcon(3)}
                {getStepText(3, "Installing dependencies")}
              </div>

              <div className="flex items-center gap-3">
                {getStepIcon(4)}
                {getStepText(4, "Starting development server")}
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 p-4">
            <TerminalComponent
              ref={terminalRef}
              webContainerInstance={instance}
              webcontainerUrl={previewUrl}
              theme="dark"
              className="h-full"
            />
          </div>
        </div>
      ) : (
        <div className="flex h-full min-h-0 flex-col">
          <div className="min-h-0 flex-1">
            <iframe
              src={previewUrl}
              className="h-full w-full border-none"
              title="WebContainer Preview"
            />
          </div>

          <div className="h-64 shrink-0 border-t">
            <TerminalComponent
              ref={terminalRef}
              webContainerInstance={instance}
              webcontainerUrl={previewUrl}
              theme="dark"
              className="h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WebContainerPreview;
