import { z } from "zod";

const categoryScoreSchema = z.object({
  label: z.string(),
  score: z.number().min(0).max(100),
  summary: z.string(),
});

const sourceSchema = z.object({
  label: z.string(),
  kind: z.enum(["dataset", "heuristic", "model-estimate", "certification", "general-knowledge"]),
  note: z.string(),
});

export const ecoReportSchema = z.object({
  product: z.object({
    name: z.string(),
    brand: z.string().nullable(),
    category: z.string(),
  }),
  summary: z.string(),
  overallScore: z.number().min(0).max(100),
  sdgAlignment: z.object({
    primary: z.string(),
    secondary: z.array(z.string()),
    whyItMatters: z.string(),
  }),
  environmentalImpact: z.object({
    carbonFootprintEstimate: z.string(),
    landWaterBiodiversityNotes: z.array(z.string()),
    scorecard: z.array(categoryScoreSchema),
  }),
  ethicalSourcing: z.object({
    laborRisk: z.string(),
    sourcingNotes: z.array(z.string()),
    score: z.number().min(0).max(100),
  }),
  packaging: z.object({
    packagingType: z.string(),
    recyclability: z.string(),
    notes: z.array(z.string()),
    score: z.number().min(0).max(100),
  }),
  redFlags: z.array(z.string()),
  certifications: z.object({
    likelyHelpful: z.array(z.string()),
    mentionedOrLikelyPresent: z.array(z.string()),
  }),
  alternatives: z.array(
    z.object({
      name: z.string(),
      reason: z.string(),
      betterFor: z.array(z.string()),
    }),
  ),
  consumerTips: z.array(z.string()),
  assumptions: z.array(z.string()),
  confidence: z.object({
    score: z.number().min(0).max(1),
    explanation: z.string(),
  }),
  sources: z.array(sourceSchema),
});

export type EcoReport = z.infer<typeof ecoReportSchema>;
