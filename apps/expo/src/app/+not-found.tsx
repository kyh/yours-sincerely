import { View } from "react-native";
import { useRouter } from "expo-router";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

const NotFoundScreen = () => {
  const router = useRouter();

  return (
    <View className="flex-1 items-start gap-5 py-5">
      <Text>Could not find the page you were looking for</Text>
      <Button variant="outline" onPress={() => router.replace("/")}>
        Return Home
      </Button>
    </View>
  );
};

export default NotFoundScreen;
