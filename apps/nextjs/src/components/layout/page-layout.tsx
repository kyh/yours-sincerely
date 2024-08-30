import { cn } from "@init/ui/utils";

type PageLayoutProps = {
  children?: React.ReactNode;
  className?: string;
};

export const PageHeader = ({
  title,
  className,
  children,
}: PageLayoutProps & { title: React.ReactNode }) => (
  <header
    className={cn(
      "area-content-header z-10 flex items-center border-b border-b-border",
      className,
    )}
  >
    <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
    {children}
  </header>
);

export const PageContent = ({ children, className }: PageLayoutProps) => (
  <main className={cn("area-content py-5", className)}>{children}</main>
);

export const PageAside = ({ children, className }: PageLayoutProps) => (
  <aside className={cn("area-aside hidden lg:flex", className)}>
    {children}
  </aside>
);
