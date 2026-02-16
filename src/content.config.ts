import { defineCollection, z } from "astro:content";

const work = defineCollection({
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    org: z.string(),
    year: z.string(),
    role: z.string().optional(),
    timeline: z.string().optional(),
    team: z.string().optional(),
    skills: z.array(z.string()).optional(),
  }),
});

const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    date: z.string(),
  }),
});

export const collections = { work, blog };
