import { Pressable } from "react-native";
import { useRouter, type Href } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/components/theme-colors";
import { cn } from "cn";

type Props = {
  /** Where to go when this screen was opened cold (deep link, push) and
      there is no history to pop. */
  fallback: Href;
  label?: string;
};

export const BackButton = ({ fallback, label }: Props) => {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label ?? "Back"}
      className={cn(
        "active:bg-accent -ml-2 h-8 flex-row items-center gap-1 rounded-lg px-2",
        label !== undefined && "w-16",
      )}
      onPress={() => {
        if (router.canGoBack()) router.back();
        else router.replace(fallback);
      }}
    >
      <ArrowLeft size={16} color={colors.foreground} />
      {label !== undefined && <Text className="text-sm font-medium">{label}</Text>}
    </Pressable>
  );
};
