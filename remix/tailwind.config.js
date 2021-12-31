module.exports = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "HelveticaNow",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Helvetica",
          "Arial",
          "sans-serif",
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
        ],
      },
      colors: {
        "primary-bg": "#e6e7f9",
        "primary-light": "#9da2e7",
        primary: "#8389E1",
        "primary-dark": "#4a52d3",
        secondary: "#3B475F",
      },
      boxShadow: {
        primary: "0 0 4px 0 rgba(131, 137, 225, 0.4)",
        "primary-sm": "0 0 2px 0 rgba(131, 137, 225, 0.4)",
      },
    },
  },
  variants: {},
  plugins: [require("@tailwindcss/typography"), require("@tailwindcss/forms")],
};
