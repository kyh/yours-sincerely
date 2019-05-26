const { UserInputError } = require('apollo-server');
const { hash, compare } = require('bcrypt');
const { sign } = require('jsonwebtoken');
const keys = require('@server/config/keys');

const Mutation = {
  signup: async (parent, args, context, info) => {
    const hashedPassword = await hash(args.password, 10);
    // Create the user in the database
    const user = await context.prisma.mutation.createUser(
      {
        data: {
          ...args,
          password: hashedPassword,
          permissions: { set: ['USER'] },
        },
      },
      info,
    );
    const token = sign({ userId: user.id }, keys.auth.jwtSecret);
    context.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });
    return user;
  },
  login: async (parent, { email, password }, context) => {
    // 1. Check if there is a user with that email
    const user = await context.prisma.query.user({ where: { email } });
    if (!user) {
      throw new UserInputError(`No user found for email: ${email}`);
    }
    // 2. Check if their password is correct
    const passwordValid = await compare(password, user.password);
    if (!passwordValid) {
      throw new UserInputError('Invalid password');
    }
    // 3. Generate the JWT Token
    const token = sign({ userId: user.id }, keys.auth.jwtSecret);
    // 4. Set the cookie with the token
    context.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });
    // 5. Return the user
    return user;
  },
  logout(parent, args, context) {
    context.response.clearCookie('token');
    return { message: `We'll miss you!` };
  },
  createPost: async (parent, args, context, info) => {
    const { userId } = context.user;
    return context.prisma.mutation.createItem(
      {
        data: {
          ...args,
          author: {
            connect: {
              id: userId,
            },
          },
        },
      },
      info,
    );
  },
  deletePost: async (parent, { id }, context) => {
    return context.prisma.mutation.deletePost({ where: { id } });
  },
};

module.exports = {
  Mutation,
};
