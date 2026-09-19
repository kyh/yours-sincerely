import ExpoModulesCore
import UIKit

enum ShortcutMode: String, Enumerable {
  case disabled
  case compose
  case stack
}

public class KeyboardShortcutsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("KeyboardShortcuts")

    View(KeyboardShortcutsView.self) {
      Events("onShortcut")
      Prop("mode") { (view: KeyboardShortcutsView, mode: ShortcutMode) in
        view.mode = mode
      }
    }
  }
}

final class KeyboardShortcutsView: ExpoView {
  let onShortcut = EventDispatcher()
  var mode = ShortcutMode.disabled {
    didSet {
      if mode == .disabled && isFirstResponder {
        resignFirstResponder()
      }
      DispatchQueue.main.async { [weak self] in
        self?.claimStackFocus()
      }
    }
  }

  override var canBecomeFirstResponder: Bool { mode == .stack }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    claimStackFocus()
  }

  // Commands belong to this view's responder chain. A presented modal must
  // not leave the underlying stack/composer listening behind its contents.
  private var coveredByModal: Bool {
    var responder: UIResponder? = self
    while let current = responder {
      if let controller = current as? UIViewController,
         let presented = controller.presentedViewController,
         !isDescendant(of: presented.view) {
        return true
      }
      responder = current.next
    }
    return false
  }

  private func firstResponder(in view: UIView) -> UIView? {
    if view.isFirstResponder { return view }
    for child in view.subviews {
      if let focused = firstResponder(in: child) { return focused }
    }
    return nil
  }

  private func isEditor(_ view: UIView) -> Bool {
    view is UITextView || view is UITextField
  }

  private func claimStackFocus() {
    guard mode == .stack, let window, !coveredByModal else { return }
    if let focused = firstResponder(in: window), isEditor(focused) { return }
    becomeFirstResponder()
  }

  private var canSubmit: Bool {
    guard mode == .compose, let window, !coveredByModal,
          let focused = firstResponder(in: window) else { return false }
    return isEditor(focused) && focused.isDescendant(of: self)
  }

  private var canNavigate: Bool {
    guard mode == .stack, let window, !coveredByModal else { return false }
    return firstResponder(in: window).map { !isEditor($0) } ?? true
  }

  override var keyCommands: [UIKeyCommand]? {
    if canSubmit {
      return [UIKeyModifierFlags.command, .control].map { modifiers in
        let command = UIKeyCommand(input: "\r", modifierFlags: modifiers, action: #selector(submit))
        command.discoverabilityTitle = "Publish"
        command.wantsPriorityOverSystemBehavior = true
        return command
      }
    }
    if canNavigate {
      return [" ", UIKeyCommand.inputLeftArrow, UIKeyCommand.inputRightArrow].map { input in
        let command = UIKeyCommand(input: input, modifierFlags: [], action: #selector(navigate))
        command.wantsPriorityOverSystemBehavior = true
        return command
      }
    }
    return nil
  }

  @objc private func submit(_ command: UIKeyCommand) {
    guard canSubmit else { return }
    onShortcut(["action": "submit"])
  }

  @objc private func navigate(_ command: UIKeyCommand) {
    guard canNavigate else { return }
    onShortcut(["action": command.input == UIKeyCommand.inputLeftArrow ? "previous" : "next"])
  }
}
