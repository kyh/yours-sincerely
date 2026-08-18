import { View } from "react-native";
import { useRouter } from "expo-router";
import { NotificationFeed } from "@knocklabs/react-native";
import { z } from "zod";
import { SafeAreaView } from "@/lib/css-interop";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { PushNotificationRegistration } from "@/components/notifications/push-notification-registration";
import { appConfig } from "@/lib/app-config";
import { useWorkspaceUser } from "@/lib/use-workspace-user";

const tappedPostId = z.string().min(1);

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
        <View className="flex-1">
          {appConfig.knockExpoChannelId !== undefined && <PushNotificationRegistration />}
          <NotificationFeed
            onRowTap={(item) => {
              const postId = tappedPostId.safeParse(item.data?.parentPostId);
              if (postId.success) {
                router.push({ pathname: "/posts/[post-id]", params: { "post-id": postId.data } });
              }
            }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
