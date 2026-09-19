import { useCallback, useState } from "react";
import type { NativeSyntheticEvent, ViewProps } from "react-native";
import { requireNativeView } from "expo";
import { useFocusEffect } from "expo-router";

interface NativeProps extends ViewProps {
  mode: "disabled" | "compose" | "stack";
  onShortcut: (event: NativeSyntheticEvent<{ action: string }>) => void;
}

const NativeKeyboardShortcutsView = requireNativeView<NativeProps>("KeyboardShortcuts");

type Props = Pick<ViewProps, "style" | "children"> &
  (
    | { mode: "compose"; onSubmit: () => void }
    | { mode: "stack"; onNext: () => void; onPrevious: () => void }
  );

/** Native responder/view focus owns delivery; off-screen Stack routes opt out. */
export const KeyboardShortcutsView = (props: Props) => {
  const [focused, setFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  const onShortcut = ({ nativeEvent: { action } }: NativeSyntheticEvent<{ action: string }>) => {
    if (!focused) {
      return;
    }
    if (props.mode === "compose") {
      if (action === "submit") {
        props.onSubmit();
      }
    } else if (action === "previous") {
      props.onPrevious();
    } else if (action === "next") {
      props.onNext();
    }
  };

  return (
    <NativeKeyboardShortcutsView
      style={props.style}
      mode={focused ? props.mode : "disabled"}
      onShortcut={onShortcut}
    >
      {props.children}
    </NativeKeyboardShortcutsView>
  );
};
