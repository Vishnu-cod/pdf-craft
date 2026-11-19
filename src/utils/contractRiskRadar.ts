/**
 * AI Contract Risk & Red-Flag Radar Engine
 * 100% client-side heuristic legal analysis.
 * Scans employment offers, NDAs, service agreements, and leases for predatory clauses,
 * unlimited liability traps, IP grabs, and auto-renewals.
 */

export interface ContractRiskIssue {
  id: string;
  category: 'ip_grab' | 'non_compete' | 'unlimited_liability' | 'auto_renewal' | 'one_sided_termination' | 'arbitration';
  title: string;
  severity: 'high' | 'medium' | 'low';
  excerpt: string;
  plainEnglish: string;
  counterProposal: string;
  matchScore: number;
}

export interface ContractRiskReport {
  safetyScore: number;
  grade: 'A - Very Safe' | 'B - Moderate Risk' | 'C - High Risk' | 'D - Predatory / Danger';
  summary: string;
  issues: ContractRiskIssue[];
  categoryCounts: Record<string, number>;
  wordCount: number;
}

interface ClausePattern {
  category: ContractRiskIssue['category'];
  title: string;
  severity: ContractRiskIssue['severity'];
  regex: RegExp;
  plainEnglish: string;
  counterProposal: string;
}

