import {useState,useEffect,useCallback} from "react";
import {toast} from "sonner";
import { TemplateFolder } from "../lib/path-to-json";
import { getPlaygroundById, getPlaygroundSavedTemplate, saveUpdatedCode } from "../actions";

interface PlaygroundData{
    id:string;
    title:string;
    name:string;
    description?:string | null;
    template?:string;
}

interface UsePlaygroundReturn{
    playgroundData:PlaygroundData | null;
    templateData:TemplateFolder | null;
    isLoading:boolean;
    error:string | null;
    loadPlayground:()=>Promise<void>;
    saveTemplateData:(data:TemplateFolder)=>Promise<boolean>;
}

function parseTemplateFolder(raw: unknown): TemplateFolder | null {
    if (raw == null) {
        return null;
    }

    let value: unknown = raw;
    if (typeof value === "string") {
        try {
            value = JSON.parse(value);
        } catch {
            return null;
        }
    }

    if (typeof value === "object" && value !== null && "folderName" in value && "items" in value) {
        return value as TemplateFolder;
    }

    if (Array.isArray(value)) {
        return {
            folderName: "Root",
            items: value,
        };
    }

    return null;
}

export const usePlayground=(id:string):UsePlaygroundReturn=>{
    const [playgroundData,setPlaygroundData]=useState<PlaygroundData | null>(null);
    const [templateData,setTemplateData]=useState<TemplateFolder | null>(null);
    const [isLoading,setIsLoading]=useState(false);
    const [error,setError]=useState<string | null>(null);

    const loadPlayground=useCallback(async()=>{
        if(!id){
            return;
        }
        try {
            setIsLoading(true);
            setError(null);
            const data=await getPlaygroundById(id);

            if(!data){
                throw new Error("Playground not found");
            }

            setPlaygroundData(data);

            const savedContent = await getPlaygroundSavedTemplate(id);
            const savedTemplate = parseTemplateFolder(savedContent);
            if (savedTemplate) {
                setTemplateData(savedTemplate);
                toast.success("Template data loaded successfully");
                return;
            }

            const res=await fetch(`/api/template/${id}`);

            if(!res.ok){
                throw new Error("Failed to load template data");
            }

            const templateRes=await res.json();
            const loadedTemplate = parseTemplateFolder(templateRes.templateJSON);

            if (!loadedTemplate) {
                throw new Error("Invalid template data format");
            }

            setTemplateData(loadedTemplate);
            toast.success("Template data loaded successfully");
        } catch (err) {
            console.log(err);
            const message = err instanceof Error ? err.message : "Failed to load template data";
            setError(message);
            toast.error(message);
            setTemplateData(null);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    const saveTemplateData=useCallback(async(data:TemplateFolder)=>{
        try {
            await saveUpdatedCode(id,data);
            setTemplateData(data);
            toast.success("Template data saved successfully");
            return true;
        } catch (error) {
            console.log(error);
            toast.error("Failed to save template data");
            return false;
        }
    }, [id]);

    useEffect(()=>{
        loadPlayground();
    }, [loadPlayground]);

    return {
        playgroundData,
        templateData,
        isLoading,
        error,
        loadPlayground,
        saveTemplateData,
    };
};
