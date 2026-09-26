import { api } from "../../api";
export type SellerDirectoryRow = {
  id: string;
  display_name: string;
  status: string;
  role: string;
};
const pending = new Map<string, Promise<SellerDirectoryRow[]>>();
/** Coalesce only concurrent reads for the same signed-in user and page.
 * No resolved data cache: subsequent navigation and retries recheck access. */
export function loadSellerDirectory(userId: string, page = 0) {
  const key = JSON.stringify([userId, page]);
  const current = pending.get(key);
  if (current) return current;
  const request = api<SellerDirectoryRow[]>(
    "/seller/platform/sellers?page=" + page,
  );
  pending.set(key, request);
  const clear = () => {
    if (pending.get(key) === request) pending.delete(key);
  };
  void request.then(clear, clear);
  return request;
}
