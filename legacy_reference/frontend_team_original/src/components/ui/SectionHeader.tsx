import * as React from "react"

import { cn } from "../../lib/utils"

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  heading: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  heading,
  description,
  actions,
  className,
  ...props
}) => {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)} {...props}>
      <div className="space-y-1">
        <div className="text-sm font-semibold text-gray-900">{heading}</div>
        {description ? <div className="text-xs text-gray-500">{description}</div> : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  )
}
