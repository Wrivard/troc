import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { usePreferences } from "../../hooks/use-preferences";
import { useOverlaysMessages } from "../../lib/messages-overlays";
import { DemoPanel, Guidelines, PageHeader, Section } from "../parts";

export default function DropdownMenuDemo() {
  usePreferences();
  const { to } = useOverlaysMessages();
  const [foil, setFoil] = useState(true);
  const [graded, setGraded] = useState(false);
  const [density, setDensity] = useState("comfortable");
  const [sort, setSort] = useState("price");

  const sortLabel =
    sort === "price" ? to("dropdownSortPrice") : sort === "condition" ? to("dropdownSortCondition") : to("dropdownSortSeller");

  return (
    <>
      <PageHeader eyebrow={to("overlaysEyebrow")} title={to("dropdownTitle")} description={to("dropdownIntro")} />

      <Section title={to("dropdownActions")}>
        <DemoPanel>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {to("dropdownTrigger")}
                <ChevronDown aria-hidden="true" style={{ width: 16, height: 16 }} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>{to("dropdownSection")}</DropdownMenuLabel>
              <DropdownMenuItem>{to("dropdownView")}</DropdownMenuItem>
              <DropdownMenuItem>{to("dropdownEdit")}</DropdownMenuItem>
              <DropdownMenuItem>{to("dropdownShare")}</DropdownMenuItem>
              <DropdownMenuItem disabled>{to("dropdownReserved")}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive>{to("dropdownRemove")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </DemoPanel>
      </Section>

      <Section title={to("dropdownSelections")}>
        <DemoPanel>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {to("dropdownViewTrigger")}
                <ChevronDown aria-hidden="true" style={{ width: 16, height: 16 }} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>{to("dropdownDensity")}</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={density} onValueChange={setDensity}>
                <DropdownMenuRadioItem value="comfortable">{to("dropdownComfortable")}</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="compact">{to("dropdownCompact")}</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked={foil} onCheckedChange={setFoil}>{to("dropdownShowFoil")}</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={graded} onCheckedChange={setGraded}>{to("dropdownShowGraded")}</DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>{to("dropdownSortBy")}</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
                    <DropdownMenuRadioItem value="price">{to("dropdownSortPrice")}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="condition">{to("dropdownSortCondition")}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="seller">{to("dropdownSortSeller")}</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
          <p className="ds-inline-status" role="status" style={{ marginTop: 16 }}>{to("dropdownSelectedNote", { value: sortLabel })}</p>
        </DemoPanel>
      </Section>

      <Guidelines items={[{ kind: "do", text: to("dropdownDo") }, { kind: "dont", text: to("dropdownDont") }]} />
    </>
  );
}
