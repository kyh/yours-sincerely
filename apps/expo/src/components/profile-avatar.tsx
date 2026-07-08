import { useState } from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { FadeOut } from "react-native-reanimated";

import { isDarkTheme, useTheme } from "@/components/theme-provider";
import { Text } from "@/components/ui/text";
import { AnimatedView } from "@/lib/css-interop";
import { getAvatarSource } from "@/lib/avatars";

/** Deterministic avatar — same hash as web, rendered from bundled SVGs.
    Web recolors the line art for dark themes via `dark:invert`; expo-image
    has no filter equivalent, but the avatars are monochrome (black on
    transparent), so `tintColor` — which recolors every non-transparent
    pixel — reproduces the same result as inverting a pure-black source.
    Shows initials on a muted circle until the avatar image loads, mirroring
    the web AvatarFallback. */
type Props = {
  name?: string;
  size?: number;
};

export const ProfileAvatar = ({ name, size = 80 }: Props) => {
  const { resolvedTheme } = useTheme();
  const [loaded, setLoaded] = useState(false);
  const label = name ?? "Anonymous";
  const initial = label.slice(0, 1) || "?";

  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: "hidden" }}>
      {!loaded && (
        <AnimatedView
          exiting={FadeOut}
          className="bg-muted absolute inset-0 items-center justify-center"
        >
          <Text className="text-muted-foreground text-sm uppercase">{initial}</Text>
        </AnimatedView>
      )}
      <Image
        source={getAvatarSource(label)}
        style={{ width: size, height: size }}
        contentFit="cover"
        tintColor={isDarkTheme(resolvedTheme) ? "#fff" : undefined}
        transition={200}
        onLoad={() => setLoaded(true)}
        accessibilityLabel={`${label}'s avatar`}
      />
    </View>
  );
};
