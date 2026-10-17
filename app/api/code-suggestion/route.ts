import { type NextRequest, NextResponse } from "next/server";

interface CodeSuggestionRequest {
  fileContent: string;
  cursorLine: number;
  cursorColumn: number;
  suggestionType: string;
  fileName?: string;
}

interface CodeContext {
  language: string;
  framework: string;
  beforeContext: string;
  currentLine: string;
  afterContext: string;
  cursorPosition: { line: number; column: number };
  isInFunction: boolean;
  isInClass: boolean;
  isAfterComment: boolean;
  incompletePatterns: string[];
}

export async function POST(request: Request) {
  try {
    const body: CodeSuggestionRequest = await request.json();

    const { fileContent, cursorLine, cursorColumn, suggestionType, fileName } =
      body;

    // stp-1validate input
    if (!fileContent || !cursorLine || !cursorColumn || !suggestionType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    //stp-2 create code context
    const context = analyzeCodeContext(
      fileContent,
      cursorLine,
      cursorColumn,
      suggestionType,
      fileName,
    );

    //stp-3 Build AI prompt
    const prompt = buildPrompt(context, suggestionType);

    //stp-4 Call ai service
    const suggestion = await generateSuggestion(prompt);

    return NextResponse.json(
      {
        suggestion,
        context,
        metadata: {
          language: context.language,
          framework: context.framework,
          position: context.cursorPosition,
          generatedAt: new Date().toISOString(),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error generating code suggestion:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 },
    );
  }
}
