import type { TextProps } from "react-native";
import { Text as RNText } from "react-native";

import { cn } from "@/lib/utils";

/** Base text — applies the app font + foreground color so ported web
    components can rely on the same defaults the web body styles provide. */
export const Text = ({ className, ...props }: TextProps) => (
  <RNText className={cn("text-foreground font-sans", className)} {...props} />
);
