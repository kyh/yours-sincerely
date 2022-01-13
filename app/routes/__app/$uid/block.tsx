import { ActionFunction, LoaderFunction, redirect, json } from "remix";
import { notFound } from "remix-utils";
import { isAuthenticated } from "~/lib/auth/server/authenticator.server";
import {
  createBlock,
  deleteBlock,
} from "~/lib/user/server/blockService.server";

export const loader: LoaderFunction = () => {
  throw notFound({ message: "This page doesn't exists." });
};

export const action: ActionFunction = async ({ request, params }) => {
  const user = await isAuthenticated(request);
  const blockerId = user?.id;
  const blockingId = params.uid;

  if (!blockerId || !blockingId)
    return json({ success: false }, { status: 400 });

  try {
    if (request.method === "POST") {
      await createBlock({
        blocker: {
          connect: {
            id: blockerId,
          },
        },
        blocking: {
          connect: {
            id: blockingId,
          },
        },
      });
    }

    if (request.method === "DELETE") {
      await deleteBlock({ blockerId, blockingId });
    }

    return redirect("/");
  } catch (error) {
    console.error(error);
    return json({ success: false, error }, { status: 500 });
  }
};
