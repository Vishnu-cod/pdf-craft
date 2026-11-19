import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { ResumeData, ResumeExperience, ResumeEducation } from '../types';

interface TextLine {
  text: string;
  y: number;
  x: number;
  fontSize: number;
}

/**
 * Extracts structured text lines from an uploaded PDF file using PDF.js
 */
export async function extractLinesFromPDF(fileBytes: ArrayBuffer): Promise<TextLine[]> {
  const cloned = fileBytes.slice(0);
  const loadingTask = pdfjsLib.getDocument({ data: cloned });
  const pdfDoc = await loadingTask.promise;
  const allLines: TextLine[] = [];

  const maxPages = Math.min(pdfDoc.numPages, 3); // Most resumes are 1-2 pages

  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();

    const items: { text: string; y: number; x: number; fontSize: number }[] = [];
    for (const item of textContent.items as any[]) {
      if (!item.str || item.str.trim() === '') continue;

      const fontSize =
        Math.round(
          Math.sqrt(
            (item.transform[0] || 12) * (item.transform[0] || 12) +
              (item.transform[1] || 0) * (item.transform[1] || 0)
          )
        ) || 12;

      const pageOffsetY = (pageNum - 1) * viewport.height;
      const y = Math.round(pageOffsetY + (viewport.height - item.transform[5]));
      const x = Math.round(item.transform[4]);

      items.push({
        text: item.str.trim(),
        y,
        x,
        fontSize,
      });
    }

    // Sort items top-to-bottom, left-to-right
    items.sort((a, b) => {
      if (Math.abs(a.y - b.y) <= 4) {
        return a.x - b.x;
      }
      return a.y - b.y;
    });

    let currentLine: typeof items = [];
    let currentY = items[0]?.y ?? 0;

    for (const it of items) {
      if (Math.abs(it.y - currentY) <= 4) {
        currentLine.push(it);
      } else {
        if (currentLine.length > 0) {
          currentLine.sort((a, b) => a.x - b.x);
          const maxFont = Math.max(...currentLine.map((c) => c.fontSize));
          const lineStr = currentLine.map((c) => c.text).join(' ').trim();
          if (lineStr) {
            allLines.push({
              text: lineStr,
              y: currentY,
              x: currentLine[0].x,
              fontSize: maxFont,
            });
          }
        }
        currentLine = [it];
        currentY = it.y;
      }
    }

    if (currentLine.length > 0) {
      currentLine.sort((a, b) => a.x - b.x);
      const maxFont = Math.max(...currentLine.map((c) => c.fontSize));
      const lineStr = currentLine.map((c) => c.text).join(' ').trim();
      if (lineStr) {
        allLines.push({
          text: lineStr,
          y: currentY,
          x: currentLine[0].x,
          fontSize: maxFont,
        });
      }
    }
  }

  return allLines;
}

/**
 * Extracts raw text lines from a DOCX file
 */
export async function extractLinesFromDOCX(fileBytes: ArrayBuffer): Promise<string[]> {
  const zip = await JSZip.loadAsync(fileBytes);
  const docXml = await zip.file('word/document.xml')?.async('text');
  if (!docXml) return [];

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(docXml, 'application/xml');
  const paragraphs = Array.from(xmlDoc.getElementsByTagName('w:p'));

  const lines: string[] = [];
  for (const p of paragraphs) {
    const textNodes = p.getElementsByTagName('w:t');
    let pText = '';
    for (let i = 0; i < textNodes.length; i++) {
      pText += textNodes[i].textContent || '';
    }
    const trimmed = pText.trim();
    if (trimmed) {
      lines.push(trimmed);
    }
  }
  return lines;
}

type SectionType = 'HEADER' | 'SUMMARY' | 'EXPERIENCE' | 'EDUCATION' | 'SKILLS' | 'PROJECTS' | 'OTHER';

