'use client';
import { TemplateFolder } from '@/features/playground/lib/path-to-json';
import { WebContainer } from '@webcontainer/api';
import React, { useEffect, useState,useCallback } from 'react'
import { transformToWebContainerFormat } from '../hooks/transformer';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

let devServerProcess: { kill: () => void } | null = null;

interface WebContainerPreviewProps {
    templateData: TemplateFolder;
    serverUrl: string;
    isLoading: boolean;
    error: string | null;
    instance: WebContainer | null;
    writeFileSync: (path: string, content: string) => Promise<void>;
    forceResetup?:boolean
}


const WebContainerPreview = ({ templateData, serverUrl, isLoading, error, instance, writeFileSync, forceResetup }: WebContainerPreviewProps) => {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [loadingState,setLoadingState]=useState({
    transforming:false,
    mounting:false,
    installing:false,
    starting:false,
    ready:false,
  });

  const [currentStep,setCurrentStep]=useState(0);
  const totalSteps=4;
  const [setupError,setSetupError]=useState<string | null>(null);
  const [isSetupComplete,setIsSetupComplete]=useState(false);
  const [isSetupInProgress,setIsSetupInProgress]=useState(false);

  useEffect(()=>{
    if(forceResetup){
      setIsSetupComplete(false);
      setIsSetupInProgress(false);
      setPreviewUrl("");
      setCurrentStep(0);
      setLoadingState({
        transforming:false,
        mounting:false,
        installing:false,
        starting:false,
        ready:false,
      });
    }
  },[forceResetup]);

  useEffect(()=>{
     async function setupContainer() {
       //Dont run setup container if its already complete or in progress
       if(!instance|| isSetupComplete|| isSetupInProgress) return;
       try {
        setIsSetupInProgress(true);
        setSetupError(null);

        //step-1 :tarnsform data to webcontainer format
        setLoadingState((prev)=>({
          ...prev,
          transforming:true,
        }));
        setCurrentStep(1);

        //terminal related stuff
         //@ts-ignore
        const files=transformToWebContainerFormat(templateData);
        setLoadingState((prev)=>({
          ...prev,
          transforming:false,
          mounting:true,
        }));
        setCurrentStep(2);
       
        //terminal related stuff

        await instance.mount(files);

        setLoadingState((prev)=>({
          ...prev,
          mounting:false,
          installing:true,
        }));
        setCurrentStep(3);

        const installProcess=await instance.spawn("npm",["install"]);

        installProcess.output.pipeTo(
          new WritableStream({
            write(data){
               //write directly on terminal
            }
          })
        );

        const installExistCode=await installProcess.exit;

        if(installExistCode!=0){
          throw new Error(`Failed to install dependencies: ${installExistCode}`);
        }
        setLoadingState((prev)=>({
          ...prev,
          installing:false,
          starting:true,
        }));
        setCurrentStep(4);

        const packageJson=JSON.parse(await instance.fs.readFile("package.json","utf-8"));
        const scripts=packageJson.scripts ?? {};
        const scriptName=typeof scripts.dev==="string"?"dev":typeof scripts.start==="string"?"start":null;
        if(!scriptName){
          throw new Error("package.json has no dev or start script");
        }

        const startArgs=["run",scriptName];
        const scriptCommand=String(scripts[scriptName]);
        if(/\b(vite|next|astro|ng)\b/.test(scriptCommand) && !scriptCommand.includes("--host")){
          startArgs.push("--","--host","0.0.0.0");
        }

        devServerProcess?.kill();

        const startProcess=await instance.spawn("npm",startArgs);
        devServerProcess=startProcess;
        let serverReady=false;
        let serverOutput="";

        //Listen for server ready event
        instance.on("server-ready",(port:number,url:string)=>{
          serverReady=true;
          console.log(`Server is running on port ${port} at ${url}`);
          setPreviewUrl(url);
          setLoadingState((prev)=>({
            ...prev,
            starting:false,
            ready:true,
          }));
          setIsSetupComplete(true);
          setIsSetupInProgress(false);
        });

        startProcess.output.pipeTo(
          new WritableStream({
            write(data){
              serverOutput+=data;
              if(serverOutput.length>2000){
                serverOutput=serverOutput.slice(-2000);
              }
            }
          })
        );

        startProcess.exit.then((code)=>{
          if(!serverReady && code!==0){
            const details=serverOutput.trim();
            setSetupError(details?`Development server exited with code ${code}\n${details}`:`Development server exited with code ${code}`);
            setIsSetupInProgress(false);
            setLoadingState((prev)=>({
              ...prev,
              starting:false,
            }));
          }
        });
        
        
      } catch (error) {
        console.error("Error setting up container :",error);
        const errorMessage=error instanceof Error ? error.message : String(error);
        setSetupError(errorMessage);
        setIsSetupComplete(false);
        setIsSetupInProgress(false);
        setLoadingState({
          transforming:false,
          mounting:false,
          installing:false,
          starting:false,
          ready:false,
        });
      }
    }
    setupContainer();
  }, [instance,isSetupComplete,isSetupInProgress,templateData]);

    //cleanup function to memory leaks
    useEffect(()=>{
      return ()=>{
        //dont kill processs or cleanup when component is unmounts
        //The web container should presist for acrooss component re-mounts
      }
    },[]);

    if(isLoading){
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md p-6 rounded-lg bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
        <h3 className="text-lg font-medium">Initializing WebContainer...</h3>
        <p className='text-sm text-gray-500 dark:text-gray-400'>Setting up your project environment. This may take a few seconds...</p>
        </div>
      </div>
    }
    if (error || setupError) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-lg max-w-md">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="h-5 w-5" />
              <h3 className="font-semibold">Error</h3>
            </div>
            <p className="text-sm whitespace-pre-wrap">{error || setupError}</p>
          </div>
        </div>
      );
    }

    const getStepIcon = (stepIndex: number) => {
      if (stepIndex < currentStep) {
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      } else if (stepIndex === currentStep) {
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      } else {
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
      }
    };

    const getStepText = (stepIndex: number, label: string) => {
      const isActive = stepIndex === currentStep;
      const isComplete = stepIndex < currentStep;
      
      return (
        <span className={`text-sm font-medium ${
          isComplete ? 'text-green-600' : 
          isActive ? 'text-blue-600' : 
          'text-gray-500'
        }`}>
          {label}
        </span>
      );
    };
    

  return (
  <div className='h-full width-full'>
    {
      !previewUrl ? (
        <div className='h-full flex flex-col'>
          <div className='h-full max-w-md p-6 m-5 rounded-lg bg-white dark:bg-zinc-800 shadow-sm mx-auto'>
            <Loader2 className='h-10 w-10 animate-spin text-primary mx-auto' />
            <h3 className='text-sm text-gray-500 dark:text-gray-400'>Setting up your project environment.</h3>
            <Progress value={(currentStep/totalSteps)*100} className='h-2 mt-2' />
            <div className="space-y-4 mt-6">
              <div className="flex items-center gap-3">
                {getStepIcon(1)}
                {getStepText(1,"Transforming template data")}
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
          <div className="flex-1 p-4 ">
            <h1>Terminal</h1>
          </div>
        </div>
      ) : (
        <div className='h-full flex flex-col'>
          <div className='flex-1'>
            <iframe src={previewUrl} className='w-full h-full border-none' title='WebContainer Preview' />
            
          </div>
          <div className="h-64 border-t ">
            <h1>Terminal Component</h1>
          </div>
        </div>
      )
    }


  </div>
);
}

export default WebContainerPreview;