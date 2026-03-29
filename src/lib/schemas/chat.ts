import { z } from "zod";

import { ecoReportSchema } from "@/lib/schemas/report";

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1),
});

export const ecoChatRequestSchema = z.object({
  report: ecoReportSchema,
  message: z.string().trim().min(1),
  previousInteractionId: z.string().trim().min(1).optional(),
});

export const ecoChatResponseSchema = z.object({
  reply: z.string(),
  interactionId: z.string().optional(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type EcoChatRequest = z.infer<typeof ecoChatRequestSchema>;
export type EcoChatResponse = z.infer<typeof ecoChatResponseSchema>;
