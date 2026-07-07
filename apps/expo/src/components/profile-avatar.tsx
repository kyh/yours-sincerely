import { Image } from "expo-image";

import { getAvatarSource } from "@/lib/avatars";

/** Deterministic avatar — same hash as web, rendered from bundled SVGs. */
type Props = {
  name?: string;
  size?: number;
};

export const ProfileAvatar = ({ name, size = 80 }: Props) => (
  <Image
    source={getAvatarSource(name ?? "Anonymous")}
    style={{ width: size, height: size, borderRadius: size / 2 }}
    contentFit="cover"
    accessibilityLabel={`${name ?? "Anonymous"}'s avatar`}
  />
);
