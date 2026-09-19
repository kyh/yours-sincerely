package expo.modules.keyboardshortcuts

import android.content.Context
import android.view.KeyEvent
import android.view.View
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

enum class ShortcutMode(val value: String) : Enumerable {
  DISABLED("disabled"),
  COMPOSE("compose"),
  STACK("stack")
}

class KeyboardShortcutsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("KeyboardShortcuts")

    View(KeyboardShortcutsView::class) {
      Events("onShortcut")
      Prop("mode") { view: KeyboardShortcutsView, mode: ShortcutMode ->
        view.mode = mode
      }
      GroupView<KeyboardShortcutsView> {}
    }
  }
}

class KeyboardShortcutsView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  val onShortcut by EventDispatcher<Map<String, String>>()
  var mode = ShortcutMode.DISABLED
    set(value) {
      field = value
      isFocusable = value == ShortcutMode.STACK
      isFocusableInTouchMode = value == ShortcutMode.STACK
      if (value == ShortcutMode.DISABLED && isFocused) clearFocus()
      post { claimStackFocus() }
    }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    post { claimStackFocus() }
  }

  override fun onWindowFocusChanged(hasWindowFocus: Boolean) {
    super.onWindowFocusChanged(hasWindowFocus)
    if (hasWindowFocus) claimStackFocus()
  }

  private fun claimStackFocus() {
    if (mode != ShortcutMode.STACK || !isShown || !hasWindowFocus()) return
    if (rootView.findFocus()?.onCheckIsTextEditor() == true) return
    // No global focus listener: tabbing to a control outside the stack keeps
    // its focus, and a Modal's separate window keeps its own keyboard events.
    requestFocus()
  }

  private fun owns(view: View): Boolean {
    var current: android.view.ViewParent? = view.parent
    while (current != null) {
      if (current === this) return true
      current = current.parent
    }
    return view === this
  }

  private fun actionFor(event: KeyEvent): String? {
    if (!hasWindowFocus()) return null
    val focused = rootView.findFocus() ?: return null
    if (mode == ShortcutMode.COMPOSE) {
      val enter = event.keyCode == KeyEvent.KEYCODE_ENTER || event.keyCode == KeyEvent.KEYCODE_NUMPAD_ENTER
      if (enter && (event.isCtrlPressed || event.isMetaPressed) &&
        focused.onCheckIsTextEditor() && owns(focused)) return "submit"
    }
    if (mode == ShortcutMode.STACK && !focused.onCheckIsTextEditor() && event.hasNoModifiers()) {
      return when (event.keyCode) {
        KeyEvent.KEYCODE_DPAD_LEFT -> "previous"
        KeyEvent.KEYCODE_DPAD_RIGHT, KeyEvent.KEYCODE_SPACE -> "next"
        else -> null
      }
    }
    return null
  }

  override fun dispatchKeyEvent(event: KeyEvent): Boolean {
    val action = actionFor(event) ?: return super.dispatchKeyEvent(event)
    if (event.action == KeyEvent.ACTION_DOWN) {
      if (action != "submit" || event.repeatCount == 0) onShortcut(mapOf("action" to action))
      return true
    }
    if (event.action == KeyEvent.ACTION_UP) return true
    return super.dispatchKeyEvent(event)
  }
}
