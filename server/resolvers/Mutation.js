const { hash, compare } = require('bcrypt');
const { sign } = require('jsonwebtoken');
const { getUserId } = require('@server/services/authentication');
const keys = require('@server/config/keys');

const Mutation = {
  signup: async (parent, { username, password }, context) => {
    const hashedPassword = await hash(password, 10);
    const user = await context.prisma.createUser({
      username,
      password: hashedPassword,
    });
    return {
      token: sign({ userId: user.id }, keys.jwtSecret),
      user,
    };
  },
  login: async (parent, { username, password }, context) => {
    const user = await context.prisma.user({ username });
    if (!user) {
      throw new Error(`No user found for username: ${username}`);
    }
    const passwordValid = await compare(password, user.password);
    if (!passwordValid) {
      throw new Error('Invalid password');
    }
    return {
      token: sign({ userId: user.id }, keys.jwtSecret),
      user,
    };
  },
  createDraft: async (parent, { title, content }, context) => {
    const userId = getUserId(context);
    return context.prisma.createPost({
      title,
      content,
      author: { connect: { id: userId } },
    });
  },
  deletePost: async (parent, { id }, context) => {
    return context.prisma.deletePost({ id });
  },
  publish: async (parent, { id }, context) => {
    return context.prisma.updatePost({
      where: { id },
      data: { published: true },
    });
  },
};

module.exports = {
  Mutation,
};
