/** The web build has no Capacitor cookie jar: there is nothing to read or clear. */
export default {
  clear: async () => {
    await Promise.resolve();
  },
  read: async () => await Promise.resolve(null),
};
