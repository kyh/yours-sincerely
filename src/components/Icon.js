import React, { forwardRef } from "react";
import styled, { css } from "styled-components";
import raw from "raw.macro";

export const iconMap = {
  x: raw("./icon-svgs/x.svg"),
  check: raw("./icon-svgs/check.svg"),
  more: raw("./icon-svgs/more-vertical.svg"),
  heart: raw("./icon-svgs/heart.svg"),
  share: raw("./icon-svgs/share.svg"),
};

export const Icon = forwardRef(
  ({ icon, color, size, rotate, ...rest }, ref) => {
    const iconSvg = iconMap[icon];
    if (!iconSvg) return null;
    return (
      <StyledIcon
        ref={ref}
        className="icon"
        iconColor={color}
        dangerouslySetInnerHTML={{ __html: iconSvg }}
        iconSize={size}
        rotate={rotate}
        {...rest}
      />
    );
  }
);

const iconSizeMap = {
  xs: "16px",
  sm: "20px",
  md: "24px",
  lg: "40px",
};

const getDimensions = (iconSize) => {
  if (typeof iconSize === "number") return `${iconSize}px`;
  return iconSizeMap[iconSize];
};

const getSvgStyles = (props) => {
  const { iconSize, iconColor, rotate } = props;

  return css`
    width: ${iconSize ? getDimensions(iconSize) : "initial"};
    height: ${iconSize ? getDimensions(iconSize) : "intial"};
    color: ${({ theme }) =>
      iconColor ? theme.colors[iconColor] : theme.ui.text};
    fill: currentColor;
    stroke: currentColor;
    ${rotate && `transform: rotate(${rotate});`}
    transition: fill 0.23s ease;

    .no-fill {
      fill: none;
    }
  `;
};

const StyledIcon = styled.div`
  display: inline-flex;
  > svg {
    ${getSvgStyles}
  }
`;
