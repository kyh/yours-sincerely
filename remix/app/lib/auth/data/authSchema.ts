import { User } from "~/lib/user/data/userSchema";

export type Session = { accessToken?: string; user: User };
export type AuthInput = { email: string; password: string };
