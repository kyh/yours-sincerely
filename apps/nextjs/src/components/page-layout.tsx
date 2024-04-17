import { clx } from "@/lib/clx";

type PageLayoutProps = {
  children?: React.ReactNode;
  className?: string;
};

export const PageHeader = ({
  title,
  className,
}: PageLayoutProps & { title: React.ReactNode }) => (
  <header
    className={clx(
      "area-content-header flex items-center border-b border-b-border",
      className,
    )}
  >
    <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
  </header>
);

export const PageContent = ({ children, className }: PageLayoutProps) => (
  <main className={clx("area-content py-5", className)}>{children}</main>
);

export const PageAside = ({ children, className }: PageLayoutProps) => (
  <aside className={clx("area-aside hidden xl:block", className)}>
    {children}
  </aside>
);
