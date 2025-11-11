import { z } from "zod";

export const createTransactionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().min(1, "Description is required").max(500),
  merchant: z.string().max(255).optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  is_deductible: z.boolean().optional().default(false),
  status: z.enum(["pending", "categorized", "reviewed"]).optional().default("pending"),
});

export const updateTransactionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  amount: z.number().positive("Amount must be positive").optional(),
  description: z.string().min(1).max(500).optional(),
  merchant: z.string().max(255).optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  is_deductible: z.boolean().optional(),
  status: z.enum(["pending", "categorized", "reviewed"]).optional(),
});

export const getTransactionsQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default("1"),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default("50"),
  category_id: z.string().uuid().optional(),
  status: z.enum(["pending", "categorized", "reviewed"]).optional(),
  is_deductible: z.string().transform((val) => val === "true").optional(),
  from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  search: z.string().optional(),
});

export const bulkCreateTransactionsSchema = z.object({
  transactions: z.array(createTransactionSchema).min(1).max(100),
});

export const bulkUpdateTransactionsSchema = z.object({
  transaction_ids: z.array(z.string().uuid()).min(1).max(100),
  updates: updateTransactionSchema,
});

export const bulkDeleteTransactionsSchema = z.object({
  transaction_ids: z.array(z.string().uuid()).min(1).max(100),
});

export const bulkCategorizeTransactionsSchema = z.object({
  transaction_ids: z.array(z.string().uuid()).min(1).max(100),
  category_id: z.string().uuid(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type GetTransactionsQuery = z.infer<typeof getTransactionsQuerySchema>;
