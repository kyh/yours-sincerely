import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { Text } from "@/components/ui/text";
import { ProfileContent } from "@/components/profile/profile-content";

const ProfileScreen = () => {
  const params = useLocalSearchParams();
  const userIdParam = params["user-id"];
  const userId = Array.isArray(userIdParam) ? null : (userIdParam ?? null);

  return (
    <View className="flex-1">
      {userId === null ? (
        <View className="flex-1 items-center justify-center px-5 py-5">
          <Text className="text-center">
            Hmm, can&apos;t seem to find the person you&apos;re looking for
          </Text>
        </View>
      ) : (
        <ProfileContent userId={userId} />
      )}
    </View>
  );
};

export default ProfileScreen;
