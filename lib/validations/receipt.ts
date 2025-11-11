import { z } from "zod";

export const updateReceiptSchema = z.object({
  transaction_id: z.string().uuid().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const linkReceiptSchema = z.object({
  transaction_id: z.string().uuid(),
});

export type UpdateReceiptInput = z.infer<typeof updateReceiptSchema>;
export type LinkReceiptInput = z.infer<typeof linkReceiptSchema>;
