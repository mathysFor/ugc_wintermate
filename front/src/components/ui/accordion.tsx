import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

interface AccordionContextValue {
  openItems: string[];
  toggleItem: (value: string) => void;
  type: "single" | "multiple";
}

const AccordionContext = React.createContext<AccordionContextValue | undefined>(undefined);

interface AccordionProps {
  type?: "single" | "multiple";
  defaultValue?: string | string[];
  children: React.ReactNode;
  className?: string;
}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ type = "single", defaultValue, children, className }, ref) => {
    const [openItems, setOpenItems] = React.useState<string[]>(() => {
      if (!defaultValue) return [];
      return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
    });

    const toggleItem = React.useCallback((value: string) => {
      setOpenItems((prev) => {
        if (type === "single") {
          return prev.includes(value) ? [] : [value];
        }
        return prev.includes(value)
          ? prev.filter((item) => item !== value)
          : [...prev, value];
      });
    }, [type]);

    return (
      <AccordionContext.Provider value={{ openItems, toggleItem, type }}>
        <div ref={ref} className={cn("space-y-2", className)}>
          {children}
        </div>
      </AccordionContext.Provider>
    );
  }
);
Accordion.displayName = "Accordion";

interface AccordionItemContextValue {
  value: string;
  isOpen: boolean;
}

const AccordionItemContext = React.createContext<AccordionItemContextValue | undefined>(undefined);

interface AccordionItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, children, className }, ref) => {
    const context = React.useContext(AccordionContext);
    if (!context) throw new Error("AccordionItem must be used within Accordion");

    const isOpen = context.openItems.includes(value);

    return (
      <AccordionItemContext.Provider value={{ value, isOpen }}>
        <div
          ref={ref}
          className={cn(
            "rounded-xl border border-slate-200 bg-white overflow-hidden",
            className
          )}
        >
          {children}
        </div>
      </AccordionItemContext.Provider>
    );
  }
);
AccordionItem.displayName = "AccordionItem";

interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ children, className, ...props }, ref) => {
    const context = React.useContext(AccordionContext);
    const itemContext = React.useContext(AccordionItemContext);
    
    if (!context || !itemContext) {
      throw new Error("AccordionTrigger must be used within AccordionItem");
    }

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => context.toggleItem(itemContext.value)}
        className={cn(
          "flex w-full items-center justify-between p-4 text-left font-medium transition-all hover:bg-slate-50",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown
          className={cn(
            "h-5 w-5 text-slate-500 transition-transform duration-200",
            itemContext.isOpen && "rotate-180"
          )}
        />
      </button>
    );
  }
);
AccordionTrigger.displayName = "AccordionTrigger";

interface AccordionContentProps {
  children: React.ReactNode;
  className?: string;
}

const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ children, className }, ref) => {
    const itemContext = React.useContext(AccordionItemContext);
    
    if (!itemContext) {
      throw new Error("AccordionContent must be used within AccordionItem");
    }

    return (
      <div
        ref={ref}
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          itemContext.isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className={cn("px-4 pb-4", className)}>
            {children}
          </div>
        </div>
      </div>
    );
  }
);
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };







