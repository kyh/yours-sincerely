import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "@/lib/css-interop";

import { BackButton } from "@/components/layout/back-button";
import { Text } from "@/components/ui/text";
import { ProfileContent } from "@/components/profile/profile-content";

const ProfileScreen = () => {
  const params = useLocalSearchParams();
  const userIdParam = params["user-id"];
  const userId = Array.isArray(userIdParam) ? null : (userIdParam ?? null);

  return (
    <SafeAreaView className="bg-background flex-1" edges={["top"]}>
      <View className="flex-row items-center justify-between px-5 py-3">
        <BackButton fallback="/" label="Back" />
      </View>
      {userId === null ? (
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-center">
            Hmm, can&apos;t seem to find the person you&apos;re looking for
          </Text>
        </View>
      ) : (
        <ProfileContent userId={userId} />
      )}
    </SafeAreaView>
  );
};

export default ProfileScreen;
