type Props = {
  id: string;
  label?: React.ReactNode;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export const TextField = ({ id, label, className, ...rest }: Props) => (
  <div className="text-left">
    {label && (
      <label className="text-sm block cursor-pointer mb-1" htmlFor={id}>
        {label}
      </label>
    )}
    <input
      id={id}
      type="text"
      className={`w-full border-t-0 border-x-0 border-b-2 border-slate-500 border-dotted rounded transition focus:bg-slate-100 focus:border-slate-500 ${
        className || ""
      }`}
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
      className="h-4 w-4 text-primary focus:ring-primary border-slate-500 rounded transition"
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
