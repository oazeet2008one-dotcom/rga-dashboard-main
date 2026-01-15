import * as React from "react"

import { Card, CardContent, CardHeader } from "./card"
import { cn } from "../../lib/utils"

export interface SectionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode
  children?: React.ReactNode
}

export const SectionCard: React.FC<SectionCardProps> = ({ header, children, className, ...props }) => {
  return (
    <Card className={className} {...props}>
      {header ? <CardHeader>{header}</CardHeader> : null}
      <CardContent className={cn(header ? "" : "pt-6")}>{children}</CardContent>
    </Card>
  )
}
