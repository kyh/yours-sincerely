import { hash, compare } from "bcrypt";

const SALT_ROUNDS = 10;

export const createPasswordHash = async (password: string) => {
  const passwordHash = await hash(password, SALT_ROUNDS);
  return passwordHash;
};

export const validatePassword = async (
  password: string,
  passwordHash: string
) => {
  const isMatchingPassword = await compare(password, passwordHash);
  return isMatchingPassword;
};
