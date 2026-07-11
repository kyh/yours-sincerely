import { z } from "zod";

export const createPostInput = z.object({
  parentId: z.string().optional(),
  content: z.string().min(10, "You'll need to write a bit more than that"),
  createdBy: z.string().optional(),
});
export type CreatePostInput = z.infer<typeof createPostInput>;
