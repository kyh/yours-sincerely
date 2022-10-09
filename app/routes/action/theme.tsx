import { json, redirect } from "@remix-run/node";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";

import { setThemeAndCommit } from "~/lib/core/server/session.server";
import { isTheme } from "~/lib/core/util/theme";

export const action: ActionFunction = async ({ request }) => {
  const requestText = await request.text();
  const form = new URLSearchParams(requestText);
  const theme = form.get("theme");

  if (!isTheme(theme)) {
    return json({
      success: false,
      message: `theme value of ${theme} is not a valid theme`,
    });
  }

  const headers = await setThemeAndCommit(request, theme);

  return json({ success: true }, { headers });
};

export const loader: LoaderFunction = () => redirect("/", { status: 404 });