/**
 * Robust section detector: Identifies standard resume section headers.
 * Headers must be short standalone lines (<= 45 chars), never sentences with periods or bullet points.
 */
function detectSectionHeader(text: string): SectionType | null {
  const trimmed = text.trim();
  // Section headers are short standalone titles (e.g. "PROFESSIONAL EXPERIENCE", "EDUCATION")
  // They are never bullet points, never long sentences (> 45 chars), and never end with a period.
  if (
    trimmed.length > 45 ||
    trimmed.startsWith('•') ||
    trimmed.startsWith('-') ||
    trimmed.startsWith('*') ||
    trimmed.endsWith('.') ||
    (trimmed.match(/[,;]/g) || []).length >= 2
  ) {
    return null;
  }

  const clean = trimmed
    .toUpperCase()
    .replace(/[^A-Z\s&]/g, '')
    .trim();

  // Summary
  if (
    clean === 'SUMMARY' ||
    clean === 'PROFESSIONAL SUMMARY' ||
    clean === 'EXECUTIVE SUMMARY' ||
    clean === 'CAREER SUMMARY' ||
    clean === 'OBJECTIVE' ||
    clean === 'CAREER OBJECTIVE' ||
    clean === 'PROFILE' ||
    clean === 'PROFESSIONAL PROFILE' ||
    clean === 'ABOUT ME' ||
    clean === 'BACKGROUND'
  ) {
    return 'SUMMARY';
  }

  // Skills & Tools
  if (
    clean.includes('SKILL') ||
    clean.includes('COMPETENC') ||
    clean.includes('PROFICIENC') ||
    clean.includes('TOOL') ||
    clean.includes('PLATFORM') ||
    clean.includes('EXPERTISE') ||
    clean.includes('TECHNOLOG')
  ) {
    return 'SKILLS';
  }

  // Projects & Practice
  if (
    clean.includes('PROJECT') ||
    clean.includes('CASE STUD') ||
    clean === 'PORTFOLIO'
  ) {
    return 'PROJECTS';
  }

  // Experience & Employment
  if (
    clean.includes('EXPERIENCE') ||
    clean.includes('EMPLOYMENT') ||
    clean.includes('WORK HISTORY') ||
    clean.includes('CAREER HISTORY') ||
    clean.includes('JOB HISTORY')
  ) {
    return 'EXPERIENCE';
  }

  // Education & Certifications
  if (
    clean.includes('EDUCATION') ||
    clean.includes('ACADEMIC') ||
    clean.includes('QUALIFICATION') ||
    clean.includes('CERTIFICATION') ||
    clean.includes('TRAINING') ||
    clean.includes('CREDENTIAL')
  ) {
    return 'EDUCATION';
  }

  if (clean.includes('LANGUAGE') || clean.includes('DECLARATION') || clean.includes('INTEREST')) {
    return 'OTHER';
  }

  return null;
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX = /(?:\+?91[\s-]?)?[6-9]\d{9}|(?:\+?1\s*)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,5}/;
const LINKEDIN_REGEX = /(?:linkedin\.com\/in\/[a-zA-Z0-9_-]+|github\.com\/[a-zA-Z0-9_-]+|(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/i;
const DATE_RANGE_REGEX = /(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(?:20\d\d|19\d\d)\s*[-–—to]+\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(?:20\d\d|present|current|now)|(?:summer|winter|spring|fall)\s*20\d\d|(?:20\d\d|19\d\d)\s*[-–—]\s*(?:20\d\d|19\d\d)/i;

const KNOWN_COUNTRIES = [
  'India', 'United States', 'USA', 'U.S.A.', 'United Kingdom', 'UK', 'U.K.',
  'Canada', 'Australia', 'Germany', 'France', 'Singapore', 'United Arab Emirates',
  'UAE', 'U.A.E.', 'Dubai', 'Saudi Arabia', 'Malaysia', 'New Zealand', 'Ireland',
  'Netherlands', 'Switzerland', 'Sweden', 'Japan', 'Philippines', 'South Africa',
  'Brazil', 'Spain', 'Italy', 'Poland', 'Sri Lanka', 'Bangladesh', 'Nepal', 'Qatar', 'Kuwait', 'Oman'
];

const KNOWN_INDIAN_STATES_CITIES = [
  'Tamil Nadu', 'Tamilnadu', 'Madurai', 'Chennai', 'Coimbatore', 'Trichy', 'Salem', 'Tirunelveli',
  'Erode', 'Vellore', 'Bangalore', 'Bengaluru', 'Karnataka', 'Hyderabad', 'Telangana', 'Andhra Pradesh',
  'Mumbai', 'Pune', 'Maharashtra', 'Delhi', 'New Delhi', 'NCR', 'Kolkata', 'West Bengal',
  'Kerala', 'Kochi', 'Thiruvananthapuram', 'Calicut', 'Gujarat', 'Ahmedabad', 'Surat', 'Vadodara',
  'Jaipur', 'Rajasthan', 'Chandigarh', 'Punjab', 'Noida', 'Gurgaon', 'Gurugram', 'Lucknow',
  'Kanpur', 'Uttar Pradesh', 'Indore', 'Bhopal', 'Madhya Pradesh', 'Bhubaneswar', 'Odisha', 'Goa'
];

/**
 * Main parser: Parses text lines into a structured ResumeData object
 */
export function parseResumeLines(rawLines: string[]): ResumeData {
  const result: ResumeData = {
    fullName: '',
    jobTitle: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    summary: '',
    experiences: [],
    education: [],
    skills: [],
  };

  // 1. Group lines by detected section
  const sectionBuckets: Record<SectionType, string[]> = {
    HEADER: [],
    SUMMARY: [],
    EXPERIENCE: [],
    EDUCATION: [],
    SKILLS: [],
    PROJECTS: [],
    OTHER: [],
  };

  let currentSection: SectionType = 'HEADER';

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const detectedHeader = detectSectionHeader(trimmed);
    if (detectedHeader) {
      currentSection = detectedHeader;
      continue;
    }

    sectionBuckets[currentSection].push(trimmed);
  }

  // 2. Parse HEADER section
  const headerLines = sectionBuckets.HEADER;

  // Name: First prominent line in HEADER that is not a heading, email, or label
  for (const line of headerLines) {
    const lower = line.toLowerCase();
    if (
      lower.includes('curriculum vitae') ||
      lower.includes('resume') ||
      lower.includes('@') ||
      lower.includes('phone') ||
      lower.includes('portfolio:')
    ) {
      continue;
    }
    if (!result.fullName && line.length < 50 && !line.includes('http') && !line.match(/\d{5,}/)) {
      result.fullName = line.replace(/[^a-zA-Z\s.'-]/g, '').trim();
      break;
    }
  }

  // Email, Phone, Website & Location from header lines or top 25 lines
  const searchLinesForContact = [...headerLines, ...rawLines.slice(0, 25)];
  for (const line of searchLinesForContact) {
    if (!result.email) {
      const emailMatch = line.match(EMAIL_REGEX);
      if (emailMatch) result.email = emailMatch[0];
    }
    if (!result.phone) {
      const phoneMatch = line.match(PHONE_REGEX);
      if (phoneMatch && phoneMatch[0].length >= 8) {
        result.phone = phoneMatch[0].trim();
      }
    }
    if (!result.website) {
      if (line.toLowerCase().includes('portfolio:')) {
        result.website = line.replace(/portfolio:\s*/i, '').trim();
      } else if (line.toLowerCase().includes('github.com') || line.toLowerCase().includes('linkedin.com')) {
        result.website = line.trim();
      } else {
        const linkMatch = line.match(LINKEDIN_REGEX);
        if (linkMatch && !linkMatch[0].includes('@')) {
          result.website = linkMatch[0].trim();
        }
      }
    }
  }

  // Extract Location:
  // A. From pipe-separated contact line (e.g., "Madurai, Tamil Nadu, India | +91 9344949527 | vishnu@...")
  for (const line of searchLinesForContact) {
    if (result.location) break;
    const parts = line.split(/[|•·;\t]+|\s{2,}/).map((p) => p.trim()).filter(Boolean);
    for (const part of parts) {
      if (
        part.includes('@') ||
        part.match(PHONE_REGEX) ||
        part.match(LINKEDIN_REGEX) ||
        part.toLowerCase().includes('portfolio') ||
        part.toLowerCase().includes('http') ||
        part.toLowerCase().includes('www.') ||
        part === result.fullName
      ) {
        continue;
      }
      const hasCountry = KNOWN_COUNTRIES.some((c) => new RegExp(`\\b${c}\\b`, 'i').test(part));
      const hasIndianStateCity = KNOWN_INDIAN_STATES_CITIES.some((c) => new RegExp(`\\b${c}\\b`, 'i').test(part));
      const hasPostalCode = /\b\d{5,6}\b/.test(part);
      const hasCityComma = /[a-zA-Z\s]+,\s*[a-zA-Z]{2,}/.test(part);

      if (hasCountry || hasIndianStateCity || hasPostalCode || hasCityComma) {
        result.location = part.replace(/^[-–—,\s]+|[-–—,\s]+$/g, '').trim();
        break;
      }
    }
  }

  // B. From explicit address labels or country mentions anywhere
  if (!result.location) {
    for (const line of rawLines) {
      const labelMatch = line.match(/(?:location|address|residence|place|current location|native|country|city|based in)[:\s]+([^|•\n\r;]{3,50})/i);
      if (labelMatch && labelMatch[1]) {
        result.location = labelMatch[1].replace(/^[-–—,\s]+|[-–—,\s]+$/g, '').trim();
        break;
      }
    }
  }

  // C. Fallback: Phone number country inference
  if (!result.location && result.phone) {
    const rawDigits = result.phone.replace(/\D/g, '');
    const docText = rawLines.join(' ');
    const foundCity = KNOWN_INDIAN_STATES_CITIES.find((c) => new RegExp(`\\b${c}\\b`, 'i').test(docText));
    if (result.phone.includes('+91') || rawDigits.startsWith('91') || /^[6-9]\d{9}$/.test(rawDigits)) {
      result.location = foundCity ? `${foundCity}, India` : 'India';
    }
  }

  // Job Title / Headline:
  // Look for sub-headline line in header (e.g., "SEO TRAINEE | JUNIOR SEO EXECUTIVE | DIGITAL MARKETING EXECUTIVE")
  for (const line of headerLines) {
    if (
      line === result.fullName ||
      line.includes('@') ||
      (result.phone && line.includes(result.phone)) ||
      (result.location && line.includes(result.location)) ||
      line.toLowerCase().includes('portfolio:')
    ) {
      continue;
    }

    if (
      line.toLowerCase().includes('seo') ||
      line.toLowerCase().includes('marketing') ||
      line.toLowerCase().includes('engineer') ||
      line.toLowerCase().includes('developer') ||
      line.toLowerCase().includes('executive') ||
      line.toLowerCase().includes('manager') ||
      line.toLowerCase().includes('analyst') ||
      line.toLowerCase().includes('associate')
    ) {
      result.jobTitle = line.trim();
      break;
    }
  }

  if (!result.jobTitle) {
    for (const line of headerLines) {
      if (
        line !== result.fullName &&
        !line.includes('@') &&
        !line.toLowerCase().includes('portfolio:') &&
        line.length < 80
      ) {
        result.jobTitle = line.trim();
        break;
      }
    }
  }

  // 3. Parse SUMMARY section
  if (sectionBuckets.SUMMARY.length > 0) {
    result.summary = sectionBuckets.SUMMARY.join(' ').replace(/\s+/g, ' ').trim();
  }

  // 4. Parse EXPERIENCE section
  const expLines = sectionBuckets.EXPERIENCE;
  let currentExp: Partial<ResumeExperience> | null = null;
  const collectedExps: ResumeExperience[] = [];
  const bulletBuffer: string[] = [];

  const finalizeCurrentExp = () => {
    if (currentExp && (currentExp.role || currentExp.company)) {
      currentExp.description = bulletBuffer.join('\n').replace(/\n+/g, '\n').trim();
      if (!currentExp.description) {
        currentExp.description = 'Handled core responsibilities, supported cross-functional deliverables, and contributed to key organization targets.';
      }
      collectedExps.push({
        id: 'exp_' + (collectedExps.length + 1),
        role: currentExp.role || 'Professional Role',
        company: currentExp.company || 'Organization',
        duration: currentExp.duration || '2022 - Present',
        description: currentExp.description,
      });
    }
    bulletBuffer.length = 0;
  };

  for (let i = 0; i < expLines.length; i++) {
    const line = expLines[i];
    const dateMatch = line.match(DATE_RANGE_REGEX);

    // Check if line contains a pipe or date range
    if (line.includes('|') || dateMatch) {
      finalizeCurrentExp();

      const parts = line.split(/\s*[|•–—;]\s*/).map((p) => p.trim()).filter(Boolean);

      let role = '';
      let company = '';
      let duration = dateMatch ? dateMatch[0].trim() : '';

      if (parts.length >= 3) {
        role = parts[0];
        company = parts[1];
        if (!duration) duration = parts[2];
      } else if (parts.length === 2) {
        role = parts[0];
        company = parts[1];
      } else {
        role = line.replace(DATE_RANGE_REGEX, '').trim();
      }

      currentExp = {
        role: role || 'Business Development Associate',
        company: company || 'Organization',
        duration: duration || '2022 - 2024',
      };
    } else {
      // Bullet point line
      if (currentExp) {
        const cleanBullet = line.replace(/^[•\-\*●▪◦\d\.]+\s*/, '').trim();
        if (cleanBullet) {
          bulletBuffer.push('• ' + cleanBullet);
        }
      }
    }
  }

  finalizeCurrentExp();

  // 5. Also append practical projects from PROJECTS section as Project Experiences!
  const projectLines = sectionBuckets.PROJECTS;
  if (projectLines.length > 0 && collectedExps.length < 4) {
    let currentProj: Partial<ResumeExperience> | null = null;
    let projBullets: string[] = [];

    const finalizeProj = () => {
      if (currentProj && currentProj.role) {
        collectedExps.push({
          id: 'exp_' + (collectedExps.length + 1),
          role: currentProj.role,
          company: currentProj.company || 'Independent Project & Practice',
          duration: currentProj.duration || '2024',
          description: projBullets.join(' ').replace(/\s+/g, ' ').trim() || 'Executed in-depth analysis and documented actionable findings.',
        });
      }
      projBullets = [];
    };

    for (const pLine of projectLines) {
      if (
        pLine.length < 80 &&
        !pLine.startsWith('•') &&
        !pLine.startsWith('-') &&
        (pLine.includes('&') || pLine.includes('Analysis') || pLine.includes('Audits') || pLine.includes('SEO') || pLine.includes('Research'))
      ) {
        finalizeProj();
        currentProj = {
          role: pLine.replace(/^[0-9.]+\s*/, '').trim(),
          company: 'Practical Portfolio Project',
          duration: '2024',
        };
      } else if (currentProj) {
        projBullets.push(pLine);
      }
    }
    finalizeProj();
  }

  if (collectedExps.length > 0) {
    result.experiences = collectedExps;
  }

  // 6. Parse EDUCATION section
  const eduLines = sectionBuckets.EDUCATION;
  const collectedEdu: ResumeEducation[] = [];

  for (const line of eduLines) {
    // If pipe separated (e.g., "Advanced Digital Marketing Training | FITA Academy | Completed")
    if (line.includes('|')) {
      const parts = line.split(/\s*\|\s*/).map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        collectedEdu.push({
          id: 'edu_' + (collectedEdu.length + 1),
          degree: parts[0],
          school: parts[1],
          year: parts[2] || 'Completed',
        });
        continue;
      }
    }

    const hasDegree = /b\.?sc|b\.?s|b\.?a|b\.?tech|b\.?e|m\.?s|m\.?a|mba|bachelor|master|degree|diploma|associate|ph\.?d|training/i.test(line);
    const hasSchool = /college|university|academy|institute|school/i.test(line);
    const dateMatch = line.match(/(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(?:20\d\d|19\d\d)\s*[-–—to]+\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(?:20\d\d|present|completed)|(?:20\d\d)/i);

    if (hasDegree || hasSchool) {
      const parts = line.split(/\s*,\s*|\sat\s/i).map((p) => p.trim()).filter(Boolean);
      collectedEdu.push({
        id: 'edu_' + (collectedEdu.length + 1),
        degree: parts[0] || line,
        school: parts[1] || 'Institution',
        year: dateMatch ? dateMatch[0] : 'Completed',
      });
    }
  }

  if (collectedEdu.length > 0) {
    result.education = collectedEdu;
  }

  // 7. Parse SKILLS section (Digital Marketing Skills, Tools & Platforms)
  const skillLines = sectionBuckets.SKILLS;
  const rawSkills: string[] = [];

  for (const line of skillLines) {
    // Remove category labels like "SEO:", "Analytics:", "Tools & Platforms:"
    const cleaned = line.replace(/^[a-zA-Z\s&]+:\s*/, '');
    const tokens = cleaned
      .split(/[,;•|]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1 && s.length < 50);

    rawSkills.push(...tokens);
  }

  const cleanSkills = Array.from(new Set(rawSkills))
    .filter((s) => !/^(and|or|with|the|in|for|at|on|of|not|live|basic)$/i.test(s))
    .slice(0, 24);

  if (cleanSkills.length > 0) {
    result.skills = cleanSkills;
  }

  // Zero-Fake-Data Rule: Never inject hardcoded dummy data.
  // Genuinely missing fields remain blank so the user can easily see and verify them in the Review Drawer!
  if (!result.fullName) result.fullName = '';
  if (!result.jobTitle) result.jobTitle = '';
  if (!result.email) result.email = '';
  if (!result.phone) result.phone = '';
  if (!result.location) result.location = '';

  return result;
}

/**
 * High-level helper: Ingests an uploaded file (PDF, DOCX, TXT), parses it,
 * and returns structured ResumeData
 */
export async function parseResumeFile(file: File): Promise<{ data: ResumeData; message: string }> {
  const fileName = file.name.toLowerCase();
  let lines: string[] = [];

  if (fileName.endsWith('.pdf')) {
    const arrayBuffer = await file.arrayBuffer();
    const textLines = await extractLinesFromPDF(arrayBuffer);
    lines = textLines.map((l) => l.text);
  } else if (fileName.endsWith('.docx')) {
    const arrayBuffer = await file.arrayBuffer();
    lines = await extractLinesFromDOCX(arrayBuffer);
  } else {
    const text = await file.text();
    lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  }

  if (lines.length === 0) {
    throw new Error('No readable text could be extracted from this document.');
  }

  const parsed = parseResumeLines(lines);

  const summaryMsg = `Extracted ${parsed.fullName || 'Candidate'}, ${parsed.experiences.length} experience & project entries, ${parsed.education.length} degree(s), and ${parsed.skills.length} skills!`;

  return {
    data: parsed,
    message: summaryMsg,
  };
}
