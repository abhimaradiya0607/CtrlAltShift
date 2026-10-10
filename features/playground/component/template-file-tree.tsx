"use client";
import React from 'react'
import { FilePlus, FolderPlus, Plus } from "lucide-react"
import { SidebarMenu } from '@/components/ui/sidebar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import TemplateNode from './template-node';

interface TemplateFile {
    filename: string
    fileExtension: string
    content: string
  }
  
interface TemplateFolder {
    folderName: string
    items: (TemplateFile | TemplateFolder)[]
  }
  
  type TemplateItem = TemplateFile | TemplateFolder
  

interface TemplateFileTreeProps {
    data: TemplateItem | null
    onFileSelect?: (file: TemplateFile) => void
    selectedFile?: TemplateFile
    title?: string
    onAddFile?: (file: TemplateFile,parentPath:string) => void
    onAddFolder?: (folder: TemplateFolder,parentPath:string) => void
    onDeleteFile?: (file: TemplateFile,parentPath:string) => void
    onDeleteFolder?: (folder: TemplateFolder,parentPath:string) => void
    onRenameFile?: (file: TemplateFile,newFilename:string,newExtension:string,parentPath:string) => void
    onRenameFolder?: (folder: TemplateFolder,newFoldername:string,parentPath:string) => void
  }

const TemplateFileTree = ({data,
    onFileSelect,
    selectedFile,
    title,
    onAddFile,
    onAddFolder,
    onDeleteFile,
    onDeleteFolder,
    onRenameFile,
    onRenameFolder}:TemplateFileTreeProps) => {
        const isRootFolder=data && typeof data === "object" && "folderName" in data;
  return (
    <aside className="flex h-svh w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
        <div className="flex h-10 shrink-0 items-center justify-between border-b px-3">
            <span className="text-sm font-medium">{title ?? "File Explorer"}</span>
            <DropdownMenu>
                <DropdownMenuTrigger
                    className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-sidebar-accent"
                    title="Add file or folder"
                >
                    <Plus className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {}}>
                        <FilePlus className="h-4 w-4 mr-2" />
                        New File
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {}}>
                        <FolderPlus className="h-4 w-4 mr-2" />
                        New Folder
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
            <SidebarMenu>
                {!data ? null : isRootFolder ? (
                    (data as TemplateFolder).items.map((child, index) => (
                        <TemplateNode
                            key={index}
                            item={child}
                            onFileSelect={onFileSelect}
                            selectedFile={selectedFile}
                            onAddFile={onAddFile}
                            onAddFolder={onAddFolder}
                            onDeleteFile={onDeleteFile}
                            onDeleteFolder={onDeleteFolder}
                            onRenameFile={onRenameFile}
                            onRenameFolder={onRenameFolder}
                            level={0}
                            path=""
                        />
                    ))
                ) : (
                    <TemplateNode
                        item={data}
                        onFileSelect={onFileSelect}
                        selectedFile={selectedFile}
                        onAddFile={onAddFile}
                        onAddFolder={onAddFolder}
                        onDeleteFile={onDeleteFile}
                        onDeleteFolder={onDeleteFolder}
                        onRenameFile={onRenameFile}
                        onRenameFolder={onRenameFolder}
                        level={0}
                        path=""
                    />
                )}
            </SidebarMenu>
        </div>
    </aside>
  )
}

export default TemplateFileTree