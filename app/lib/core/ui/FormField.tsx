type Props = {
  id: string;
  label?: React.ReactNode;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export const TextField = ({ id, label, className = "", ...rest }: Props) => (
  <div className="text-left">
    {label && (
      <label
        className="mb-1 block cursor-pointer text-sm font-medium text-slate-500 dark:text-slate-100"
        htmlFor={id}
      >
        {label}
      </label>
    )}
    <input
      id={id}
      type="text"
      className={`w-full rounded border-x-0 border-t-0 border-b-2 border-dotted border-slate-500 bg-transparent transition focus:border-slate-500 focus:bg-slate-100 dark:focus:border-slate-200 dark:focus:bg-slate-600 ${className}`}
      {...rest}
    />
  </div>
);

export const Checkbox = ({ id, label, className, ...rest }: Props) => (
  <div className="flex items-center">
    <input
      id={id}
      name="remember-me"
      type="checkbox"
      className="h-4 w-4 rounded border-slate-500 text-primary transition focus:ring-primary"
      {...rest}
    />
    <label
      htmlFor={id}
      className={`ml-2 block cursor-pointer text-sm text-slate-500 ${
        className || ""
      }`}
    >
      {label}
    </label>
  </div>
);

type TextAreaProps = {
  id: string;
  label?: React.ReactNode;
  className?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const TextArea = ({
  id,
  label,
  className = "",
  ...rest
}: TextAreaProps) => (
  <div className="text-left">
    {label && (
      <label
        className="mb-1 block cursor-pointer text-sm font-medium text-slate-500 dark:text-slate-100"
        htmlFor={id}
      >
        {label}
      </label>
    )}
    <textarea
      id={id}
      className={`min-h-[100px] w-full rounded border-x-0 border-t-0 border-b-2 border-dotted border-slate-500 bg-transparent transition focus:border-slate-500 focus:bg-slate-100 dark:focus:border-slate-200 dark:focus:bg-slate-600 ${className}`}
      {...rest}
    />
  </div>
);
