import { View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "@/lib/css-interop";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Spinner } from "@/components/ui/spinner";
import { ProfileContent } from "@/components/profile/profile-content";
import { useWorkspaceUser } from "@/lib/use-workspace-user";

export default function ProfileTabScreen() {
  const router = useRouter();
  const { user, isPending } = useWorkspaceUser();

  return (
    <SafeAreaView className="bg-background flex-1" edges={["top"]}>
      <View className="flex-row items-center justify-between px-5 py-3">
        <Text className="text-xl font-bold">Profile</Text>
      </View>
      {isPending ? (
        <View className="flex-1 items-center justify-center">
          <Spinner />
        </View>
      ) : user === null ? (
        <View className="flex-1 items-center justify-center gap-4 px-5">
          <Text className="text-muted-foreground text-center text-sm">
            Sign in to see your profile, stats, and writing streaks.
          </Text>
          <Button onPress={() => router.push("/auth/sign-in")}>Sign in</Button>
        </View>
      ) : (
        <ProfileContent userId={user.id} />
      )}
    </SafeAreaView>
  );
}
