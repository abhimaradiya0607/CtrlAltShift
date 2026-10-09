"use server"

import { db } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { currentUser } from "@/features/auth/actions";
import {TemplateFolder} from "../lib/path-to-json";
import {revalidatePath} from "next/cache";



export const getPlaygroundById=async(id:string)=>{
    try {
        const playground=await db.playground.findUnique({
            where:{id},
            select:{
                id:true,
                title:true,
                description:true,
                template:true,
            },
        })
        if(!playground){
            return null;
        }
        return {
            ...playground,
            name:playground.title,
        };
    } catch (error) {
        console.log(error);
        return null;
    }
}

export const getPlaygroundSavedTemplate=async(id:string)=>{
    try {
        const templateFile=await db.templateFile.findUnique({
            where:{playgroundId:id},
            select:{content:true},
        })
        return templateFile?.content ?? null;
    } catch (error) {
        console.log(error);
        return null;
    }
}

export const saveUpdatedCode=async(playgroundId:string,data:TemplateFolder)=>{
    const user=await currentUser();
    if(!user){
        return null;
    }
    try {
        const updatedPlayground=await db.templateFile.upsert({
           where:{
            playgroundId
           },
           update:{
            content:data as unknown as Prisma.InputJsonValue,
           },
           create:{
            playgroundId,
            content:data as unknown as Prisma.InputJsonValue,
           }
})
        return updatedPlayground;
        
    } catch (error) {
        console.log(error);
        return null;
    }
}