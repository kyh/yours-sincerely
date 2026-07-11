import { NativeModule, requireOptionalNativeModule } from "expo";

declare class LegacyCookieModule extends NativeModule {
  /** Resolves the raw (still percent-encoded) value of cookie `name` for `host`, or null. */
  read(name: string, host: string): Promise<string | null>;
  /** Deletes only cookie `name` from the legacy WebView/native jars for `host`. */
  clear(name: string, host: string): Promise<void>;
}

/** Null in builds compiled before this native module existed (e.g. older dev
    clients) — callers must treat absence as "no legacy session to migrate". */
export default requireOptionalNativeModule<LegacyCookieModule>("LegacyCookie");
