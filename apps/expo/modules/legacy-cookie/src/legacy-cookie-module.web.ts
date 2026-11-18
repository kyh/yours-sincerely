import { NativeModule, registerWebModule } from "expo";

class LegacyCookieModule extends NativeModule {
  // oxlint-disable-next-line class-methods-use-this -- instance method shape mirrors the native module
  read() {
    return Promise.resolve(null);
  }
  // oxlint-disable-next-line class-methods-use-this -- instance method shape mirrors the native module
  clear() {
    return Promise.resolve();
  }
}

export default registerWebModule(LegacyCookieModule, "LegacyCookieModule");
