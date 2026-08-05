import { Router } from "express";
import { callClaude, callClaudeForJSON } from "../services/claudeService.js";
import {
  REPORT_TYPES,
  REPORT_TYPE_GUIDANCE,
  RESEARCH_AREAS,
  GOALS,
  REGIONS,
  CURATED_DOMAINS,
  buildContextLine,
} from "../config/constants.js";

const router = Router();

function badRequest(res, message) {
  return res.status(400).json({ error: message });
}

function validateContext(context = {}) {
  const { areas = [], goal = "", region = "" } = context;
  if (!Array.isArray(areas) || areas.some((a) => !RESEARCH_AREAS.includes(a))) {
    return "Invalid research area(s)";
  }
  if (goal && !GOALS.includes(goal)) return "Invalid goal";
  if (region && !REGIONS.includes(region)) return "Invalid region";
  return null;
}

/**
 * POST /api/plan
 * body: { topic: string, depth: number (1-5), context: { areas, goal, region, countries, timeline } }
 * returns: { subquestions: string[] }
 */
router.post("/plan", async (req, res) => {
  const { topic, depth = 3, context = {} } = req.body;
  if (!topic || typeof topic !== "string") return badRequest(res, "topic is required");
  const clampedDepth = Math.min(5, Math.max(1, Number(depth) || 3));
  const contextError = validateContext(context);
  if (contextError) return badRequest(res, contextError);

  try {
    const contextLine = buildContextLine(context);
    const plan = await callClaudeForJSON(
      `You are a research planning assistant specialized exclusively in fashion and its related industries (apparel, luxury goods, textiles and materials, beauty, retail, fashion tech, sustainability, fashion culture/media). ${contextLine}\n` +
        `Given a research topic, break it into exactly ${clampedDepth} focused, non-overlapping sub-questions that together build a well-rounded understanding of the topic, aligned with the research areas, goal, geographic focus, and timeline above. If the topic is not naturally about fashion, reframe the sub-questions toward its fashion/style/apparel angle. Topic: "${topic}". ` +
        `Write the sub-questions in Romanian. ` +
        `Respond with ONLY valid JSON, no markdown fences, no preamble: {"subquestions": ["...", "...", "..."]} (the array must have exactly ${clampedDepth} items)`
    );
    if (!Array.isArray(plan.subquestions) || plan.subquestions.length === 0) {
      throw new Error("Model did not return a usable subquestions array");
    }
    res.json({ subquestions: plan.subquestions });
  } catch (err) {
    console.error("[/api/plan]", err);
    res.status(502).json({ error: "Failed to generate research plan", detail: err.message });
  }
});

/**
 * POST /api/search
 * body: { question: string, topic: string, context: {...} }
 * returns: { answer: string, sources: [{title, url}] }
 */
router.post("/search", async (req, res) => {
  const { question, topic, context = {}, curatedOnly = true } = req.body;
  if (!question || !topic) return badRequest(res, "question and topic are required");
  const contextError = validateContext(context);
  if (contextError) return badRequest(res, contextError);

  try {
    const contextLine = buildContextLine(context);
    const prompt =
      `Research this specific question using web search and give a concise, well-informed answer (3-5 sentences), keeping the framing centered on fashion and related industries: "${question}". ` +
      `Context: part of a larger fashion-industry research project on "${topic}". ${contextLine}\n` +
      `Write the answer in Romanian (source titles can stay in their original language). ` +
      `After researching, respond with ONLY valid JSON, no markdown fences, no preamble: {"answer": "concise answer text", "sources": [{"title": "source title", "url": "source url"}]}. Include 2-4 of the most relevant sources.`;

    let result = await callClaudeForJSON(prompt, {
      webSearch: true,
      allowedDomains: curatedOnly ? CURATED_DOMAINS : null,
    });

    // Curated sources may simply not cover a given sub-question — fall back
    // to the open web rather than returning an empty answer.
    let usedFallback = false;
    if (curatedOnly && (!result.sources || result.sources.length === 0)) {
      result = await callClaudeForJSON(prompt, { webSearch: true, allowedDomains: null });
      usedFallback = true;
    }

    res.json({ answer: result.answer || "", sources: result.sources || [], usedFallback });
  } catch (err) {
    console.error("[/api/search]", err);
    res.status(502).json({ error: "Failed to research sub-question", detail: err.message });
  }
});

/**
 * POST /api/report
 * body: { type: string, topic: string, context: {...}, findings: [{question, answer}] }
 * returns: { executiveSummary, keyFindings, timeline, confidence, followUps }
 */
router.post("/report", async (req, res) => {
  const { type, topic, context = {}, findings = [] } = req.body;
  if (!topic || !type) return badRequest(res, "topic and type are required");
  const typeInfo = REPORT_TYPES.find((t) => t.value === type);
  if (!typeInfo) return badRequest(res, `Unknown report type: ${type}`);
  if (!Array.isArray(findings) || findings.length === 0) return badRequest(res, "findings must be a non-empty array");
  const contextError = validateContext(context);
  if (contextError) return badRequest(res, contextError);

  try {
    const contextLine = buildContextLine(context);
    const guidance = REPORT_TYPE_GUIDANCE[type];
    const findingsBlock = findings.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");

    const report = await callClaudeForJSON(
      `You are producing a "${typeInfo.label}" for a fashion-industry research project. Topic: "${topic}". ${contextLine}\n${guidance}\n\n` +
        `Researched findings for each sub-question:\n\n${findingsBlock}\n\n` +
        `Write all text content in Romanian. ` +
        `Be concise — this must fit in a short response. Respond with ONLY valid JSON, no markdown fences, no preamble, no line breaks inside string values: {"executiveSummary": "2-3 sentences max", "keyFindings": ["...", "...", "..."] (3-4 items, each one sentence), "timeline": [{"period": "...", "event": "..."}] (3-4 entries max, each event one short sentence), "confidence": {"level": "High|Medium|Low", "note": "one short sentence"}, "followUps": ["...", "...", "..."] (exactly 3, each under 12 words)}`
    );
    res.json(report);
  } catch (err) {
    console.error("[/api/report]", err);
    res.status(502).json({ error: "Failed to generate report", detail: err.message });
  }
});

/** GET /api/report-types — lets the frontend fetch the picker options from one source of truth. */
router.get("/report-types", (req, res) => {
  res.json({ reportTypes: REPORT_TYPES });
});

/** GET /api/curated-sources — the domain allowlist used when curatedOnly is true. */
router.get("/curated-sources", (req, res) => {
  res.json({ domains: CURATED_DOMAINS });
});

export default router;
