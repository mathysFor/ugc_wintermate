import { Card } from "./card"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: number
    label: string
    positive?: boolean
  }
  className?: string
  loading?: boolean
}

export function StatsCard({ title, value, icon, trend, className, loading }: StatsCardProps) {
  if (loading) {
    return (
      <Card className={cn("p-6 flex flex-col gap-2", className)}>
        <div className="h-4 w-24 bg-slate-100 animate-pulse rounded" />
        <div className="h-8 w-16 bg-slate-100 animate-pulse rounded mt-2" />
      </Card>
    )
  }

  return (
    <Card className={cn("p-6 hover:shadow-md transition-all duration-300 group", className)}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        {icon && (
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              trend.positive
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            )}
          >
            {trend.positive ? "+" : ""}
            {trend.value}% {trend.label}
          </span>
        )}
      </div>
    </Card>
  )
}


