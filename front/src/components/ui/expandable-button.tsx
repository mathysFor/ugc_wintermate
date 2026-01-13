import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface ExpandableButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function ExpandableButton({ href, children, className }: ExpandableButtonProps) {
  return (
    <Link 
      to={href} 
      className={cn(
        "group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-[#0EA5E9] pl-8 pr-2 py-2 text-white transition-all duration-300 hover:bg-[#0284C7]", 
        className
      )}
    >
      <span className="relative z-10 text-lg font-semibold transition-colors duration-300 group-hover:text-[#0EA5E9] whitespace-nowrap">
        {children}
      </span>
      
      <div className="relative flex h-12 w-12 items-center justify-center">
        {/* Expanding Circle Background */}
        <div className="absolute inset-0 rounded-full bg-white transition-transform duration-500 ease-in-out group-hover:scale-[25]" />
        
        {/* Arrow */}
        <ArrowRight className="relative z-10 h-5 w-5 text-[#0EA5E9] transition-transform duration-300 group-hover:rotate-45" />
      </div>
    </Link>
  );
}
