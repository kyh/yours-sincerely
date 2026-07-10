import { Pressable, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { SafeAreaView } from "@/lib/css-interop";

import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/components/theme-colors";
import { ProfileContent } from "@/components/profile/profile-content";

export default function ProfileScreen() {
  const { "user-id": userId } = useLocalSearchParams<{ "user-id": string }>();
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <SafeAreaView className="bg-background flex-1" edges={["top"]}>
      <View className="flex-row items-center justify-between px-5 py-3">
        <Pressable
          accessibilityRole="button"
          className="active:bg-accent -ml-2 h-8 flex-row items-center gap-1 rounded-lg px-2"
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/");
          }}
        >
          <ArrowLeft size={16} color={colors.foreground} />
          <Text className="text-sm font-medium">Back</Text>
        </Pressable>
      </View>
      <ProfileContent userId={userId} />
    </SafeAreaView>
  );
}
