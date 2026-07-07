import { View } from "react-native";
import { useRouter } from "expo-router";
import { NotificationFeed } from "@knocklabs/react-native";
import { SafeAreaView } from "@/lib/css-interop";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { KnockProviders } from "@/components/notifications/knock-providers";
import { appConfig } from "@/lib/app-config";
import { useWorkspaceUser } from "@/lib/use-workspace-user";

export default function NotificationsScreen() {
  const router = useRouter();
  const { user, isPending } = useWorkspaceUser();

  const knockConfigured =
    appConfig.knockPublicApiKey !== undefined && appConfig.knockFeedChannelId !== undefined;

  return (
    <SafeAreaView className="bg-background flex-1" edges={["top"]}>
      <View className="flex-row items-center justify-between px-5 py-3">
        <Text className="text-xl font-bold">Notifications</Text>
      </View>
      {isPending ? (
        <View className="flex-1 items-center justify-center">
          <Spinner />
        </View>
      ) : user === null ? (
        <View className="flex-1 items-center justify-center gap-4 px-5">
          <Text className="text-muted-foreground text-center text-sm">
            Sign in to see replies to your love letters.
          </Text>
          <Button onPress={() => router.push("/auth/sign-in")}>Sign in</Button>
        </View>
      ) : !knockConfigured ? (
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-muted-foreground text-center text-sm">
            Notifications aren't configured for this build.
          </Text>
        </View>
      ) : (
        <KnockProviders>
          <NotificationFeed
            onRowTap={(item) => {
              const postId = item.data?.parentPostId;
              if (typeof postId === "string" && postId.length > 0) {
                router.push({ pathname: "/posts/[post-id]", params: { "post-id": postId } });
              }
            }}
          />
        </KnockProviders>
      )}
    </SafeAreaView>
  );
}
