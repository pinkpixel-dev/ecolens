"use client";

import Image from "next/image";
import { useState, useTransition } from "react";

import type { ChatMessage } from "@/lib/schemas/chat";
import type { IdentifiedProduct } from "@/lib/schemas/product";
import type { EcoReport } from "@/lib/schemas/report";

type RequestState = {
  product: IdentifiedProduct | null;
  report: EcoReport | null;
  error: string | null;
};

const demoProducts = [
  "Plastic bottled water",
  "Fast fashion cotton t-shirt",
  "Chocolate snack bar",
];

function fileToBase64(file: File) {
  return new Promise<{ data: string; mimeType: string }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        reject(new Error("Failed to read image."));
        return;
      }

      const [, base64 = ""] = result.split(",");
      resolve({ data: base64, mimeType: file.type || "image/jpeg" });
    };
    reader.onerror = () => reject(new Error("Failed to read image."));
    reader.readAsDataURL(file);
  });
}

function getScoreTone(score: number) {
  if (score >= 75) {
    return { label: "Stronger choice", className: "tone-good" };
  }

  if (score >= 45) {
    return { label: "Mixed impact", className: "tone-warn" };
  }

  return { label: "High concern", className: "tone-bad" };
}

function getImpactHeadline(report: EcoReport) {
  const allScores = [
    report.overallScore,
    report.ethicalSourcing.score,
    report.packaging.score,
    ...report.environmentalImpact.scorecard.map((item) => item.score),
  ];

  return Math.min(...allScores);
}

