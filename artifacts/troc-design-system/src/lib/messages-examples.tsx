/**
 * Centralized English / Canadian-French copy for the cross-cutting applied &
 * mobile guide examples. Kept separate from the shared lib/messages catalog so
 * the pilot copy stays untouched. The example pages read locale from
 * usePreferences and resolve strings through useExamplesMessages; the real
 * reusable components take plain label props and never depend on this module.
 * These pages are a small, bounded marketplace vignette — not a homepage or a
 * real marketplace app. English brand slogans are verbatim; their French
 * fields are natural translated equivalents (never copies of the English).
 * French strings tend to run longer, which also proves label resilience.
 */
import { usePreferences } from "../hooks/use-preferences"

export const examplesMessages = {
  // Page scaffolding
  appliedEyebrow: ["Applied composition", "Composition appliquée"],
  appliedTitle: ["Branding in context", "La marque en contexte"],
  appliedIntro: [
    "One compact, bounded marketplace vignette that assembles the real primitives — header, search, product, price, badges, and shipping progress. It is a composition example, not a homepage or a live marketplace.",
    "Une vignette de marché compacte et délimitée qui assemble les vrais composants — en-tête, recherche, produit, prix, badges et progression d’expédition. C’est un exemple de composition, pas une page d’accueil ni un marché réel.",
  ],
  boundedNote: ["Bounded example · every action is local and nothing is saved.", "Exemple délimité · chaque action est locale et rien n’est enregistré."],

  // Approved brand lines: English verbatim, French natural equivalents.
  tagline: ["Canada’s Trading Card Marketplace", "Le marché canadien des cartes à collectionner"],
  searchLine: ["One search. Every seller.", "Une recherche. Tous les vendeurs."],
  shippingLine: ["More cards. Less shipping.", "Plus de cartes. Moins de frais de livraison."],

  // Header / search
  navPrimary: ["Primary navigation", "Navigation principale"],
  navShop: ["Shop", "Acheter"],
  navSell: ["Sell", "Vendre"],
  navCollect: ["Collect", "Collectionner"],
  brandLabel: ["TROC — home", "TROC — accueil"],
  searchLabel: ["Search cards, sets, and sellers", "Rechercher des cartes, éditions et vendeurs"],
  searchPlaceholder: ["One search. Every seller.", "Une recherche. Tous les vendeurs."],
  searchClear: ["Clear search", "Effacer la recherche"],
  searchSubmit: ["Search", "Rechercher"],
  searchLoading: ["Searching the demo list…", "Recherche dans la liste de démonstration…"],
  searchEmpty: ["No matches in the demo list.", "Aucune correspondance dans la liste de démonstration."],
  langEn: ["English", "English"],
  langFr: ["Français", "Français"],
  language: ["Language", "Langue"],
  themeDark: ["TROC Dark", "TROC Sombre"],
  themeLight: ["TROC Light", "TROC Clair"],
  theme: ["Theme", "Thème"],
  cart: ["Cart", "Panier"],
  account: ["Account", "Compte"],
  signIn: ["Sign in", "Se connecter"],
  memberName: ["A. Tremblay", "A. Tremblay"],

  // Vignette structure
  featuredTitle: ["Featured near you", "En vedette près de chez vous"],
  featuredIntro: ["A handful of sample offers, presented with the real product, price, and badge modules.", "Quelques offres d’exemple, présentées avec les vrais modules produit, prix et badges."],
  resultsTitle: ["Search results", "Résultats de recherche"],
  cartTitle: ["Your cart", "Votre panier"],
  cartIntro: ["Meaningful seller-minimum and free-shipping progress from real modules.", "Progression réelle vers le minimum du vendeur et l’expédition gratuite."],

  // Product copy
  cardCharizard: ["Charizard ex", "Charizard ex"],
  cardPikachu: ["Pikachu", "Pikachu"],
  cardLuffy: ["Monkey D. Luffy", "Monkey D. Luffy"],
  cardLightning: ["Lightning Bolt", "Éclair"],
  setSV: ["Scarlet & Violet · 199/165", "Écarlate et Violet · 199/165"],
  setSV198: ["Scarlet & Violet · 025/198", "Écarlate et Violet · 025/198"],
  setOP: ["One Piece · OP05-060", "One Piece · OP05-060"],
  setMagic: ["Magic · M11", "Magic · M11"],
  gamePokemon: ["Pokémon", "Pokémon"],
  gameOnePiece: ["One Piece", "One Piece"],
  gameMagic: ["Magic", "Magic"],
  langBadgeEn: ["English", "Anglais"],
  langBadgeFr: ["French", "Français"],
  condNM: ["Near Mint", "Quasi neuf"],
  condLP: ["Lightly Played", "Légèrement joué"],
  refPrice: ["Reference", "Référence"],
  lowest: ["Lowest available", "Meilleur prix"],
  sellersCount: (n: number) => [`${n} sellers`, `${n} vendeurs`] as const,
  available: (n: number) => [`${n} available`, `${n} disponibles`] as const,
  outOfStock: ["Out of stock", "En rupture"],
  missingImage: ["Image unavailable", "Image indisponible"],
  cardAlt: (name: string) => [`${name} trading card`, `Carte à collectionner ${name}`] as const,
  viewOffers: ["View offers", "Voir les offres"],
  addToCart: ["Add to cart", "Ajouter au panier"],
  added: ["Added", "Ajouté"],

  // Seller / progress
  sellerRating: ["Seller rating", "Note du vendeur"],
  sellerTop: ["Top seller", "Vendeur vedette"],
  sellerName: ["Maple City Cards", "Maple City Cards"],
  minimumLabel: ["Seller minimum", "Minimum du vendeur"],
  minimumRemaining: (text: string) => [`Add ${text} more from this seller`, `Ajoutez ${text} de plus chez ce vendeur`] as const,
  minimumReached: ["Seller minimum reached", "Minimum du vendeur atteint"],
  freeShipLabel: ["Free shipping", "Expédition gratuite"],
  freeShipRemaining: (text: string) => [`Add ${text} more for free shipping`, `Ajoutez ${text} de plus pour l’expédition gratuite`] as const,
  freeShipReached: ["You’ve unlocked free shipping", "Expédition gratuite débloquée"],

  // Interaction feedback
  lastAction: ["Last demo action", "Dernière action de démonstration"],
  none: ["none yet", "aucune pour l’instant"],
  clicked: ["clicked", "cliqué"],
  selectedItem: ["Selected", "Sélectionné"],

  // Mobile page (kept + upgraded)
  mobileVignetteTitle: ["Mobile in context", "Le mobile en contexte"],
  mobileVignetteIntro: [
    "The same real header, search, product, and progress modules, arranged for a bounded phone frame that renders its mobile layout even on a desktop viewport.",
    "Les mêmes modules réels — en-tête, recherche, produit et progression — disposés dans un cadre téléphone délimité qui affiche sa mise en page mobile même sur un écran de bureau.",
  ],
  mobileGuidanceTitle: ["Responsive breakpoints", "Points de rupture réactifs"],
  breakpointCompact: ["Compact · below 768px: single column, bottom navigation, search in the top bar.", "Compact · sous 768 px : une seule colonne, navigation inférieure, recherche dans la barre supérieure."],
  breakpointWide: ["Wide · 768px and up: the desktop header shows inline navigation and actions.", "Large · à partir de 768 px : l’en-tête de bureau affiche la navigation et les actions en ligne."],
  navHome: ["Home", "Accueil"],
  navSearch: ["Search", "Recherche"],
  bottomNav: ["Bottom navigation", "Navigation inférieure"],
} as const

type Plain = readonly [string, string]
export type ExamplesMessageKey = {
  [K in keyof typeof examplesMessages]: (typeof examplesMessages)[K] extends Plain ? K : never
}[keyof typeof examplesMessages]

export function useExamplesMessages() {
  const { locale } = usePreferences()
  const index = locale === "en" ? 0 : 1
  const te = (key: ExamplesMessageKey) => (examplesMessages[key] as Plain)[index]
  // Resolve the parameterised (function) messages by locale.
  const sellersCount = (n: number) => examplesMessages.sellersCount(n)[index]
  const available = (n: number) => examplesMessages.available(n)[index]
  const cardAlt = (name: string) => examplesMessages.cardAlt(name)[index]
  const minimumRemaining = (text: string) => examplesMessages.minimumRemaining(text)[index]
  const freeShipRemaining = (text: string) => examplesMessages.freeShipRemaining(text)[index]
  return { te, sellersCount, available, cardAlt, minimumRemaining, freeShipRemaining, index, locale }
}
