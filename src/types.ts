export type AppStep = 1 | 2 | 3 | 4;

export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
}

export interface ResumeBasics {
  contact: ContactInfo;
  bullets: string[];
}

export interface Skill {
  id: string;
  name: string;
  evidence: string;
  category: string;
}

export interface RankedSkill {
  id: string;
  name: string;
  note: string;
}

export interface TopOpportunity {
  rate?: string;
  demand?: string;
  why?: string;
  steps?: string[];
}

export interface Ranking {
  list: RankedSkill[];
  top: TopOpportunity;
}

export interface Lead {
  id: string;
  name: string;
  info: string;
  source: string;
}

export interface AnalysisResult {
  skills: Skill[];
  research: Record<string, string>;
  ranking: Ranking;
  leads: Lead[];
  basics: ResumeBasics;
}

export interface AnalysisProgress {
  phase: "extracting" | "researching" | "ranking" | "leads";
  current?: number;
  total?: number;
  label?: string;
}
