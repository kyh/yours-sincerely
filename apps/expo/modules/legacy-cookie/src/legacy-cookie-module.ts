import type { NativeModule } from "expo";
import { requireOptionalNativeModule } from "expo";

declare class LegacyCookieModule extends NativeModule {
  /** Resolves the raw (still percent-encoded) value of cookie `name` for `host`, or null. */
  read(name: string, host: string): Promise<string | null>;
  /** Deletes only cookie `name` from the legacy WebView/native jars for `host`. */
  clear(name: string, host: string): Promise<void>;
}

/** Null in older development clients. A store build missing this bridge must
    block API requests rather than discard the existing Capacitor identity. */
export default requireOptionalNativeModule<LegacyCookieModule>("LegacyCookie");
