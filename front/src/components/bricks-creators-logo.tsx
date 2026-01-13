export const BricksCreatorsLogo = ({ className = "w-auto h-10", ...props }: React.HTMLAttributes<HTMLDivElement> & { className?: string }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`} {...props}>
      {/* Logo Down Skis */}
      <img
        src="/down_logo.png"
        alt="Down Skis"
        className="h-10 w-auto"
      />
      
      {/* Texte */}
      <div className="flex flex-col">
        <span className="text-xl font-black text-[#0A2337] leading-none">
          WINTERMATE
        </span>
        <span className="text-sm font-normal text-[#0A2337] leading-tight">
          creators program
        </span>
      </div>
    </div>
  );
};
