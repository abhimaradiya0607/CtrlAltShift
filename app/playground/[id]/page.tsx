"use client";

import { SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
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
import { useCallback, useEffect, useState } from "react";
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
import { TemplateFile } from "@/features/playground/types";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import PlaygroundEditor from "@/features/playground/component/playground-editor";

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

  useEffect(() => {
    setPlaygroundId(id);
  }, [id, setPlaygroundId]);

  useEffect(() => {
    if (templateData && !openFiles.length) {
      setTemplateData(templateData);
    }
  }, [templateData, setTemplateData,openFiles.length]);

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

  return (
    <>
      <TemplateFileTree
        data={templateData!}
        
        onFileSelect={handleFileSelect}
        selectedFile={activeFile}
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
              {openFiles.length}File(s) Open
              {hasUnsavedChanges && ". Unsaved Changes"}
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger className="ml-auto">
              <Button
                size={"sm"}
                variant={"outline"}
                aria-label="Save"
                onClick={() => {}}
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
                onClick={() => {}}
                disabled={!activeFile || !activeFile.hasUnsavedChanges}
              >
                <Save className="h-4 w-4" />
                All
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save All (Ctrl + Shift + S)</TooltipContent>
          </Tooltip>
          {/* TODO: Toogle Ai */}
          <Tooltip>
            <TooltipTrigger className="ml-auto">
              <Button
                size={"sm"}
                variant={"outline"}
                aria-label="Save"
                onClick={() => {}}
                disabled={!activeFile || !activeFile.hasUnsavedChanges}
              >
                <BotIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle AI</TooltipContent>
          </Tooltip>
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
                    {
                        openFiles.length > 1 && (
                            <Button size={"sm"} variant={"ghost"}  onClick={closeAllFiles}aria-label="More options">
                                Close All
                            </Button>
                        )
                    }
                  </div>
                </Tabs>
              </div>
              <div className="flex-1">
                <ResizablePanelGroup orientation="horizontal" className="h-full">
                    <ResizablePanel defaultSize={isPreviewVisible?50:100}>
                    <PlaygroundEditor activeFile={activeFile} content={activeFile?.content||""} onContentChange={(value)=>activeFileId && updateFileContent(activeFileId,value)}/>
                    </ResizablePanel>
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
