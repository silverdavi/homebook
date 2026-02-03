import clsx from "clsx";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "math" | "reading" | "science";
}

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        {
          "bg-slate-100 text-slate-700": variant === "default",
          "bg-subject-math-light text-subject-math": variant === "math",
          "bg-subject-reading-light text-subject-reading":
            variant === "reading",
          "bg-subject-science-light text-subject-science":
            variant === "science",
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
