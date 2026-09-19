import { useState } from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react-native";

import { BottomDrawer } from "@/components/ui/bottom-drawer";
import { Dialog } from "@/components/ui/dialog";
import { useThemeColors } from "@/components/theme-colors";
import { orpc } from "@/lib/api";
import { PostForm } from "./post-form";

/** Web's FAB opens a drawer below 640px, a centered dialog above it. */
export const NewPostButton = ({ bottom, right }: { bottom: number; right: number }) => {
  const { width } = useWindowDimensions();
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);
  const { data: placeholder } = useQuery(orpc.prompt.getRandomPrompt.queryOptions());

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="New post"
        className="bg-primary size-12 items-center justify-center rounded-full"
        style={{
          bottom,
          elevation: 4,
          position: "absolute",
          right,
          shadowColor: "#000",
          shadowOffset: { height: 2, width: 0 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
        }}
        onPress={() => setOpen(true)}
      >
        <Plus size={22} color={colors.primaryForeground} />
      </Pressable>
      {width >= 640 ? (
        <Dialog open={open} onClose={() => setOpen(false)} label="New Post">
          <PostForm
            placeholder={placeholder}
            onSuccess={() => setOpen(false)}
            presentation="dialog"
          />
        </Dialog>
      ) : (
        <BottomDrawer open={open} onClose={() => setOpen(false)}>
          <View className="py-4">
            <PostForm
              placeholder={placeholder}
              onSuccess={() => setOpen(false)}
              presentation="drawer"
            />
          </View>
        </BottomDrawer>
      )}
    </>
  );
};
