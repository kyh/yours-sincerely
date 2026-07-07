import type { ReactNode } from "react";
import { Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Bottom sheet used where the web app opens a vaul Drawer
    (share menu, post options, new-post form). */
type BottomDrawerProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export const BottomDrawer = ({ open, onClose, children }: BottomDrawerProps) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        accessibilityLabel="Close drawer"
        className="flex-1 justify-end bg-black/40"
        onPress={onClose}
      >
        <Pressable onPress={(event) => event.stopPropagation()}>
          <View
            className="bg-popover rounded-t-2xl px-4 pt-3"
            style={{ paddingBottom: insets.bottom + 12 }}
          >
            <View className="bg-muted mb-3 h-1.5 w-12 self-center rounded-full" />
            {children}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
