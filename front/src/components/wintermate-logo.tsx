export function WinterMateLogo({ className = "h-20 w-auto" }: { className?: string }) {
  return (
    <img 
      src="/logo_winterMate_Full.png" 
      alt="Winter Mate" 
      className={className}
    />
  );
}

export function WinterMateIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <div className={`${className} flex items-center justify-center`}>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <path 
          d="M20 4L4 28H14L20 18L26 28H36L20 4Z" 
          fill="currentColor"
        />
        <path 
          d="M14 28L8 36H32L26 28H14Z" 
          fill="currentColor"
          opacity="0.7"
        />
      </svg>
    </div>
  );
}

