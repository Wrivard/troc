"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "../../lib/utils"
import { buttonVariants } from "./button"

export interface PaginationProps extends React.ComponentPropsWithoutRef<"nav"> {
  /** Accessible name for the pagination landmark, e.g. "Pagination". */
  label: string
}

const Pagination = ({ className, label, ...props }: PaginationProps) => (
  <nav
    role="navigation"
    aria-label={label}
    className={cn("troc-pagination", className)}
    {...props}
  />
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentPropsWithoutRef<"ul">
>(({ className, ...props }, ref) => (
  <ul ref={ref} className={cn("troc-pagination-list", className)} {...props} />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("troc-pagination-item", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
  disabled?: boolean
} & React.ComponentPropsWithoutRef<"button">

const PaginationLink = React.forwardRef<HTMLButtonElement, PaginationLinkProps>(
  ({ className, isActive = false, disabled = false, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-current={isActive ? "page" : undefined}
      disabled={disabled}
      className={cn(
        buttonVariants({ variant: isActive ? "primary" : "ghost", size: "icon" }),
        "troc-pagination-link",
        className
      )}
      {...props}
    />
  )
)
PaginationLink.displayName = "PaginationLink"

type PaginationNavProps = {
  disabled?: boolean
  label: string
} & React.ComponentPropsWithoutRef<"button">

const PaginationPrevious = React.forwardRef<HTMLButtonElement, PaginationNavProps>(
  ({ className, label, disabled = false, children, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      disabled={disabled}
      className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "troc-pagination-nav", className)}
      {...props}
    >
      <ChevronLeft aria-hidden="true" />
      {children}
    </button>
  )
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = React.forwardRef<HTMLButtonElement, PaginationNavProps>(
  ({ className, label, disabled = false, children, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      disabled={disabled}
      className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "troc-pagination-nav", className)}
      {...props}
    >
      {children}
      <ChevronRight aria-hidden="true" />
    </button>
  )
)
PaginationNext.displayName = "PaginationNext"

export interface PaginationEllipsisProps
  extends React.ComponentPropsWithoutRef<"span"> {
  /** Screen-reader label for the skipped pages. */
  label: string
}

const PaginationEllipsis = ({ className, label, ...props }: PaginationEllipsisProps) => (
  <span className={cn("troc-pagination-ellipsis", className)} {...props}>
    {/* Only the decorative icon is hidden; the translated skipped-page label
        stays available to assistive technology. */}
    <MoreHorizontal aria-hidden="true" />
    <span className="sr-only">{label}</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}
