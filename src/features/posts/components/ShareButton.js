import React from "react";
import { Icon } from "components/Icon";
import { IconContainer } from "./FlagButton";

export const ShareButton = ({ postId }) => {
  if (!navigator.share) return null;
  return (
    <div>
      <IconContainer
        onClick={() =>
          navigator.share({
            title: "A tiny beautiful letter",
            url: `${window.location.href}/${postId}`,
          })
        }
      >
        <Icon icon="share" color="grey" />
      </IconContainer>
    </div>
  );
};
