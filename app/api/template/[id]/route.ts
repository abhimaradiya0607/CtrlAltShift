import {NextRequest,NextResponse} from "next/server";
import path from "path";
import fs from "fs/promises";
import {db} from "@/lib/db";

import{readTemplateStructureFromJson,saveTemplateStructureToJson} from "@/features/playground/lib/path-to-json";
import {templatePaths} from "@/lib/template";

function validateJsonStructure(data:unknown):boolean{
   try {
    JSON.parse(JSON.stringify(data));
    return true;
   } catch (error) {
    console.log(error);
    return false;
   }
}

export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>})
    {
    const {id}=await params;

    if(!id){
        return NextResponse.json({error:"Missing Playground ID "},{status:404});
    }
    const playground=await db.playground.findUnique({
        where:{id},
    });
    if(!playground){
        return NextResponse.json({error:"Playground not found"},{status:404});
    }


    const templateKey= playground.template as keyof typeof templatePaths;
    const templatePath=templatePaths[templateKey];

    if(!templatePath){
        return NextResponse.json({error:"Invalid template type"},{status:404});
    }
    try {
        const inputPath=path.join(process.cwd(),templatePath);
        const outputfile=path.join(process.cwd(),`output/${templateKey}.json`);
      

        await saveTemplateStructureToJson(inputPath,outputfile);
        const result= await readTemplateStructureFromJson(outputfile);
        //validate json structure

        if(!validateJsonStructure(result.items)){
            return NextResponse.json({error:"Invalid JSON structure"},{status:400});
        }

        await fs.unlink(outputfile);

        return Response.json({success:true,templateJSON:result},{status:200});
    } catch (error) {
        console.error("Error reading template structure",error);
        return Response.json({success:false,error:"Failed to read template structure"},{status:500});
    }
    
}
