export type ActiveTab = 'sign-edit' | 'organize' | 'convert' | 'tools' | 'resume' | 'split' | 'security' | 'security-studio' | 'postercraft' | 'whatsapp-studio';

export type ToolSubTab = 'table-extract' | 'doctor' | 'diff';
export type ConvertSubTab = 'images-to-pdf' | 'pdf-to-images' | 'extract-images';

export interface ResumeExperience {
  id: string;
  role: string;
  company: string;
  duration: string;
  description: string;
}

export interface ResumeEducation {
  id: string;
  degree: string;
  school: string;
  year: string;
}

export interface ResumeData {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  summary: string;
  experiences: ResumeExperience[];
  education: ResumeEducation[];
  skills: string[];
  photoUrl?: string;
  qrCodeEnabled?: boolean;
  qrCodeUrl?: string;
}

export type ResumeTemplate = 'modern' | 'executive' | 'classic';
export type ResumeColor = 'indigo' | 'slate' | 'navy' | 'emerald' | 'burgundy';

export interface Annotation {
  id: string;
  type: 'signature' | 'text' | 'redaction' | 'stamp' | 'date';
  pageIndex: number;
  x: number; // percentage (0 to 100) or exact coords
  y: number; // percentage (0 to 100)
  width?: number;
  height?: number;
  content: string; // image base64, text string, stamp label
  fontSize?: number;
  color?: string;
}

export interface PDFPageMeta {
  pageNumber: number;
  width: number;
  height: number;
  rotation: number;
  previewUrl?: string;
}

export interface ExtractedTable {
  headers: string[];
  rows: string[][];
}
