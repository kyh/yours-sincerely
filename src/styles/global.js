import styledNormalize from "styled-normalize";
import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
  ${styledNormalize}

  html {
    box-sizing: border-box;
  }

  *,
  *:before,
  *:after {
    box-sizing: inherit;
  }

  body {
    color: ${({ theme }) => theme.ui.text};
    background-color: ${({ theme }) => theme.ui.background};
    text-rendering: optimizeLegibility;
    font-family: "HelveticaNow", -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif,
      'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
    letter-spacing: -0.2px;
  }

  a {
    color: inherit;
    text-decoration: none;
    transition: 0.2s ease;
  }

  /* Remove button styling */
  button,
  input[type='submit'],
  input[type='reset'] {
    background: none;
    color: inherit;
    border: none;
    padding: 0;
    font: inherit;
    cursor: pointer;
    outline: inherit;
  }

  img {
    max-width: 100%;
  }

  p {
    margin: 0 0 ${({ theme }) => theme.spacings(2)};
  }

  .pointer-none {
    pointer-events: none;
  }
`;
