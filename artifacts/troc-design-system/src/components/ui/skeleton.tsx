"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const skeletonVariants = cva("troc-skeleton", {
  variants: {
    shape: {
      text: "troc-skeleton--text",
      avatar: "troc-skeleton--avatar",
      card: "troc-skeleton--card",
      row: "troc-skeleton--row",
    },
  },
  defaultVariants: {
    shape: "text",
  },
})

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

/**
 * Purely presentational placeholder. Mark the loading region at composition
 * level (e.g. `aria-busy` + a visually-hidden translated "loading" label);
 * individual skeletons are `aria-hidden`.
 */
const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, shape, ...props }, ref) => (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(skeletonVariants({ shape }), className)}
      {...props}
    />
  )
)
Skeleton.displayName = "Skeleton"

export { Skeleton, skeletonVariants }
