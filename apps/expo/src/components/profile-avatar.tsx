import { useState } from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { FadeOut } from "react-native-reanimated";

import { isDarkTheme, useTheme } from "@/components/theme-provider";
import { Text } from "@/components/ui/text";
import { AnimatedView } from "@/lib/css-interop";
import { getAvatarSource } from "@/lib/avatars";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/** Deterministic avatar — same hash as web, rendered from bundled SVGs.
    Web recolors the line art for dark themes via `dark:invert`; expo-image
    has no filter equivalent, but the avatars are monochrome (black on
    transparent), so `tintColor` — which recolors every non-transparent
    pixel — reproduces the same result as inverting a pure-black source.
    Shows initials on a muted circle until the avatar image loads, mirroring
    the web AvatarFallback. */
interface Props {
  name?: string;
  src?: string;
  size?: number;
}

export const ProfileAvatar = ({ name, src, size = 80 }: Props) => {
  const { resolvedTheme } = useTheme();
  const reduceMotionEnabled = useReducedMotion();
  const label = name ?? "Anonymous";
  const source = src ?? getAvatarSource(label);
  const [loadedSource, setLoadedSource] = useState<typeof source | null>(null);
  const initial = label.slice(0, 1) || "?";

  return (
    <View style={{ borderRadius: size / 2, height: size, overflow: "hidden", width: size }}>
      {loadedSource !== source && (
        <AnimatedView
          exiting={reduceMotionEnabled ? undefined : FadeOut}
          className="bg-muted absolute inset-0 items-center justify-center"
        >
          <Text className="text-muted-foreground text-sm uppercase">{initial}</Text>
        </AnimatedView>
      )}
      <Image
        source={source}
        style={{ height: size, width: size }}
        contentFit="cover"
        tintColor={src === undefined && isDarkTheme(resolvedTheme) ? "#fff" : undefined}
        transition={reduceMotionEnabled ? 0 : 200}
        onLoad={() => setLoadedSource(source)}
        accessibilityLabel={`${label}'s avatar`}
      />
    </View>
  );
};
