import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { chatWithEcoReport } from "@/lib/gemini/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await chatWithEcoReport(body);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid chat request.", details: error.flatten() },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected chat error." },
      { status: 500 },
    );
  }
}
