import { useState, useRef } from "react";
import * as mammoth from "mammoth";
import { Upload, FileText, Copy, Check, Loader2, RotateCcw } from "lucide-react";

const PDF_JS_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const PDF_WORKER_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="' + src + '"]');
    if (existing) {
      if (existing.dataset.loaded === "true") return resolve();
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load " + src)));
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load " + src));
    document.head.appendChild(script);
  });
}

async function extractPdfText(file) {
  await loadScriptOnce(PDF_JS_URL);
  const pdfjsLib = window.pdfjsLib;
  if (!pdfjsLib) throw new Error("PDF reader unavailable");
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
  const buf = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buf }).promise;
  let fullText = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map((item) => item.str).join(" ") + "\n";
  }
  return fullText.trim();
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Source+Serif+Pro:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

.sct {
  --paper: #EEF0EC;
  --card: #F8F9F6;
  --ink: #17231F;
  --ink-soft: #4E5F58;
  --line: #D3D9CF;
  --gold: #9C7327;
  --gold-soft: #F1E7D2;
  --teal: #2C685D;
  --teal-soft: #E1EDE9;
  --coral: #B94E38;
  --coral-soft: #F5E4DF;
  font-family: 'IBM Plex Sans', system-ui, sans-serif;
  background: var(--paper);
  color: var(--ink);
  min-height: 100%;
  padding: 28px 18px 60px;
  box-sizing: border-box;
}
.sct * { box-sizing: border-box; }
.sct-wrap { max-width: 620px; margin: 0 auto; }

.sct-brandrow {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-bottom: 14px;
}
.sct-mark {
  width: 34px;
  height: 34px;
  border-radius: 4px;
  background: var(--ink);
  color: var(--paper);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Source Serif Pro', Georgia, serif;
  font-weight: 700;
  font-size: 15px;
  letter-spacing: -0.5px;
  flex-shrink: 0;
  position: relative;
}
.sct-mark::after {
  content: "";
  position: absolute;
  left: 6px;
  right: 6px;
  bottom: 5px;
  height: 2px;
  background: var(--gold);
  border-radius: 1px;
}
.sct-wordmark {
  font-family: 'Source Serif Pro', Georgia, serif;
  font-weight: 700;
  font-size: 20px;
  color: var(--ink);
  letter-spacing: -0.2px;
}

.sct-head { margin-bottom: 28px; }
.sct-head p {
  color: var(--ink-soft);
  font-size: 14.5px;
  line-height: 1.55;
  margin: 0;
  max-width: 52ch;
}

