import type { ImageSourcePropType } from "react-native";
import { ANONYMOUS_DISPLAY_NAME, getLegacyAvatarIndex } from "@repo/contract/user/user-display";

import avatar0 from "../../assets/avatars/0.svg";
import avatar1 from "../../assets/avatars/1.svg";
import avatar2 from "../../assets/avatars/2.svg";
import avatar3 from "../../assets/avatars/3.svg";
import avatar4 from "../../assets/avatars/4.svg";
import avatar5 from "../../assets/avatars/5.svg";
import avatar6 from "../../assets/avatars/6.svg";
import avatar7 from "../../assets/avatars/7.svg";
import avatar8 from "../../assets/avatars/8.svg";
import avatar9 from "../../assets/avatars/9.svg";
import avatar10 from "../../assets/avatars/10.svg";
import avatar11 from "../../assets/avatars/11.svg";
import avatar12 from "../../assets/avatars/12.svg";
import avatar13 from "../../assets/avatars/13.svg";
import avatar14 from "../../assets/avatars/14.svg";
import avatar15 from "../../assets/avatars/15.svg";
import avatar16 from "../../assets/avatars/16.svg";
import avatar17 from "../../assets/avatars/17.svg";
import avatar18 from "../../assets/avatars/18.svg";
import avatar19 from "../../assets/avatars/19.svg";

const avatarSources: ImageSourcePropType[] = [
  avatar0,
  avatar1,
  avatar2,
  avatar3,
  avatar4,
  avatar5,
  avatar6,
  avatar7,
  avatar8,
  avatar9,
  avatar10,
  avatar11,
  avatar12,
  avatar13,
  avatar14,
  avatar15,
  avatar16,
  avatar17,
  avatar18,
  avatar19,
];

/** Same deterministic hash as apps/web/src/lib/avatars.ts — a given
    display name maps to the same avatar on web and native. */
export const getAvatarSource = (str = ANONYMOUS_DISPLAY_NAME) => {
  const source = avatarSources[getLegacyAvatarIndex(str)];

  return source ?? avatarSources[0];
};
