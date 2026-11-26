import { NativeModule, registerWebModule } from "expo";

class LegacyCookieModule extends NativeModule {
  // oxlint-disable-next-line class-methods-use-this -- instance method shape mirrors the native module
  async read() {
    return await Promise.resolve(null);
  }
  // oxlint-disable-next-line class-methods-use-this -- instance method shape mirrors the native module
  async clear() {
    await Promise.resolve();
  }
}

export default registerWebModule(LegacyCookieModule, "LegacyCookieModule");