.sct-rail {
  display: flex;
  align-items: center;
  margin: 26px 0 32px;
}
.sct-step {
  display: flex;
  align-items: center;
  flex: 1;
}
.sct-dot {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1.5px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
  background: var(--paper);
  color: var(--ink-soft);
}
.sct-dot.done { background: var(--teal); border-color: var(--teal); color: #fff; }
.sct-dot.active { background: var(--ink); border-color: var(--ink); color: #fff; }
.sct-label {
  font-size: 11px;
  color: var(--ink-soft);
  margin-left: 7px;
  white-space: nowrap;
  display: none;
}
.sct-connector { height: 1px; background: var(--line); flex: 1; margin: 0 6px; }
.sct-connector.done { background: var(--teal); }
@media (min-width: 480px) { .sct-label { display: inline; } }

.sct-card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 24px;
  margin-bottom: 16px;
  box-shadow: 0 1px 0 rgba(23, 35, 31, 0.03), 0 6px 20px rgba(23, 35, 31, 0.04);
}
.sct-card h2 {
  font-family: 'Source Serif Pro', Georgia, serif;
  font-size: 19px;
  font-weight: 600;
  margin: 0 0 6px;
}
.sct-sub {
  color: var(--ink-soft);
  font-size: 13.5px;
  margin: 0 0 16px;
  line-height: 1.5;
}

.sct-textarea {
  width: 100%;
  min-height: 180px;
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 12px;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 13.5px;
  line-height: 1.5;
  resize: vertical;
  background: #fff;
  color: var(--ink);
}
.sct-textarea:focus { outline: 2px solid var(--teal); outline-offset: 1px; }

.sct-filerow {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  font-size: 12.5px;
  color: var(--ink-soft);
  flex-wrap: wrap;
  position: relative;
}

.sct-btn {
  font-family: 'IBM Plex Sans', sans-serif;
  font-weight: 600;
  font-size: 14px;
  padding: 11px 20px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  background: var(--ink);
  color: #fff;
  transition: opacity 0.15s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.sct-btn:hover:not(:disabled) { opacity: 0.85; }
.sct-btn:disabled { background: var(--line); color: var(--ink-soft); cursor: not-allowed; }
.sct-btn.secondary { background: transparent; color: var(--ink); border: 1px solid var(--line); }
.sct-btn:focus-visible, .sct-leadtab:focus-visible, .sct-uploadbtn:focus-visible {
  outline: 2px solid var(--teal);
  outline-offset: 2px;
}

.sct-uploadbtn {
  font-family: 'IBM Plex Sans', sans-serif;
  font-weight: 600;
  font-size: 13px;
  padding: 9px 15px;
  border-radius: 4px;
  border: 1px dashed var(--line);
  background: #fff;
  color: var(--ink);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 7px;
}
.sct-uploadbtn:hover { border-color: var(--teal); color: var(--teal); }
.sct-filemeta {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  color: var(--ink-soft);
}

.sct-err {
  background: var(--coral-soft);
  border: 1px solid var(--coral);
  color: var(--coral);
  font-size: 13px;
  padding: 10px 12px;
  border-radius: 4px;
  margin-bottom: 14px;
}
.sct-loading {
  font-size: 13.5px;
  color: var(--ink-soft);
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 4px 0;
}
.sct-spin {
  animation: sctspin 0.8s linear infinite;
  flex-shrink: 0;
}
@keyframes sctspin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .sct-spin { animation-duration: 2.5s; }
}

.sct-tag {
  display: inline-block;
  font-size: 10.5px;
  color: var(--gold);
  background: var(--gold-soft);
  padding: 2px 7px;
  border-radius: 2px;
  margin-top: 5px;
}

.sct-pick {
  border: 1px solid var(--gold);
  background: var(--gold-soft);
  border-radius: 4px;
  padding: 18px;
  margin-bottom: 18px;
}
.sct-pick .sct-eyebrow { font-size: 12px; color: var(--gold); font-weight: 600; margin-bottom: 4px; }
.sct-pick h2 { margin: 0 0 12px; }

.sct-statrow { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
.sct-stat {
  background: #fff;
  border: 1px solid var(--gold);
  border-radius: 4px;
  padding: 7px 12px;
  font-family: 'Source Serif Pro', Georgia, serif;
  font-weight: 600;
  font-size: 14.5px;
  color: var(--ink);
}
.sct-statlabel {
  display: block;
  font-family: 'IBM Plex Sans', sans-serif;
  font-weight: 500;
  font-size: 10.5px;
  color: var(--ink-soft);
  margin-bottom: 2px;
}

.sct-why {
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--ink);
  margin: 0 0 16px;
}

.sct-steps { margin-top: 4px; }
.sct-stepslabel {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink-soft);
  margin-bottom: 6px;
}
.sct-steps ol {
  margin: 0;
  padding-left: 20px;
}
.sct-steps li {
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--ink);
  margin-bottom: 5px;
}

.sct-ranklist { margin-top: 4px; }
.sct-rankrow {
  display: flex;
  gap: 12px;
  border-bottom: 1px solid var(--line);
  padding: 12px 0;
}
.sct-rankrow:last-child { border-bottom: none; }
.sct-ranknum {
  font-family: 'Source Serif Pro', Georgia, serif;
  font-size: 15px;
  font-weight: 600;
  color: var(--ink-soft);
  width: 20px;
  flex-shrink: 0;
}
.sct-rankname { font-weight: 600; font-size: 14px; margin-bottom: 2px; }
.sct-ranknote { font-size: 12.5px; color: var(--ink-soft); line-height: 1.45; }

.sct-hint { font-size: 12.5px; color: var(--ink-soft); }

.sct-lead {
  display: flex;
  gap: 11px;
  align-items: flex-start;
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 12px 14px;
  margin-bottom: 8px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.12s, background 0.12s;
}
.sct-lead.selected { border-color: var(--teal); background: var(--teal-soft); }
.sct-lead input[type="radio"] {
  margin-top: 3px;
  accent-color: var(--teal);
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}
.sct-leadname { font-weight: 600; font-size: 13.5px; margin-bottom: 2px; }
.sct-leadinfo { font-size: 12.5px; color: var(--ink-soft); line-height: 1.45; }
.sct-leadsource { font-size: 11.5px; color: var(--gold); margin-top: 4px; }

