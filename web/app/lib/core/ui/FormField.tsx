type Props = {
  id: string;
  label?: React.ReactNode;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export const TextField = ({ id, label, className = "", ...rest }: Props) => (
  <div className="text-left">
    {label && (
      <label
        className="block mb-1 text-sm font-medium text-gray-500 cursor-pointer dark:text-slate-100"
        htmlFor={id}
      >
        {label}
      </label>
    )}
    <input
      id={id}
      type="text"
      className={`w-full bg-transparent border-t-0 border-x-0 border-b-2 border-slate-500 border-dotted rounded transition focus:bg-slate-100 focus:border-slate-500 dark:focus:bg-slate-600 dark:focus:border-slate-200 ${className}`}
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
      className="w-4 h-4 transition rounded text-primary focus:ring-primary border-slate-500"
      {...rest}
    />
    <label
      htmlFor={id}
      className={`ml-2 block text-sm text-slate-500 cursor-pointer ${
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
        className="block mb-1 text-sm font-medium text-gray-500 cursor-pointer dark:text-slate-100"
        htmlFor={id}
      >
        {label}
      </label>
    )}
    <textarea
      id={id}
      className={`w-full bg-transparent border-t-0 border-x-0 border-b-2 border-slate-500 border-dotted rounded transition focus:bg-slate-100 focus:border-slate-500 dark:focus:bg-slate-600 dark:focus:border-slate-200 min-h-[100px] ${className}`}
      {...rest}
    />
  </div>
);
