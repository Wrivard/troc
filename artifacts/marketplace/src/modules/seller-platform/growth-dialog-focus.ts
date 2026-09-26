import { useRef } from "react";
/** Controlled dialogs without a DialogTrigger still return keyboard focus. */
export function useGrowthDialogFocus() {
  const previous = useRef<HTMLElement | null>(null);
  return {
    onOpenAutoFocus: () => {
      previous.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
    },
    onCloseAutoFocus: (event: Event) => {
      if (previous.current?.isConnected) {
        event.preventDefault();
        previous.current.focus();
      }
    },
  };
}
