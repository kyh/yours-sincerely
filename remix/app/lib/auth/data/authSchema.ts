import { User } from "~/lib/user/data/userSchema";

export type Session = { accessToken?: string; user: User | null };
export type AuthInput = { email: string; password: string };
