import { BarChart3, FileSearch, LockKeyhole, Menu, ShieldCheck, Sparkles, Target, X } from "lucide-react";
import { useState } from "react";
import { ResultsDashboard } from "./components/ResultsDashboard";
import { ProposalEditor } from "./components/ProposalEditor";
import { StepRail } from "./components/StepRail";
import { UploadPanel } from "./components/UploadPanel";
import { analyzeResume } from "./lib/api";
import { createProposal } from "./lib/proposal";
import type { AnalysisProgress, AnalysisResult, AppStep } from "./types";

const progressCopy: Record<AnalysisProgress["phase"], { title: string; detail: string }> = {
  extracting: { title: "Mapping your marketable skills", detail: "Connecting resume evidence to client-facing services." },
  researching: { title: "Reading the live market", detail: "Checking buyer demand, rates, and salary signals." },
  ranking: { title: "Finding your strongest entry point", detail: "Comparing income potential with packaging simplicity." },
  leads: { title: "Locating credible opportunities", detail: "Searching for source-backed organizations to approach." },
};

export default function App() {
  const [step, setStep] = useState<AppStep>(1);
  const [resumeText, setResumeText] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<AnalysisProgress>({ phase: "extracting" });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [proposal, setProposal] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

  async function runAnalysis() {
    setError("");
    setStep(2);
    try {
      const nextResult = await analyzeResume(resumeText, setProgress);
      setResult(nextResult);
      setStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      const detail = caught instanceof Error ? caught.message : "Unknown error.";
      setError(`Analysis could not be completed: ${detail} Please try again.`);
      setStep(1);
    }
  }

  function makeProposal() {
    if (!result) return;
    const lead = result.leads.find((item) => item.id === selectedLeadId);
    setProposal(createProposal(result, lead));
    setStep(4);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setStep(1); setResumeText(""); setConsent(false); setError(""); setResult(null); setSelectedLeadId(null); setProposal("");
  }

  const progressData = progressCopy[progress.phase];
  const researchPercent = progress.phase === "extracting" ? 15 : progress.phase === "researching"
    ? 20 + ((progress.current ?? 0) / Math.max(progress.total ?? 1, 1)) * 50 : progress.phase === "ranking" ? 82 : 94;

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="./" aria-label="Resume Genius home"><span className="brand-mark"><Sparkles size={18} /></span><span>Resume <b>Genius</b></span></a>
        <nav className={mobileMenu ? "header-nav open" : "header-nav"} aria-label="Utility navigation">
          <a href="./privacy.html">Privacy</a><a href="./terms.html">Terms</a><span className="status-pill"><span /> Analysis service online</span>
        </nav>
        <button className="menu-button" type="button" aria-label="Toggle menu" onClick={() => setMobileMenu((open) => !open)}>{mobileMenu ? <X /> : <Menu />}</button>
      </header>

      <main>
        <div className="page-frame"><StepRail current={step} /></div>
        {step === 1 && (
          <div className="page-frame start-layout">
            <UploadPanel resumeText={resumeText} consent={consent} error={error} onTextChange={setResumeText} onConsentChange={setConsent} onError={setError} onAnalyze={() => void runAnalysis()} />
            <aside className="insight-sidebar">
              <p className="eyebrow">What you will receive</p><h2>From work history to a usable go-to-market plan.</h2>
              <div className="benefit-list">
                <div><span><FileSearch /></span><p><strong>Evidence-based skills</strong><small>Client-facing offers tied directly to resume proof.</small></p></div>
                <div><span><BarChart3 /></span><p><strong>Current market signals</strong><small>Rates, salary context, demand, and buyer types.</small></p></div>
                <div><span><Target /></span><p><strong>A practical next move</strong><small>Ranked opportunities, verified sources, and outreach steps.</small></p></div>
              </div>
              <div className="privacy-note"><ShieldCheck size={20} /><p><strong>Your API key never enters this browser.</strong><small>Requests pass through a restricted server proxy. Resume text is used for this analysis and is not stored by Resume Genius.</small></p></div>
            </aside>
          </div>
        )}
        {step === 2 && (
          <div className="page-frame loading-wrap"><section className="workspace-card loading-card" aria-live="polite" aria-busy="true">
            <div className="analysis-orbit"><div><Sparkles size={26} /></div></div><p className="eyebrow">Live analysis in progress</p><h1>{progressData.title}</h1><p>{progressData.detail}</p>
            {progress.phase === "researching" && <strong className="progress-label">{progress.label} · {progress.current} of {progress.total}</strong>}
            <div className="progress-track"><span style={{ width: `${researchPercent}%` }} /></div><small>This usually takes one to three minutes because each skill is researched separately.</small>
          </section></div>
        )}
        {step === 3 && result && <div className="page-frame"><ResultsDashboard result={result} selectedLeadId={selectedLeadId} onSelectLead={setSelectedLeadId} onCreateProposal={makeProposal} /></div>}
        {step === 4 && result && <div className="page-frame"><ProposalEditor proposal={proposal} onChange={setProposal} onReset={reset} context={`Built around ${result.ranking.list[0].name}${selectedLeadId ? ` for ${result.leads.find((item) => item.id === selectedLeadId)?.name}` : " as a reusable template"}.`} /></div>}
      </main>

      <footer className="site-footer"><div><span className="footer-brand"><LockKeyhole size={14} /> Resume Genius</span><p>AI-assisted career intelligence. Verify market claims and opportunities before acting.</p></div><div><a href="./privacy.html">Privacy Policy</a><a href="./terms.html">Terms of Use</a></div></footer>
    </div>
  );
}
