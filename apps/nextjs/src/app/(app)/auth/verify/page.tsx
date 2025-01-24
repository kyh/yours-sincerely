import { MultiFactorAuthForm } from "@/app/(app)/auth/_components/auth-form";

export const generateMetadata = () => {
  return {
    title: "Verify Authentication",
  };
};

const Page = () => {
  return <MultiFactorAuthForm />;
};

export default Page;
