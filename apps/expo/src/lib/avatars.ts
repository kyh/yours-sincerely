import type { ImageSourcePropType } from "react-native";

const avatarSources: ImageSourcePropType[] = [
  require("../../assets/avatars/0.svg"),
  require("../../assets/avatars/1.svg"),
  require("../../assets/avatars/2.svg"),
  require("../../assets/avatars/3.svg"),
  require("../../assets/avatars/4.svg"),
  require("../../assets/avatars/5.svg"),
  require("../../assets/avatars/6.svg"),
  require("../../assets/avatars/7.svg"),
  require("../../assets/avatars/8.svg"),
  require("../../assets/avatars/9.svg"),
  require("../../assets/avatars/10.svg"),
  require("../../assets/avatars/11.svg"),
  require("../../assets/avatars/12.svg"),
  require("../../assets/avatars/13.svg"),
  require("../../assets/avatars/14.svg"),
  require("../../assets/avatars/15.svg"),
  require("../../assets/avatars/16.svg"),
  require("../../assets/avatars/17.svg"),
  require("../../assets/avatars/18.svg"),
  require("../../assets/avatars/19.svg"),
];

/** Same deterministic hash as apps/web/src/lib/avatars.ts — a given
    display name maps to the same avatar on web and native. */
export const getAvatarSource = (str = "Anonymous") => {
  const hash = hashString(str);
  const source = avatarSources[hash % 20];
  return source ?? avatarSources[0];
};

const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
};
