type Props = {
  bgColor?: string;
  children?: React.ReactNode;
};

export const Divide = ({ bgColor, children }: Props) => (
  <div className="relative my-5">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-slate-300" />
    </div>
    <div className="relative flex justify-center text-sm">
      <span className={`px-2 text-slate-500 ${bgColor || "bg-slate-50"}`}>
        {children}
      </span>
    </div>
  </div>
);
