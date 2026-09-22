# Inventory management

Status: **In development**, available in the local test workflow. Hosted availability requires database/authentication activation.

The `/seller/inventory` page supports active seller accounts whose user is an owner, manager or inventory member. Select a seller, search name/SKU, filter listing status, inventory source or synchronization state, and page through results. Quantity and CAD price can be edited; explicit selected listings can be activated, paused or archived.

Manual listing searches the existing canonical catalog and requires selecting the exact card/printing/finish, condition, quantity, price and unique seller SKU. The initial workflow supports raw singles; it does not invent grading certificates or new canonical cards. Existing graded/special listings remain intact.

Zero quantity marks an active listing sold out. Positive restocking restores a sold-out listing to active. Paused/archived listings retain their intentional visibility state. Stale versions require refresh; pending checkout reservations require retry after checkout completes or expires. No last-write-wins stock overwrite is allowed.

Source labels and synchronization fields describe provenance and state. `not_connected` means there is no active integration; never represent an imported CSV as live synchronization.

Photo-required listings are saved as drafts according to the commerce setting photoThresholdCents. Activation requires existing listing photos; the later seller platform will supply the photo-upload workflow. No imported high-value item bypasses this gate.
