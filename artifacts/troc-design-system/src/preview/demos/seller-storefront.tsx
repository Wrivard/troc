// Banner overlap is reserved for the avatar; seller names remain below the banner.
import { Crown, MapPin, TrendingUp } from "lucide-react";
import { SellerAvatar, SellerBanner, SellerStorefrontHeader } from "../../components/ui/seller-storefront";
import { SellerBadge } from "../../components/ui/seller-badges";
import { SellerLevelBadge, SellerPlanBadge, SellerRating, SellerStat, SellerStats } from "../../components/ui/seller-reputation";
import { Button } from "../../components/ui/button";
import { usePreferences } from "../../hooks/use-preferences";
import { useCartMessages } from "../../lib/messages-cart";
import { DemoPanel, Guidelines, PageHeader, Section, Stack } from "../parts";

export default function SellerStorefrontDemo() {
  const { locale } = usePreferences();
  const { tc } = useCartMessages();

  const rating = <SellerRating value={4.8} count={1240} label={tc("ratingLabel")} locale={locale} />;
  const badges = (
    <>
      <SellerBadge kind="verified-seller" label={tc("verifiedSeller")} size="compact" />
      <SellerBadge kind="top-seller" label={tc("topSeller")} size="compact" />
    </>
  );
  const stats = (
    <SellerStats>
      <SellerStat icon={<MapPin />} label={tc("statShipsFrom")} value={tc("statShipsFromValue")} />
      <SellerStat icon={<TrendingUp />} label={tc("statSales")} value={tc("statSalesValue")} />
      <SellerStat label={tc("statOnTime")} value={tc("statOnTimeValue")} />
    </SellerStats>
  );
  const actions = (
    <>
      <Button variant="primary" size="sm">{tc("actionVisit")}</Button>
      <Button variant="outline" size="sm">{tc("actionFollow")}</Button>
    </>
  );

  return (
    <>
      <PageHeader eyebrow={tc("eyebrow")} title={tc("storefrontTitle")} description={tc("storefrontIntro")} />

      <Section title={tc("withBanner")}>
        <DemoPanel>
          <SellerStorefrontHeader
            name={tc("sellerName")}
            tagline={tc("sellerTagline")}
            avatar={<SellerAvatar name={tc("sellerName")} size="lg" />}
            banner={<SellerBanner />}
            rating={rating}
            badges={<>{badges}<SellerLevelBadge tier="top" icon={<Crown aria-hidden="true" />} label={tc("levelTop")} /></>}
            stats={stats}
            plan={<SellerPlanBadge featured label={tc("hobbyShop")} />}
            actions={actions}
          />
          <p className="ds-helper" style={{ marginTop: 12 }}>{tc("demoOnly")}</p>
        </DemoPanel>
      </Section>

      <Section title={tc("noBanner")}>
        <DemoPanel>
          <SellerStorefrontHeader
            name={tc("sellerName")}
            tagline={tc("sellerTagline")}
            avatar={<SellerAvatar name={tc("sellerName")} />}
            rating={rating}
            badges={badges}
            stats={stats}
            actions={actions}
          />
        </DemoPanel>
      </Section>

      <Section title={tc("compactHeader")}>
        <DemoPanel>
          <SellerStorefrontHeader
            compact
            name={tc("sellerName")}
            avatar={<SellerAvatar name={tc("sellerName")} size="sm" />}
            rating={<SellerRating value={4.8} count={1240} format="compact" label={tc("ratingLabel")} locale={locale} />}
            badges={<SellerBadge kind="verified-seller" label={tc("verifiedSeller")} size="compact" />}
          />
        </DemoPanel>
      </Section>

      <Section title={tc("loadingHeader")}>
        <DemoPanel>
          <SellerStorefrontHeader
            loading
            loadingLabel={tc("loadingLabel")}
            name={tc("sellerName")}
            avatar={<SellerAvatar name={tc("sellerName")} loading />}
          />
        </DemoPanel>
      </Section>

      <Guidelines items={[{ kind: "do", text: tc("storefrontDo") }, { kind: "dont", text: tc("storefrontDont") }]} />
    </>
  );
}
