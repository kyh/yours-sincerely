import { View } from "react-native";
import { SafeAreaView } from "@/lib/css-interop";

import { Text } from "@/components/ui/text";
import { AvatarMenu } from "@/components/layout/avatar-menu";
import { CardStackProvider } from "@/components/post/card-stack";
import { NewPostButton } from "@/components/post/new-post-button";
import { PostFeed } from "@/components/post/post-feed";
import { useFeedLayout } from "@/lib/feed-layout";
import { CONTENT_COLUMN_STYLE } from "@/lib/layout";

export default function HomeScreen() {
  const { layout } = useFeedLayout();

  return (
    <SafeAreaView className="bg-background flex-1" edges={["top"]}>
      <View style={[CONTENT_COLUMN_STYLE, { flex: 1 }]}>
        <View className="flex-row items-center justify-between px-5 py-3">
          <Text className="text-xl font-bold">Home</Text>
          <AvatarMenu />
        </View>
        <CardStackProvider key={layout}>
          <PostFeed layout={layout} filters={{ limit: 5 }} />
        </CardStackProvider>
      </View>
      <NewPostButton />
    </SafeAreaView>
  );
}
