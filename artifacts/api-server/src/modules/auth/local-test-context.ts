import { AsyncLocalStorage } from "node:async_hooks";
export type LocalTestIdentity = {
  id: string;
  email: string;
  email_confirmed_at: string;
};
export const localTestIdentity = new AsyncLocalStorage<LocalTestIdentity>();
export function localTestMode() {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.TROC_LOCAL_ACCOUNTS === "true"
  );
}
