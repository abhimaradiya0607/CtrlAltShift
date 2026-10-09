"use client";

import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useParams } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { usePlayground } from "@/features/playground/hooks/usePlayground";

export default function PlaygroundPage(){
    const params=useParams<{id:string}>();
    const id=typeof params.id==="string"?params.id:"";
    const {playgroundData,templateData,isLoading,error,loadPlayground,saveTemplateData}=usePlayground(id);
        
    return (
        <div>
            <>
            <SidebarInset>
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
            </>
        </div>
    )
}