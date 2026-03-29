import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { identifyProduct } from "@/lib/gemini/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const product = await identifyProduct(body);

    return NextResponse.json({ product });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid identify request.", details: error.flatten() },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected identify error.",
      },
      { status: 500 },
    );
  }
}
