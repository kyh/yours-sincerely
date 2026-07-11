package expo.modules.legacycookie

import android.webkit.CookieManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * One-shot bridge to the cookie jar the old Capacitor build left behind.
 * Capacitor's WebView and this module share the process-wide
 * android.webkit.CookieManager, whose storage survives app updates
 * because the applicationId is unchanged.
 */
class LegacyCookieModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("LegacyCookie")

    AsyncFunction("read") { name: String, host: String ->
      CookieManager.getInstance()
        .getCookie("https://$host")
        ?.split("; ")
        ?.firstOrNull { it.startsWith("$name=") }
        // substringAfter takes the first '=', keeping any '=' inside the value intact
        ?.substringAfter("=")
    }

    AsyncFunction("clear") { name: String, host: String ->
      val manager = CookieManager.getInstance()
      manager.setCookie("https://$host", "$name=; Max-Age=0; Path=/; Secure; HttpOnly")
      manager.setCookie(
        "https://$host",
        "$name=; Max-Age=0; Path=/; Domain=$host; Secure; HttpOnly",
      )
      manager.setCookie(
        "https://$host",
        "$name=; Max-Age=0; Path=/; Domain=.$host; Secure; HttpOnly",
      )
      manager.flush()

      val remains = manager.getCookie("https://$host")
        ?.split("; ")
        ?.any { it.substringBefore("=") == name }
        ?: false
      check(!remains) { "Legacy cookie remains readable after clearing" }
    }
  }
}
