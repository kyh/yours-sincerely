import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { notFound } from "remix-utils";
import { authenticator } from "~/lib/auth/server/authenticator.server";

export const loader: LoaderFunction = () => {
  throw notFound({ message: "This page doesn't exists." });
};

export const action: ActionFunction = async ({ request }) => {
  return authenticator.authenticate("google", request);
};
