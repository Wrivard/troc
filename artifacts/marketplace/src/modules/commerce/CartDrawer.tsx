import type { Locale } from "@workspace/catalog";
import {
  Drawer,
  DrawerContent,
  DrawerClose,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@workspace/troc-design-system/components/ui/drawer";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { CommerceApp } from "./CommerceApp";

export default function CartDrawer({
  locale,
  onClose,
  returnFocus,
}: {
  locale: Locale;
  onClose: () => void;
  returnFocus: HTMLElement | null;
}) {
  const fr = locale === "fr";
  return (
    <Drawer
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      direction="right"
    >
      <DrawerContent
        side="right"
        className="troc-cart-drawer"
        hideClose
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocus?.focus();
        }}
      >
        <DrawerHeader className="troc-cart-drawer-header">
          <div className="troc-cart-drawer-title">
            <DrawerTitle>{fr ? "Votre panier" : "Your cart"}</DrawerTitle>
            <DrawerClose asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label={fr ? "Fermer le panier" : "Close cart"}
              >
                {fr ? "Fermer" : "Close"} <span aria-hidden="true">×</span>
              </Button>
            </DrawerClose>
          </div>
          <DrawerDescription>
            {fr
              ? "Chaque carte compte. La livraison aussi."
              : "Every card counts. So does shipping."}
          </DrawerDescription>
          <a className="troc-editorial-text-link" href={`/cart?lang=${locale}`}>
            {fr ? "Ouvrir le panier complet" : "Open full cart"}
          </a>
        </DrawerHeader>
        <CommerceApp path="/cart" embedded />
      </DrawerContent>
    </Drawer>
  );
}
