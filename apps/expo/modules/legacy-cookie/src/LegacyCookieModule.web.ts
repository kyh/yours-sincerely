import { NativeModule, registerWebModule } from "expo";

class LegacyCookieModule extends NativeModule {
  read(): Promise<string | null> {
    return Promise.resolve(null);
  }
  clear(): Promise<void> {
    return Promise.resolve();
  }
}

export default registerWebModule(LegacyCookieModule, "LegacyCookieModule");
