import { View } from "react-native";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

type Props = {
  message: string;
  onRetry: () => void;
};

export const QueryErrorState = ({ message, onRetry }: Props) => (
  <View className="flex-1 items-center justify-center gap-3 px-5">
    <Text className="text-center text-sm">{message}</Text>
    <Button size="sm" variant="outline" onPress={onRetry}>
      Try again
    </Button>
  </View>
);
