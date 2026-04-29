import * as z from 'zod';

export const sessionSchema = z.object({
  id: z.number(),
  jwtid: z.string(),
  user_id: z.number(),
});