export function AppShell() {
  const [productName, setProductName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [correctionName, setCorrectionName] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [state, setState] = useState<RequestState>({
    product: null,
    report: null,
    error: null,
  });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatInteractionId, setChatInteractionId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isChatPending, startChatTransition] = useTransition();

  async function runAnalysis(selectedName?: string) {
    startTransition(async () => {
      try {
        setState((current) => ({ ...current, error: null }));
        setIsRegenerating(Boolean(state.report));

        const payload: Record<string, string> = {};
        const effectiveName = (selectedName ?? productName).trim();

        if (effectiveName) {
          payload.productName = effectiveName;
        }

        if (imageFile) {
          const image = await fileToBase64(imageFile);
          payload.imageBase64 = image.data;
          payload.imageMimeType = image.mimeType;
        }

        const identifyResponse = await fetch("/api/identify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const identifyData = await identifyResponse.json();

        if (!identifyResponse.ok) {
          throw new Error(identifyData.error || "Failed to identify product.");
        }

        const analyzeResponse = await fetch("/api/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ product: identifyData.product }),
        });

        const analyzeData = await analyzeResponse.json();

        if (!analyzeResponse.ok) {
          throw new Error(analyzeData.error || "Failed to analyze product.");
        }

        setState({
          product: identifyData.product,
          report: analyzeData.report,
          error: null,
        });
        setCorrectionName(identifyData.product.name);
        setChatMessages([
          {
            role: "assistant",
            content:
              "Your Eco Report is ready. Ask why something was flagged, whether an alternative is better, or what action would reduce the most impact.",
          },
        ]);
        setChatInteractionId(null);
        setChatInput("");
        setIsRegenerating(false);
      } catch (error) {
        setState((current) => ({
          product: current.product,
          report: current.report,
          error: error instanceof Error ? error.message : "Something went wrong.",
        }));
        setIsRegenerating(false);
      }
    });
  }

  async function sendChatMessage() {
    if (!state.report) {
      return;
    }

    const trimmed = chatInput.trim();

    if (!trimmed) {
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: trimmed,
    };

    setChatInput("");
    setChatMessages((current) => [...current, userMessage]);

    startChatTransition(async () => {
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            report: state.report,
            message: trimmed,
            previousInteractionId: chatInteractionId || undefined,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to send chat message.");
        }

        setChatMessages((current) => [
          ...current,
          {
            role: "assistant",
            content: data.reply,
          },
        ]);
        setChatInteractionId(data.interactionId || null);
      } catch (error) {
        setChatMessages((current) => [
          ...current,
          {
            role: "assistant",
            content:
              error instanceof Error
                ? `I hit a snag while answering: ${error.message}`
                : "I hit a snag while answering that question.",
          },
        ]);
      }
    });
  }

  const tone = state.report ? getScoreTone(state.report.overallScore) : null;
  const weakestScore = state.report ? getImpactHeadline(state.report) : null;

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <div className="hero-brand">
            <div className="hero-logo-wrap">
              <Image
                src="/logo.png"
                alt="EcoLens logo"
                className="hero-logo"
                width={120}
                height={120}
                priority
              />
            </div>
            <p className="eyebrow">EcoLens</p>
          </div>
          <h1>Scan what you buy. See what it costs the planet.</h1>
          <p className="lede">
            EcoLens identifies everyday products and turns them into a clear sustainability report
            focused on responsible consumption, climate impact, and sourcing risks.
          </p>
          <div className="badge-row">
            <span>SDG 12</span>
            <span>AI product identification</span>
            <span>Structured sustainability reports</span>
          </div>
        </div>

        <div className="panel-card input-card">
          <label className="field">
            <span>Product name</span>
            <input
              value={productName}
              onChange={(event) => setProductName(event.target.value)}
              placeholder="Try: bottled water, cotton t-shirt, chocolate bar"
            />
          </label>

          <label className="field">
            <span>Product image</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
            />
          </label>

          <button className="primary-button" disabled={isPending} onClick={() => void runAnalysis()}>
            {isPending ? "Analyzing..." : "Generate Eco Report"}
          </button>

          <div className="demo-row">
            {demoProducts.map((demo) => (
              <button
                key={demo}
                className="demo-chip"
                disabled={isPending}
                onClick={() => {
                  setProductName(demo);
                  void runAnalysis(demo);
                }}
                type="button"
              >
                {demo}
              </button>
            ))}
          </div>
        </div>
      </section>

      {state.error ? <p className="error-banner">{state.error}</p> : null}

      <section className="content-grid">
        <article className="panel-card">
          <h2>How the MVP works</h2>
          <ol className="ordered-list">
            <li>Identify a product from text or an uploaded image.</li>
            <li>Normalize the product data for analysis.</li>
            <li>Generate a structured sustainability report with Gemini.</li>
            <li>Show carbon, sourcing, packaging, and better-option guidance.</li>
          </ol>
        </article>

        <article className="panel-card">
          <h2>Why it matters</h2>
          <p>
            EcoLens supports SDG 12 by helping consumers make better choices with more useful
            product transparency. The goal is not perfect certainty. It is better information at the
            moment of purchase.
          </p>
        </article>
      </section>

      {isPending ? (
        <p className="info-banner">
          {isRegenerating
            ? "EcoLens is analyzing your correction and regenerating the report."
            : "EcoLens is analyzing your input and generating the report."}
        </p>
      ) : null}

      {state.product ? (
        <section className="report-stack">
          <article className="panel-card">
            <div className="section-heading">
              <div>
                <p className="metric-label">Identified Product</p>
                <h2>{state.product.name}</h2>
              </div>
              <span className="inline-pill">
                {Math.round(state.product.confidence * 100)}% identification confidence
              </span>
            </div>

            <div className="metric-grid">
              <div>
                <p className="metric-label">Category</p>
                <p>{state.product.category}</p>
              </div>
              <div>
                <p className="metric-label">Brand</p>
                <p>{state.product.brand || "Unknown"}</p>
              </div>
              <div>
                <p className="metric-label">Packaging</p>
                <p>{state.product.packagingType || "Unknown"}</p>
              </div>
              <div>
                <p className="metric-label">Use Case</p>
                <p>{state.product.likelyUseCase}</p>
              </div>
            </div>

            <p className="muted-copy">{state.product.description}</p>

            <div className="tag-row">
              {state.product.materialsOrIngredients.map((item) => (
                <span key={item} className="info-chip">
                  {item}
                </span>
              ))}
            </div>
          </article>

          <article className="panel-card">
            <div className="section-heading">
              <div>
                <p className="metric-label">Correction Flow</p>
                <h3>Fix the detected product and regenerate</h3>
              </div>
              <span className="inline-pill">Best for image misidentification</span>
            </div>
            <p className="muted-copy">
              If EcoLens got the product close but not quite right, enter the correct product name
              here and regenerate a fresh report using your correction as the primary signal.
            </p>
            <div className="chat-input-row">
              <input
                value={correctionName}
                onChange={(event) => setCorrectionName(event.target.value)}
                placeholder="Example: stainless steel insulated water bottle"
              />
              <button
                className="primary-button"
                disabled={isPending || !correctionName.trim()}
                onClick={() => {
                  setProductName(correctionName);
                  void runAnalysis(correctionName);
                }}
                type="button"
              >
                {isPending ? "Regenerating..." : "Regenerate Report"}
              </button>
            </div>
          </article>
        </section>
      ) : null}

      {state.report ? (
        <section className="report-stack">
          <article className="panel-card report-hero">
            <div className="report-hero-copy">
              <div className="section-heading">
                <div>
                  <p className="metric-label">Eco Report</p>
                  <h2>{state.report.product.name}</h2>
                </div>
                <span className={`status-pill ${tone?.className ?? ""}`}>{tone?.label}</span>
              </div>
              <p className="summary-copy">{state.report.summary}</p>
            </div>

            <div className="score-orb">
              <span>{state.report.overallScore}</span>
              <small>of 100</small>
            </div>
          </article>

          <section className="stat-strip">
            <article className="stat-card">
              <p className="metric-label">Environmental weak point</p>
              <h3>{weakestScore}/100</h3>
              <p className="muted-copy">Lowest score across the current report profile.</p>
            </article>
            <article className="stat-card">
              <p className="metric-label">Confidence</p>
              <h3>{Math.round(state.report.confidence.score * 100)}%</h3>
              <p className="muted-copy">{state.report.confidence.explanation}</p>
            </article>
            <article className="stat-card">
              <p className="metric-label">Primary SDG</p>
              <h3>{state.report.sdgAlignment.primary}</h3>
              <p className="muted-copy">{state.report.sdgAlignment.whyItMatters}</p>
            </article>
          </section>

          <div className="content-grid">
            <article className="panel-card">
              <h3>Category Scorecard</h3>
              <div className="score-list">
                {state.report.environmentalImpact.scorecard.map((item) => (
                  <div key={item.label} className="score-row">
                    <div className="score-row-header">
                      <span>{item.label}</span>
                      <strong>{item.score}/100</strong>
                    </div>
                    <div className="score-bar">
                      <span style={{ width: `${item.score}%` }} />
                    </div>
                    <p className="muted-copy compact-copy">{item.summary}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel-card">
              <h3>Environmental Impact</h3>
              <p className="metric-label">Carbon estimate</p>
              <p>{state.report.environmentalImpact.carbonFootprintEstimate}</p>
              <ul className="flat-list">
                {state.report.environmentalImpact.landWaterBiodiversityNotes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="panel-card">
              <h3>Ethical Sourcing</h3>
              <div className="mini-stat">
                <span className="metric-label">Score</span>
                <strong>{state.report.ethicalSourcing.score}/100</strong>
              </div>
              <p className="muted-copy compact-copy">{state.report.ethicalSourcing.laborRisk}</p>
              <ul className="flat-list">
                {state.report.ethicalSourcing.sourcingNotes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="panel-card">
              <h3>Packaging</h3>
              <div className="mini-stat">
                <span className="metric-label">Score</span>
                <strong>{state.report.packaging.score}/100</strong>
              </div>
              <p>{state.report.packaging.packagingType}</p>
              <p className="muted-copy compact-copy">{state.report.packaging.recyclability}</p>
              <ul className="flat-list">
                {state.report.packaging.notes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>

          <div className="content-grid">
            <article className="panel-card">
              <h3>Red Flags</h3>
              <ul className="flat-list">
                {state.report.redFlags.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="panel-card">
              <h3>Better Alternatives</h3>
              <div className="alternative-list">
                {state.report.alternatives.map((alternative) => (
                  <div key={alternative.name} className="alternative-card">
                    <div className="section-heading">
                      <h4>{alternative.name}</h4>
                    </div>
                    <p className="muted-copy compact-copy">{alternative.reason}</p>
                    <div className="tag-row">
                      {alternative.betterFor.map((item) => (
                        <span key={item} className="info-chip">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className="content-grid">
            <article className="panel-card">
              <h3>Certifications To Look For</h3>
              <p className="metric-label">Helpful</p>
              <div className="tag-row">
                {state.report.certifications.likelyHelpful.map((item) => (
                  <span key={item} className="info-chip">
                    {item}
                  </span>
                ))}
              </div>
              <p className="metric-label section-space">Mentioned or likely present</p>
              <ul className="flat-list">
                {state.report.certifications.mentionedOrLikelyPresent.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="panel-card">
              <h3>What You Can Do</h3>
              <ul className="flat-list">
                {state.report.consumerTips.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>

          <div className="content-grid">
            <article className="panel-card">
              <h3>Assumptions</h3>
              <ul className="flat-list">
                {state.report.assumptions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="panel-card">
              <h3>Sources And Reasoning Inputs</h3>
              <div className="source-list">
                {state.report.sources.map((source) => (
                  <div key={`${source.label}-${source.kind}`} className="source-item">
                    <div className="source-topline">
                      <strong>{source.label}</strong>
                      <span className="source-kind">{source.kind}</span>
                    </div>
                    <p className="muted-copy compact-copy">{source.note}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <article className="panel-card">
            <div className="section-heading">
              <div>
                <p className="metric-label">Follow-up Chat</p>
                <h3>Ask EcoLens about this report</h3>
              </div>
              <span className="inline-pill">Report-aware Gemini chat</span>
            </div>
            <p className="muted-copy">
              Use chat to understand the current report. If the product itself is wrong, use the
              correction flow above to regenerate a new report.
            </p>

            <div className="chat-suggestion-row">
              {[
                "Why is this rated so low?",
                "What is the best alternative here?",
                "What one action would reduce the most impact?",
              ].map((prompt) => (
                <button
                  key={prompt}
                  className="demo-chip"
                  disabled={isChatPending}
                  onClick={() => setChatInput(prompt)}
                  type="button"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="chat-thread">
              {chatMessages.map((message, index) => (
                <div
                  key={`${message.role}-${index}-${message.content.slice(0, 16)}`}
                  className={`chat-bubble ${message.role === "user" ? "chat-user" : "chat-assistant"}`}
                >
                  <span className="metric-label">{message.role === "user" ? "You" : "EcoLens"}</span>
                  <p>{message.content}</p>
                </div>
              ))}

              {isChatPending ? (
                <div className="chat-bubble chat-assistant">
                  <span className="metric-label">EcoLens</span>
                  <p>Thinking through the current report...</p>
                </div>
              ) : null}
            </div>

            <div className="chat-input-row">
              <input
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendChatMessage();
                  }
                }}
                placeholder="Ask a follow-up question about this report"
              />
              <button
                className="primary-button"
                disabled={isChatPending || !chatInput.trim()}
                onClick={() => void sendChatMessage()}
                type="button"
              >
                {isChatPending ? "Sending..." : "Ask"}
              </button>
            </div>
          </article>
        </section>
      ) : null}
    </main>
  );
}
