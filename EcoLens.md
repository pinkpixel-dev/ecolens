# EcoLens

## Project Overview

- Demo video: https://youtu.be/s3EjDCPtkrY
- Repository: https://github.com/pinkpixel-dev/ecolens
- Live app: https://ecolens.pinkpixel.dev

## Problem Statement

Consumers want to make better purchasing decisions, but sustainability information is often inconsistent, or too technical to use in the moment of purchase. Details about packaging waste, sourcing, materials, and environmental impact may exist somewhere, but they are rarely available in a quick and understandable format for everyday shoppers.

EcoLens addresses this gap by turning a product image or product name into a structured sustainability report. The goal is to give people practical guidance at the moment of decision-making instead of expecting them to research every product on their own.

## UN Sustainable Development Goals

EcoLens primarily supports:

- SDG 12: Responsible Consumption and Production

It also supports:

- SDG 13: Climate Action
- SDG 8: Decent Work and Economic Growth
- SDG 15: Life on Land

The strongest alignment is with SDG 12.8, which focuses on ensuring that people have the information and awareness needed for sustainable lifestyles.

## Solution Summary

EcoLens is a web application that helps users quickly evaluate the sustainability profile of everyday consumer products. A user can upload a product image, type a product name, or use a demo example. EcoLens then identifies the product and generates a structured report that explains environmental impact, ethical sourcing concerns, packaging issues, red flags, and better alternatives.

The experience is designed to be fast, understandable, and useful in real-world shopping scenarios. Rather than showing a single unexplained score, EcoLens breaks the result into sections that help users understand why a product received its rating and what they can do next.

## How AI Is Used

EcoLens uses AI in three ways:

1. Product identification
   Gemini interprets an image, text input, or both and converts that input into a structured product object.

2. Sustainability analysis
   Gemini evaluates the normalized product information and produces a typed sustainability report with scores, assumptions, red flags, and recommendations.

3. Context-aware follow-up chat
   After a report is generated, the user can ask follow-up questions such as why a product scored poorly or which alternative is more sustainable. The chat uses the current report as context so answers stay relevant to the product already analyzed.

AI is not included as a novelty feature. It is the key enabler that makes multimodal product understanding, structured reasoning, and accessible consumer guidance possible in a lightweight application.

## User Flow

1. The user enters a product name or uploads a product image.
2. EcoLens identifies and normalizes the product.
3. EcoLens generates a structured sustainability report.
4. The user reviews scores, concerns, alternatives, and action tips.
5. The user can ask follow-up questions in a report-aware chat.
6. If the product was identified incorrectly, the user can correct it and regenerate the report.

## Impact

EcoLens helps people make more informed purchasing decisions by turning complex sustainability questions into something more usable. Instead of expecting consumers to compare scattered sources across packaging, labor, materials, and emissions, the app presents a single, readable report that highlights the most important tradeoffs.

Potential impact includes:

- helping users avoid high-impact or wasteful products
- making ethical sourcing concerns more visible
- encouraging more sustainable purchasing habits
- improving access to sustainability information for non-experts
- supporting better day-to-day decisions at scale

The long-term value is cumulative. If many small consumer choices become better informed, demand can gradually shift toward products with lower environmental impact, better sourcing practices, and less waste.

## Why It Matters By 2030

By 2030, progress toward sustainability goals will depend not only on governments and companies but also on the choices made by consumers. Everyday decisions around food, fashion, packaging, and household goods all contribute to larger environmental and social outcomes.

EcoLens supports this future by making sustainability guidance more accessible at the point of purchase. It aligns especially well with SDG 12 because it focuses on giving people information they can actually use when making consumption decisions.

## Technical Approach

EcoLens uses a two-pass AI pipeline backed by typed validation.

### Identification Pass

The first pass accepts a product name, an image, or both. Gemini converts that input into a normalized product object that may include fields such as name, brand, category, packaging type, likely materials or ingredients, and confidence.

### Analysis Pass

The second pass takes the normalized product object and generates a structured sustainability report. The JSON output is validated with Zod before it is used by the frontend.

This report includes:

- overall sustainability score
- environmental impact categories
- ethical sourcing notes
- packaging analysis
- red flags
- certifications
- better alternatives
- action tips
- assumptions and confidence

### Follow-Up Chat

Once a report exists, the chat system uses that report as context for follow-up questions. This makes the app feel conversational without requiring a full analysis to run again for every user message.

## Technology Stack

- Next.js 16
- React 19
- TypeScript
- `@google/genai`
- Zod
- ESLint

## Architecture

EcoLens uses a lightweight full-stack architecture:

1. The frontend collects product input from the user.
2. `POST /api/identify` sends the input to Gemini and validates the response against a product schema.
3. `POST /api/analyze` sends the normalized product into a second prompt and validates the resulting `EcoReport`.
4. The frontend renders the report as structured UI sections.
5. `POST /api/chat` answers follow-up questions using the current report as context.

This architecture keeps the product simple while maintaining strong contracts between AI output and the user interface.

## Key Features

- product identification from text or image input
- structured sustainability analysis
- category-based scorecards
- ethical sourcing and packaging breakdowns
- red flags and certifications
- better alternatives
- consumer action tips
- assumptions and confidence display
- follow-up chat
- product correction and regeneration flow

## Research And References

The project was informed by research into:

- the United Nations Sustainable Development Goals, especially SDG 12
- common consumer sustainability concerns around packaging, materials, and sourcing
- multimodal AI workflows for product understanding
- schema validation patterns for reliable AI output handling

The implementation also draws on the official documentation for Gemini, Next.js, React, and Zod.

## Limitations

EcoLens is an MVP and should be understood as an AI-assisted sustainability guidance tool, not a scientific auditing platform.

Current limitations include:

- results are model-assisted rather than manufacturer-verified
- output quality depends on recognizable product information
- the app does not yet integrate live retailer or certification databases
- carbon and sourcing assessments are directional rather than compliance-grade
- coverage is stronger for common consumer goods than niche products

These tradeoffs are reasonable for an MVP focused on fast consumer education, interactive usability, and clear AI-assisted decision support.

## Conclusion

EcoLens shows how AI can make sustainability information more practical and accessible. By translating product inputs into understandable reports with recommendations and follow-up guidance, it helps consumers act on their values in real purchasing moments.

## References

1. United Nations. Sustainable Development Goals. https://sdgs.un.org/goals
2. Google AI. Gemini API documentation. https://ai.google.dev/
3. Next.js Documentation. https://nextjs.org/docs
4. React Documentation. https://react.dev/
5. Zod Documentation. https://zod.dev/
