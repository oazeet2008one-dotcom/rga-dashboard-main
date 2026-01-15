import * as React from "react"

import { cn } from "../../lib/utils"

export interface DataTableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  wrapperClassName?: string
}

export const DataTable = React.forwardRef<HTMLTableElement, DataTableProps>(
  ({ className, wrapperClassName, ...props }, ref) => {
    return (
      <div className={cn("w-full overflow-x-auto", wrapperClassName)}>
        <table
          ref={ref}
          className={cn("w-full text-sm", className)}
          {...props}
        />
      </div>
    )
  }
)

DataTable.displayName = "DataTable"
