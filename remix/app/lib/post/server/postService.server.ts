import { Prisma } from "@prisma/client";
import { prisma } from "~/lib/core/server/prisma.server";
import { Post } from "~/lib/post/data/postSchema";

export const getPostList = async () => {
  const list = await prisma.post.findMany();
  return list;
};

export const getPost = async (input: Pick<Post, "id">) => {
  const post = await prisma.post.findUnique({
    where: { id: input.id },
  });

  return post;
};

export const createPost = async (input: Prisma.PostCreateInput) => {
  const { id, ...data } = input;
  const created = await prisma.post.create({
    data,
  });

  return created;
};

export const updatePost = async (
  input: Pick<Post, "id"> & Prisma.PostUpdateInput
) => {
  const { id, ...data } = input;
  const updated = await prisma.post.update({
    where: { id },
    data,
  });

  return updated;
};

export const deletePost = async (input: Pick<Post, "id">) => {
  const deleted = prisma.post.delete({
    where: { id: input.id },
  });

  return deleted;
};
