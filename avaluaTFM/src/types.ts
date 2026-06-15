/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EvaluationLevel = 1 | 2 | 3 | 4;

export interface CriterionScoring {
  level: EvaluationLevel | null;
  comment: string;
}

export type RubricScoring = Record<string, CriterionScoring>;

export interface PDFAnnotation {
  id: string;
  type: 'pin' | 'highlight' | 'draw' | 'text';
  pageNumber: number;
  x: number; // Percentage from left (0 to 100)
  y: number; // Percentage from top (0 to 100)
  width?: number; // Percentage width
  height?: number; // Percentage height
  color: string; // e.g. '#ef4444', '#10b981', '#f59e0b', '#3b82f6'
  icon?: string; // 'check' | 'close' | 'question' | 'star' | 'comment'
  text?: string; // Comment text or text label
  points?: { x: number; y: number }[]; // Percentage coordinates for drawings
  createdAt?: string;
}

export interface TFM {
  id: string;
  studentName: string;
  tfmTitle?: string;
  directLinks?: { id: string; label: string; url: string }[];
  pdfFileName?: string;
  pdfAnnotations?: PDFAnnotation[];
  generalComments?: string;
  evaluatorRole: 'tutor' | 'avaluador'; // Default role initially set by creator, but can switch
  createdAt: string;
  updatedAt: string;
  
  // Section 1: Procés del TFM (Evaluated by Tutor) - worth 20%
  procesScore: number; // 0 to 10
  procesComment: string;
  
  // Section 2: Rubrica del Treball (Evaluated by BOTH Tutor and Avaluador) - worth 60%
  tutorRubric: RubricScoring;
  avaluadorRubric: RubricScoring;
  
  // Section 3: Video i Defensa (Evaluated only by Avaluador Extern) - worth 20%
  videoRubric: RubricScoring; // structure, synthesis, verbals
  defensaRubric: RubricScoring; // clarity, argument, additional
  
  // Rich Notes (Markdown/HTML formatted common notes)
  videoNotes: string;
  defensaNotes: string;
  commonNotes: string; // "apartat d'escriptura comú i de notes"
}

export interface Criterion {
  id: string;
  name: string;
  weight: number;
  levels: {
    1: string;
    2: string;
    3: string;
    4: string;
  };
}

// Criteria groups for UI structuring
export interface CriterionGroup {
  id: string;
  name: string;
  criteria: Criterion[];
}
