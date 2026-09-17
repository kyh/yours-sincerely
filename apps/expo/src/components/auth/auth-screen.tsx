import type { ReactNode } from "react";
import { ScrollView } from "react-native";

export const AuthScreen = ({ children }: { children: ReactNode }) => (
  <ScrollView
    contentContainerStyle={{ gap: 20, paddingVertical: 20 }}
    automaticallyAdjustKeyboardInsets
    keyboardShouldPersistTaps="handled"
    keyboardDismissMode="on-drag"
  >
    {children}
  </ScrollView>
);
