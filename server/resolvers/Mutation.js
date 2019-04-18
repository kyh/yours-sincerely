const { hash, compare } = require('bcrypt');
const { sign } = require('jsonwebtoken');
const keys = require('@server/config/keys');

const Mutation = {
  signup: async (parent, { username, password }, context) => {
    const hashedPassword = await hash(password, 10);
    // Create the user in the database
    const user = await context.prisma.createUser({
      username,
      password: hashedPassword,
      permissions: { set: ['USER'] },
    });
    const token = sign({ userId: user.id }, keys.jwtSecret);
    context.response.cookie(keys.cookieName, token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });
    return user;
  },
  login: async (parent, { email, password }, context) => {
    // 1. Check if there is a user with that email
    const user = await context.prisma.user({ email });
    if (!user) {
      throw new Error(`No user found for email: ${email}`);
    }
    // 2. Check if their password is correct
    const passwordValid = await compare(password, user.password);
    if (!passwordValid) {
      throw new Error('Invalid password');
    }
    // 3. Generate the JWT Token
    const token = sign({ userId: user.id }, keys.jwtSecret);
    // 4. Set the cookie with the token
    context.response.cookie(keys.cookieName, token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });
    // 5. Return the user
    return user;
  },
  logout(parent, args, context) {
    context.response.clearCookie(keys.cookieName);
    return { message: `We'll miss you!` };
  },
  createDraft: async (parent, { title, content }, context) => {
    const { userId } = context;
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
