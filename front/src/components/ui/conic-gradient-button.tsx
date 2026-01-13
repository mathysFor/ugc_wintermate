import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface ConicGradientButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function ConicGradientButton({ href, children, className }: ConicGradientButtonProps) {
  return (
    <Link to={href} className={cn("relative inline-block p-[1px] overflow-hidden rounded-full group", className)}>
      <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#FA6C37_0%,#ffffff_50%,#FA6C37_100%)]" />
      <div className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-white/80 px-5 py-1.5 text-sm font-medium text-slate-900 backdrop-blur-xl">
        {children}
      </div>
    </Link>
  );
}

