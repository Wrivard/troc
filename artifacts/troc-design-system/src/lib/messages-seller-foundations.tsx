/**
 * Centralized English / Canadian-French copy for the two foundational families
 * pulled forward into the start of Chunk 5 (progress, seller-reputation). Kept
 * out of the shared lib/messages catalog so the pilot copy stays untouched.
 * Stories read locale from usePreferences and resolve strings through
 * useSellerFoundationMessages; the reusable components themselves take plain
 * label props and never depend on this module.
 */
import { usePreferences } from "../hooks/use-preferences"

export const sellerFoundationMessages = {
  // Shared demo scaffolding
  eyebrow: ["Foundations", "Fondations"],
  states: ["States", "États"],
  variants: ["Variants", "Variantes"],
  demoOnly: ["Local demo only · no accounts, plans, or traction are real.", "Démonstration locale seulement · aucun compte, forfait ou achalandage réel."],
  do: ["Do", "À faire"],
  dont: ["Don’t", "À éviter"],

  // Progress
  progressTitle: ["Progress bars", "Barres de progression"],
  progressIntro: ["Determinate and indeterminate bars for seller minimums, free shipping, and promotions. Every bar is labelled.", "Barres déterminées et indéterminées pour les minimums de vendeur, la livraison gratuite et les promotions. Chaque barre est étiquetée."],
  determinate: ["Determinate", "Déterminée"],
  indeterminate: ["Indeterminate", "Indéterminée"],
  sizes: ["Sizes", "Tailles"],
  compact: ["Compact", "Compact"],
  standard: ["Default", "Normal"],
  zero: ["Empty (0%)", "Vide (0 %)"],
  partial: ["Partial", "Partielle"],
  complete: ["Complete (100%)", "Terminée (100 %)"],
  sellerMinimumLabel: ["Seller minimum", "Minimum du vendeur"],
  sellerMinimumValue: ["$1.42 / $5 minimum", "1,42 $ / 5 $ minimum"],
  sellerMinimumHelp: ["Add $3.58 more from this seller.", "Ajoutez 3,58 $ de plus chez ce vendeur."],
  freeShippingLabel: ["Free shipping", "Livraison gratuite"],
  freeShippingValue: ["$36.50 / $50", "36,50 $ / 50 $"],
  promotionLabel: ["Promotion progress", "Progression de la promotion"],
  promotionValue: ["2 / 5 cards", "2 / 5 cartes"],
  promotionHelp: ["Add 3 more cards to unlock 10% off.", "Ajoutez 3 cartes pour obtenir 10 % de rabais."],
  loadingLabel: ["Loading inventory", "Chargement de l’inventaire"],
  progressDo: ["Give every bar a text label and a plain-language value.", "Donnez à chaque barre un libellé texte et une valeur en langage clair."],
  progressDont: ["Don’t rely on the fill colour alone to convey how far along it is.", "Ne comptez pas sur la couleur de remplissage seule pour indiquer l’avancement."],

  // Seller reputation
  sellerTitle: ["Seller reputation", "Réputation du vendeur"],
  sellerIntro: ["Rating, stats, level, and plan for a seller. Visual only — no real accounts, reviews, or plans exist.", "Note, statistiques, niveau et forfait d’un vendeur. Visuel seulement — aucun compte, avis ou forfait réel."],
  ratingTitle: ["Seller rating", "Note du vendeur"],
  ratingLabel: ["Seller rating", "Note du vendeur"],
  ratingFull: ["Full", "Complète"],
  ratingCompact: ["Compact (offer row)", "Compact (ligne d’offre)"],
  ratingUnrated: ["New seller · no reviews yet", "Nouveau vendeur · aucun avis"],
  ratingLoading: ["Loading rating", "Chargement de la note"],
  loading: ["Loading", "Chargement"],
  unrated: ["Unrated", "Non noté"],
  statsTitle: ["Seller stats", "Statistiques du vendeur"],
  statShipsFrom: ["Ships from", "Expédié de"],
  statShipsFromValue: ["Ontario, CA", "Ontario, CA"],
  statSales: ["Sales", "Ventes"],
  statSalesValue: ["1,240", "1 240"],
  statResponse: ["Avg. response", "Réponse moy."],
  statResponseValue: ["Under 2h", "Moins de 2 h"],
  statOnTime: ["On-time ship", "Expédition à temps"],
  statOnTimeValue: ["98%", "98 %"],
  statUnavailable: ["Not enough data yet", "Pas assez de données"],
  levelTitle: ["Seller level", "Niveau du vendeur"],
  levelNew: ["New seller", "Nouveau vendeur"],
  levelEstablished: ["Established", "Établi"],
  levelTop: ["Top Seller", "Vendeur vedette"],
  levelFounding: ["Founding Seller", "Vendeur fondateur"],
  planTitle: ["Seller plan", "Forfait du vendeur"],
  planStandard: ["Standard", "Standard"],
  planHobbyShop: ["Hobby Shop", "Boutique spécialisée"],
  planNote: ["Plans are illustrative badges only; no billing or tiers are implemented.", "Les forfaits ne sont que des badges illustratifs ; aucune facturation ni palier n’est implémenté."],
  sellerDo: ["Show the review count next to a score and label an unrated seller clearly.", "Affichez le nombre d’avis à côté d’une note et indiquez clairement un vendeur non noté."],
  sellerDont: ["Don’t imply reviews, sales, or plan tiers are real in this demo.", "Ne laissez pas croire que les avis, ventes ou forfaits sont réels dans cette démo."],
} as const

export type SellerFoundationMessageKey = keyof typeof sellerFoundationMessages

export function useSellerFoundationMessages() {
  const { locale } = usePreferences()
  const index = locale === "en" ? 0 : 1
  const ts = (key: SellerFoundationMessageKey) => sellerFoundationMessages[key][index]
  return { ts }
}
