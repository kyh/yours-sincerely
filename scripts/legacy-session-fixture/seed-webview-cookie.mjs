// Seed a cookie into a running Android WebView through the Chrome DevTools
// protocol, so the WebView itself persists it to the CookieManager jar the
// legacy Capacitor app shares with the Expo build. Needs a debuggable WebView
// (capacitor.config android.webContentsDebuggingEnabled) and an adb forward.
// Usage: node seed-webview-cookie.mjs <devtools-json-url> <domain> <name> <value>
const [jsonUrl, domain, name, value] = process.argv.slice(2);

const targets = await (await fetch(jsonUrl)).json();
const page = targets.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
if (!page) throw new Error(`no page target in ${JSON.stringify(targets)}`);

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve, { once: true });
  ws.addEventListener("error", reject, { once: true });
});

let nextId = 1;
const call = (method, params) =>
  new Promise((resolve, reject) => {
    const id = nextId++;
    const onMessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id !== id) return;
      ws.removeEventListener("message", onMessage);
      if (msg.error) {
        reject(new Error(JSON.stringify(msg.error)));
        return;
      }
      resolve(msg.result);
    };
    ws.addEventListener("message", onMessage);
    ws.send(JSON.stringify({ id, method, params }));
  });

await call("Network.enable", {});
const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 400;
const result = await call("Network.setCookie", {
  name,
  value,
  domain,
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "Lax",
  expires,
});
console.log("setCookie", JSON.stringify(result));
const { cookies } = await call("Network.getCookies", { urls: [`https://${domain}/`] });
console.log(
  "visible",
  cookies.map((c) => `${c.name}=${c.value.slice(0, 12)}… httpOnly=${c.httpOnly}`),
);
ws.close();
