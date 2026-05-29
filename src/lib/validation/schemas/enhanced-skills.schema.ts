// src/lib/validation/schemas/enhanced-skills.schema.ts
import { z } from "zod";

export const createReportSchema = z.object({
  category: z.enum(['bug','abuse','content','fraud','security','legal','performance','feature_request']),
  title: z.string().trim().min(5).max(200),
  description: z.string().trim().min(20).max(5000),
  page_url: z.string().url().optional(),
  page_route: z.string().max(500).optional(),
  dom_selector: z.string().max(500).optional(),
  video_timestamp_secs: z.number().int().min(0).optional(),
  lesson_id: z.string().uuid().optional(),
  course_id: z.string().uuid().optional(),
  reported_user_id: z.string().uuid().optional(),
  screenshot_path: z.string().max(500).optional(),
  browser_info: z.object({
    userAgent: z.string(),
    viewport: z.object({ w: z.number(), h: z.number() })
  }).optional(),
  reproduction_steps: z.string().max(2000).optional(),
}).strict();

export const createGradeScaleSchema = z.object({
  name: z.string().trim().min(2).max(100),
  is_default: z.boolean().default(false),
  passing_grade: z.string().max(3).default('D'),
  grades: z.array(z.object({
    letter: z.string().max(3),
    min_pct: z.number().min(0).max(100),
    max_pct: z.number().min(0).max(100),
    grade_point: z.number().min(0).max(4).multipleOf(0.1),
    label: z.string().max(50),
  })).min(2).max(15),
}).strict().refine(data => {
  const sorted = [...data.grades].sort((a,b) => a.min_pct - b.min_pct);
  if (sorted[0].min_pct !== 0) return false;
  if (sorted[sorted.length-1].max_pct !== 100) return false;
  
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].min_pct !== sorted[i-1].max_pct + 1) return false;
  }
  return true;
}, { message: 'Grade ranges must cover 0-100 with no gaps or overlaps' });

export const updateGradeScaleSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  is_default: z.boolean().optional(),
  passing_grade: z.string().max(3).optional(),
  grades: z.array(z.object({
    letter: z.string().max(3),
    min_pct: z.number().min(0).max(100),
    max_pct: z.number().min(0).max(100),
    grade_point: z.number().min(0).max(4).multipleOf(0.1),
    label: z.string().max(50),
  })).min(2).max(15).optional(),
}).strict().refine(data => {
  if (!data.grades) return true;
  const sorted = [...data.grades].sort((a,b) => a.min_pct - b.min_pct);
  if (sorted[0].min_pct !== 0) return false;
  if (sorted[sorted.length-1].max_pct !== 100) return false;
  
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].min_pct !== sorted[i-1].max_pct + 1) return false;
  }
  return true;
}, { message: 'Grade ranges must cover 0-100 with no gaps or overlaps' });

export const createTaskSchema = z.object({
  title: z.string().trim().min(2).max(200),
  type: z.enum(['email','notification','reminder','quiz_reminder','study_reminder','deadline_alert','weekly_report','custom']),
  payload: z.record(z.unknown()),
  scheduled_at: z.string().datetime(),
  recurrence: z.enum(['once','daily','weekly','monthly']).default('once'),
  recurrence_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  recurrence_day: z.number().int().min(0).max(31).optional(),
  max_runs: z.number().int().min(1).optional(),
}).strict();

export const researchSchema = z.object({
  query: z.string().trim().min(3).max(500),
  depth: z.enum(['quick','deep']).default('quick'),
}).strict();

export const createTranscriptSchema = z.object({
  lesson_id: z.string().uuid(),
  transcript_text: z.string().min(10),
  segments: z.array(z.object({
    start_secs: z.number().min(0),
    end_secs: z.number().min(0),
    text: z.string(),
    is_final: z.boolean(),
  })).optional(),
  language: z.string().length(2).default('en'),
  source: z.enum(['web_speech','whisper','upload','manual']).default('web_speech'),
}).strict();

export const gradeOverrideSchema = z.object({
  instructor_override: z.number().min(0).max(100).optional(),
  instructor_note: z.string().trim().max(1000).optional(),
}).strict().refine(d => d.instructor_override !== undefined || d.instructor_note !== undefined,
  { message: 'Must provide at least a score override or instructor note' });
