import { z } from "zod";
import {
  feedbackPriorities,
  feedbackStatuses,
  feedbackTypes,
} from "@/features/feedback/types";

const optionalShortText = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((value) => value || null);

export const createFeedbackSchema = z.object({
  type: z.enum(feedbackTypes),
  priority: z.enum(feedbackPriorities).default("medium"),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(5).max(5000),
  pageUrl: optionalShortText,
  userAgent: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((value) => value || null),
  browser: optionalShortText,
  operatingSystem: optionalShortText,
  viewport: z
    .string()
    .trim()
    .max(50)
    .optional()
    .transform((value) => value || null),
  language: z
    .string()
    .trim()
    .max(30)
    .optional()
    .transform((value) => value || null),
  appVersion: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((value) => value || null),
});

export const updateFeedbackSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(feedbackStatuses),
  adminComment: z
    .string()
    .trim()
    .max(5000)
    .optional()
    .transform((value) => value || null),
});

export const feedbackIdSchema = z.string().uuid();
