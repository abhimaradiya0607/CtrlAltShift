import { SidebarMenuButton, SidebarMenuItem, SidebarMenuSub } from '@/components/ui/sidebar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronRight, Edit3, File, FilePlus, Folder, FolderPlus, MoreHorizontal, Trash2 } from 'lucide-react'
import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import type { TemplateFile, TemplateFolder, TemplateItem } from '../lib/path-to-json'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface TemplateNodeProps {
    item: TemplateItem
    onFileSelect?: (file: TemplateFile) => void
    selectedFile?: TemplateFile
    level: number
    path?: string
    title?: string
    onAddFile?: (file: TemplateFile,parentPath:string) => void
    onAddFolder?: (folder: TemplateFolder,parentPath:string) => void
    onDeleteFile?: (file: TemplateFile,parentPath:string) => void
    onDeleteFolder?: (folder: TemplateFolder,parentPath:string) => void
    onRenameFile?: (file: TemplateFile,newFilename:string,newExtension:string,parentPath:string) => void
    onRenameFolder?: (folder: TemplateFolder,newFolderName:string,parentPath:string) => void
  }


const TemplateNode = ({
    item,
    onFileSelect,
    selectedFile,
    level,
    path="",   
    title,
    onAddFile,
    onAddFolder,
    onDeleteFile,
    onDeleteFolder,
    onRenameFile,
    onRenameFolder
}:TemplateNodeProps) => {
    const isValidItem=item && typeof item === "object";
    const isFolder =isValidItem && "folderName" in item;

    const[isOpen,setIsOpen]=useState(level<2);
    
    if(!isValidItem){
        return null;
    }

    if(!isFolder){
        const file=item as TemplateFile;
        const filename=`${file.filename}.${file.fileExtension}`;

        return(
            <SidebarMenuItem>
            <div className="flex items-center group" style={{ paddingLeft: `${level * 12}px` }}>
                <SidebarMenuButton
                    className='flex-1'
                    isActive={selectedFile === file}
                    onClick={() => onFileSelect?.(file)}
                >
                    <File className='h-4 w-4 mr-2 shrink-0' />
                    <span className="truncate">{filename}</span>
                </SidebarMenuButton>
                <DropdownMenu>
                    <DropdownMenuTrigger onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                            <Button variant={"ghost"} className='h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity' >
                                <MoreHorizontal className='h-3 w-3'/>
                            </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                        <DropdownMenuItem onClick={() => onRenameFile?.(file, file.filename, file.fileExtension, path)}>
                            <Edit3 className='h-4 w-4 mr-2' />
                            Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator/>
                        <DropdownMenuItem onClick={() => onDeleteFile?.(file, path)} className="text-destructive">
                            <Trash2 className='h-4 w-4 mr-2' />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </SidebarMenuItem>
        );
    }
    else{

      const folder = item as TemplateFolder
      const folderName = folder.folderName;
    const currentPath = path ? `${path}/${folderName}` : folderName;
    
  return (
      <SidebarMenuItem>
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="group/collapsible w-full">
          <div className="flex items-center group" style={{ paddingLeft: `${level * 12}px` }}>
            <CollapsibleTrigger className="flex min-w-0 flex-1">
           <SidebarMenuButton className='flex-1'>
            <ChevronRight className={cn("h-4 w-4 shrink-0 transition-transform duration-200 ease-out", isOpen && "rotate-90")} />
            <Folder className='h-4 w-4 mr-2 shrink-0' />
            <span>{folderName}</span>
            </SidebarMenuButton> 
            </CollapsibleTrigger>


            <DropdownMenu>
              <DropdownMenuTrigger onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                            <Button variant={"ghost"} className='h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity' >
                                <MoreHorizontal className='h-3 w-3'/>
                            </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                        <DropdownMenuItem onClick={() => onAddFile?.({ filename: "untitled", fileExtension: "txt", content: "" }, currentPath)}>
                            <FilePlus className='h-4 w-4 mr-2' />
                            New File
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAddFolder?.({ folderName: "new-folder", items: [] }, currentPath)}>
                            <FolderPlus className='h-4 w-4 mr-2' />
                            New Folder
                        </DropdownMenuItem>
                        <DropdownMenuSeparator/>
                        <DropdownMenuItem onClick={() => onRenameFolder?.(folder, folderName, path)}>
                            <Edit3 className='h-4 w-4 mr-2' />
                            Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDeleteFolder?.(folder, path)} className="text-destructive">
                            <Trash2 className='h-4 w-4 mr-2' />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CollapsibleContent>
          <SidebarMenuSub>
            {folder.items.map((childItem, index) => (
              <TemplateNode
                key={index}
                item={childItem}
                level={level + 1}
                path={currentPath}
                onFileSelect={onFileSelect}
                selectedFile={selectedFile}
                onAddFile={onAddFile}
                onAddFolder={onAddFolder}
                onDeleteFile={onDeleteFile}
                onDeleteFolder={onDeleteFolder}
                onRenameFile={onRenameFile}
                onRenameFolder={onRenameFolder}
              />
            ))}
          </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuItem>
    );
  }
}

export default TemplateNode;
