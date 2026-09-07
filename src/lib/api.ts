import type { AnalysisProgress, AnalysisResult, Ranking, Skill } from "../types";
import { parseResumeBasics } from "./resume";

export const API_ENDPOINT = "https://resume-genius-proxy.onrender.com/api/messages";
export const MAX_RESUME_CHARS = 75_000;
const MAX_SKILLS = 5;

interface ApiMessage { role: "user" | "assistant"; content: string }

function parseJsonLoose<T>(text: string): T {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const array = cleaned.startsWith("[");
  const start = cleaned.indexOf(array ? "[" : "{");
  const end = cleaned.lastIndexOf(array ? "]" : "}");
  return JSON.parse(start >= 0 && end >= 0 ? cleaned.slice(start, end + 1) : cleaned) as T;
}

async function callClaude(messages: ApiMessage[], withSearch = false, retries = 2): Promise<string> {
  let lastError: Error = new Error("The analysis service could not be reached.");
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45_000);
    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          ...(withSearch ? { tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 4 }] } : {}),
        }),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({})) as { content?: Array<{ type: string; text?: string }>; error?: string | { message?: string } };
      if (!response.ok) {
        const detail = typeof data.error === "string" ? data.error : data.error?.message;
        const error = new Error(`${detail || "The analysis service returned an error."} (${response.status})`);
        if ([429, 500, 502, 503, 529].includes(response.status) && attempt < retries) {
          lastError = error;
          await new Promise((resolve) => setTimeout(resolve, 800 * 2 ** attempt));
          continue;
        }
        throw error;
      }
      const text = (data.content ?? []).filter((block) => block.type === "text").map((block) => block.text ?? "").join("\n").trim();
      if (!text) throw new Error("The analysis service returned an empty response.");
      return text;
    } catch (error) {
      lastError = error instanceof DOMException && error.name === "AbortError"
        ? new Error("The analysis request timed out.")
        : error instanceof Error ? error : lastError;
      if (attempt >= retries || lastError.message.includes("timed out")) throw lastError;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

function validateSkills(value: unknown): Skill[] {
  if (!Array.isArray(value)) throw new Error("The service returned an invalid skills response.");
  const valid = value.filter((item): item is { name: string; evidence: string; category?: string } =>
    Boolean(item && typeof item.name === "string" && typeof item.evidence === "string"));
  if (!valid.length) throw new Error("No marketable skills could be identified from this resume.");
  return valid.slice(0, MAX_SKILLS).map((skill, index) => ({
    id: `s${index}`,
    name: skill.name.trim(),
    evidence: skill.evidence.trim(),
    category: String(skill.category || "Other"),
  }));
}

function validateRanking(value: unknown, skills: Skill[]): Ranking {
  const candidate = value as { ranked?: Array<{ name?: string; note?: string }>; top?: Ranking["top"] };
  if (!Array.isArray(candidate?.ranked) || !candidate.ranked.length || !candidate.top) throw new Error("The service returned an invalid ranking response.");
  const used = new Set<string>();
  const list = candidate.ranked.flatMap((item) => {
    const match = skills.find((skill) => skill.name.toLowerCase() === String(item.name || "").toLowerCase());
    if (!match || used.has(match.id)) return [];
    used.add(match.id);
    return [{ id: match.id, name: match.name, note: String(item.note || "") }];
  });
  if (!list.length) throw new Error("The ranking response did not match the extracted skills.");
  return { list, top: candidate.top };
}

export async function analyzeResume(text: string, onProgress: (progress: AnalysisProgress) => void): Promise<AnalysisResult> {
  if (text.length > MAX_RESUME_CHARS) throw new Error("This resume is too long. Keep it under 75,000 characters.");
  const basics = parseResumeBasics(text);

  onProgress({ phase: "extracting" });
  const extraction = await callClaude([{ role: "user", content:
    `Read this resume and identify up to ${MAX_SKILLS} marketable skills this person could sell as a freelancer, consultant, or contractor. ` +
    `For each, give a short client-facing skill name, one sentence of evidence from the resume, and a category. ` +
    `Return ONLY JSON: [{"name":"...","evidence":"...","category":"..."}]\n\nRESUME:\n${text}` }]);
  const skills = validateSkills(parseJsonLoose<unknown>(extraction));

  const research: Record<string, string> = {};
  for (let index = 0; index < skills.length; index += 1) {
    const skill = skills[index];
    onProgress({ phase: "researching", current: index + 1, total: skills.length, label: skill.name });
    research[skill.id] = await callClaude([{ role: "user", content:
      `Research the current market for freelancers and small businesses hiring for "${skill.name}". In under 150 words report: ` +
      `(1) businesses hiring now, (2) freelance/project rates in USD, (3) full-time salary range in USD, and (4) demand trend. Be specific.` }], true);
  }

  onProgress({ phase: "ranking" });
  const bundle = skills.map((skill) => `SKILL: ${skill.name}\nEvidence: ${skill.evidence}\nMarket research: ${research[skill.id]}`).join("\n\n");
  const ranked = await callClaude([{ role: "user", content:
    `Rank these skills by immediate income potential and packaging simplicity. Return ONLY JSON: ` +
    `{"ranked":[{"name":"...","note":"..."}],"top":{"rate":"...","demand":"...","why":"...","steps":["..."]}}\n\n${bundle}` }]);
  const ranking = validateRanking(parseJsonLoose<unknown>(ranked), skills);

  onProgress({ phase: "leads" });
  const leadsText = await callClaude([{ role: "user", content:
    `Use web search to find up to 4 real, currently active organizations with evidence they need freelance or contract help with "${ranking.list[0].name}". ` +
    `Do not invent names. Return fewer or an empty array when evidence is insufficient. Return ONLY JSON: [{"name":"...","info":"...","source":"https://..."}]` }], true);
  const rawLeads = parseJsonLoose<unknown>(leadsText);
  const leads = (Array.isArray(rawLeads) ? rawLeads : []).filter((lead): lead is { name: string; info?: string; source: string } =>
    Boolean(lead && typeof lead.name === "string" && /^https:\/\//i.test(String(lead.source || ""))))
    .slice(0, 4)
    .map((lead, index) => ({ id: `l${index}`, name: lead.name, info: String(lead.info || ""), source: lead.source }));

  return { skills, research, ranking, leads, basics };
}
