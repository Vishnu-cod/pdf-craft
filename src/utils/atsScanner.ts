import { ResumeData } from '../types';

export interface KeywordMatch {
  keyword: string;
  category: 'core' | 'tool' | 'soft' | 'domain';
  inResume: boolean;
  frequencyInJob: number;
}

export interface ATSReport {
  overallScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'Needs Improvement';
  summary: string;
  keywordMatchRate: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  actionVerbScore: number;
  detectedActionVerbs: string[];
  suggestedActionVerbs: string[];
  readabilityScore: number;
  checklist: {
    hasContactInfo: boolean;
    hasClearHeadline: boolean;
    hasSummary: boolean;
    hasMeasurableMetrics: boolean;
    hasEducation: boolean;
    hasSkillsSection: boolean;
  };
}

const COMMON_ACTION_VERBS = [
  'spearheaded', 'architected', 'accelerated', 'orchestrated', 'delivered', 'achieved',
  'executed', 'engineered', 'increased', 'decreased', 'boosted', 'generated', 'scaled',
  'streamlined', 'analyzed', 'audited', 'enrolled', 'managed', 'developed', 'launched',
  'optimized', 'resolved', 'supervised', 'collaborated', 'designed', 'mentored', 'constructed'
];

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'more', 'will', 'your',
  'about', 'what', 'which', 'their', 'there', 'they', 'been', 'would', 'could', 'should',
  'work', 'team', 'teams', 'skills', 'experience', 'responsible', 'requirements', 'must',
  'qualifications', 'duties', 'including', 'years', 'plus', 'ability', 'knowledge', 'candidate',
  'role', 'position', 'looking', 'join', 'company', 'environment', 'strong', 'good', 'great',
  'opportunity', 'working', 'help', 'across', 'within', 'other', 'needs', 'apply', 'job'
]);

/**
 * Extracts candidate high-value keywords & phrases from text
 */
function extractKeywordsFromText(text: string): Map<string, number> {
  const counts = new Map<string, number>();
  const clean = text.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, ' ');

  // 1. Single word tokens
  const words = clean.split(/\s+/).filter((w) => w.length >= 3 && !STOP_WORDS.has(w) && !/^\d+$/.test(w));
  for (const w of words) {
    counts.set(w, (counts.get(w) || 0) + 1);
  }

  // 2. Multi-word key phrases (bigrams and trigrams)
  const tokens = clean.split(/\s+/).filter(Boolean);
  for (let i = 0; i < tokens.length - 1; i++) {
    const bigram = `${tokens[i]} ${tokens[i + 1]}`;
    if (!STOP_WORDS.has(tokens[i]) && !STOP_WORDS.has(tokens[i + 1])) {
      if (bigram.length > 6) {
        counts.set(bigram, (counts.get(bigram) || 0) + 1);
      }
    }

    if (i < tokens.length - 2) {
      const trigram = `${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`;
      if (!STOP_WORDS.has(tokens[i]) && !STOP_WORDS.has(tokens[i + 2])) {
        if (trigram.length > 10) {
          counts.set(trigram, (counts.get(trigram) || 0) + 1);
        }
      }
    }
  }

  return counts;
}

/**
 * Compiles all resume text into a single searchable string
 */
export function getResumeFullText(resume: ResumeData): string {
  const parts = [
    resume.fullName,
    resume.jobTitle,
    resume.summary,
    resume.location,
    resume.website,
    ...resume.skills,
    ...resume.experiences.flatMap((e) => [e.role, e.company, e.description]),
    ...resume.education.flatMap((ed) => [ed.degree, ed.school]),
  ];
  return parts.join(' ').toLowerCase();
}

/**
 * Analyzes resume against job description and produces detailed ATS audit
 */
export function analyzeATS(resume: ResumeData, jobDescription: string): ATSReport {
  const resumeText = getResumeFullText(resume);
  const jdKeywordsMap = extractKeywordsFromText(jobDescription);

  // Filter for most meaningful keywords appearing in JD
  const sortedJdKeywords = Array.from(jdKeywordsMap.entries())
    .sort((a, b) => b[1] - a[1])
    .filter(([kw, count]) => {
      // Keep if frequency is >= 2 or length is significant
      return count >= 2 || kw.includes(' ') || kw.length >= 5;
    })
    .slice(0, 35)
    .map(([kw]) => kw);

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  for (const kw of sortedJdKeywords) {
    const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(resumeText)) {
      matchedKeywords.push(kw);
    } else {
      missingKeywords.push(kw);
    }
  }

  const keywordMatchRate = sortedJdKeywords.length > 0
    ? Math.round((matchedKeywords.length / sortedJdKeywords.length) * 100)
    : 75;

  // Action verbs check
  const detectedActionVerbs: string[] = [];
  const suggestedActionVerbs: string[] = [];

  for (const verb of COMMON_ACTION_VERBS) {
    if (new RegExp(`\\b${verb}\\b`, 'i').test(resumeText)) {
      detectedActionVerbs.push(verb);
    } else {
      if (suggestedActionVerbs.length < 5) suggestedActionVerbs.push(verb);
    }
  }

  const actionVerbScore = Math.min(100, detectedActionVerbs.length * 15);

  // Metrics check (%, $, numbers)
  const hasMeasurableMetrics = /\b\d+%\b|\$\d+|\b\d+\+\b|\b\d{2,}\b/.test(resumeText);

  const checklist = {
    hasContactInfo: !!(resume.email && resume.phone),
    hasClearHeadline: !!(resume.jobTitle && resume.jobTitle.length > 3),
    hasSummary: !!(resume.summary && resume.summary.length > 40),
    hasMeasurableMetrics,
    hasEducation: resume.education.length > 0,
    hasSkillsSection: resume.skills.length >= 4,
  };

  const checklistPassed = Object.values(checklist).filter(Boolean).length;
  const readabilityScore = Math.round((checklistPassed / 6) * 100);

  // Composite ATS Score
  const rawScore = Math.round(
    keywordMatchRate * 0.5 + actionVerbScore * 0.2 + readabilityScore * 0.3
  );
  const overallScore = Math.max(30, Math.min(99, rawScore));

  let grade: ATSReport['grade'] = 'Needs Improvement';
  let summary = '';

  if (overallScore >= 90) {
    grade = 'A+';
    summary = 'Phenomenal Match! Your resume seamlessly covers key industry keywords, action verbs, and structure.';
  } else if (overallScore >= 80) {
    grade = 'A';
    summary = 'Strong ATS Compatibility. Minor keyword alignment will push your score into top recruiter percentiles.';
  } else if (overallScore >= 70) {
    grade = 'B';
    summary = 'Good foundation. Adding missing target keywords and quantifiable metrics will substantially boost rankings.';
  } else if (overallScore >= 55) {
    grade = 'C';
    summary = 'Average match. Key skills required by the job posting are currently missing from your resume.';
  } else {
    grade = 'Needs Improvement';
    summary = 'Low keyword overlap with the target job posting. Add core keywords to pass automated applicant screens.';
  }

  return {
    overallScore,
    grade,
    summary,
    keywordMatchRate,
    matchedKeywords,
    missingKeywords,
    actionVerbScore,
    detectedActionVerbs,
    suggestedActionVerbs,
    readabilityScore,
    checklist,
  };
}
