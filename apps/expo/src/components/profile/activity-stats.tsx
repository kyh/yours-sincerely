import { View } from "react-native";

import { Text } from "@/components/ui/text";

/** Port of the web activity-stats grid. */
type Props = {
  posts: number;
  likes: number;
  currentStreak: number;
  longestStreak: number;
};

const Stat = ({ label, value }: { label: string; value: number }) => (
  <View className="w-[45%] items-center gap-1">
    <Text className="text-lg font-bold">{value}</Text>
    <Text className="text-muted-foreground text-xs">{label}</Text>
  </View>
);

export const ActivityStats = ({ posts, likes, currentStreak, longestStreak }: Props) => (
  <View className="flex-row flex-wrap justify-center gap-y-4">
    <Stat label="Current Streak" value={currentStreak} />
    <Stat label="Longest Streak" value={longestStreak} />
    <Stat label="Total Posts" value={posts} />
    <Stat label="Total Likes" value={likes} />
  </View>
);
