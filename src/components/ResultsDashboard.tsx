import { ArrowRight, BriefcaseBusiness, CheckCircle2, ExternalLink, Gauge, SearchCheck, TrendingUp } from "lucide-react";
import type { AnalysisResult } from "../types";

interface ResultsDashboardProps {
  result: AnalysisResult;
  selectedLeadId: string | null;
  onSelectLead: (id: string | null) => void;
  onCreateProposal: () => void;
}

export function ResultsDashboard({ result, selectedLeadId, onSelectLead, onCreateProposal }: ResultsDashboardProps) {
  const leadSkill = result.ranking.list[0];
  const top = result.ranking.top;
  return (
    <div className="results-layout">
      <section className="opportunity-hero">
        <div className="opportunity-copy">
          <p className="eyebrow light"><CheckCircle2 size={15} /> Analysis complete</p>
          <h1>Your strongest offer is <em>{leadSkill.name}</em>.</h1>
          <p>{top.why || leadSkill.note}</p>
        </div>
        <div className="metric-grid">
          <div className="metric"><span><Gauge size={16} /> Typical rate</span><strong>{top.rate || "Market-priced"}</strong></div>
          <div className="metric"><span><TrendingUp size={16} /> Demand</span><strong>{top.demand || "Active"}</strong></div>
          <div className="metric"><span><BriefcaseBusiness size={16} /> Skills found</span><strong>{result.skills.length}</strong></div>
        </div>
      </section>

      <div className="results-grid">
        <section className="workspace-card">
          <div className="card-heading"><div><p className="eyebrow">Priority order</p><h2>Skill value ranking</h2></div><span className="count-badge">{result.ranking.list.length} skills</span></div>
          <div className="ranking-list">
            {result.ranking.list.map((ranked, index) => {
              const skill = result.skills.find((item) => item.id === ranked.id);
              return (
                <details className="rank-row" key={ranked.id} open={index === 0}>
                  <summary>
                    <span className="rank-number">{String(index + 1).padStart(2, "0")}</span>
                    <span className="rank-copy"><strong>{ranked.name}</strong><small>{ranked.note}</small></span>
                    <span className="category-tag">{skill?.category}</span>
                  </summary>
                  <div className="research-block">
                    <p><b>Resume evidence</b>{skill?.evidence}</p>
                    <p><b>Live market read</b>{result.research[ranked.id]}</p>
                  </div>
                </details>
              );
            })}
          </div>
        </section>

        <aside className="workspace-card next-card">
          <p className="eyebrow">Seven-day launch plan</p>
          <h2>Move from insight to outreach.</h2>
          <ol className="action-list">
            {(top.steps?.length ? top.steps : ["Package a clear outcome.", "Choose a credible proof point.", "Contact three qualified buyers."]).map((step, index) => (
              <li key={step}><span>{index + 1}</span><p>{step}</p></li>
            ))}
          </ol>
        </aside>
      </div>

      <section className="workspace-card leads-section">
        <div className="card-heading">
          <div><p className="eyebrow"><SearchCheck size={15} /> Source-backed leads</p><h2>Choose who the proposal should address.</h2><p>Open the source and verify the opportunity before contacting an organization.</p></div>
        </div>
        <div className="lead-grid">
          <button className={`lead-card ${selectedLeadId === null ? "selected" : ""}`} type="button" onClick={() => onSelectLead(null)}>
            <span className="radio-mark" /><strong>General template</strong><p>Keep the proposal reusable for any qualified buyer.</p>
          </button>
          {result.leads.map((lead) => (
            <div className={`lead-card ${selectedLeadId === lead.id ? "selected" : ""}`} key={lead.id}>
              <button className="lead-select" type="button" onClick={() => onSelectLead(lead.id)} aria-label={`Select ${lead.name}`}><span className="radio-mark" /><strong>{lead.name}</strong><p>{lead.info}</p></button>
              <a href={lead.source} target="_blank" rel="noreferrer">View source <ExternalLink size={13} /></a>
            </div>
          ))}
        </div>
        {!result.leads.length && <p className="empty-note">No verifiable active opportunities were found in this search. You can still create a general proposal.</p>}
        <div className="section-action"><button className="button primary" type="button" onClick={onCreateProposal}>Create my proposal <ArrowRight size={17} /></button></div>
      </section>
    </div>
  );
}
