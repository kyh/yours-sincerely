import { Knock } from "@knocklabs/node";

declare global {
  var knock: Knock | undefined;
}

export const knock = global.knock || new Knock(process.env.KNOCK_API_KEY);

if (process.env.NODE_ENV !== "production") global.knock = knock;
