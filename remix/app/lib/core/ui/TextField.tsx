type Props = {
  id: string;
  label?: React.ReactNode;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export const TextField = ({ id, label, className, ...rest }: Props) => (
  <div className="text-left">
    {label && (
      <label className="block" htmlFor={id}>
        {label}
      </label>
    )}
    <input
      id={id}
      type="text"
      className={`w-full border-b-2 border-slate-500 border-dotted rounded p-3 transition focus:outline-none focus:bg-slate-100 ${
        className || ""
      }`}
      {...rest}
    />
  </div>
);
