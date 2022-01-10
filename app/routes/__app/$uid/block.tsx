import { ActionFunction, LoaderFunction, redirect, json } from "remix";
import { isAuthenticated } from "~/lib/auth/server/middleware/auth.server";
import {
  createBlock,
  deleteBlock,
} from "~/lib/user/server/blockService.server";

export const loader: LoaderFunction = () => {
  throw new Response("", { status: 404 });
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
