/**
 * Centralized English / Canadian-French demo copy for the Chunk 6 seller & cart
 * families: seller-storefront, cart-seller-group, order-totals, smart-cart.
 * Kept out of the shared lib/messages catalog so the pilot copy stays untouched.
 *
 * Stories read locale from usePreferences and resolve strings through
 * useCartMessages; the reusable components take plain label props and never
 * depend on this module. All prices are sample CAD values only and imply no
 * real accounts, traction, or transactions.
 */
import { usePreferences } from "../hooks/use-preferences"

export const cartMessages = {
  // Shared scaffolding
  eyebrow: ["Seller & cart", "Vendeur et panier"],
  states: ["States", "États"],
  variants: ["Variants", "Variantes"],
  loading: ["Loading", "Chargement"],
  compact: ["Compact", "Compact"],
  standard: ["Default", "Normal"],
  mobile: ["Mobile", "Mobile"],
  do: ["Do", "À faire"],
  dont: ["Don’t", "À éviter"],
  demoOnly: ["Sample data only · no real accounts, carts, or transactions.", "Données d’exemple seulement · aucun compte, panier ou transaction réel."],
  visualPreviewOnly: ["Local visual preview · nothing is saved or purchased.", "Aperçu visuel local · rien n’est enregistré ni acheté."],

  // ------------------------------------------------ Seller storefront
  storefrontTitle: ["Seller storefront", "Vitrine du vendeur"],
  storefrontIntro: ["The seller identity header: banner, avatar, verification, rating, stats, level, plan, and actions. A seller avatar falls back to initials — never the TROC logo.", "L’en-tête d’identité du vendeur : bannière, avatar, vérification, note, statistiques, niveau, forfait et actions. L’avatar utilise des initiales par défaut — jamais le logo TROC."],
  sellerName: ["Northern Cards Co.", "Northern Cards Co."],
  sellerTagline: ["Ships from Ontario · Cards since 2019", "Expédié de l’Ontario · Cartes depuis 2019"],
  ratingLabel: ["Seller rating", "Note du vendeur"],
  verifiedSeller: ["Verified Seller", "Vendeur vérifié"],
  topSeller: ["Top Seller", "Vendeur vedette"],
  hobbyShop: ["Hobby Shop", "Boutique spécialisée"],
  levelTop: ["Top Seller", "Vendeur vedette"],
  statShipsFrom: ["Ships from", "Expédié de"],
  statShipsFromValue: ["Ontario, CA", "Ontario, CA"],
  statSales: ["Sales", "Ventes"],
  statSalesValue: ["1,240", "1 240"],
  statOnTime: ["On-time ship", "Expédition à temps"],
  statOnTimeValue: ["98%", "98 %"],
  actionVisit: ["Visit storefront", "Voir la vitrine"],
  actionFollow: ["Follow", "Suivre"],
  withBanner: ["With banner", "Avec bannière"],
  noBanner: ["No banner (initials avatar)", "Sans bannière (avatar à initiales)"],
  compactHeader: ["Compact", "Compact"],
  loadingHeader: ["Loading", "Chargement"],
  loadingLabel: ["Loading seller", "Chargement du vendeur"],
  storefrontDo: ["Fall back to seller initials and keep verification factual and neutral.", "Utilisez les initiales du vendeur et gardez la vérification factuelle et neutre."],
  storefrontDont: ["Don’t reuse the TROC logo as a seller avatar or add a decorative banner gradient.", "Ne réutilisez pas le logo TROC comme avatar et n’ajoutez pas de dégradé décoratif à la bannière."],

  // -------------------------------------------------- Cart seller group
  cartTitle: ["Seller-grouped cart", "Panier regroupé par vendeur"],
  cartIntro: ["Cart items grouped by seller, with quantity editing, removal, sub-dollar cards, seller-minimum and promotion progress, and combined shipping.", "Articles du panier regroupés par vendeur, avec modification de quantité, retrait, cartes sous 1 $, progression du minimum et des promotions, et livraison combinée."],
  cartInteractiveTitle: ["Interactive cart", "Panier interactif"],
  cartInteractiveHelp: ["Edit quantities or remove cards; totals and progress update live. Reset restores the sample.", "Modifiez les quantités ou retirez des cartes ; les totaux et la progression se mettent à jour. Réinitialiser rétablit l’exemple."],
  reset: ["Reset cart", "Réinitialiser le panier"],
  quantityLabel: ["Quantity", "Quantité"],
  decrement: ["Decrease quantity", "Diminuer la quantité"],
  increment: ["Increase quantity", "Augmenter la quantité"],
  removeItem: ["Remove card", "Retirer la carte"],
  unitPriceLabel: ["Each", "L’unité"],
  lineTotalLabel: ["Line total", "Total de la ligne"],
  combinedShipping: ["Combined shipping: $3.99 for all cards", "Livraison combinée : 3,99 $ pour toutes les cartes"],
  sellerSubtotal: ["Seller subtotal", "Sous-total du vendeur"],
  sellerMinimumLabel: ["Seller minimum", "Minimum du vendeur"],
  sellerMinReached: ["Seller minimum reached.", "Minimum du vendeur atteint."],
  promotionLabel: ["Promotion progress", "Progression de la promotion"],
  promoReached: ["Promotion unlocked — 10% off applied.", "Promotion débloquée — 10 % de rabais appliqué."],
  promoBadge: ["10% off 5+ cards", "10 % sur 5 cartes et plus"],
  itemUnavailable: ["No longer available from this seller", "Plus disponible chez ce vendeur"],
  cardsInCart: ["Cards", "Cartes"],
  emptyCart: ["Your cart is empty.", "Votre panier est vide."],
  // Card sample titles / metadata
  cardCharizard: ["Charizard ex", "Dracaufeu ex"],
  cardCharizardMeta: ["Obsidian Flames · #223 · NM", "Flammes Obsidiennes · #223 · NM"],
  cardPikachu: ["Pikachu", "Pikachu"],
  cardPikachuMeta: ["Base Set · #58 · LP", "Set de base · #58 · LP"],
  cardCommon: ["Common energy card", "Carte énergie commune"],
  cardCommonMeta: ["Bulk · #102 · NM", "En vrac · #102 · NM"],
  imageMissing: ["No image", "Aucune image"],
  cartDo: ["Group by seller and always show combined shipping and how close the minimum is.", "Regroupez par vendeur et affichez toujours la livraison combinée et l’écart au minimum."],
  cartDont: ["Don’t hide sub-dollar cards or round prices — cheap cards are a core principle.", "Ne cachez pas les cartes sous 1 $ et n’arrondissez pas — les cartes bon marché sont un principe fondamental."],

  // ------------------------------------------------------- Order totals
  totalsTitle: ["Order totals", "Totaux de commande"],
  totalsIntro: ["A tabular CAD summary: cards subtotal, shipping, discounts, total, and optional savings. Two-decimal precision keeps sub-dollar amounts exact.", "Un résumé CAD tabulaire : sous-total des cartes, livraison, rabais, total et économies optionnelles. La précision à deux décimales garde les montants sous 1 $ exacts."],
  totalsFull: ["Full", "Complet"],
  totalsCompact: ["Compact (cart sidebar)", "Compact (barre latérale du panier)"],
  totalsWithSavings: ["With savings", "Avec économies"],
  lineCards: ["Cards subtotal", "Sous-total des cartes"],
  lineCardsHint: ["3 sellers combined", "3 vendeurs regroupés"],
  lineShipping: ["Shipping", "Livraison"],
  lineDiscount: ["Promotion (10% off)", "Promotion (10 % de rabais)"],
  lineTotal: ["Total", "Total"],
  savingsLabel: ["You save", "Vous économisez"],

  // --------------------------------------------------------- Smart Cart
  smartTitle: ["Smart Cart comparison", "Comparaison Smart Cart"],
  smartIntro: ["A visual-only comparison of a scattered cart versus a seller-consolidated one. It only presents supplied figures — there is no optimizer, saved cart, or purchase.", "Une comparaison visuelle d’un panier éparpillé et d’un panier regroupé par vendeur. Elle ne fait que présenter les chiffres fournis — aucun optimiseur, panier enregistré ou achat."],
  smartOriginal: ["Original", "Original"],
  smartTroc: ["TROC Smart Cart", "Smart Cart TROC"],
  smartSellers8: ["8 sellers", "8 vendeurs"],
  smartSellers3: ["3 sellers", "3 vendeurs"],
  smartCards: ["Cards", "Cartes"],
  smartShipping: ["Shipping", "Livraison"],
  smartTotalLabel: ["Total", "Total"],
  smartSellersRow: ["Sellers", "Vendeurs"],
  smartSave: ["You save", "Vous économisez"],
  smartExplanation: ["This card costs $0.06 more from this seller but saves $1.24 in shipping.", "Cette carte coûte 0,06 $ de plus chez ce vendeur, mais économise 1,24 $ de livraison."],
  smartLoading: ["Comparing cart", "Comparaison du panier"],
  smartEmpty: ["Add cards to see how consolidating sellers could reduce shipping.", "Ajoutez des cartes pour voir comment regrouper les vendeurs peut réduire la livraison."],
  smartApply: ["Preview Smart Cart", "Aperçu du Smart Cart"],
  smartDo: ["Show the shipping saving plainly and label any apply action as a local preview.", "Affichez clairement l’économie de livraison et indiquez qu’une action d’application n’est qu’un aperçu local."],
  smartDont: ["Don’t imply a real optimizer, saved cart, or completed purchase.", "Ne laissez pas croire à un vrai optimiseur, à un panier enregistré ou à un achat effectué."],
} as const

export type CartMessageKey = keyof typeof cartMessages

export function useCartMessages() {
  const { locale } = usePreferences()
  const index = locale === "en" ? 0 : 1
  const tc = (key: CartMessageKey) => cartMessages[key][index]
  return { tc }
}
