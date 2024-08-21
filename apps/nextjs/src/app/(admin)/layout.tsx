import type { Metadata } from "next";
import React from "react";

import { api, HydrateClient } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Admin",
};

const Layout = ({ children }: React.PropsWithChildren) => {
  void api.user.me.prefetch();

  return <HydrateClient>{children}</HydrateClient>;
};

export default Layout;
