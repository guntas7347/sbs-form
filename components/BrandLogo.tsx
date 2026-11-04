import Link from "next/link";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
  showSubtitle?: boolean;
}

export function BrandLogo({
  size = "md",
  href = "/",
  className = "",
  showSubtitle = false,
}: BrandLogoProps) {
  const iconSizes = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-11 h-11 text-base",
  };

  const titleSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
  };

  const Content = (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <img src="/sbssu-logo.png" className="size-10" />

      <div className="flex flex-col">
        <span
          className={`font-semibold tracking-tight text-stone-900 dark:text-white leading-none ${titleSizes[size]}`}
        >
          SBS{" "}
          <span className="font-light text-orange-600 dark:text-orange-400">
            FORMS
          </span>
        </span>
        {showSubtitle && (
          <span className="text-[10px] font-medium tracking-wide uppercase text-stone-400 dark:text-stone-500 mt-0.5">
            Minimal Form Engine
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="transition-opacity hover:opacity-90 inline-block focus:outline-none focus:ring-2 focus:ring-orange-400/30 rounded-lg"
      >
        {Content}
      </Link>
    );
  }

  return Content;
}
