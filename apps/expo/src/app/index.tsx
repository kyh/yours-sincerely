import { View, useWindowDimensions } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { CardStackProvider } from "@/components/post/card-stack";
import { PostFeed } from "@/components/post/post-feed";
import { PostForm } from "@/components/post/post-form";
import { orpc } from "@/lib/api";
import { useFeedLayout } from "@/lib/feed-layout";

const HomeScreen = () => {
  const { layout } = useFeedLayout();
  const { width } = useWindowDimensions();
  const inlineComposer = width >= 768 && layout === "list";
  const { data: placeholder } = useQuery(orpc.prompt.getRandomPrompt.queryOptions());

  return (
    <View className="flex-1">
      <CardStackProvider key={layout}>
        <PostFeed
          layout={layout}
          filters={{ limit: 5 }}
          header={
            inlineComposer ? (
              <View className="border-border mb-5 border-b pb-5">
                <PostForm placeholder={placeholder} />
              </View>
            ) : null
          }
        />
      </CardStackProvider>
    </View>
  );
};

export default HomeScreen;
