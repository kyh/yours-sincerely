import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react-native";

import { BottomDrawer } from "@/components/ui/bottom-drawer";
import { useThemeColors } from "@/components/theme-colors";
import { trpc } from "@/lib/api";
import { PostForm } from "./post-form";

/** FAB + bottom-sheet post form — port of the web NewPostButton (drawer mode). */
export const NewPostButton = () => {
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);
  const { data: placeholder } = useQuery(trpc.prompt.getRandomPrompt.queryOptions());

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="New post"
        className="bg-primary size-12 items-center justify-center rounded-full"
        style={{
          position: "absolute",
          right: 20,
          bottom: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 4,
        }}
        onPress={() => setOpen(true)}
      >
        <Plus size={22} color={colors.primaryForeground} />
      </Pressable>
      <BottomDrawer open={open} onClose={() => setOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View className="p-2">
            <PostForm placeholder={placeholder} onSuccess={() => setOpen(false)} />
          </View>
        </KeyboardAvoidingView>
      </BottomDrawer>
    </>
  );
};
