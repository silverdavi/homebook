import clsx from "clsx";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({
  className,
  hover = false,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-xl bg-white border border-slate-200 shadow-paper",
        hover &&
          "transition-all duration-200 hover:shadow-paper-md hover:-translate-y-0.5 cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("px-6 py-4 border-b border-slate-100", className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("px-6 py-4", className)} {...props}>
      {children}
    </div>
  );
}
