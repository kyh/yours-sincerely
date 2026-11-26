import { z } from "zod";

const [jsonUrl, domain, name, value] = process.argv.slice(2);

if (jsonUrl === undefined || domain === undefined || name === undefined || value === undefined) {
  throw new Error("Usage: seed-webview-cookie.ts <devtools json url> <domain> <name> <value>");
}

const targetSchema = z.object({ type: z.string(), webSocketDebuggerUrl: z.string().optional() });

const replySchema = z.object({
  error: z.unknown().optional(),
  id: z.number().optional(),
  result: z.unknown().optional(),
});

const cookiesSchema = z.object({
  cookies: z.array(z.object({ httpOnly: z.boolean(), name: z.string(), value: z.string() })),
});

const targetsResponse = await fetch(jsonUrl);
const targets = z.array(targetSchema).parse(await targetsResponse.json());

const debuggerUrl = targets.find(
  (target) => target.type === "page" && target.webSocketDebuggerUrl !== undefined,
)?.webSocketDebuggerUrl;

if (debuggerUrl === undefined) {
  throw new Error(`no page target in ${JSON.stringify(targets)}`);
}

const ws = new WebSocket(debuggerUrl);

const opened = Promise.withResolvers<null>();

ws.addEventListener(
  "open",
  () => {
    opened.resolve(null);
  },
  { once: true },
);

ws.addEventListener(
  "error",
  (event) => {
    opened.reject(new Error(event.type));
  },
  { once: true },
);

await opened.promise;

let nextId = 1;

const call = async (
  method: string,
  params: Record<string, boolean | number | string | string[]>,
) => {
  const id = nextId;
  nextId += 1;
  const replied = Promise.withResolvers<unknown>();

  const onMessage = (event: MessageEvent) => {
    const reply = replySchema.parse(JSON.parse(String(event.data)));

    if (reply.id !== id) {
      return;
    }

    ws.removeEventListener("message", onMessage);

    if (reply.error !== undefined) {
      replied.reject(new Error(JSON.stringify(reply.error)));

      return;
    }

    replied.resolve(reply.result);
  };

  ws.addEventListener("message", onMessage);
  ws.send(JSON.stringify({ id, method, params }));

  return await replied.promise;
};

await call("Network.enable", {});

const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 400;

const result = await call("Network.setCookie", {
  domain,
  expires,
  httpOnly: true,
  name,
  path: "/",
  sameSite: "Lax",
  secure: true,
  value,
});

console.log("setCookie", JSON.stringify(result));

const { cookies } = cookiesSchema.parse(
  await call("Network.getCookies", { urls: [`https://${domain}/`] }),
);

console.log(
  "visible",
  cookies.map(
    (cookie) => `${cookie.name}=${cookie.value.slice(0, 12)}… httpOnly=${cookie.httpOnly}`,
  ),
);

ws.close();
