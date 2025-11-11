import { z } from "zod";

export const createRuleSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  pattern: z.string().min(1, "Pattern is required"),
  category_id: z.string().uuid(),
  enabled: z.boolean().optional().default(true),
  priority: z.number().int().optional().default(0),
});

export const updateRuleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  pattern: z.string().min(1).optional(),
  category_id: z.string().uuid().optional(),
  enabled: z.boolean().optional(),
  priority: z.number().int().optional(),
});

export const applyRulesSchema = z.object({
  transaction_ids: z.array(z.string().uuid()).optional(),
});

export type CreateRuleInput = z.infer<typeof createRuleSchema>;
export type UpdateRuleInput = z.infer<typeof updateRuleSchema>;
export type ApplyRulesInput = z.infer<typeof applyRulesSchema>;
