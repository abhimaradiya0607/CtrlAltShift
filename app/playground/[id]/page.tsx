"use client";

import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useParams } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { usePlayground } from "@/features/playground/hooks/usePlayground";
import TemplateFileTree from "@/features/playground/component/template-file-tree";
import { useFileExplorer } from "@/features/playground/hooks/useFileExplorer";
import { useCallback } from "react";

export default function PlaygroundPage(){
    const params=useParams<{id:string}>();
    const id=typeof params.id==="string"?params.id:"";
    const {playgroundData,templateData,isLoading,error,loadPlayground,saveTemplateData}=usePlayground(id);
    
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

      
    return (
        <div className="flex min-h-svh w-full">
            <TemplateFileTree data={templateData!} />
            <SidebarInset className="flex-1">
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <div className="flex min-w-0 flex-1 items-center">
                        <span className="truncate text-sm font-medium">
                            {playgroundData?.title ?? playgroundData?.name ?? (isLoading ? "Loading…" : "Untitled Playground")}
                        </span>
                    </div>
                </header>
            </SidebarInset>
        </div>
    )
}