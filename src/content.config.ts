import { defineCollection, z } from "astro:content";

const councils = defineCollection({
  type: "content",
  schema: z.object({}).passthrough(),
});

const pages = defineCollection({
  type: "content",
  schema: z.object({}).passthrough(),
});

export const collections = { councils, pages };
