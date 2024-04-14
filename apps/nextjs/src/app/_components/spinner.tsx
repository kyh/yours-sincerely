"use client"

import { useEffect, useState } from "react";
import { iconAttrs } from "./icon";

const States = {
  default: "default",
  loading: "loading",
  done: "done",
};

export const Spinner = ({ loading = false, ...rest }) => {
  const [state, setState] = useState(States.default);

  useEffect(() => {
    if (state === States.default && loading) {
      setState(States.loading);
    } else if (state === States.loading && !loading) {
      setState(States.done);
      setTimeout(() => {
        setState(States.default);
      }, 3000);
    }
  }, [state, loading]);

  return (
    <div {...rest}>
      <SpinnerSvg color="#8389E1" isShown={state === States.loading} />
      <svg
        {...iconAttrs}
        className="text-green-600"
        width="24"
        height="24"
        style={{ opacity: state === States.done ? 1 : 0 }}
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  );
};

type SpinnerSvgProps = {
  color: string;
  isShown: boolean;
} & React.SVGProps<SVGSVGElement>;

export const SpinnerSvg = ({
  color,
  isShown,
  className = "",
  ...rest
}: SpinnerSvgProps) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 38 38"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-opacity ${className}`}
    style={{ opacity: isShown ? 1 : 0, position: "absolute" }}
    {...rest}
  >
    <defs>
      <linearGradient x1="8.042%" y1="0%" x2="65.682%" y2="23.865%" id="a">
        <stop stopColor={color} stopOpacity="0" offset="0%" />
        <stop stopColor={color} stopOpacity=".631" offset="63.146%" />
        <stop stopColor={color} offset="100%" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <g transform="translate(1 1)">
        <path d="M36 18c0-9.94-8.06-18-18-18" stroke="url(#a)" strokeWidth="2">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 18 18"
            to="360 18 18"
            dur="0.6s"
            repeatCount="indefinite"
          />
        </path>
        <circle fill={color} cx="36" cy="18" r="1">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 18 18"
            to="360 18 18"
            dur="0.6s"
            repeatCount="indefinite"
          />
        </circle>
      </g>
    </g>
  </svg>
);
