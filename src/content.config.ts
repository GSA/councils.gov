import { defineCollection } from "astro:content";
import { z } from "astro/zod";

const councils = defineCollection({
  type: "content",
  schema: z.object({}).passthrough(),
});

const pages = defineCollection({
  type: "content",
  schema: z.object({}).passthrough(),
});

export const collections = { councils, pages };
