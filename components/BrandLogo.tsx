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
      {/* Geometric mark: warm peach/orange to mint/emerald gradient icon */}
      <div
        className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 via-amber-300 to-emerald-400 shadow-sm shadow-orange-500/10 font-bold text-white tracking-tight ${iconSizes[size]}`}
      >
        <span className="relative z-10 font-mono tracking-tighter">S</span>
        <div className="absolute inset-0.5 rounded-[10px] bg-white/20 backdrop-blur-xs" />
        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-stone-900" />
      </div>

      <div className="flex flex-col">
        <span
          className={`font-semibold tracking-tight text-stone-900 dark:text-white leading-none ${titleSizes[size]}`}
        >
          SBS <span className="font-light text-orange-600 dark:text-orange-400">FORMS</span>
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
