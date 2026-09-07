import type { AnalysisResult, Lead } from "../types";

export function createProposal(result: AnalysisResult, selectedLead?: Lead): string {
  const { basics, ranking, skills } = result;
  const skill = skills.find((item) => item.id === ranking.list[0].id) ?? skills[0];
  const client = selectedLead?.name ?? "Prospective Client";
  const need = selectedLead?.info ?? "optimizing core workflows and managing operational systems";
  const name = basics.contact.name && basics.contact.name !== "Candidate" ? basics.contact.name : "Consultant";
  const email = basics.contact.email || "[Your Email]";
  const phone = basics.contact.phone || "[Your Phone]";
  const location = basics.contact.location || "[Your Location]";
  const bullet1 = basics.bullets[0] || `Direct execution and oversight of ${skill.name}.`;
  const bullet2 = basics.bullets[1] || "Standardization of procedures to eliminate recurring bottlenecks.";
  const bullet3 = basics.bullets[2] || "Proactive resolution of urgent operational escalations.";

  return `PROPOSAL: FRACTIONAL SUPPORT & WORKFLOW STABILIZATION
Prepared for: Leadership Team, ${client}
Prepared by:  ${name} | ${skill.name} Specialist
Direct:       ${phone} | ${email} | ${location}

----------------------------------------------------------------------
1. EXECUTIVE SUMMARY & SITUATION OVERVIEW
Growing organizations frequently encounter operational drag: unorganized workflows, backlogged support requests, and recurring technical friction that pulls internal teams away from core business objectives.

Targeted Objective: ${need}

This proposal outlines a structured, SLA-backed support engagement designed to eliminate workflow downtime, resolve backlogs quickly, and institutionalize standard operating procedures.

Demonstrated Qualifications:
• Proven background delivering: "${skill.evidence}"
• Hands-on proficiency across core competencies: ${skills.map((item) => item.name).join(", ")}.

----------------------------------------------------------------------
2. SCOPE OF SERVICES & TECHNICAL DELIVERABLES
• Priority Workflow Execution:
  - Rapid intake, triage, and resolution of support requests and operational blockers.
  - Dedicated support for team members and systems administration.

• Core Competency Oversight (${skill.name}):
  - ${bullet1}
  - ${bullet2}

• Standardization & Documentation:
  - Standard Operating Procedure documentation for incident escalation and daily operations.
  - ${bullet3}

----------------------------------------------------------------------
3. SERVICE LEVEL AGREEMENTS
• Severity 1 (Critical Outage / Blocker): < 30 minutes initial response and mitigation.
• Severity 2 (Operational Friction): < 2 hours resolution target.
• General Inquiries & Standard Tasks: Same-business-day turnaround.
• Bi-Weekly Systems Report: Completed items, root-cause resolutions, and efficiency recommendations.

----------------------------------------------------------------------
4. ENGAGEMENT & INVESTMENT OPTIONS
• Option A: Dedicated Fractional Retainer — $2,850 / month
  Up to 20 dedicated hours monthly, priority SLA response, and ongoing systems maintenance.

• Option B: 2-Week Stabilization Sprint — $1,950 (One-Time)
  Focused audit of current workflow backlogs, SOP creation, and process cleanup.

• Option C: Flexible Project / Ad-Hoc Support — $75 / hour
  On-demand coverage for systems transitions, surge volume, or specialized initiatives.

----------------------------------------------------------------------
5. NEXT STEPS & IMPLEMENTATION
1. Schedule a brief 15-minute operational discovery call this week.
2. Confirm priority bottlenecks and preferred start date.

Available times: Thursday or Friday between 10:00 AM – 3:00 PM.
Direct confirmation: ${email} | ${phone}`;
}
