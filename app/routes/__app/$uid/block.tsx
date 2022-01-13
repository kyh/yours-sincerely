import { ActionFunction, LoaderFunction, redirect } from "remix";
import { notFound, badRequest, serverError } from "remix-utils";
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
    return badRequest({ message: "Invalid block" });

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
    if (error instanceof Error) return badRequest({ message: error.message });
    return serverError({ message: "Something went wrong" });
  }
};
