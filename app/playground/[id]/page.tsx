"use client";

import { SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Bot,
  BotIcon,
  FileText,
  PanelLeft,
  Plus,
  Save,
  Settings,
  X,
} from "lucide-react";
import { useParams } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { usePlayground } from "@/features/playground/hooks/usePlayground";
import TemplateFileTree from "@/features/playground/component/template-file-tree";
import { useFileExplorer } from "@/features/playground/hooks/useFileExplorer";
import { useCallback, useEffect, useState, useRef } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TemplateFile, TemplateFolder } from "@/features/playground/types";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import PlaygroundEditor from "@/features/playground/component/playground-editor";
import { useWebContainer } from "@/features/webContainers/hooks/usewebContainer";
import WebContainerPreview from "@/features/webContainers/components/web-container-preview";
import LoadingStep from "@/components/ui/loader";
import { findFilePath } from "@/features/playground/lib";
import { toast } from "sonner";
import * as React from "react";
import ToogleAI from "@/features/playground/component/toogle-ai";

export default function PlaygroundPage() {
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);
  const params = useParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const {
    playgroundData,
    templateData,
    isLoading,
    error,
    loadPlayground,
    saveTemplateData,
  } = usePlayground(id);

  const {
    activeFileId,
    closeAllFiles,
    openFile,
    closeFile,
    editorContent,
    updateFileContent,
    handleAddFile,
    handleAddFolder,
    handleDeleteFile,
    handleDeleteFolder,
    handleRenameFile,
    handleRenameFolder,
    openFiles,
    setTemplateData,
    setActiveFileId,
    setPlaygroundId,
    setOpenFiles,
  } = useFileExplorer();

  const { serverUrl,
     isLoading: isContainerLoading, 
     error: containerError, 
     instance, 
     writeFileSync, 
     destroy } = useWebContainer({ templateData :templateData!});

    const lastSyncedContent=useRef<Map<string,string>>(new Map());

  useEffect(() => {
    setPlaygroundId(id);
  }, [id, setPlaygroundId]);

  useEffect(() => {
    if (templateData && !openFiles.length) {
      setTemplateData(templateData);
    }
  }, [templateData, setTemplateData, openFiles.length]);

  const saveTemplateForExplorer = useCallback(
    async (data: TemplateFolder): Promise<void> => {
      const saved = await saveTemplateData(data);
      if (!saved) {
        throw new Error("Failed to save template data");
      }
    },
    [saveTemplateData]
  );

  const wrappedHandleAddFile = useCallback(
    (newFile: TemplateFile, parentPath: string) => {
      return handleAddFile(
        newFile,
        parentPath,
        writeFileSync!,
        instance,
        saveTemplateForExplorer
      );
    },
    [handleAddFile, writeFileSync, instance, saveTemplateForExplorer]
  );

  const wrappedHandleAddFolder = useCallback(
    (newFolder: TemplateFolder, parentPath: string) => {
      return handleAddFolder(
        newFolder,
        parentPath,
        instance,
        saveTemplateForExplorer
      );
    },
    [handleAddFolder, instance, saveTemplateForExplorer]
  );

  const wrappedHandleDeleteFile = useCallback(
    (file: TemplateFile, parentPath: string) => {
      return handleDeleteFile(file, parentPath, saveTemplateForExplorer);
    },
    [handleDeleteFile, saveTemplateForExplorer]
  );

  const wrappedHandleDeleteFolder = useCallback(
    (folder: TemplateFolder, parentPath: string) => {
      return handleDeleteFolder(folder, parentPath, saveTemplateForExplorer);
    },
    [handleDeleteFolder, saveTemplateForExplorer]
  );

  const wrappedHandleRenameFile = useCallback(
    (
      file: TemplateFile,
      newFilename: string,
      newExtension: string,
      parentPath: string
    ) => {
      return handleRenameFile(
        file,
        newFilename,
        newExtension,
        parentPath,
        saveTemplateForExplorer
      );
    },
    [handleRenameFile, saveTemplateForExplorer]
  );

  const wrappedHandleRenameFolder = useCallback(
    (folder: TemplateFolder, newFolderName: string, parentPath: string) => {
      return handleRenameFolder(
        folder,
        newFolderName,
        parentPath,
        saveTemplateForExplorer
      );
    },
    [handleRenameFolder, saveTemplateForExplorer]
  );

  const [explorerOpen, setExplorerOpen] = useState(true);
  const activeFile = openFiles.find((file) => file.id === activeFileId);

  const hasUnsavedChanges = openFiles.some((file) => file.hasUnsavedChanges);

  //   const wrappedHandleAddFile = useCallback(
  //     (newFile: TemplateFile, parentPath: string) => {
  //       return handleAddFile(
  //         newFile,
  //         parentPath,
  //         writeFileSync!,
  //         instance,
  //         saveTemplateData
  //       );
  //     },
  //     [handleAddFile, writeFileSync, instance, saveTemplateData]
  //   );

  //   const wrappedHandleAddFolder = useCallback(
  //     (newFolder: TemplateFolder, parentPath: string) => {
  //       return handleAddFolder(newFolder, parentPath, instance, saveTemplateData);
  //     },
  //     [handleAddFolder, instance, saveTemplateData]
  //   );

  //   const wrappedHandleDeleteFile = useCallback(
  //     (file: TemplateFile, parentPath: string) => {
  //       return handleDeleteFile(file, parentPath, saveTemplateData);
  //     },
  //     [handleDeleteFile, saveTemplateData]
  //   );

  //   const wrappedHandleDeleteFolder = useCallback(
  //     (folder: TemplateFolder, parentPath: string) => {
  //       return handleDeleteFolder(folder, parentPath, saveTemplateData);
  //     },
  //     [handleDeleteFolder, saveTemplateData]
  //   );

  //   const wrappedHandleRenameFile = useCallback(
  //     (
  //       file: TemplateFile,
  //       newFilename: string,
  //       newExtension: string,
  //       parentPath: string
  //     ) => {
  //       return handleRenameFile(
  //         file,
  //         newFilename,
  //         newExtension,
  //         parentPath,
  //         saveTemplateData
  //       );
  //     },
  //     [handleRenameFile, saveTemplateData]
  //   );

  //   const wrappedHandleRenameFolder = useCallback(
  //     (folder: TemplateFolder, newFolderName: string, parentPath: string) => {
  //       return handleRenameFolder(
  //         folder,
  //         newFolderName,
  //         parentPath,
  //         saveTemplateData
  //       );
  //     },
  //     [handleRenameFolder, saveTemplateData]
  //   );

  const handleFileSelect = (file: TemplateFile) => {
    openFile(file);
  };

  const persistFiles = useCallback(
    async (fileIds: string[]) => {
      const explorerTemplate = useFileExplorer.getState().templateData;
      const latestTemplateData =
        explorerTemplate &&
        typeof explorerTemplate === "object" &&
        "items" in explorerTemplate
          ? explorerTemplate
          : templateData;
      const openFilesNow = useFileExplorer.getState().openFiles;
      const filesToSave = openFilesNow.filter((file) => fileIds.includes(file.id));

      if (filesToSave.length === 0) return;
      if (!latestTemplateData || !("items" in latestTemplateData)) {
        throw new Error("Template data is not loaded");
      }

      const updatedTemplateData = JSON.parse(JSON.stringify(latestTemplateData));

      const replaceFileContent = (items: any[], filePath: string, content: string, pathSoFar: string[] = []): any[] =>
        items.map((item) => {
          if ("folderName" in item) {
            return {
              ...item,
              items: replaceFileContent(item.items, filePath, content, [
                ...pathSoFar,
                item.folderName,
              ]),
            };
          }

          const itemPath = [
            ...pathSoFar,
            item.fileExtension
              ? `${item.filename}.${item.fileExtension}`
              : item.filename,
          ].join("/");

          if (itemPath === filePath) {
            return { ...item, content };
          }
          return item;
        });

      for (const fileToSave of filesToSave) {
        const filePath = findFilePath(fileToSave, updatedTemplateData);
        if (!filePath) {
          throw new Error(
            `Could not find file path for ${fileToSave.filename}.${fileToSave.fileExtension}`
          );
        }

        updatedTemplateData.items = replaceFileContent(
          updatedTemplateData.items,
          filePath,
          fileToSave.content
        );

        if (writeFileSync) {
          await writeFileSync(filePath, fileToSave.content);
          lastSyncedContent.current.set(fileToSave.id, fileToSave.content);
        }
      }

      const saved = await saveTemplateData(updatedTemplateData);
      if (!saved) {
        throw new Error("Failed to save template data");
      }

      // saveTemplateData returns a boolean. Keep the folder object in the explorer store.
      setTemplateData(updatedTemplateData);

      const savedById = new Map(filesToSave.map((file) => [file.id, file.content]));
      setOpenFiles(
        useFileExplorer.getState().openFiles.map((file) => {
          const savedContent = savedById.get(file.id);
          if (savedContent === undefined) return file;
          return {
            ...file,
            originalContent: savedContent,
            hasUnsavedChanges: file.content !== savedContent,
          };
        })
      );
    },
    [templateData, writeFileSync, saveTemplateData, setTemplateData, setOpenFiles]
  );

  const handleSave = useCallback(
    async (fileId?: string) => {
      const targetFileId = fileId || activeFileId;
      if (!targetFileId) return;

      const fileToSave = useFileExplorer
        .getState()
        .openFiles.find((file) => file.id === targetFileId);
      if (!fileToSave) return;

      try {
        await persistFiles([targetFileId]);
        toast.success(
          `Saved ${fileToSave.filename}.${fileToSave.fileExtension}`
        );
      } catch (error) {
        console.error("Error saving file:", error);
        toast.error(
          `Failed to save ${fileToSave.filename}.${fileToSave.fileExtension}`
        );
        throw error;
      }
    },
    [activeFileId, persistFiles]
  );

  const handleSaveAll = useCallback(async () => {
    const unsavedFiles = useFileExplorer
      .getState()
      .openFiles.filter((file) => file.hasUnsavedChanges);

    if (unsavedFiles.length === 0) {
      toast.info("No unsaved changes to save");
      return;
    }

    try {
      await persistFiles(unsavedFiles.map((file) => file.id));
      toast.success(`Saved ${unsavedFiles.length} file(s)`);
    } catch (error) {
      console.error("Error saving files:", error);
      toast.error("Failed to save one or more files");
    }
  }, [persistFiles]);

  React.useEffect(() => {
   const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      if (e.shiftKey) {
        handleSaveAll();
      } else {
        handleSave();
      }
    }
   };
   window.addEventListener("keydown",handleKeyDown);
   return () => {
    window.removeEventListener("keydown",handleKeyDown);
   };
  },[handleSave,handleSaveAll]);
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-600 mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()} variant="destructive">
          Try Again
        </Button>
      </div>
    );
  }

  //loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-4">
        <div className="w-full max-w-md p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-6 text-center">
            Loading Playground
          </h2>
          <div className="mb-8">
            <LoadingStep
              currentStep={1}
              step={1}
              label="Loading playground data"
            />
            <LoadingStep
              currentStep={2}
              step={2}
              label="Setting up environment"
            />
            <LoadingStep currentStep={3} step={3} label="Ready to code" />
          </div>
        </div>
      </div>
    );
  }


  return (
    <>
      <TemplateFileTree
        data={templateData!}
        title="File Explorer"
        onFileSelect={handleFileSelect}
        selectedFile={activeFile}
        onAddFile={wrappedHandleAddFile}
        onAddFolder={wrappedHandleAddFolder}
        onDeleteFile={wrappedHandleDeleteFile}
        onDeleteFolder={wrappedHandleDeleteFolder}
        onRenameFile={wrappedHandleRenameFile}
        onRenameFolder={wrappedHandleRenameFolder}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <Button
            variant="ghost"
            size="icon-sm"
            className="-ml-1"
            aria-label={explorerOpen ? "Close sidebar" : "Open sidebar"}
            onClick={() => setExplorerOpen((open) => !open)}
          >
            <PanelLeft />
          </Button>
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex min-w-0 flex-1 flex-col">
            <h1 className="text-sm font-medium">
              {playgroundData?.title ??
                playgroundData?.name ??
                (isLoading ? "Loading…" : "Untitled Playground")}
            </h1>
            <p className="text-xs text-muted-foreground">
              {openFiles.length} File(s) Open
              {hasUnsavedChanges && ". Unsaved Changes"}
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger className="ml-auto">
              <Button
                size={"sm"}
                variant={"outline"}
                aria-label="Save"
                onClick={()=>handleSave()}
                disabled={!activeFile || !activeFile.hasUnsavedChanges}
              >
                <Save className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save (Ctrl + S)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger className="ml-auto">
              <Button
                size={"sm"}
                variant={"outline"}
                aria-label="Save"
                onClick={handleSaveAll}
                disabled={!hasUnsavedChanges}
              >
                <Save className="h-4 w-4" />
                All
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save All (Ctrl + Shift + S)</TooltipContent>
          </Tooltip>
          {/* TODO: Toogle Ai */}

          <ToogleAI
          isEnabled={false}
          onToggle={()=>{}}
          suggestionLoading={false}
          />
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button size={"sm"} variant={"outline"} aria-label="More options">
                <Settings className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsPreviewVisible(true)}>
                {isPreviewVisible ? "Hide Preview" : "Show Preview"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={closeAllFiles}>
                Close All Files
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <div className="h-[calc(100vh-64px)]">
          {openFiles.length > 0 ? (
            <div className="flex h-full flex-col">
              <div className="border-b bg-muted/30">
                <Tabs
                  value={activeFileId || " "}
                  onValueChange={setActiveFileId}
                >
                  <div className="flex items-center justify-between px-4 py-2">
                    <TabsList className="h-8 bg-transparent p-0">
                      {openFiles.map((file) => (
                        <TabsTrigger
                          key={file.id}
                          value={file.id}
                          className="relative h-8 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm group"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="size-3" />
                            <span>
                              {file.filename}.{file.fileExtension}
                            </span>
                            {file.hasUnsavedChanges && (
                              <span className="absolute -right-1 -top-1 size-3 rounded-full bg-yellow-500 animate-pulse" />
                            )}

                            <span
                              className="ml-2 h-4 w-4 hover:bg-destructive hover:text-destructive-foreground rounded-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                closeFile(file.id);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </span>
                          </div>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {openFiles.length > 1 && (
                      <Button
                        size={"sm"}
                        variant={"ghost"}
                        onClick={closeAllFiles}
                        aria-label="More options"
                      >
                        Close All
                      </Button>
                    )}
                  </div>
                </Tabs>
              </div>
              <div className="flex-1">
                <ResizablePanelGroup
                  orientation="horizontal"
                  className="h-full"
                >
                  <ResizablePanel defaultSize={isPreviewVisible ? 50 : 100}>
                    <PlaygroundEditor
                      activeFile={activeFile}
                      content={activeFile?.content || ""}
                      onContentChange={(value) =>
                        activeFileId && updateFileContent(activeFileId, value)
                      }
                    />
                  </ResizablePanel>
                  {isPreviewVisible && (
                    <>
                    <ResizableHandle/>
                    <ResizablePanel defaultSize={50}>
                      <WebContainerPreview 
                      templateData={templateData!} 
                      instance={instance}
                      writeFileSync={writeFileSync}
                      isLoading={isContainerLoading}
                      error={containerError} 
                      serverUrl={serverUrl!}  
                      forceResetup={false}
                      />
                    </ResizablePanel>
                    </>
                  )}
                </ResizablePanelGroup>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full items-center justify-center text-muted-foreground gap-4">
              <FileText className="size-16 text-gray-300" />
              <div className="text-center ">
                <p className="text-lg font-medium">No Files Open</p>
                <p className="text-sm text-gray-500">
                  Select a file from the sidebar to get started
                </p>
              </div>
            </div>
          )}
        </div>
      </SidebarInset>
    </>
  );
}
