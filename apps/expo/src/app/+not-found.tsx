import { View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "@/lib/css-interop";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="bg-background flex-1">
      <View className="flex-1 items-center justify-center gap-4 px-8">
        <Text className="text-center text-2xl font-bold">This letter got lost</Text>
        <Text className="text-muted-foreground text-center text-sm">
          The page you followed does not exist anymore.
        </Text>
        <Button onPress={() => router.replace("/")}>Back to the letters</Button>
      </View>
    </SafeAreaView>
  );
}
