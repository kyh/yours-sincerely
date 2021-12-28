export const classNames = (...classes: String[]) => {
  return classes.filter(Boolean).join(" ");
};
