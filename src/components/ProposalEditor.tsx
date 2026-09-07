import { Check, Copy, Download, RotateCcw } from "lucide-react";
import { useState } from "react";

export function ProposalEditor({ proposal, onChange, onReset, context }: { proposal: string; onChange: (value: string) => void; onReset: () => void; context: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(proposal);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function download() {
    const url = URL.createObjectURL(new Blob([proposal], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "resume-genius-proposal.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="workspace-card proposal-card">
      <div className="proposal-heading"><div><p className="eyebrow"><Check size={15} /> Ready to personalize</p><h1>Your proposal draft</h1><p>{context} Review the claims, pricing, and contact details before sending.</p></div></div>
      <textarea className="proposal-editor" value={proposal} onChange={(event) => onChange(event.target.value)} aria-label="Editable proposal draft" />
      <div className="proposal-actions">
        <button className="button primary" type="button" onClick={() => void copy()}>{copied ? <Check size={17} /> : <Copy size={17} />}{copied ? "Copied" : "Copy proposal"}</button>
        <button className="button secondary" type="button" onClick={download}><Download size={17} /> Download .txt</button>
        <button className="button quiet" type="button" onClick={onReset}><RotateCcw size={16} /> Analyze another resume</button>
      </div>
    </section>
  );
}
