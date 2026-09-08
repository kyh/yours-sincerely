import type { ViewStyle } from "react-native";

/** iPad-friendly reading column: full width on phones, capped and centered
    on wide screens. */
export const CONTENT_COLUMN_STYLE = {
  alignSelf: "center",
  maxWidth: 760,
  width: "100%",
} satisfies ViewStyle;
