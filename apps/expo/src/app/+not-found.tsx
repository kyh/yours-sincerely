import { View } from "react-native";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useTabNavigation } from "@/lib/use-tab-navigation";

const NotFoundScreen = () => {
  const navigateToTab = useTabNavigation();

  return (
    <View className="flex-1 items-start gap-5 py-5">
      <Text>Could not find the page you were looking for</Text>
      <Button variant="outline" onPress={() => navigateToTab("/")}>
        Return Home
      </Button>
    </View>
  );
};

export default NotFoundScreen;
