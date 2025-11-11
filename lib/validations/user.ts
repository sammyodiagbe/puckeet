import { z } from "zod";

export const updateUserSettingsSchema = z.object({
  settings: z.record(z.any()).optional(),
});

export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>;