.sct-leadtabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
.sct-leadtab {
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 12.5px;
  font-weight: 600;
  padding: 7px 13px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: #fff;
  color: var(--ink-soft);
  cursor: pointer;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
}
.sct-leadtab.active { background: var(--ink); border-color: var(--ink); color: #fff; }

.sct-proposal {
  white-space: pre-wrap;
  font-size: 13.5px;
  line-height: 1.65;
  font-family: 'IBM Plex Sans', sans-serif;
  border: 1px solid var(--line);
  border-top: 3px solid var(--gold);
  background: #fff;
  border-radius: 4px;
  padding: 22px 20px;
  margin-bottom: 14px;
}
.sct-actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.sct-copied { font-size: 12.5px; color: var(--teal); }
`;

const STEPS = ["Resume", "Research", "Best fit", "Proposal"];
const MODEL = "claude-sonnet-4-6";
// While using the built-in Claude.ai artifact API access, this stays as-is.
// Once your Render proxy is deployed, change this to your proxy's full URL,
// e.g. "https://resume-genius-proxy.onrender.com/api/messages"
const API_ENDPOINT = "https://api.anthropic.com/v1/messages";
const MAX_SKILLS_RESEARCHED = 6;
const LEADS_SKILL_COUNT = 3;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callClaude(messages, tools, retries) {
  const maxRetries = typeof retries === "number" ? retries : 2;
  const body = { model: MODEL, max_tokens: 1000, messages };
  if (tools) body.tools = tools;
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const retryable = res.status === 429 || res.status === 500 || res.status === 503 || res.status === 529;
        let detail = "";
        try {
          const errBody = await res.json();
          detail = (errBody && errBody.error && errBody.error.message) || "";
        } catch (parseErr) {
          // ignore, no JSON body to read
        }
        const err = new Error("Request failed (" + res.status + ")" + (detail ? ": " + detail : ""));
        if (retryable && attempt < maxRetries) {
          lastErr = err;
          await wait(700 * (attempt + 1));
          continue;
        }
        throw err;
      }
      const data = await res.json();
      const text = (data.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      return text;
    } catch (err) {
      lastErr = err;
      const isNetworkErr = err instanceof TypeError;
      if ((isNetworkErr || (err.message && err.message.includes("Request failed"))) && attempt < maxRetries) {
        await wait(700 * (attempt + 1));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

function parseJsonLoose(text) {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const isArray = cleaned.trim()[0] === "[";
  const start = cleaned.indexOf(isArray ? "[" : "{");
  const end = isArray ? cleaned.lastIndexOf("]") : cleaned.lastIndexOf("}");
  const slice = start >= 0 && end >= 0 ? cleaned.slice(start, end + 1) : cleaned;
  return JSON.parse(slice);
}

export default function ResumeGenius() {
  const [step, setStep] = useState(1);
  const [resumeText, setResumeText] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileLoading, setFileLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [analyzePhase, setAnalyzePhase] = useState("");
  const [researchProgress, setResearchProgress] = useState({ current: 0, total: 0, label: "" });
  const [analyzeError, setAnalyzeError] = useState("");

  const [skills, setSkills] = useState([]);
  const [research, setResearch] = useState({});
  const [ranking, setRanking] = useState(null);
  const [leadsBySkill, setLeadsBySkill] = useState({});
  const [activeLeadsSkillId, setActiveLeadsSkillId] = useState(null);
  const [selectedLeadId, setSelectedLeadId] = useState(null);

  const [loadingProposal, setLoadingProposal] = useState(false);
  const [proposalError, setProposalError] = useState("");
  const [proposal, setProposal] = useState("");
  const [copied, setCopied] = useState(false);

  function resetAll() {
    setStep(1);
    setResumeText("");
    setFileName("");
    setSkills([]);
    setResearch({});
    setRanking(null);
    setLeadsBySkill({});
    setActiveLeadsSkillId(null);
    setSelectedLeadId(null);
    setProposal("");
    setAnalyzeError("");
    setProposalError("");
  }

  async function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setAnalyzeError("");
    setFileLoading(true);
    const name = file.name.toLowerCase();
    try {
      if (name.endsWith(".pdf")) {
        const text = await extractPdfText(file);
        if (!text) throw new Error("empty");
        setResumeText(text);
      } else if (name.endsWith(".docx")) {
        const buf = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buf });
        if (!result.value) throw new Error("empty");
        setResumeText(result.value);
      } else if (name.endsWith(".doc")) {
        throw new Error("legacy-doc");
      } else {
        const text = await file.text();
        setResumeText(text);
      }
    } catch (err) {
      if (err && err.message === "legacy-doc") {
        setAnalyzeError("Old .doc files can't be read in-browser. Save it as .docx or .pdf and upload again, or paste the text directly.");
      } else {
        setAnalyzeError("Couldn't read that file. Try re-saving it as .docx or .pdf, or paste the resume text directly instead.");
      }
    } finally {
      setFileLoading(false);
    }
  }

  async function analyzeResume() {
    setAnalyzeError("");
    setAnalyzing(true);
    setAnalyzePhase("extracting");
    try {
      const extractPrompt =
        "Read this resume and identify up to " + MAX_SKILLS_RESEARCHED + " marketable skills this person could sell as a freelancer, " +
        "consultant, or contractor. For each, give a short, client-facing skill name (not a resume buzzword), one sentence of evidence " +
        'pulled from the resume, and a category. Return ONLY a JSON array, no other text, in this exact shape: ' +
        '[{"name": "...", "evidence": "...", "category": "..."}]\n\nRESUME:\n' + resumeText;
      const extractText = await callClaude([{ role: "user", content: extractPrompt }]);
      const parsedSkills = parseJsonLoose(extractText);
      const withIds = parsedSkills.slice(0, MAX_SKILLS_RESEARCHED).map((s, i) => ({ id: "s" + i, ...s }));
      setSkills(withIds);

      setAnalyzePhase("researching");
      const results = {};
      for (let i = 0; i < withIds.length; i++) {
        const s = withIds[i];
        setResearchProgress({ current: i + 1, total: withIds.length, label: s.name });
        const researchPrompt =
          "Use web search to research the current market for freelancers and small businesses/entrepreneurs looking to hire for this skill: \"" +
          s.name + "\". Report, in under 180 words: (1) the types of businesses or entrepreneurs who are actively hiring for this right now, " +
          "(2) a current freelance/project rate range in USD, (3) a current full-time salary range in USD for comparable work, " +
          "(4) one sentence on demand trend right now. Be specific with numbers where you find them. Plain prose, no headers.";
        try {
          const text = await callClaude(
            [{ role: "user", content: researchPrompt }],
            [{ type: "web_search_20250305", name: "web_search" }]
          );
          results[s.id] = text || "No research data returned for this skill.";
        } catch (skillErr) {
          results[s.id] = "Couldn't pull live market data for this skill. Ranking below is based on the resume evidence alone for this one.";
        }
      }
      setResearch(results);

      setAnalyzePhase("ranking");
      const bundle = withIds
        .map((s) => "SKILL: " + s.name + "\nEvidence: " + s.evidence + "\nMarket research: " + (results[s.id] || ""))
        .join("\n\n");
      const rankPrompt =
        "Here are skills pulled from a resume, each with research on current demand and pay among entrepreneurs and businesses hiring freelancers. " +
        "Rank ALL of them from most to least valuable in terms of income potential and how easily they can be turned into paid freelance work right now " +
        "(weigh pay, demand, and how easy it is to package as a clear, sellable service). " +
        "For the note on each ranked skill, keep it ONE short plain sentence, no more than 20 words, in plain everyday language a non-expert would understand at a glance. " +
        "For the top-ranked skill, break your reasoning into short, separate, easy-to-scan pieces instead of one long paragraph: " +
        "a rate figure, a demand figure, a 1-2 sentence explanation of why it wins written in plain language, and 3 to 4 short concrete action steps " +
        "(each under 12 words, imperative voice, like a to-do list) for turning it into income starting this week. " +
        "Return ONLY JSON in this exact shape, no other text: {" +
        "\"ranked\": [{\"name\": \"<skill name exactly as given>\", \"note\": \"<one short plain sentence>\"}], " +
        "\"top\": {" +
        "\"rate\": \"<short rate figure, e.g. '$50\u2013$100/hr'>\", " +
        "\"demand\": \"<short demand figure or phrase, e.g. '0.4% unemployment in this field'>\", " +
        "\"why\": \"<1-2 short plain sentences on why this skill wins>\", " +
        "\"steps\": [\"<short action step>\", \"<short action step>\", \"<short action step>\"]" +
        "}}\n\n" + bundle;
      const rankText = await callClaude([{ role: "user", content: rankPrompt }]);
      const parsedRank = parseJsonLoose(rankText);
      const rankedList = parsedRank.ranked.map((r) => {
        const match = withIds.find((s) => s.name.toLowerCase() === String(r.name).toLowerCase()) || withIds[0];
        return { id: match.id, name: match.name, note: r.note };
      });
      setRanking({ list: rankedList, top: parsedRank.top });

      setAnalyzePhase("leads");
      const leadsTargets = rankedList.slice(0, LEADS_SKILL_COUNT);
      const leadsMap = {};
      for (let i = 0; i < leadsTargets.length; i++) {
        const target = leadsTargets[i];
        setResearchProgress({ current: i + 1, total: leadsTargets.length, label: target.name });
        try {
          const leadsPrompt =
            "Use web search to find real, currently active businesses, agencies, or entrepreneurs that appear to need freelance or contract help " +
            "with this skill: \"" + target.name + "\". Look at job boards, freelance marketplaces, recent hiring posts, and company news. " +
            "Only include businesses you actually found evidence for through search \u2014 never invent or guess a company name. " +
            "Return 3 to 6 of them. If you can't find that many with real evidence, return fewer rather than making any up. " +
            "Return ONLY JSON in this exact shape, no other text: [{\"name\": \"<real business name>\", \"info\": \"<1-2 sentences on what they do and why they need this skill right now>\", \"source\": \"<where you found this, e.g. an Upwork listing, a LinkedIn hiring post, their careers page>\"}]";
          const leadsText = await callClaude(
            [{ role: "user", content: leadsPrompt }],
            [{ type: "web_search_20250305", name: "web_search" }]
          );
          const parsedLeads = parseJsonLoose(leadsText);
          const leadsWithIds = (Array.isArray(parsedLeads) ? parsedLeads : []).map((l, i2) => ({ id: target.id + "-l" + i2, ...l }));
          leadsMap[target.id] = {
            leads: leadsWithIds,
            note: leadsWithIds.length === 0 ? "No specific active leads turned up in this search \u2014 the proposal below is written generically." : "",
          };
        } catch (leadsErr) {
          leadsMap[target.id] = { leads: [], note: "Couldn't pull specific business leads this time \u2014 the proposal below is written generically." };
        }
      }
      setLeadsBySkill(leadsMap);
      setActiveLeadsSkillId(rankedList[0].id);
      setSelectedLeadId(null);

      setStep(3);
    } catch (err) {
      const reason = err && err.message ? err.message : "Unknown error.";
      setAnalyzeError("Something went wrong analyzing that resume: " + reason + " Try again.");
    } finally {
      setAnalyzing(false);
      setAnalyzePhase("");
    }
  }

  async function generateProposal() {
    setProposalError("");
    setLoadingProposal(true);
    try {
      const skill = skills.find((s) => s.id === activeLeadsSkillId) || skills.find((s) => s.id === ranking.list[0].id);
      if (!skill) throw new Error("Lost track of which skill this proposal is for. Try picking a skill tab again.");
      const marketNote = research[skill.id] || "";
      const activeLeads = (leadsBySkill[activeLeadsSkillId] && leadsBySkill[activeLeadsSkillId].leads) || [];
      const selectedLead = activeLeads.find((l) => l.id === selectedLeadId);
      const targetLine = selectedLead
        ? "Address this proposal specifically to \"" + selectedLead.name + "\", a business described as: " + selectedLead.info +
          ". Open by naming their likely specific need based on that description, not a generic pitch."
        : "Write this as a general-purpose proposal template, not addressed to a specific company, that can be sent to a similar prospect.";
      const prompt =
        "Write a short, client-ready proposal template this person can send to land their first paying client for the skill \"" +
        skill.name + "\". Ground it in this resume evidence: \"" + skill.evidence + "\". " +
        "Use this market context for pricing guidance: " + marketNote + "\n" + targetLine + "\n\n" +
        "Structure it with these sections, plain text, no markdown symbols: " +
        "a one-line subject/headline, a short opening naming the client's likely problem, " +
        "a 'How I can help' section with 3 bullet-style lines, a 'What you get' deliverables list, " +
        "a suggested price or price range framed with a rationale, and a short direct call to action. " +
        "Keep it under 320 words and written in first person as if the freelancer is sending it.";
      const text = await callClaude([{ role: "user", content: prompt }]);
      if (!text) throw new Error("The model returned an empty response.");
      setProposal(text);
      setStep(4);
    } catch (err) {
      const reason = err && err.message ? err.message : "Unknown error.";
      setProposalError("Couldn't draft the proposal: " + reason + " You can hit the button again to retry.");
    } finally {
      setLoadingProposal(false);
    }
  }

  function copyProposal() {
    navigator.clipboard.writeText(proposal).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function analyzeLoadingText() {
    if (analyzePhase === "extracting") return "Reading the resume and identifying marketable skills...";
    if (analyzePhase === "researching") {
      return "Researching " + researchProgress.label + " (" + researchProgress.current + " of " + researchProgress.total + ")...";
    }
    if (analyzePhase === "ranking") return "Comparing skills for income potential...";
    if (analyzePhase === "leads") {
      return "Finding businesses for " + researchProgress.label + " (" + researchProgress.current + " of " + researchProgress.total + ")...";
    }
    return "Working...";
  }

  return (
    <div className="sct">
      <style>{CSS}</style>
      <div className="sct-wrap">
        <div className="sct-head">
          <div className="sct-brandrow">
            <div className="sct-mark">RG</div>
            <div className="sct-wordmark">Resume Genius</div>
          </div>
          <p>Upload a resume. It finds the sellable skills, researches what entrepreneurs and businesses are actually paying for each one right now, highlights the strongest bet, and drafts the proposal to go land the first client.</p>
        </div>

        <div className="sct-rail">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const state = n < step ? "done" : n === step ? "active" : "";
            return (
              <div className="sct-step" key={label} style={{ flex: n === STEPS.length ? "0 0 auto" : 1 }}>
                <div className={"sct-dot " + state}>{n < step ? <Check size={14} strokeWidth={2.5} /> : n}</div>
                <div className="sct-label">{label}</div>
                {n !== STEPS.length && <div className={"sct-connector " + (n < step ? "done" : "")} />}
              </div>
            );
          })}
        </div>

        {step === 1 && (
          <div className="sct-card">
            <h2>Start with a resume</h2>
            <p className="sct-sub">Paste the text below, or upload a .pdf, .docx, or .txt file.</p>
            {analyzeError && <div className="sct-err">{analyzeError}</div>}
            <textarea
              className="sct-textarea"
              placeholder="Paste resume text here..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
            <div className="sct-filerow">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.docx,.pdf"
                onChange={handleFile}
                style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }}
              />
              <button type="button" className="sct-uploadbtn" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
                <Upload size={14} />
                {fileName ? "Choose a different file" : "Upload a file"}
              </button>
              {fileLoading && (
                <span className="sct-filemeta"><Loader2 size={14} className="sct-spin" />Reading {fileName}...</span>
              )}
              {!fileLoading && fileName && resumeText && (
                <span className="sct-filemeta"><FileText size={14} />{fileName} loaded</span>
              )}
            </div>
            <div style={{ marginTop: 16 }}>
              {analyzing ? (
                <div className="sct-loading"><Loader2 size={14} className="sct-spin" />{analyzeLoadingText()}</div>
              ) : (
                <button className="sct-btn" disabled={!resumeText.trim() || fileLoading} onClick={analyzeResume}>
                  Find my most valuable skill
                </button>
              )}
            </div>
          </div>
        )}

        {step === 3 && ranking && (
          <div className="sct-card">
            <div className="sct-pick">
              <div className="sct-eyebrow">Best opportunity to lead with</div>
              <h2>{ranking.list[0].name}</h2>
              {ranking.top && (
                <div className="sct-statrow">
                  {ranking.top.rate && <div className="sct-stat"><span className="sct-statlabel">Typical rate</span>{ranking.top.rate}</div>}
                  {ranking.top.demand && <div className="sct-stat"><span className="sct-statlabel">Demand</span>{ranking.top.demand}</div>}
                </div>
              )}
              {ranking.top && ranking.top.why && <p className="sct-why">{ranking.top.why}</p>}
              {ranking.top && Array.isArray(ranking.top.steps) && ranking.top.steps.length > 0 && (
                <div className="sct-steps">
                  <div className="sct-stepslabel">Get started this week</div>
                  <ol>
                    {ranking.top.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
            <h2 style={{ fontSize: 15, marginBottom: 10 }}>Full skill value ranking</h2>
            <div className="sct-ranklist">
              {ranking.list.map((r, i) => (
                <div className="sct-rankrow" key={r.id}>
                  <div className="sct-ranknum">{i + 1}</div>
                  <div>
                    <div className="sct-rankname">{r.name}</div>
                    <div className="sct-ranknote">{r.note}</div>
                  </div>
                </div>
              ))}
            </div>

            <h2 style={{ fontSize: 15, margin: "22px 0 6px" }}>Businesses that could use this right now</h2>
            <p className="sct-sub" style={{ marginBottom: 12 }}>
              Found through live search, for the top {Math.min(LEADS_SKILL_COUNT, ranking.list.length)} skills. Pick a skill, then optionally a business, to draft the proposal against them.
            </p>
            <div className="sct-leadtabs">
              {ranking.list.slice(0, LEADS_SKILL_COUNT).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={"sct-leadtab " + (activeLeadsSkillId === r.id ? "active" : "")}
                  onClick={() => {
                    setActiveLeadsSkillId(r.id);
                    setSelectedLeadId(null);
                  }}
                >
                  {r.name}
                </button>
              ))}
            </div>
            {(() => {
              const active = leadsBySkill[activeLeadsSkillId];
              const activeLeads = (active && active.leads) || [];
              const activeNote = active && active.note;
              return (
                <div style={{ marginBottom: 6 }}>
                  {activeNote && <div className="sct-hint" style={{ marginBottom: 10 }}>{activeNote}</div>}
                  {activeLeads.length > 0 && (
                    <>
                      <label className={"sct-lead " + (selectedLeadId === null ? "selected" : "")}>
                        <input type="radio" name="lead" checked={selectedLeadId === null} onChange={() => setSelectedLeadId(null)} />
                        <div>
                          <div className="sct-leadname">Keep it general</div>
                          <div className="sct-leadinfo">Write a template proposal not tied to one specific company.</div>
                        </div>
                      </label>
                      {activeLeads.map((l) => (
                        <label key={l.id} className={"sct-lead " + (selectedLeadId === l.id ? "selected" : "")}>
                          <input type="radio" name="lead" checked={selectedLeadId === l.id} onChange={() => setSelectedLeadId(l.id)} />
                          <div>
                            <div className="sct-leadname">{l.name}</div>
                            <div className="sct-leadinfo">{l.info}</div>
                            {l.source && <div className="sct-leadsource">Source: {l.source}</div>}
                          </div>
                        </label>
                      ))}
                    </>
                  )}
                </div>
              );
            })()}

            {proposalError && <div className="sct-err" style={{ marginTop: 16 }}>{proposalError}</div>}
            <div style={{ marginTop: 18 }}>
              {loadingProposal ? (
                <div className="sct-loading"><Loader2 size={14} className="sct-spin" />Drafting the proposal...</div>
              ) : (
                <button className="sct-btn" onClick={generateProposal}>Draft the proposal</button>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="sct-card">
            <h2>Proposal draft</h2>
            <p className="sct-sub">
              {(() => {
                const skillName = skills.find((s) => s.id === activeLeadsSkillId);
                const activeLeads = (leadsBySkill[activeLeadsSkillId] && leadsBySkill[activeLeadsSkillId].leads) || [];
                const lead = activeLeads.find((l) => l.id === selectedLeadId);
                const base = "Built around " + (skillName ? skillName.name : (ranking && ranking.list[0].name));
                return base + (lead ? ", addressed to " + lead.name + "." : ", written as a general template.");
              })()}
              {" "}Edit freely before sending.
            </p>
            <div className="sct-proposal">{proposal}</div>
            <div className="sct-actions">
              <button className="sct-btn" onClick={copyProposal}>
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? "Copied" : "Copy proposal"}
              </button>
              <button className="sct-btn secondary" onClick={resetAll}>
                <RotateCcw size={15} />
                Start a new resume
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
