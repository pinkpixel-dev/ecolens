import { z } from "zod";

import { getGeminiClient, getGeminiModel } from "@/lib/gemini/client";
import {
  buildAnalysisPrompt,
  buildEcoChatInstruction,
  buildIdentificationPrompt,
} from "@/lib/gemini/prompts";
import { ecoChatRequestSchema, ecoChatResponseSchema } from "@/lib/schemas/chat";
import {
  identifiedProductSchema,
  productInputSchema,
  type ProductInput,
} from "@/lib/schemas/product";
import { ecoReportSchema } from "@/lib/schemas/report";

function buildContents(input: ProductInput, prompt: string) {
  const contents: Array<Record<string, unknown>> = [];

  if (input.imageBase64 && input.imageMimeType) {
    contents.push({
      inlineData: {
        mimeType: input.imageMimeType,
        data: input.imageBase64,
      },
    });
  }

  contents.push({ text: prompt });

  return contents;
}

export async function identifyProduct(rawInput: unknown) {
  const input = productInputSchema.refine(
    (value) => Boolean(value.productName?.trim() || (value.imageBase64 && value.imageMimeType)),
    "Provide either a product name or an image.",
  ).parse(rawInput);

  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: getGeminiModel(),
    contents: buildContents(input, buildIdentificationPrompt(input)),
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: z.toJSONSchema(identifiedProductSchema),
    },
  });

  return identifiedProductSchema.parse(JSON.parse(response.text ?? "{}"));
}

export async function analyzeProduct(rawProduct: unknown) {
  const product = identifiedProductSchema.parse(rawProduct);
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: getGeminiModel(),
    contents: buildAnalysisPrompt(product),
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: z.toJSONSchema(ecoReportSchema),
    },
  });

  return ecoReportSchema.parse(JSON.parse(response.text ?? "{}"));
}

function getInteractionText(interaction: {
  outputs?: Array<{ type?: string; text?: string }>;
}) {
  const textOutput = interaction.outputs?.find((output) => output.type === "text" && output.text);

  if (!textOutput?.text) {
    throw new Error("Gemini did not return a text response for chat.");
  }

  return textOutput.text;
}

export async function chatWithEcoReport(rawInput: unknown) {
  const input = ecoChatRequestSchema.parse(rawInput);
  const ai = getGeminiClient();
  const interaction = await ai.interactions.create({
    model: getGeminiModel(),
    input: input.message,
    previous_interaction_id: input.previousInteractionId,
    system_instruction: buildEcoChatInstruction(input.report),
    store: true,
    generation_config: {
      thinking_level: "low",
      max_output_tokens: 800,
    },
  });

  return ecoChatResponseSchema.parse({
    reply: getInteractionText(interaction),
    interactionId: interaction.id,
  });
}
