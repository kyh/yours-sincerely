import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { ProfileContent } from "@/components/profile/profile-content";

const ProfileScreen = () => {
  const { "user-id": userId } = useLocalSearchParams<"/profile/[user-id]">();

  return (
    <View className="flex-1">
      <ProfileContent userId={userId} />
    </View>
  );
};

export default ProfileScreen;