const RISK_PATTERNS: ClausePattern[] = [
  // 1. IP Grab
  {
    category: 'ip_grab',
    title: 'Broad Intellectual Property & Side-Project Claim',
    severity: 'high',
    regex: /(?:all\s+inventions|all\s+intellectual\s+property|inventions,\s*developments|works\s+of\s+authorship)[^.]{0,100}?(?:whether\s+or\s+not\s+(?:during|on)\s+working\s+hours|outside\s+working\s+hours|at\s+any\s+time\s+during\s+employment|on\s+personal\s+time|using\s+personal\s+equipment)/i,
    plainEnglish:
      'The company claims ownership of everything you invent or create—even personal hobby projects made on weekends or using your personal laptop with zero company resources.',
    counterProposal:
      '"Company shall have no ownership rights over inventions developed entirely on employee\'s own time without using company equipment, facilities, or trade secrets, which do not relate directly to company\'s core business."',
  },
  {
    category: 'ip_grab',
    title: 'Unrestricted Worldwide Perpetual Rights Assignment',
    severity: 'medium',
    regex: /(?:irrevocably\s+and\s+unconditionally\s+assigns|assigns\s+in\s+perpetuity|worldwide\s+and\s+perpetual)[^.]{0,80}?(?:all\s+moral\s+rights|all\s+rights,\s+title\s+and\s+interest\s+whatsoever)/i,
    plainEnglish:
      'You are surrendering all moral and proprietary rights permanently across the entire universe without any right to attribution or future royalties.',
    counterProposal:
      '"Assignment of rights shall be limited solely to deliverables specifically commissioned, accepted, and paid in full under this agreement."',
  },

  // 2. Non-Compete
  {
    category: 'non_compete',
    title: 'Excessive Non-Compete Duration & Geography',
    severity: 'high',
    regex: /(?:shall\s+not\s+(?:directly\s+or\s+indirectly\s+)?(?:engage|compete|participate|work)\s+in|non-compete|covenant\s+not\s+to\s+compete)[^.]{0,100}?(?:(?:1[2-9]|[2-9][0-9])\s*months|(?:2|3|4|5)\s*years|worldwide|global)/i,
    plainEnglish:
      'This clause bars you from working for competitors or in your professional field for an unusually long period (1-5 years) or across the entire globe after leaving.',
    counterProposal:
      '"Non-compete obligation shall be strictly limited to direct competitors within a 25-mile radius and shall not exceed 6 months following termination."',
  },
  {
    category: 'non_compete',
    title: 'Sweeping Client & Coworker Non-Solicitation',
    severity: 'medium',
    regex: /(?:non-solicitation|shall\s+not\s+(?:directly\s+or\s+indirectly\s+)?solicit)[^.]{0,100}?(?:any\s+employee|any\s+client|prospective\s+client|supplier|vendor)[^.]{0,80}?(?:(?:1[2-9]|[2-9][0-9])\s*months|(?:1|2|3)\s*years)/i,
    plainEnglish:
      'You cannot recruit former colleagues, accept work from former clients, or contact mutual business partners for up to 1-3 years.',
    counterProposal:
      '"Non-solicitation shall apply only to clients with whom employee had direct, material interaction during the final 6 months of employment."',
  },

  // 3. Unlimited Liability
  {
    category: 'unlimited_liability',
    title: 'Uncapped Personal Indemnification & Liability',
    severity: 'high',
    regex: /(?:indemnify,\s*defend\s*and\s*hold\s*harmless|shall\s+indemnify)[^.]{0,120}?(?:any\s+and\s+all\s+(?:claims|damages|losses|liabilities|expenses|costs)|attorney(?:'?s)?\s+fees)[^.]{0,80}?(?:without\s+limitation|unlimited|whatsoever)/i,
    plainEnglish:
      'You agree to personally pay for any and all legal fees, lawsuits, or financial losses incurred by the other party with zero financial cap or limit!',
    counterProposal:
      '"Total aggregate liability of either party shall be capped at the total amount paid or payable under this Agreement in the twelve (12) months preceding the claim."',
  },
  {
    category: 'unlimited_liability',
    title: 'Consequential & Punitive Damages Exposure',
    severity: 'medium',
    regex: /(?:indirect,\s*incidental,\s*special,\s*consequential|punitive\s+damages|loss\s+of\s+profits)[^.]{0,60}?(?:shall\s+apply|entitled\s+to\s+recover|liable\s+for)/i,
    plainEnglish:
      'Leaves you exposed to paying for theoretical future "lost profits" or indirect damages, which can reach millions of dollars.',
    counterProposal:
      '"Neither party shall be liable to the other for any indirect, special, incidental, punitive, or consequential damages (including lost profits)."',
  },

  // 4. Auto-Renewal
  {
    category: 'auto_renewal',
    title: 'Predatory Auto-Renewal / Sneaky Evergreen Clause',
    severity: 'medium',
    regex: /(?:automatically\s+renew|successive\s+periods|evergreen)[^.]{0,80}?(?:unless\s+(?:written\s+)?notice\s+is\s+given|at\s+least\s+(?:30|60|90)\s+days)/i,
    plainEnglish:
      'The contract automatically locks you into another contract term (and recurring charges) unless you send a written cancellation notice months in advance.',
    counterProposal:
      '"Agreement shall renew only upon mutual written agreement of both parties at least 30 days prior to expiration."',
  },

  // 5. One-Sided Termination
  {
    category: 'one_sided_termination',
    title: 'One-Sided Immediate Termination Without Cause',
    severity: 'high',
    regex: /(?:company\s+may\s+terminate\s+(?:at\s+any\s+time\s+)?without\s+cause|terminate\s+at\s+its\s+sole\s+discretion)[^.]{0,100}?(?:contractor|employee)\s+must\s+provide\s+(?:30|60|90)\s+days/i,
    plainEnglish:
      'The company can fire or drop you instantly with zero notice or severance, but you are legally obligated to work a long notice period (30-90 days).',
    counterProposal:
      '"Either party may terminate this agreement without cause upon thirty (30) days prior written notice, or immediately upon mutual agreement with severance."',
  },
  {
    category: 'one_sided_termination',
    title: 'Liquidated Damages & Forfeiture Penalty',
    severity: 'high',
    regex: /(?:liquidated\s+damages|forfeit\s+(?:all\s+)?unpaid\s+compensation|forfeit\s+accrued\s+salary|deduct\s+from\s+final\s+settlement)/i,
    plainEnglish:
      'The contract threatens to withhold your earned wages, bonuses, or final settlement pay as punitive damages if you resign early.',
    counterProposal:
      '"Employee shall be entitled to full payment for all work performed and accrued statutory benefits up to the effective termination date."',
  },

  // 6. Mandatory Arbitration
  {
    category: 'arbitration',
    title: 'Mandatory Binding Arbitration & Class Action Waiver',
    severity: 'low',
    regex: /(?:mandatory\s+binding\s+arbitration|waives\s+any\s+right\s+to\s+participate\s+in\s+a\s+class\s+action|exclusive\s+jurisdiction\s+of\s+arbitration)/i,
    plainEnglish:
      'You give up your constitutional right to take disputes to an open court with a judge or jury, agreeing instead to private arbitration.',
    counterProposal:
      '"Disputes shall be settled first through good-faith mediation; if unresolved, parties retain standard rights to seek equitable relief in local court jurisdiction."',
  },
];

/**
 * Scans contract text and generates a comprehensive risk report
 */
export function analyzeContractRisks(contractText: string): ContractRiskReport {
  const issues: ContractRiskIssue[] = [];
  const categoryCounts: Record<string, number> = {
    ip_grab: 0,
    non_compete: 0,
    unlimited_liability: 0,
    auto_renewal: 0,
    one_sided_termination: 0,
    arbitration: 0,
  };

  const cleanText = contractText.replace(/\r?\n+/g, ' ');
  const words = cleanText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Split into sentences for targeted matching
  const sentences = contractText.split(/(?<=[.!?])\s+/);

  for (const pattern of RISK_PATTERNS) {
    // Check full text match first
    const match = cleanText.match(pattern.regex);
    if (match) {
      // Find matching sentence for realistic excerpt
      const matchingSentence = sentences.find((s) => pattern.regex.test(s)) || match[0];
      const trimmedExcerpt = matchingSentence.trim().slice(0, 240);

      issues.push({
        id: 'issue_' + (issues.length + 1),
        category: pattern.category,
        title: pattern.title,
        severity: pattern.severity,
        excerpt: trimmedExcerpt.endsWith('.') ? trimmedExcerpt : trimmedExcerpt + '...',
        plainEnglish: pattern.plainEnglish,
        counterProposal: pattern.counterProposal,
        matchScore: pattern.severity === 'high' ? 30 : pattern.severity === 'medium' ? 18 : 8,
      });

      categoryCounts[pattern.category] = (categoryCounts[pattern.category] || 0) + 1;
    }
  }

  // Calculate safety score (100 minus penalty points)
  const totalPenalty = issues.reduce((acc, issue) => acc + issue.matchScore, 0);
  const rawScore = Math.max(15, 100 - totalPenalty);
  const safetyScore = Math.min(100, rawScore);

  let grade: ContractRiskReport['grade'] = 'D - Predatory / Danger';
  let summary = '';

  if (safetyScore >= 85) {
    grade = 'A - Very Safe';
    summary = 'Clean and fair commercial terms. No predatory clauses or severe liability traps detected.';
  } else if (safetyScore >= 70) {
    grade = 'B - Moderate Risk';
    summary = 'Standard commercial terms with minor protective covenants. Review highlighted sections before signing.';
  } else if (safetyScore >= 50) {
    grade = 'C - High Risk';
    summary = 'Significant red flags detected! Contains restrictive covenants or one-sided liability terms that favor the other party.';
  } else {
    grade = 'D - Predatory / Danger';
    summary = 'Severe predatory clauses detected! We strongly advise using the suggested counter-proposals to push back before signing.';
  }

  return {
    safetyScore,
    grade,
    summary,
    issues,
    categoryCounts,
    wordCount,
  };
}
