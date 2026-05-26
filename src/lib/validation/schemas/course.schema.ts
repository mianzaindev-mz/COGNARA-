/**
 * Zod schemas for all course-system API request validation.
 * Imported by route handlers to validate incoming payloads.
 */

import { z } from "zod";

// ─── Course schemas ──────────────────────────────────────────────────────────

export const createCourseSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be at most 200 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(200, "Slug is too long")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase with hyphens (e.g. my-course)",
    ),
  description: z.string().max(5000).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  price_usd: z.number().min(0, "Price cannot be negative").optional().default(0),
  is_published: z.boolean().optional().default(false),
  thumbnail_url: z.string().url().optional().nullable(),
  preview_video_url: z.string().url().optional().nullable(),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
  language: z.string().max(10).optional().default("en"),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;

export const updateCourseSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  price_usd: z.number().min(0).optional(),
  is_published: z.boolean().optional(),
  thumbnail_url: z.string().url().optional().nullable(),
  preview_video_url: z.string().url().optional().nullable(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  language: z.string().max(10).optional(),
});

export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;

export const listCoursesQuerySchema = z.object({
  search: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  is_published: z.enum(["true", "false"]).optional(),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 20))
    .pipe(z.number().int().min(1).max(100)),
  offset: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 0))
    .pipe(z.number().int().min(0)),
});

// ─── Chapter schemas ─────────────────────────────────────────────────────────

export const createChapterSchema = z.object({
  title: z.string().min(1, "Chapter title is required").max(200),
  description: z.string().max(2000).optional().nullable(),
  order_index: z.number().int().min(0).optional().default(0),
  is_locked: z.boolean().optional().default(true),
  wall_type: z.enum(["none", "cloud", "wall"]).optional().default("none"),
});

export type CreateChapterInput = z.infer<typeof createChapterSchema>;

// ─── Lesson schemas ──────────────────────────────────────────────────────────

export const createLessonSchema = z.object({
  title: z.string().min(1, "Lesson title is required").max(300),
  content: z.string().max(50000).optional().nullable(),
  order_index: z.number().int().min(0).optional().default(0),
  type: z
    .enum(["text", "video", "code", "quiz", "mini_activity"])
    .optional()
    .default("text"),
  video_url: z.string().url().optional().nullable(),
  duration_mins: z.number().int().min(0).optional().nullable(),
  is_free_preview: z.boolean().optional().default(false),
  is_graded: z.boolean().optional().default(false),
});

export type CreateLessonInput = z.infer<typeof createLessonSchema>;

// ─── Enrollment schemas ──────────────────────────────────────────────────────

export const enrollSchema = z.object({
  course_id: z.string().uuid("Invalid course ID"),
  payment_intent_id: z.string().optional(),
});

export type EnrollInput = z.infer<typeof enrollSchema>;

export const dropSchema = z.object({
  reason: z.string().max(500).optional(),
});

export type DropInput = z.infer<typeof dropSchema>;

// ─── Progress schemas ────────────────────────────────────────────────────────

export const lessonCompleteSchema = z.object({
  lesson_id: z.string().uuid("Invalid lesson ID"),
  time_spent_mins: z.number().int().min(0).optional().default(0),
});

export type LessonCompleteInput = z.infer<typeof lessonCompleteSchema>;

// ─── UUID param helper ───────────────────────────────────────────────────────

export const uuidParam = z.string().uuid("Invalid ID format");
