import type { ReactNode } from "react";
import { View } from "react-native";
import { SignUpContent } from "@/components/auth/sign-up-content";
import { ProfileContent } from "@/components/profile/profile-content";

import { Spinner } from "@/components/ui/spinner";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useWorkspaceUser } from "@/lib/use-workspace-user";
import { ignoreRejection } from "@/lib/ignore-rejection";

const ProfileIndexScreen = () => {
  const { user, isPending, isError, refetch } = useWorkspaceUser();

  let content: ReactNode;
  if (isPending) {
    content = (
      <View className="flex-1 items-center justify-center py-5">
        <Spinner />
      </View>
    );
  } else if (isError && user === null) {
    content = (
      <View className="flex-1 py-5">
        <QueryErrorState
          message="Couldn't load your profile. Check your connection and try again."
          onRetry={() => {
            void ignoreRejection(refetch());
          }}
        />
      </View>
    );
  } else if (user === null) {
    content = <SignUpContent next="/profile" />;
  } else {
    content = <ProfileContent key={user.id} userId={user.id} />;
  }

  return content;
};

export default ProfileIndexScreen;
