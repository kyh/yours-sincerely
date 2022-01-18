export const baseClass =
  "inline-flex justify-center items-center px-4 py-2 border text-sm leading-4 font-medium rounded-md transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed";

export const variantClasses = {
  outline:
    "bg-white border shadow-sm text-slate-500 border-slate-200 hover:bg-primary-bg hover:border-primary hover:text-primary-dark dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700  dark:hover:text-primary-light dark:hover:border-primary-light",
  solid:
    "text-white bg-primary shadow-primary border-transparent hover:bg-primary-dark hover:shadow-primary-sm focus:ring-primary-dark disabled:hover:bg-primary disabled:hover:shadow-primary",
};

type Props = {
  className?: string;
  variant?: keyof typeof variantClasses;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = ({
  className = "",
  variant = "solid",
  ...rest
}: Props) => {
  return (
    <button
      className={`${baseClass} ${variantClasses[variant]} ${className}`}
      {...rest}
    />
  );
};
