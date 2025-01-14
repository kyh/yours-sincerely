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
  <header className={cn("area-content-header", className)}>
    <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
    {children}
  </header>
);

export const PageContent = ({ children, className }: PageLayoutProps) => (
  <main className={cn("area-content", className)}>{children}</main>
);

export const PageAside = ({ children, className }: PageLayoutProps) => (
  <aside className={cn("area-aside", className)}>{children}</aside>
);
