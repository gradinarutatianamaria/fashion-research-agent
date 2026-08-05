import React, { useState } from "react";
import { Search, Loader2, Pin, RotateCcw, ExternalLink, Printer, Download, CheckCircle2, HelpCircle, Library, Trash2, X, Save } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const C = {
  bg: "#1a1a1a",
  headerText: "#e0e0e0",
  card: "#828282",
  text: "#ffffff",
  textSoft: "#f0f0f0",
  option: "rgba(255,255,255,0.12)",
  optionBorder: "rgba(255,255,255,0.15)",
  optionHover: "rgba(255,255,255,0.2)",
  optionSelected: "rgba(255,255,255,0.3)",
  faint: "rgba(255,255,255,0.5)",
  dot: "rgba(255,255,255,0.3)",
  button: "rgba(255,255,255,0.85)",
  buttonText: "#333333",
};

const AREA_COLORS = {
  "Fashion Design": "#5b9bd5",
  "Marketing & Branding": "#ed7d31",
  "Fashion Technology": "#70ad47",
  Sustainability: "#a9d18e",
  "History & Archives": "#8ea9db",
  Craftsmanship: "#f4b183",
};

const RESEARCH_AREAS = [
  { emoji: "👗", label: "Fashion Design" },
  { emoji: "📈", label: "Marketing & Branding" },
  { emoji: "💻", label: "Fashion Technology" },
  { emoji: "🌱", label: "Sustainability" },
  { emoji: "🏛️", label: "History & Archives" },
  { emoji: "✂️", label: "Craftsmanship" },
];

const GOALS = ["Academic research", "Market analysis"];
const REGIONS = ["Europe", "Asia", "Africa", "North and Central America", "South America", "Australia and Oceania", "Global"];
const TIMELINES = ["Last 12 months", "Last 5 years", "Last decade", "All time", "Custom"];

const REPORT_TYPES = [
  { emoji: "📚", label: "Literature Review", value: "literature_review" },
  { emoji: "📄", label: "Executive Summary", value: "executive_summary" },
  { emoji: "📊", label: "SWOT Analysis", value: "swot" },
  { emoji: "🎤", label: "Presentation Outline", value: "presentation_outline" },
  { emoji: "📈", label: "Marketing Report", value: "marketing_report" },
  { emoji: "🌱", label: "Sustainability Report", value: "sustainability_report" },
];

const STEP_ORDER = ["areas", "goal", "region", "timeline", "search", "rating", "feedback"];

const API_BASE = (typeof window !== "undefined" && window.__DOSSIER_API_BASE__) || "http://localhost:3001/api";

