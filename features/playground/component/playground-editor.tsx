"use client"

import React, {useRef,useEffect,useCallback} from 'react'
import Editor ,{type Monaco} from '@monaco-editor/react'
import { TemplateFile } from '@/lib/generated/prisma/client'
import { getEditorLanguage,configureMonaco,defaultEditorOptions } from '../lib/editor-config'

interface PlaygroundEditorProps {
  activeFile:TemplateFile|undefined
  content:string
  onContentChange: (value: string) => void
}

const PlaygroundEditor = ({activeFile,content,onContentChange}:PlaygroundEditorProps) => {
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<Monaco | null>(null)

  const handleEditorDidMount = (editor:any,monaco:Monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    configureMonaco(monaco);
    updateEditorLanguage();

  }
  const updateEditorLanguage=()=>{
    if(!activeFile || !editorRef.current||!monacoRef.current) return;

    const model = editorRef.current.getModel();
    if(model){
      return;
    }           //@ts-ignore
    const language = getEditorLanguage(activeFile.fileExtension||"");
    try {
      monacoRef.current.editor.setModelLanguage(model,language);
    } catch (error) {
      console.warn("Failed to set language:",error);
    }

  }

  useEffect(()=>{
    updateEditorLanguage();
  },[activeFile]);

  useEffect(()=>{
    updateEditorLanguage();
  },[activeFile]);

  
  

  return (
    <div className='h-full position-relative'>
     {/*todo:AI thinking bubble*/}
     <Editor
     height="100%"
     value={content}
     onMount={handleEditorDidMount}
     onChange={(value)=>onContentChange(value||"")}   //@ts-ignore
     language={activeFile?getEditorLanguage(activeFile.fileExtension||""):"plaintext"}
     //@ts-ignore
     options={defaultEditorOptions}
     />
      </div>
  )
}

export default PlaygroundEditor