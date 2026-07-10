import ExpoModulesCore
import WebKit

/**
 One-shot bridge to the cookie jars the old Capacitor build left behind.
 The Capacitor WKWebView persisted its cookies in WKWebsiteDataStore.default()
 (and, on Capacitor >= 5, mirrored them into HTTPCookieStorage.shared), both of
 which survive an App Store update because the bundle id is unchanged.
 */
public class LegacyCookieModule: Module {
  public func definition() -> ModuleDefinition {
    Name("LegacyCookie")

    AsyncFunction("read") { (name: String, host: String, promise: Promise) in
      DispatchQueue.main.async {
        let wkStore = WKWebsiteDataStore.default().httpCookieStore

        func matches(_ cookie: HTTPCookie) -> Bool {
          cookie.name == name && cookie.domain.hasSuffix(host)
        }

        // WKHTTPCookieStore lazily spins up WebKit's network process and can
        // report an empty jar for the first few hundred ms — retry briefly
        // before consulting the shared-jar fallback.
        func attempt(_ remaining: Int) {
          wkStore.getAllCookies { cookies in
            if let hit = cookies.first(where: matches) {
              promise.resolve(hit.value)
              return
            }
            if remaining > 0 {
              DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
                attempt(remaining - 1)
              }
            } else {
              let fallback = HTTPCookieStorage.shared.cookies?.first(where: matches)
              promise.resolve(fallback?.value)
            }
          }
        }

        attempt(3)
      }
    }

    AsyncFunction("clear") { (host: String, promise: Promise) in
      DispatchQueue.main.async {
        let store = WKWebsiteDataStore.default()
        store.fetchDataRecords(ofTypes: WKWebsiteDataStore.allWebsiteDataTypes()) { records in
          let matching = records.filter { $0.displayName.hasSuffix(host) }
          store.removeData(ofTypes: WKWebsiteDataStore.allWebsiteDataTypes(), for: matching) {
            let shared = HTTPCookieStorage.shared
            shared.cookies?
              .filter { $0.domain.hasSuffix(host) }
              .forEach { shared.deleteCookie($0) }
            promise.resolve(nil)
          }
        }
      }
    }
  }
}
