"use client"

import * as React from "react"
import { LoaderCircle, LogIn, ShoppingCart, User } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "./button"
import { TrocLogo } from "./logo"
import { GlobalSearch, type GlobalSearchProps } from "./global-search"
import { LocaleSwitcher, type LocaleSwitcherProps } from "./locale-switcher"
import { ThemeSwitcher, type ThemeSwitcherProps } from "./theme-switcher"

export interface SiteNavItem {
  id: string
  label: string
  /** Native header destination; disabled/loading items remain inert buttons. */
  href?: string
  current?: boolean
  onSelect?: () => void
  /** Disable interaction for this destination (native button disabled). */
  disabled?: boolean
  /**
   * Mark this destination as loading: interaction is disabled, `aria-busy` is
   * set, and a decorative spinner is shown beside the unchanged, accessible
   * label. Purely a visual/interaction state — implies no auth or routing.
   */
  loading?: boolean
}

export interface SiteAccount {
  /** Signed-in display name; when omitted the header shows a Sign in action. */
  name?: string
  /** Short initials for the avatar. */
  initials?: string
}

export interface SiteHeaderProps extends React.HTMLAttributes<HTMLElement> {
  /** Primary destinations, e.g. Shop / Sell / Collect. */
  navItems: SiteNavItem[]
  /** Three compact rows on narrow screens; all controls remain available. */
  compactMobile?: boolean
  /** Accessible name for the primary nav landmark. */
  navLabel: string
  /** Localized brand label for the logo. */
  logoLabel: string
  /** Consumer-owned home destination; omitted in isolated component examples. */
  homeHref?: string
  search: GlobalSearchProps
  locale: LocaleSwitcherProps
  theme: ThemeSwitcherProps
  account?: SiteAccount
  cartCount?: number
  cartLabel: string
  accountLabel: string
  signInLabel: string
  onCart?: () => void
  onAccount?: () => void
  onSignIn?: () => void
}

const SiteHeader = React.forwardRef<HTMLElement, SiteHeaderProps>(
  (
    {
      className,
      navItems,
      compactMobile = false,
      navLabel,
      logoLabel,
      homeHref,
      search,
      locale,
      theme,
      account,
      cartCount = 0,
      cartLabel,
      accountLabel,
      signInLabel,
      onCart,
      onAccount,
      onSignIn,
      ...props
    },
    ref
  ) => (
    <header ref={ref} className={cn("troc-site-header", className)} data-compact-mobile={compactMobile || undefined} {...props}>
      <div className="troc-site-header-brand">
        {homeHref ? <a href={homeHref} aria-label={logoLabel}><TrocLogo variant="auto" height={26} label={logoLabel} /></a> : <TrocLogo variant="auto" height={26} label={logoLabel} />}
      </div>

      <nav className="troc-site-nav" aria-label={navLabel}>
        {navItems.map((item) => item.href && !item.disabled && !item.loading ? (
          <a key={item.id} className="troc-site-nav-link" href={item.href} aria-current={item.current ? "page" : undefined}>
            {item.label}
          </a>
        ) : (
          <button
            key={item.id}
            type="button"
            className="troc-site-nav-link"
            aria-current={item.current ? "page" : undefined}
            aria-busy={item.loading || undefined}
            disabled={item.disabled || item.loading || undefined}
            onClick={item.onSelect}
          >
            {item.loading && <LoaderCircle className="troc-loading" aria-hidden="true" />}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="troc-site-header-search">
        <GlobalSearch {...search} />
      </div>

      <div className="troc-site-header-actions">
        <LocaleSwitcher {...locale} />
        <ThemeSwitcher iconOnly {...theme} />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="troc-site-cart"
          aria-label={cartCount > 0 ? `${cartLabel} (${cartCount})` : cartLabel}
          onClick={onCart}
        >
          <ShoppingCart aria-hidden="true" />
          {cartCount > 0 && <span className="troc-site-cart-count" aria-hidden="true">{cartCount}</span>}
        </Button>

        {account?.name ? (
          <Button type="button" variant="ghost" className="troc-site-account" aria-label={accountLabel} onClick={onAccount}>
            <span className="troc-site-avatar" aria-hidden="true">{account.initials ?? <User aria-hidden="true" />}</span>
            <span className="troc-site-account-name">{account.name}</span>
          </Button>
        ) : (
          <Button type="button" variant="primary" size="sm" className="troc-site-sign-in" onClick={onSignIn}>
            <LogIn aria-hidden="true" />
            <span className="troc-site-sign-in-label">{signInLabel}</span>
          </Button>
        )}
      </div>
    </header>
  )
)
SiteHeader.displayName = "SiteHeader"

export interface MobileNavItem extends SiteNavItem {
  icon: React.ReactNode
  /** Optional count badge (e.g. cart). */
  count?: number
}

export interface MobileNavigationProps extends React.HTMLAttributes<HTMLElement> {
  /** Bottom-navigation destinations (keep it restrained: 3–5 items). */
  items: MobileNavItem[]
  /** Accessible name for the bottom nav landmark. */
  label: string
}

const MobileNavigation = React.forwardRef<HTMLElement, MobileNavigationProps>(
  ({ className, items, label, ...props }, ref) => (
    <nav ref={ref} className={cn("troc-mobile-bottom-nav", className)} aria-label={label} {...props}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="troc-mobile-bottom-item"
          aria-current={item.current ? "page" : undefined}
          aria-busy={item.loading || undefined}
          disabled={item.disabled || item.loading || undefined}
          onClick={item.onSelect}
        >
          {item.loading ? <LoaderCircle className="troc-loading" aria-hidden="true" /> : item.icon}
          <span>
            {item.label}
            {typeof item.count === "number" && item.count > 0 && (
              <span className="troc-site-cart-count" aria-hidden="true">{item.count}</span>
            )}
          </span>
        </button>
      ))}
    </nav>
  )
)
MobileNavigation.displayName = "MobileNavigation"

export { SiteHeader, MobileNavigation }
