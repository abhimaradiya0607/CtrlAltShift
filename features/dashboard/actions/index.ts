"use server"

import {currentUser} from "@/features/auth/actions"
import {db} from "@/lib/db"
import { Templates } from "@/lib/generated/prisma/enums"
import { revalidatePath } from "next/cache"

export const createPlayground=async (data:{title:string,template:Templates,description?:string}) => {
    const {template,description,title}=data;

    const user=await currentUser();
    if(!user){
        return {error:"Unauthorized"};
    }

    if(!user.id){
        return {error:"User not found"};
    }

    try {
        const playground=await db.playground.create({
            data:{
                title,
                description,
                template,
                userId:user.id,
            },
        });
        return playground;
    } catch (error) {
        console.error(error);
        return {error:"Failed to create playground"};
    }
}

export const getAllPlaygroundForUser=async () => {
    const user=await currentUser();
    if(!user){
        return {error:"Unauthorized"};
    }

    if(!user.id){
        return {error:"User not found"};
    }

    try {
        const playground=await db.playground.findMany({
            where:{
                userId:user.id
            },
            include:{
                user:true,
                Starmark:{
                    where:{
                        userId:user?.id
                    },
                    select:{
                        isMarked:true,
                    }
                }
            }
        })

        return playground;
    } catch (error) {
        console.error(error);
        return {error:"Failed to get all playground for user"};
    }
    
}

export const deleteProjectById=async (id:string) => {
    try {
        await db.playground.delete({
            where:{id}
        })
        revalidatePath("/dashboard");
    } catch (error) {
        console.error(error);
        return {error:"Failed to delete project"};
    }
}

export const editProjectById=async (id:string,data:{title:string,description:string}) => {
    try {
        await db.playground.update({
            where:{id},
            data:data,
        })
        return {success:"Project edited successfully"};
    } catch (error) {
        console.error(error);
        return {error:"Failed to edit project"};
    }
}

export const duplicateProjectById=async (id:string) => {
    try {
        const originalPlayground=await db.playground.findUnique({
            where:{id},
        })

        if(!originalPlayground){
            throw new Error("Playground not found");
        }

        const duplicatedPlayground=await db.playground.create({
            data:{
                title:`${originalPlayground.title} - Copy`,
                description:originalPlayground.description,
                template:originalPlayground.template,
                userId:originalPlayground.userId,
            }
        })
        revalidatePath("/dashboard");
        return duplicatedPlayground;
    } catch (error) {
        console.error(error);
        return {error:"Failed to duplicate project"};
    }
}

