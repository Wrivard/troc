import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { usePreferences } from "../../hooks/use-preferences";
import { useOverlaysMessages } from "../../lib/messages-overlays";
import { DemoPanel, Field, Guidelines, PageHeader, Section } from "../parts";

export default function DialogDemo() {
  usePreferences();
  const { to } = useOverlaysMessages();

  const [editOpen, setEditOpen] = useState(false);
  const [price, setPrice] = useState("140");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const invalid = Number(price) <= 0 || price.trim() === "";

  const save = () => {
    if (invalid) return;
    setSaving(true);
    // Local demo only — simulate an async save with a short timeout.
    window.setTimeout(() => {
      setSaving(false);
      setEditOpen(false);
      setStatus(to("dialogSaved"));
    }, 900);
  };

  const [deleteOpen, setDeleteOpen] = useState(false);
  const remove = () => {
    setDeleteOpen(false);
    setStatus(to("dialogRemoved"));
  };

  return (
    <>
      <PageHeader eyebrow={to("overlaysEyebrow")} title={to("dialogTitle")} description={to("dialogIntro")} />

      <Section title={to("dialogBasic")}>
        <DemoPanel>
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button>{to("dialogEditTrigger")}</Button>
            </DialogTrigger>
            <DialogContent closeLabel={to("close")}>
              <DialogHeader>
                <DialogTitle>{to("dialogEditHeading")}</DialogTitle>
                <DialogDescription>{to("dialogEditDescription")}</DialogDescription>
              </DialogHeader>
              <Field
                id="dialog-price"
                label={to("dialogPriceLabel")}
                error={invalid ? to("dialogPriceError") : undefined}
              >
                <Input
                  id="dialog-price"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={price}
                  aria-invalid={invalid || undefined}
                  onChange={(event) => setPrice(event.target.value)}
                />
              </Field>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">{to("cancel")}</Button>
                </DialogClose>
                <Button onClick={save} loading={saving} disabled={invalid || saving}>
                  {saving ? to("dialogSaving") : to("dialogSave")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </DemoPanel>
      </Section>

      <Section title={to("dialogDestructive")}>
        <DemoPanel>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">{to("dialogDeleteTrigger")}</Button>
            </DialogTrigger>
            <DialogContent closeLabel={to("close")}>
              <DialogHeader>
                <DialogTitle>{to("dialogDeleteHeading")}</DialogTitle>
                <DialogDescription>{to("dialogDeleteDescription")}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">{to("cancel")}</Button>
                </DialogClose>
                <Button variant="destructive" onClick={remove}>{to("dialogConfirmRemove")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {status && <p className="ds-inline-status" role="status" style={{ marginTop: 16 }}>{status}</p>}
          <p className="ds-helper" style={{ marginTop: 8 }}>{to("demoOnly")}</p>
        </DemoPanel>
      </Section>

      <Guidelines items={[{ kind: "do", text: to("dialogDo") }, { kind: "dont", text: to("dialogDont") }]} />
    </>
  );
}
