import * as React from "react"

import { Alert, AlertDescription } from "./alert"
import { cn } from "../../lib/utils"

export type StateKind = "loading" | "empty" | "error"

export interface StateProps extends React.HTMLAttributes<HTMLDivElement> {
  kind: StateKind
  message: string
}

export const State: React.FC<StateProps> = ({ kind, message, className, ...props }) => {
  if (kind === "error") {
    return (
      <Alert className={className} {...props}>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={cn("text-center py-8 text-gray-500", className)} {...props}>
      {message}
    </div>
  )
}
