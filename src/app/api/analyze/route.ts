import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { analyzeProduct } from "@/lib/gemini/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const report = await analyzeProduct(body.product);

    return NextResponse.json({ report });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid analyze request.", details: error.flatten() },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected analyze error.",
      },
      { status: 500 },
    );
  }
}
