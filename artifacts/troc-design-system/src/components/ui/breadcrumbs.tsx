"use client"

import * as React from "react"
import { ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "../../lib/utils"

export interface BreadcrumbProps extends React.ComponentPropsWithoutRef<"nav"> {
  /** Accessible name for the breadcrumb navigation landmark. */
  label: string
}

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ className, label, ...props }, ref) => (
    <nav
      ref={ref}
      aria-label={label}
      className={cn("troc-breadcrumb", className)}
      {...props}
    />
  )
)
Breadcrumb.displayName = "Breadcrumb"

const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<"ol">
>(({ className, ...props }, ref) => (
  <ol ref={ref} className={cn("troc-breadcrumb-list", className)} {...props} />
))
BreadcrumbList.displayName = "BreadcrumbList"

const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("troc-breadcrumb-item", className)} {...props} />
))
BreadcrumbItem.displayName = "BreadcrumbItem"

const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a">
>(({ className, ...props }, ref) => (
  <a ref={ref} className={cn("troc-breadcrumb-link", className)} {...props} />
))
BreadcrumbLink.displayName = "BreadcrumbLink"

const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span">
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn("troc-breadcrumb-page", className)}
    {...props}
  />
))
BreadcrumbPage.displayName = "BreadcrumbPage"

const BreadcrumbSeparator = ({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"li">) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn("troc-breadcrumb-separator", className)}
    {...props}
  >
    {children ?? <ChevronRight aria-hidden="true" />}
  </li>
)
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"

export interface BreadcrumbEllipsisProps
  extends React.ComponentPropsWithoutRef<"span"> {
  /** Accessible label for the collapsed items (screen-reader only). */
  label: string
}

const BreadcrumbEllipsis = ({
  className,
  label,
  ...props
}: BreadcrumbEllipsisProps) => (
  <span
    role="presentation"
    className={cn("troc-breadcrumb-ellipsis", className)}
    {...props}
  >
    <MoreHorizontal aria-hidden="true" />
    <span className="sr-only">{label}</span>
  </span>
)
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis"

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}
