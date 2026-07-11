import ExpoModulesCore
import WebKit

/**
 One-shot bridge to the cookie jars the old Capacitor build left behind.
 The Capacitor WKWebView persisted its cookies in WKWebsiteDataStore.default()
 (and mirrored them into HTTPCookieStorage.shared), both of
 which survive an App Store update because the bundle id is unchanged.
 */
public class LegacyCookieModule: Module {
  public func definition() -> ModuleDefinition {
    Name("LegacyCookie")

    AsyncFunction("read") { (name: String, host: String, promise: Promise) in
      DispatchQueue.main.async {
        guard let url = URL(string: "https://\(host)") else {
          promise.resolve(nil)
          return
        }

        if let legacyValue = LegacyBinaryCookieReader.read(name: name, host: host) {
          promise.resolve(legacyValue)
          return
        }

        // Capacitor persisted its WKWebView cookie store before a React Native
        // WebView existed. Creating a detached default-store WebView activates
        // that legacy WebKit namespace before we query its HttpOnly cookies.
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        let bootstrapWebView = WKWebView(frame: .zero, configuration: configuration)
        bootstrapWebView.loadHTMLString("", baseURL: url)

        let wkStore = WKWebsiteDataStore.default().httpCookieStore

        func matches(_ cookie: HTTPCookie) -> Bool {
          cookie.name == name && (cookie.domain == host || cookie.domain == ".\(host)")
        }

        // WKHTTPCookieStore lazily spins up WebKit's network process and can
        // report an empty jar for the first few hundred ms — retry briefly
        // before consulting the shared-jar fallback.
        func attempt(_ remaining: Int) {
          _ = bootstrapWebView
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
              let fallback = HTTPCookieStorage.shared.cookies(for: url)?.first(where: matches)
              promise.resolve(fallback?.value)
            }
          }
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
          attempt(3)
        }
      }
    }

    AsyncFunction("clear") { (name: String, host: String, promise: Promise) in
      DispatchQueue.main.async {
        guard let url = URL(string: "https://\(host)") else {
          promise.resolve(nil)
          return
        }

        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        let bootstrapWebView = WKWebView(frame: .zero, configuration: configuration)
        bootstrapWebView.loadHTMLString("", baseURL: url)
        let store = WKWebsiteDataStore.default().httpCookieStore

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
          _ = bootstrapWebView
          store.getAllCookies { cookies in
            let matching = cookies.filter {
              $0.name == name && ($0.domain == host || $0.domain == ".\(host)")
            }
            let deletion = DispatchGroup()

            matching.forEach { cookie in
              deletion.enter()
              store.delete(cookie) {
                deletion.leave()
              }
            }

            deletion.notify(queue: .main) {
              let shared = HTTPCookieStorage.shared
              shared.cookies?
                .filter {
                  $0.name == name && ($0.domain == host || $0.domain == ".\(host)")
                }
                .forEach { shared.deleteCookie($0) }

              do {
                // The shipped Capacitor build used the generic cookie file.
                // Server auth and SecureStore persistence are already verified
                // before this runs, so remove the obsolete bearer credential.
                try LegacyBinaryCookieReader.deleteStoreIfContains(name: name, host: host)
                guard LegacyBinaryCookieReader.read(name: name, host: host) == nil else {
                  throw NSError(
                    domain: "LegacyCookie",
                    code: 1,
                    userInfo: [NSLocalizedDescriptionKey: "Legacy cookie remains readable after clearing"]
                  )
                }
                promise.resolve(nil)
              } catch {
                promise.reject(error)
              }
            }
          }
        }
      }
    }
  }
}
