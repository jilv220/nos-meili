import { z } from 'https://deno.land/x/zod@v3.21.4/mod.ts';

/** Schema to validate Nostr hex IDs such as event IDs and pubkeys. */
const nostrIdSchema = z.string().regex(/^[0-9a-f]{64}$/);

/** Nostr TimeStamps are positive integers. */
const TimeStampSchema = z.number().int().positive();

const PaginationSchema = z.number().int().nonnegative();

export const searchSchema = z.object({
  query: z.string().optional().default(""),
  kind: z.string().optional().default("1").transform((input) => parseInt(input)),
  pubkey: nostrIdSchema.optional(),
  since: TimeStampSchema.optional(),
  until: TimeStampSchema.optional(),
  sort: z.string().optional(),
  limit: PaginationSchema.optional().default(20),
  offset: PaginationSchema.optional().default(0),
})
