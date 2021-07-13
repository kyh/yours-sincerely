import { Share } from "react-feather";
import { IconContainer } from "components/FlagButton";
import { lightTheme } from "util/theme";

export const ShareButton = ({ post }) => {
  if (!navigator.share) return null;
  return (
    <div>
      <IconContainer
        onClick={() =>
          navigator.share({
            title: "A tiny beautiful letter",
            url: `${window.location.href}/${post.id}`,
          })
        }
      >
        <Share color={lightTheme.colors.grey} />
      </IconContainer>
    </div>
  );
};
