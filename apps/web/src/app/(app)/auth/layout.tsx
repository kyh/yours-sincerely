import type { Metadata } from "next";

import { NOINDEX } from "@/lib/seo";

/** Sign-in, sign-up and password screens: forms, never search results. */
export const metadata: Metadata = { robots: NOINDEX };

const AuthLayout = ({ children }: { children: React.ReactNode }) => children;

export default AuthLayout;
