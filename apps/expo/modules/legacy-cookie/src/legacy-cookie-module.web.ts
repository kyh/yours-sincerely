import { NativeModule, registerWebModule } from "expo";

class LegacyCookieModule extends NativeModule {
  // oxlint-disable-next-line class-methods-use-this -- instance method shape mirrors the native module
  read(): Promise<string | null> {
    return Promise.resolve(null);
  }
  // oxlint-disable-next-line class-methods-use-this -- instance method shape mirrors the native module
  clear(): Promise<void> {
    return Promise.resolve();
  }
}

export default registerWebModule(LegacyCookieModule, "LegacyCookieModule");
