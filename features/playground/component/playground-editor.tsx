"use client";

import React, { useRef, useEffect, useCallback } from "react";
import Editor, { type Monaco } from "@monaco-editor/react";
import { TemplateFile } from "@/lib/generated/prisma/client";
import {
  getEditorLanguage,
  configureMonaco,
  defaultEditorOptions,
} from "../lib/editor-config";

interface PlaygroundEditorProps {
  activeFile: TemplateFile | undefined;
  content: string;
  onContentChange: (value: string) => void;
  suggestion: string | null;
  suggestionLoading: boolean;
  suggestionPosition: { line: number; column: number } | null;
  onAcceptSuggestion: (editor: any, monaco: any) => void;
  onRejectSuggestion: (editor: any) => void;
  onTriggerSuggestion: (type: string, editor: any) => void;
}

const PlaygroundEditor = ({
  activeFile,
  content,
  onContentChange,
  suggestion,
  suggestionLoading,
  suggestionPosition,
  onAcceptSuggestion,
  onRejectSuggestion,
  onTriggerSuggestion,
}: PlaygroundEditorProps) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const inlineCompletionProviderRef = useRef<any>(null);
  const currentSuggestionRef = useRef<{
    text: string;
    id: string;
  } | null>(null);

  const isAcceptingSuggestionRef = useRef(false);
  const suggestionAcceptedRef = useRef(false);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tabCommandRef = useRef<{ dispose: () => void } | null>(null);

  const generateSuggestionId = () =>
    `suggestion-${Date.now()}-${Math.random()}`;

  const createInlineCompletionProvider = useCallback(
    (monaco: Monaco) => {
      return {
        provideInlineCompletions: ()=> {
          if(!suggestion || isAcceptingSuggestionRef.current || suggestionAcceptedRef.current) {
            return { items: [] };
          }
          
          const suggestionId = generateSuggestionId();
          currentSuggestionRef.current = {
            text: suggestion,
            id: suggestionId,
          };

          //clean the suggestion text (remove \r characters)
          const cleanedSuggestion = suggestion.replace(/\r/g, "");


          return {
            items: [
              {
                insertText: cleanedSuggestion,
                range: new monaco.Range(
                  editorRef.current.getPosition().lineNumber,
                  editorRef.current.getPosition().column,
                  editorRef.current.getPosition().lineNumber,
                  editorRef.current.getPosition().column,
                ),
                kind: monaco.languages.CompletionItemKind.Text,
                label: `AI Suggestion`,
                detail: `AI Generated Code Suggestion `,
                documentation: `Press tab to accept`,
                filterText: "",
                sortText: "0000",
                insertTextRules:monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              },
            ],
          };
        },
        disposeInlineCompletions: () => {
          console.log("Free inline suggestions called");
        },
      };
    },
    [suggestion],
  );

  //clear current suggestion

  const clearCurrentSuggestion = useCallback(() => {
    console.log("Clearing current suggestion");
    currentSuggestionRef.current = null;
    suggestionAcceptedRef.current = false;

    if (editorRef.current) {
      editorRef.current.trigger(
        "ai",
        "editor.action.inlineSuggest.hide",
        null,
      );
    }
  }, []);

  //accept current suggestion with double acceptance prevetance
  const acceptCurrentSuggestion = useCallback(() => {
      if (
        !editorRef.current ||
        !monacoRef.current ||
        !currentSuggestionRef.current
      ) {
        console.log("Cannot accept suggestion: editor or monaco not ready");
        return false;
      }

      //critical :Prevent double acceptance with immediate flag setting
      if (isAcceptingSuggestionRef.current || suggestionAcceptedRef.current) {
        console.log("Blocked double acceptance attempt");
        return false;
      }

      isAcceptingSuggestionRef.current = true;
      suggestionAcceptedRef.current = true;

      

     

      try {
        const editor=editorRef.current;
        const monaco=monacoRef.current;
        const cleanedSuggestionText = currentSuggestionRef.current?.text.replace(/\r/g, "");
        const position=editor.getPosition();

        //safety prevent duplicate if already

        const modelTextAtCursor=editor.getModel().getValueInRange(new monaco.Range(position.lineNumber,position.column,position.lineNumber,position.column));
        
        if(modelTextAtCursor === cleanedSuggestionText) {
          console.log("Cursor moved from suggestion position");
          return false;
        }

        const range = new monaco.Range(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column,
        );

        editor.executeEdits("ai-suggestion", [
          {
            range: range,
            text: cleanedSuggestionText,
            forceMoveMarkers: true,
          },
        ]);

        const lines = cleanedSuggestionText.split("\n");
        const endLine = position.lineNumber + lines.length - 1;

        const endColumn =
          lines.length == 1
            ? position.column + cleanedSuggestionText.length
            : lines[lines.length - 1].length + 1;

        editor.setPosition({ lineNumber: endLine, column: endColumn });

        clearCurrentSuggestion();

        onAcceptSuggestion(editor, monaco);

        return true;
      } catch (error) {
        console.error("Error accepting suggestion:", error);
        return false;
      } finally {
        //reset flags
        isAcceptingSuggestionRef.current = false;
        //keep accept flag for longer to prevent immediate re-acceptance
        setTimeout(() => {
          suggestionAcceptedRef.current = false;
          console.log("Resetting suggestion accepted flag");
        }, 1000);
      }
    }, [clearCurrentSuggestion, onAcceptSuggestion]);

  const hasActiveSuggestionAtPosition = useCallback(() => {
      if (!editorRef.current || !currentSuggestionRef.current) return false;

      const position = editorRef.current.getPosition();
      const suggestion = currentSuggestionRef.current;

      return (
        position.lineNumber === suggestion.position.line &&
        position.column >= suggestion.position.column &&
        position.column <= suggestion.position.column + 2
      );
    }, []);

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    if(inlineCompletionProviderRef.current) {
      inlineCompletionProviderRef.current.dispose();
    }
    currentSuggestionRef.current = null;

    if(suggestion){
      const language = getEditorLanguage(activeFile?.fileExtension || "");
      const provider = createInlineCompletionProvider(monacoRef.current);

      inlineCompletionProviderRef.current =
        monacoRef.current.languages.registerInlineCompletionsProvider(language, provider);

      setTimeout(() => {
          editorRef.current.trigger("ai", "editor.action.inlineSuggest.trigger", null);
        },50)
    }

    return()=>{
      if(inlineCompletionProviderRef.current) {
        inlineCompletionProviderRef.current.dispose();
        inlineCompletionProviderRef.current = null;
      }
    }
  }, [
    suggestion,
    activeFile,
    createInlineCompletionProvider,
  ]);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.updateOptions({
      ...defaultEditorOptions,
      inlineSuggest: {
        enabled: true,
        model: "prefix",
        suppressSuggestion: true,
      },
      suggest: {
        preview: false,
        showInlineDetails: false,
        insertMode: "replace",
      },
      quickSuggestions: {
        other: true,
        comments: false,
        strings: false,
      },
      cursorSmoothAnimation: "on",
    });

    configureMonaco(monaco);

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
      onTriggerSuggestion("completion", editor);
    });

    if (tabCommandRef.current) {
      tabCommandRef.current.dispose();
    }

    tabCommandRef.current = editor.addAction({
      id: "accept-ai-suggestion",
      label: "Accept AI Suggestion",
      keybindings: [monaco.KeyCode.Tab],
      run: () => {
        if (isAcceptingSuggestionRef.current || suggestionAcceptedRef.current) {
          editor.trigger("keyboard","tab", null);
          return;
        }
        
        if(currentSuggestionRef.current) {
         const accepted = acceptCurrentSuggestion();
         if(accepted) {
          return;
         }
        }
        editor.trigger("keyboard","tab", null);
      },
    });

    editor.addCommand(monaco.KeyCode.Escape, () => {
      if(currentSuggestionRef.current) {
        onRejectSuggestion(editor);
        clearCurrentSuggestion();
      }
    })

    editor.onDidChangeCursorPosition((e: any) => {
      if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);

      if(!isAcceptingSuggestionRef.current && !suggestionLoading && !currentSuggestionRef.current) {
        suggestionTimeoutRef.current = setTimeout(() => {
          onTriggerSuggestion("completion", editor);
        }, 300);
      } 
    });


    editor.onDidChangeModelContent((e: any) => {
      if (isAcceptingSuggestionRef.current) return;

      // If user types while there's a suggestion, clear it (unless it's our insertion)
      if (
        currentSuggestionRef.current &&
        e.changes.length > 0 &&
        !suggestionAcceptedRef.current
      ) {
        const change = e.changes[0];

        // Check if this is our own suggestion insertion
        if (
          change.text === currentSuggestionRef.current.text ||
          change.text === currentSuggestionRef.current.text.replace(/\r/g, "")
        ) {
          console.log("Our suggestion was inserted, not clearing");
          return;
        }

        // User typed something else, clear the suggestion
        console.log("User typed while suggestion active, clearing");
        clearCurrentSuggestion();
      }

      // Trigger context-aware suggestions on certain typing patterns
      const triggers=["\n","{",".","=","(",",",":",";"];
      if (e.changes.length > 0 && triggers.includes(e.changes[0].text)) {
          setTimeout(() => {
            if (
              editorRef.current &&
              !currentSuggestionRef.current &&
              !suggestionLoading
            ) {
              onTriggerSuggestion("completion", editor);
            }
          }, 100); // Small delay to let the change settle
        }
      });

    updateEditorLanguage();
  };

  
  const updateEditorLanguage = () => {
    if (!activeFile || !editorRef.current || !monacoRef.current) return;
    
    const language = getEditorLanguage(activeFile.fileExtension || "");
    try {
      monacoRef.current.editor.setModelLanguage(model, language);
    } catch (error) {
      console.warn("Failed to set language:", error);
    }
  };

  useEffect(() => {
    updateEditorLanguage();
  }, [activeFile]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
      if (inlineCompletionProviderRef.current) {
        inlineCompletionProviderRef.current.dispose();
        inlineCompletionProviderRef.current = null;
      }
      if (tabCommandRef.current) {
        tabCommandRef.current.dispose();
        tabCommandRef.current = null;
      }
    };
  }, []);

  return (
    <div className="h-full position-relative">
      {/*todo:AI thinking bubble*/}
      {suggestionLoading && (
        <div
          className="absolute top-2 left-2 z-10 bg-red-100 dark:bg-red-900 px-2 py-1 rounded text-xs text-red-800 dark:text-red-300
          flex items-center gap-1"
        >
          <div className="size-2 bg-red-500 rounded-full animate-pulse"></div>
          AI Thinking...
        </div>
      )}

      {/*AI suggestion bubble*/}
      {currentSuggestionRef.current && !suggestionLoading && (
        <div
          className="absolute top-2 right-2 z-10 bg-green-100 dark:bg-green-900 px-2 py-1 rounded text-xs
         text-green-700 dark:text-green-300 flex items-center gap-1"
        >
          <div className="size-2 bg-green-500 rounded-full"></div>
          Press Tab to Accept
        </div>
      )}
      <Editor
        height="100%"
        value={content}
        onMount={handleEditorDidMount}
        onChange={(value) => onContentChange(value || "")} //@ts-ignore
        language={
          activeFile
            ? getEditorLanguage(activeFile.fileExtension || "")
            : "plaintext"
        }
        //@ts-ignore
        options={defaultEditorOptions}
      />
    </div>
  );
};

export default PlaygroundEditor;
