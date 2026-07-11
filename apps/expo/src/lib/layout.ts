import type { ViewStyle } from "react-native";

/** iPad-friendly reading column: full width on phones, capped and centered
    on wide screens. */
export const CONTENT_COLUMN_STYLE = {
  width: "100%",
  maxWidth: 760,
  alignSelf: "center",
} satisfies ViewStyle;
