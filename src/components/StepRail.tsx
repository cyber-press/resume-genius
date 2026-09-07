import { Check } from "lucide-react";
import type { AppStep } from "../types";

const steps = ["Resume", "Market research", "Best fit", "Proposal"];

export function StepRail({ current }: { current: AppStep }) {
  return (
    <nav className="step-rail" aria-label="Analysis progress">
      {steps.map((label, index) => {
        const number = index + 1;
        const complete = number < current;
        const active = number === current;
        return (
          <div className={`step ${complete ? "complete" : ""} ${active ? "active" : ""}`} key={label}>
            <span className="step-marker" aria-current={active ? "step" : undefined}>
              {complete ? <Check size={14} strokeWidth={3} /> : number}
            </span>
            <span className="step-label">{label}</span>
          </div>
        );
      })}
    </nav>
  );
}
