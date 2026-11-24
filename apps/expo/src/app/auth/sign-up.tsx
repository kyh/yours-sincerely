import { useLocalSearchParams } from "expo-router";

import { SignUpContent } from "@/components/auth/sign-up-content";
import { resolveNextRoute } from "@/components/auth/next-route";

const SignUpScreen = () => {
  const { next } = useLocalSearchParams<{ next?: string | string[] }>();

  return <SignUpContent next={resolveNextRoute(next)} />;
};

export default SignUpScreen;
