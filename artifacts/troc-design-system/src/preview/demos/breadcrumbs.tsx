import { Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../components/ui/breadcrumbs";
import { usePreferences } from "../../hooks/use-preferences";
import { useControlsMessages } from "../../lib/messages-controls";
import { DemoPanel, Guidelines, PageHeader, Section } from "../parts";

export default function BreadcrumbsDemo() {
  usePreferences();
  const { tc } = useControlsMessages();
  return <>
    <PageHeader eyebrow={tc("breadcrumbsEyebrow")} title={tc("breadcrumbsTitle")} description={tc("breadcrumbsIntro")} />

    <Section title={tc("default")}><DemoPanel>
      <Breadcrumb label={tc("breadcrumbLabel")}>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#"><Home aria-hidden="true" />{tc("crumbHome")}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink href="#">{tc("crumbPokemon")}</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink href="#">{tc("crumbSet")}</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>{tc("crumbCard")}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <p className="ds-helper" style={{ marginTop: 16 }}>{tc("crumbNote")}</p>
    </DemoPanel></Section>

    <Section title={tc("breadcrumbShort")}><DemoPanel>
      <Breadcrumb label={tc("breadcrumbLabel")}>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="#">{tc("crumbHome")}</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>{tc("crumbPokemon")}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </DemoPanel></Section>

    <Section title={tc("breadcrumbCollapsed")}><DemoPanel>
      <Breadcrumb label={tc("breadcrumbLabel")}>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="#"><Home aria-hidden="true" />{tc("crumbHome")}</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbEllipsis label={tc("crumbMoreLabel")} /></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink href="#">{tc("crumbSet")}</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>{tc("crumbCard")}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </DemoPanel></Section>

    <Guidelines items={[{ kind: "do", text: tc("breadcrumbsDo") }, { kind: "dont", text: tc("breadcrumbsDont") }]} />
  </>;
}