async function apiRequest(method, path, body) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(`Can't reach the backend at ${API_BASE}. Is it running?`);
  }
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.error || `Backend error (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}
const apiPost = (path, body) => apiRequest("POST", path, body);
const apiGet = (path) => apiRequest("GET", path);
const apiDelete = (path) => apiRequest("DELETE", path);

/* ---------- shared visual primitives, matching the provided spec ---------- */

function OptionItem({ active, onClick, children, icon, iconColor, big }) {
  return (
    <div
      onClick={onClick}
      className="transition-all"
      style={{
        background: active ? C.optionSelected : C.option,
        border: `1px solid ${active ? "#ffffff" : C.optionBorder}`,
        boxShadow: active ? "0 0 0 1px #ffffff" : "none",
        borderRadius: big ? 14 : 12,
        padding: big ? "36px 24px" : "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        cursor: "pointer",
        fontSize: big ? "1.15rem" : "1.1rem",
        color: C.textSoft,
        userSelect: "none",
      }}
    >
      {icon && (
        <span style={{ fontSize: "1.3rem", width: 24, display: "flex", alignItems: "center", justifyContent: "center", color: iconColor }}>
          {icon}
        </span>
      )}
      <span>{children}</span>
    </div>
  );
}

function Stars({ value, onChange }) {
  return (
    <div className="flex justify-center gap-4" style={{ margin: "40px 0" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          onClick={() => onChange(n)}
          style={{
            fontSize: "2.5rem",
            color: n <= value ? "#ffffff" : "rgba(255,255,255,0.6)",
            cursor: "pointer",
            transition: "color 0.2s, transform 0.2s",
            transform: n <= value ? "scale(1.1)" : "scale(1)",
          }}
        >
          {n <= value ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
}

function ActionButton({ onClick, children, disabled, compact }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: C.button,
        color: C.buttonText,
        border: "none",
        borderRadius: 30,
        padding: compact ? "10px 16px" : "16px",
        fontSize: compact ? "0.85rem" : "1.15rem",
        fontWeight: 500,
        cursor: disabled ? "default" : "pointer",
        width: compact ? "auto" : "100%",
        letterSpacing: "0.02em",
        opacity: disabled ? 0.4 : 1,
        marginTop: compact ? 0 : 24,
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5"
      style={{ background: C.option, color: C.textSoft, border: `1px solid ${C.optionBorder}`, borderRadius: 20, padding: "8px 14px", fontSize: "0.8rem" }}
    >
      {children}
    </button>
  );
}

function NavDots({ step }) {
  const idx = STEP_ORDER.indexOf(step);
  if (idx === -1) return null;
  return (
    <div className="flex justify-center gap-2" style={{ marginTop: 16 }}>
      {STEP_ORDER.map((s, i) => (
        <div key={s} style={{ width: 6, height: 6, borderRadius: "50%", background: i === idx ? "#ffffff" : C.dot, transition: "background-color 0.2s" }} />
      ))}
    </div>
  );
}

function FooterNote({ children }) {
  return (
    <div style={{ textAlign: "center", fontSize: "0.75rem", color: C.faint, marginTop: 24, letterSpacing: "0.02em" }}>
      {children}
    </div>
  );
}

function Card({ children }) {
  return (
    <div
      style={{
        background: C.card,
        width: "100%",
        maxWidth: 640,
        borderRadius: 24,
        padding: "40px 32px 32px 32px",
        boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
        display: "flex",
        flexDirection: "column",
        minHeight: 320,
      }}
    >
      {children}
    </div>
  );
}

function Shell({ step, children }) {
  return (
    <div
      style={{
        background: C.bg,
        color: "#ffffff",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <style>{`
        @media print { .no-print { display: none !important; } }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
      `}</style>
      <div style={{ fontSize: "1.5rem", letterSpacing: "0.05em", marginBottom: 24, fontWeight: 400, textAlign: "center", color: C.headerText }}>
        The Fashion Copilot
      </div>
      {children}
      <NavDots step={step} />
    </div>
  );
}

export default function FashionCopilot() {
  const [step, setStep] = useState("areas");
  const [area, setArea] = useState("");
  const [goal, setGoal] = useState("");
  const [region, setRegion] = useState("");
  const [timeline, setTimeline] = useState("");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [topic, setTopic] = useState("");
  const [depth, setDepth] = useState(3);
  const [curatedOnly, setCuratedOnly] = useState(true);

  const [phase, setPhase] = useState("idle"); // idle|planning|researching|ready|generating|done|error
  const [subquestions, setSubquestions] = useState([]);
  const [error, setError] = useState("");

  const [reportType, setReportType] = useState(null);
  const [report, setReport] = useState(null);

  const [libraryOpen, setLibraryOpen] = useState(false);
  const [library, setLibrary] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState("");
  const [savedId, setSavedId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [sessionRating, setSessionRating] = useState(0);
  const [likedText, setLikedText] = useState("");
  const [improveText, setImproveText] = useState("");

  // brief 250ms delay before advancing on single-select, so the "selected" state is visible first
  const selectAndAdvance = (setter, val, nextStep) => {
    setter(val);
    setTimeout(() => setStep(nextStep), 250);
  };

  const isBusy = phase === "planning" || phase === "researching";

  const buildContext = () => ({
    areas: area ? [area] : [],
    goal,
    region,
    countries: [],
    timeline: timeline === "Custom" ? `Custom (${customFrom || "?"}–${customTo || "?"})` : timeline,
  });

  const reset = () => {
    setStep("areas");
    setArea("");
    setGoal("");
    setRegion("");
    setTimeline("");
    setCustomFrom("");
    setCustomTo("");
    setTopic("");
    setDepth(3);
    setPhase("idle");
    setSubquestions([]);
    setError("");
    setReportType(null);
    setReport(null);
    setSavedId(null);
    setSessionRating(0);
    setLikedText("");
    setImproveText("");
  };

  const runResearch = async () => {
    setError("");
    setReport(null);
    setReportType(null);
    setSubquestions([]);
    setPhase("planning");
    const context = buildContext();
    try {
      const plan = await apiPost("/plan", { topic, depth, context });
      const initialSubs = plan.subquestions.map((q, i) => ({ id: i, question: q, status: "pending", answer: "", sources: [] }));
      setSubquestions(initialSubs);
      setPhase("researching");

      const completedSubs = [...initialSubs];
      for (let i = 0; i < completedSubs.length; i++) {
        setSubquestions((prev) => prev.map((s) => (s.id === i ? { ...s, status: "searching" } : s)));
        const result = await apiPost("/search", { question: completedSubs[i].question, topic, context, curatedOnly });
        completedSubs[i] = { ...completedSubs[i], status: "done", answer: result.answer || "", sources: result.sources || [], usedFallback: !!result.usedFallback };
        setSubquestions((prev) => prev.map((s) => (s.id === i ? completedSubs[i] : s)));
      }
      setPhase("ready");
    } catch (e) {
      setError(e.message || "Something went wrong.");
      setPhase("error");
    }
  };

  const generateReport = async (type) => {
    setReportType(type);
    setPhase("generating");
    setError("");
    try {
      const findings = subquestions.map((s) => ({ question: s.question, answer: s.answer }));
      const rep = await apiPost("/report", { type, topic, context: buildContext(), findings });
      setReport(rep);
      setPhase("done");
    } catch (e) {
      setError(e.message || "Something went wrong.");
      setPhase("error");
    }
  };

  const fetchLibrary = async () => {
    setLibraryLoading(true);
    setLibraryError("");
    try {
      const { dossiers } = await apiGet("/dossiers");
      setLibrary(dossiers);
    } catch (e) {
      setLibraryError(e.message || "Couldn't load your library.");
    } finally {
      setLibraryLoading(false);
    }
  };
  const toggleLibrary = () => {
    const opening = !libraryOpen;
    setLibraryOpen(opening);
    if (opening) fetchLibrary();
  };
  const loadDossier = async (id) => {
    setLibraryError("");
    try {
      const d = await apiGet(`/dossiers/${id}`);
      setTopic(d.topic);
      setDepth(d.depth || 3);
      setArea((d.context?.areas || [])[0] || "");
      setGoal(d.context?.goal || "");
      setRegion(d.context?.region || "");
      setTimeline(d.context?.timeline || "");
      setSubquestions(d.subquestions || []);
      setReportType(d.reportType);
      setReport(d.report);
      setSavedId(d.id);
      setPhase("done");
      setLibraryOpen(false);
    } catch (e) {
      setLibraryError(e.message || "Couldn't open that dossier.");
    }
  };
  const removeDossier = async (id, e) => {
    e.stopPropagation();
    try {
      await apiDelete(`/dossiers/${id}`);
      setLibrary((prev) => prev.filter((d) => d.id !== id));
      if (savedId === id) setSavedId(null);
    } catch (e2) {
      setLibraryError(e2.message || "Couldn't delete that dossier.");
    }
  };
  const saveCurrentDossier = async () => {
    if (!report) return;
    setSaving(true);
    setError("");
    try {
      const record = await apiPost("/dossiers", { topic, depth, context: buildContext(), reportType, report, subquestions });
      setSavedId(record.id);
    } catch (e) {
      setError(e.message || "Couldn't save this dossier.");
    } finally {
      setSaving(false);
    }
  };

  const downloadWordDoc = () => {
    if (!report) return;
    const typeLabel = REPORT_TYPES.find((t) => t.value === reportType)?.label || "Report";
    const findingsHtml = report.keyFindings.map((f) => `<li>${f}</li>`).join("");
    const timelineHtml = (report.timeline || []).map((t) => `<li><strong>${t.period}:</strong> ${t.event}</li>`).join("");
    const followUpsHtml = (report.followUps || []).map((f) => `<li>${f}</li>`).join("");
    const sourcesHtml = subquestions.flatMap((s) => s.sources || []).map((s) => `<li><a href="${s.url}">${s.title || s.url}</a></li>`).join("");
    const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${topic}</title>
      <style>body{font-family:Georgia,serif;color:#1a1a1a;line-height:1.5;}h1{font-size:22pt;margin-bottom:2pt;}h2{font-size:13pt;color:#828282;margin-top:18pt;}.meta{font-size:9pt;color:#828282;font-family:Consolas,monospace;}li{margin-bottom:6pt;}</style></head>
      <body><div class="meta">THE FASHION COPILOT — ${typeLabel.toUpperCase()}</div><h1>${topic}</h1><p>${report.executiveSummary}</p>
      <h2>Key Findings</h2><ul>${findingsHtml}</ul><h2>Timeline</h2><ul>${timelineHtml}</ul>
      <h2>Confidence Assessment</h2><p>${report.confidence?.level}: ${report.confidence?.note}</p>
      <h2>Suggested Follow-up Questions</h2><ul>${followUpsHtml}</ul><h2>Sources</h2><ul>${sourcesHtml}</ul></body></html>`;
    const blob = new Blob(["\ufeff", html], { type: "application/msword" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${topic.slice(0, 40).replace(/[^a-z0-9]+/gi, "-") || "dossier"}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const printDossier = () => window.print();

  const chartData = subquestions.map((s, i) => ({ name: `Q${i + 1}`, sources: (s.sources || []).length }));

  /* ---------------- WIZARD (matches provided HTML step-for-step) ---------------- */

  if (phase === "idle") {
    if (step === "areas") {
      return (
        <Shell step={step}>
          <Card>
            <h2 style={{ fontSize: "1.85rem", fontWeight: 400, marginBottom: 28, color: "#fff" }}>What in fashion are we digging into?</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: "auto" }}>
              {RESEARCH_AREAS.map((a) => (
                <OptionItem key={a.label} active={area === a.label} icon={a.emoji} iconColor={AREA_COLORS[a.label]} onClick={() => selectAndAdvance(setArea, a.label, "goal")}>
                  {a.label}
                </OptionItem>
              ))}
            </div>
            <FooterNote>Pick one to start — you can go deeper from here</FooterNote>
          </Card>
        </Shell>
      );
    }
    if (step === "goal") {
      return (
        <Shell step={step}>
          <Card>
            <h2 style={{ fontSize: "1.85rem", fontWeight: 400, marginBottom: 28, color: "#fff" }}>What is your goal?</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: "auto" }}>
              {GOALS.map((g) => (
                <OptionItem key={g} big active={goal === g} onClick={() => selectAndAdvance(setGoal, g, "region")}>
                  {g}
                </OptionItem>
              ))}
            </div>
          </Card>
        </Shell>
      );
    }
    if (step === "region") {
      return (
        <Shell step={step}>
          <Card>
            <h2 style={{ fontSize: "1.85rem", fontWeight: 400, marginBottom: 28, color: "#fff" }}>Region</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: "auto" }}>
              {REGIONS.map((r) => (
                <OptionItem key={r} active={region === r} onClick={() => selectAndAdvance(setRegion, r, "timeline")}>
                  {r}
                </OptionItem>
              ))}
            </div>
          </Card>
        </Shell>
      );
    }
    if (step === "timeline") {
      return (
        <Shell step={step}>
          <Card>
            <h2 style={{ fontSize: "1.85rem", fontWeight: 400, marginBottom: 28, color: "#fff" }}>Timeline</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: "auto" }}>
              {TIMELINES.map((t) => (
                <OptionItem key={t} active={timeline === t} onClick={() => selectAndAdvance(setTimeline, t, t === "Custom" ? "custom" : "search")}>
                  {t}
                </OptionItem>
              ))}
            </div>
          </Card>
        </Shell>
      );
    }
    if (step === "custom") {
      return (
        <Shell step="timeline">
          <Card>
            <h2 style={{ fontSize: "1.85rem", fontWeight: 400, marginBottom: 28, color: "#fff" }}>Custom timeline</h2>
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <input value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} placeholder="From (e.g. 2015)" className="text-input-field" style={inputStyle} />
              <input value={customTo} onChange={(e) => setCustomTo(e.target.value)} placeholder="To (e.g. 2025)" className="text-input-field" style={inputStyle} />
            </div>
            <ActionButton onClick={() => setStep("search")} disabled={!customFrom || !customTo}>Next</ActionButton>
          </Card>
        </Shell>
      );
    }
    if (step === "search") {
      return (
        <Shell step={step}>
          <Card>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && topic.trim() && runResearch()}
              placeholder="the researched topic"
              style={{ ...inputStyle, marginBottom: 10 }}
            />
            <h2 style={{ fontSize: "1.5rem", marginTop: 10, marginBottom: 10, fontWeight: 400, color: "#fff" }}>Search depth</h2>
            <Stars value={depth} onChange={setDepth} />

            <div onClick={() => setCuratedOnly((v) => !v)} className="flex items-center gap-2" style={{ cursor: "pointer", marginBottom: 8 }}>
              <div style={{ width: 34, height: 18, borderRadius: 10, background: curatedOnly ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)", position: "relative", transition: "background 0.2s" }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#333", position: "absolute", top: 2, left: curatedOnly ? 18 : 2, transition: "left 0.2s" }} />
              </div>
              <span style={{ fontSize: "0.8rem", color: C.faint }}>curated fashion sources only</span>
            </div>

            <ActionButton onClick={runResearch} disabled={!topic.trim()}>Start researching</ActionButton>
            {error && <p style={{ color: "#fff", fontSize: "0.8rem", marginTop: 12 }}>{error}</p>}
            <FooterNote>Your topic isn't shared. We never ask for passwords.</FooterNote>
          </Card>
        </Shell>
      );
    }
  }

  /* ---------------- RESEARCH IN PROGRESS / REPORT / LIBRARY ---------------- */

  return (
    <Shell step={step}>
      <div className="w-full flex justify-center no-print" style={{ maxWidth: 640, marginBottom: 10 }}>
        <button onClick={toggleLibrary} style={{ marginLeft: "auto" }}>
          <GhostButton><Library size={12} /> Library</GhostButton>
        </button>
      </div>

      {libraryOpen && (
        <Card>
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <span style={{ fontSize: "0.75rem", letterSpacing: "0.05em", color: C.faint }}>SAVED DOSSIERS</span>
            <button onClick={() => setLibraryOpen(false)} style={{ color: "#fff" }}><X size={14} /></button>
          </div>
          {libraryLoading && <p style={{ fontSize: "0.8rem", color: C.faint }}>loading…</p>}
          {libraryError && <p style={{ fontSize: "0.8rem", color: "#fff" }}>{libraryError}</p>}
          {!libraryLoading && !libraryError && library.length === 0 && <p style={{ fontSize: "0.8rem", color: C.faint }}>nothing saved yet</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {library.map((d) => {
              const typeInfo = REPORT_TYPES.find((t) => t.value === d.reportType);
              return (
                <div key={d.id} onClick={() => loadDossier(d.id)} className="flex items-center justify-between" style={{ ...optionRowStyle, cursor: "pointer" }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "0.9rem", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{typeInfo?.emoji} {d.topic}</p>
                    <p style={{ fontSize: "0.7rem", color: C.faint }}>{typeInfo?.label} · {new Date(d.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span onClick={(e) => removeDossier(d.id, e)} style={{ color: "#fff", flexShrink: 0 }}><Trash2 size={13} /></span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {isBusy && (
        <Card>
          <p style={{ fontSize: "0.85rem", color: C.faint, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Loader2 size={14} className="animate-spin" /> {phase === "planning" ? "planning the research…" : "researching…"}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {subquestions.map((s, idx) => (
              <div key={s.id} style={optionRowStyle}>
                <p style={{ fontSize: "0.7rem", color: C.faint, marginBottom: 4 }}>
                  {String(idx + 1).padStart(2, "0")} — {s.status === "pending" ? "queued" : s.status === "searching" ? "searching…" : "filed"}
                  {s.usedFallback && <span> · open web</span>}
                </p>
                <p style={{ fontSize: "0.95rem", color: "#fff" }}>{s.question}</p>
                {s.answer && <p style={{ fontSize: "0.9rem", color: C.textSoft, marginTop: 6 }}>{s.answer}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {phase === "ready" && (
        <Card>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 400, marginBottom: 20, color: "#fff" }}>Available Research Outputs</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {REPORT_TYPES.map((t) => (
              <OptionItem key={t.value} onClick={() => generateReport(t.value)}>{t.emoji} {t.label}</OptionItem>
            ))}
          </div>
        </Card>
      )}

      {phase === "generating" && (
        <p style={{ color: "#fff", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 8 }}>
          <Loader2 size={14} className="animate-spin" /> filing the {REPORT_TYPES.find((t) => t.value === reportType)?.label.toLowerCase()}…
        </p>
      )}

      {report && !["rating", "feedback"].includes(step) && (
        <div className="printable-area">
          <Card>
            <div className="flex items-center justify-between no-print" style={{ marginBottom: 16 }}>
              <span style={{ fontSize: "0.75rem", letterSpacing: "0.05em", color: C.faint }}>
                {REPORT_TYPES.find((t) => t.value === reportType)?.label.toUpperCase()}
              </span>
              <div className="flex gap-2">
                <button onClick={saveCurrentDossier} disabled={saving || !!savedId} style={smallBtnStyle}>
                  {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />} {savedId ? "Saved" : "Save"}
                </button>
                <button onClick={printDossier} style={smallBtnStyle}><Printer size={11} /> PDF</button>
                <button onClick={downloadWordDoc} style={smallBtnStyle}><Download size={11} /> .DOC</button>
              </div>
            </div>

            <p style={{ fontSize: "0.85rem", color: C.faint, marginBottom: 4 }}>{topic}</p>
            <p style={{ fontSize: "1.3rem", color: "#fff", marginBottom: 20 }}>{report.executiveSummary}</p>

            <h3 style={sectionLabelStyle}>KEY FINDINGS</h3>
            <ul style={{ marginBottom: 20 }}>
              {report.keyFindings?.map((f, i) => (
                <li key={i} className="flex gap-2" style={{ fontSize: "0.9rem", color: "#fff", marginBottom: 8 }}>
                  <Pin size={13} style={{ marginTop: 3, flexShrink: 0 }} /> <span>{f}</span>
                </li>
              ))}
            </ul>

            {report.timeline?.length > 0 && (
              <>
                <h3 style={sectionLabelStyle}>TIMELINE</h3>
                <div style={{ marginBottom: 20, paddingLeft: 12, borderLeft: `2px solid ${C.optionBorder}` }}>
                  {report.timeline.map((t, i) => (
                    <div key={i} style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: "0.75rem", color: "#fff" }}>{t.period}</span>
                      <p style={{ fontSize: "0.9rem", color: C.textSoft }}>{t.event}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {chartData.length > 0 && (
              <>
                <h3 style={sectionLabelStyle}>RESEARCH COVERAGE</h3>
                <div style={{ height: 150, marginBottom: 20 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.optionBorder} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: C.faint }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: C.faint }} />
                      <Tooltip />
                      <Bar dataKey="sources" fill="#ffffff" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            <h3 style={sectionLabelStyle}>SOURCES &amp; REFERENCES</h3>
            <div className="flex flex-wrap gap-2" style={{ marginBottom: 20 }}>
              {subquestions.flatMap((s) => s.sources || []).map((src, i) => (
                <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" style={{ ...smallBtnStyle, textDecoration: "none" }}>
                  <ExternalLink size={9} /> {src.title || src.url}
                </a>
              ))}
            </div>

            {report.confidence && (
              <div className="flex items-start gap-2" style={{ ...optionRowStyle, marginBottom: 20 }}>
                <CheckCircle2 size={15} style={{ marginTop: 2, flexShrink: 0, color: "#fff" }} />
                <div>
                  <span style={{ fontSize: "0.75rem", color: "#fff" }}>{report.confidence.level} confidence</span>
                  <p style={{ fontSize: "0.9rem", color: C.textSoft }}>{report.confidence.note}</p>
                </div>
              </div>
            )}

            {report.followUps?.length > 0 && (
              <div style={{ paddingTop: 16, marginBottom: 20, borderTop: `1px dashed ${C.optionBorder}` }}>
                <h3 style={{ ...sectionLabelStyle, display: "flex", alignItems: "center", gap: 6 }}><HelpCircle size={12} /> SUGGESTED FOLLOW-UPS</h3>
                <ul>
                  {report.followUps.map((f, i) => (
                    <li key={i} style={{ fontSize: "0.9rem", color: C.textSoft, fontStyle: "italic", marginBottom: 6 }}>— {f}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2 no-print">
              <ActionButton onClick={() => setStep("rating")}>Finish &amp; rate</ActionButton>
            </div>
            <button onClick={reset} className="flex items-center gap-1.5 justify-center no-print" style={{ ...smallBtnStyle, marginTop: 10, width: "100%", justifyContent: "center" }}>
              <RotateCcw size={12} /> New topic
            </button>
          </Card>
        </div>
      )}

      {phase === "done" && step === "rating" && (
        <Card>
          <h2 style={{ fontSize: "1.85rem", fontWeight: 400, marginBottom: 10, color: "#fff" }}>How would you rate this experience?</h2>
          <Stars value={sessionRating} onChange={setSessionRating} />
          <ActionButton onClick={() => setStep("feedback")} disabled={sessionRating === 0}>Next</ActionButton>
        </Card>
      )}

      {phase === "done" && step === "feedback" && (
        <Card>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 400, marginBottom: 12, color: "#fff" }}>What you liked about using this copilot?</h2>
          <textarea value={likedText} onChange={(e) => setLikedText(e.target.value)} style={textareaStyle} />
          <h2 style={{ fontSize: "1.3rem", fontWeight: 400, marginBottom: 12, color: "#fff" }}>What we should improve?</h2>
          <textarea value={improveText} onChange={(e) => setImproveText(e.target.value)} style={textareaStyle} />
          <ActionButton onClick={reset}>Finish</ActionButton>
          <FooterNote>Your feedback isn't shared. We never ask for passwords.</FooterNote>
        </Card>
      )}

      {error && phase === "error" && (
        <Card>
          <p style={{ color: "#fff", fontSize: "0.9rem" }}>{error}</p>
          <ActionButton onClick={() => setPhase("idle")}>Back</ActionButton>
        </Card>
      )}
    </Shell>
  );
}

const inputStyle = {
  background: "rgba(255,255,255,0.12)",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: 12,
  padding: "16px 20px",
  color: "#ffffff",
  fontSize: "1.1rem",
  width: "100%",
  outline: "none",
};

const textareaStyle = { ...inputStyle, height: 100, resize: "none", marginBottom: 20 };

const optionRowStyle = {
  background: "rgba(255,255,255,0.12)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 12,
  padding: "14px 16px",
};

const smallBtnStyle = {
  background: "rgba(255,255,255,0.12)",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "6px 10px",
  fontSize: "0.7rem",
  display: "flex",
  alignItems: "center",
  gap: 4,
  cursor: "pointer",
};

const sectionLabelStyle = { fontSize: "0.75rem", letterSpacing: "0.05em", color: "rgba(255,255,255,0.5)", marginBottom: 8 };
