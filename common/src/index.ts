import { z } from "zod";

export const signupInput = z.object({
  username: z.string().email(),
  name: z.string().optional(),
  password: z.string().min(6),
});

export const signinInput = z.object({
  username: z.string().email(),
  password: z.string().min(6),
});

export const createBlogInput = z.object({
  title: z.string(),
  content: z.string(),
});

export const updateBlogInput = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  id: z.number(),
});

export type User = z.infer<typeof signupInput>;
export type Signin = z.infer<typeof signinInput>;
export type CreateBlog = z.infer<typeof createBlogInput>;
export type UpdateBlog = z.infer<typeof updateBlogInput>;
