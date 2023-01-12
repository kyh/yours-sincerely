import { prisma } from "~/lib/core/server/prisma.server";
const webPush = require("web-push");

interface PushObject {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  dir?: string;
  image?: string;
  silent?: boolean;
}

export async function saveSubscription(sub: PushSubscription): Promise<void> {
  console.log("Subscription", sub);
}

/**
 * Pushes and triggers a notification to the client-side of your app straight from the server.
 *
 * @param {string} content - An object consisting of the Notification's info to be sent over the server.
 * @param {number} delay - The delay in milliseconds before the text is copied (defaults to 0)
 */
export async function pushNotification(content: PushObject, delay: number = 0) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.log(
      "You must set the VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY " +
        "environment variables. You can use the following ones:"
    );
    console.log(webPush.generateVAPIDKeys());
    return;
  }

  webPush.setVapidDetails(
    "https://serviceworke.rs/",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  // await storage.init();
  // const subscription = await storage.getItem("subscription");

  // setTimeout(() => {
  //   webPush
  //     .sendNotification(subscription, JSON.stringify(content))
  //     .then(() => {
  //       return new Response("success", {
  //         status: 200,
  //       });
  //     })
  //     .catch((e: Error) => {
  //       console.log(e);
  //       return new Response("Failed!", {
  //         status: 500,
  //       });
  //     });
  // }, delay * 1000);
}
