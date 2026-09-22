/**
 * Centralized English / Canadian-French copy for the Chunk 5 marketplace card
 * families authored here: product-presentation, seller-offer, recently-sold,
 * notification-item, and collection-progress. Kept out of the shared
 * lib/messages catalog so the approved pilot copy stays untouched. Stories read
 * locale from usePreferences and resolve strings through useMarketCardMessages;
 * the reusable components themselves take plain label props and never depend on
 * this module. All prices/ratings/stocks/sellers are clearly illustrative.
 */
import { usePreferences } from "../hooks/use-preferences"

export const marketCardMessages = {
  // Shared scaffolding
  eyebrow: ["Marketplace", "Marketplace"],
  demoOnly: [
    "Local demo only · prices, sellers, stock, and sales are illustrative, not real.",
    "Démonstration locale seulement · prix, vendeurs, stock et ventes sont illustratifs, non réels.",
  ],
  variants: ["Variants", "Variantes"],
  states: ["States", "États"],
  do: ["Do", "À faire"],
  dont: ["Don’t", "À éviter"],
  loading: ["Loading", "Chargement"],
  loadingLabel: ["Loading card", "Chargement de la carte"],
  imageMissing: ["Image unavailable", "Image indisponible"],
  imageMissingLabel: ["Card image unavailable", "Image de carte indisponible"],

  // Shared card copy
  cardCharizardTitle: ["Charizard ex", "Charizard ex"],
  cardCharizardMeta: ["151 · 199/165 · Special Illustration Rare", "151 · 199/165 · Illustration spéciale rare"],
  cardPikachuTitle: ["Pikachu", "Pikachu"],
  cardPikachuMeta: ["151 · 173/165 · Illustration Rare", "151 · 173/165 · Illustration rare"],
  cardBoltTitle: ["Lightning Bolt", "Lightning Bolt"],
  cardBoltMeta: ["Magic 2011 · 149 · Common", "Magic 2011 · 149 · Commune"],
  cardLuffyTitle: ["Monkey D. Luffy", "Monkey D. Luffy"],
  cardLuffyMeta: ["OP05-060 · Super Rare", "OP05-060 · Super rare"],

  // ---- Product presentation ----
  ppTitle: ["Product & card tiles", "Fiches de produits et cartes"],
  ppIntro: [
    "Card tiles and compact rows for browse and search results. Full card shape, contained artwork, reference and lowest prices, seller count, and stock.",
    "Fiches en tuiles et lignes compactes pour la navigation et les résultats. Forme complète de carte, illustration contenue, prix de référence et le plus bas, nombre de vendeurs et stock.",
  ],
  ppTileTitle: ["Tile", "Tuile"],
  ppRowTitle: ["Compact row", "Ligne compacte"],
  ppReferenceLabel: ["Reference price", "Prix de référence"],
  ppLowestLabel: ["Lowest available", "Le plus bas offert"],
  ppSellersOne: ["1 seller", "1 vendeur"],
  ppSellersMany: ["{n} sellers", "{n} vendeurs"],
  ppInStock: ["{n} available", "{n} disponibles"],
  ppInStockOne: ["1 available", "1 disponible"],
  ppOutOfStock: ["Out of stock", "En rupture"],
  ppView: ["View offers", "Voir les offres"],
  ppSelected: ["Selected", "Sélectionnée"],
  ppSelectLabel: ["Select card", "Sélectionner la carte"],
  ppStatesTitle: ["Tile states", "États des tuiles"],
  ppHover: ["Hover", "Survol"],
  ppFocus: ["Focus", "Focus"],
  ppSelectedState: ["Selected", "Sélectionnée"],
  ppLoading: ["Loading", "Chargement"],
  ppMissing: ["Missing image", "Image manquante"],
  ppOut: ["Out of stock", "En rupture"],
  ppConditionNM: ["Near Mint", "Quasi neuf"],
  ppLangEN: ["English", "Anglais"],
  ppLangFR: ["French", "Français"],
  ppGamePokemon: ["Pokémon", "Pokémon"],
  ppGameMagic: ["Magic", "Magic"],
  ppGameOnePiece: ["One Piece", "One Piece"],
  ppDo: [
    "Keep the full card shape with contained artwork so no card is cropped.",
    "Conservez la forme complète de la carte et l’illustration contenue pour ne rien rogner.",
  ],
  ppDont: [
    "Don’t nest the select control inside the card link; keep interactive controls as siblings.",
    "N’imbriquez pas le sélecteur dans le lien de la carte ; gardez les contrôles interactifs côte à côte.",
  ],

  // ---- Seller offer ----
  soTitle: ["Seller offers", "Offres des vendeurs"],
  soIntro: [
    "One seller’s offer for a card: verification, rating, condition, price, editable quantity, shipping, promotion, and Add to Cart. Add to Cart is a demo callback only.",
    "L’offre d’un vendeur pour une carte : vérification, note, état, prix, quantité modifiable, livraison, promotion et Ajouter au panier. Ajouter au panier est un rappel de démonstration seulement.",
  ],
  soSellerName: ["Maple Card Co.", "Maple Card Co."],
  soSellerName2: ["Northern Hobby Shop", "Boutique du Nord"],
  soSellerName3: ["Prairie Singles", "Prairie Singles"],
  soVerified: ["Verified seller", "Vendeur vérifié"],
  soHobbyShop: ["Verified hobby shop", "Boutique spécialisée vérifiée"],
  soTopSeller: ["Top seller", "Vendeur vedette"],
  soRatingLabel: ["Seller rating", "Note du vendeur"],
  soConditionNM: ["Near Mint", "Quasi neuf"],
  soConditionLP: ["Lightly Played", "Légèrement joué"],
  soShipping: ["Ships from Ontario · $1.49 shipping", "Expédié de l’Ontario · 1,49 $ de livraison"],
  soShippingFree: ["Ships from Québec · Free over $25", "Expédié du Québec · Gratuit dès 25 $"],
  soQuantityLabel: ["Quantity", "Quantité"],
  soDecrement: ["Decrease quantity", "Diminuer la quantité"],
  soIncrement: ["Increase quantity", "Augmenter la quantité"],
  soPriceLabel: ["Price", "Prix"],
  soAddToCart: ["Add to cart", "Ajouter au panier"],
  soPromotion: ["10% off 5+", "10 % dès 5"],
  soUnavailable: ["Currently unavailable", "Actuellement indisponible"],
  soSelected: ["Selected", "Sélectionnée"],
  soPending: ["Pending Add to Cart", "Ajout au panier en cours"],
  soDisabled: ["Disabled", "Désactivée"],
  soAddingLabel: ["Adding to cart…", "Ajout au panier…"],
  soAddedToast: ["Added to cart (demo only)", "Ajouté au panier (démo seulement)"],
  soDefault: ["Default", "Par défaut"],
  soStackedNote: ["On narrow screens the offer stacks into a single column.", "Sur petits écrans, l’offre s’empile en une seule colonne."],
  soDo: [
    "Show the seller’s verification, rating, condition, and shipping alongside the price.",
    "Affichez la vérification, la note, l’état et la livraison du vendeur à côté du prix.",
  ],
  soDont: [
    "Don’t imply a real cart or checkout; Add to Cart is a demo callback here.",
    "Ne laissez pas croire à un vrai panier ou paiement ; Ajouter au panier est un rappel de démo ici.",
  ],

  // ---- Recently sold ----
  rsTitle: ["Recently sold", "Ventes récentes"],
  rsIntro: [
    "A compact, static reference of a recent illustrative sale — image, title, price, and timestamp. No live ticker or real sales.",
    "Référence compacte et statique d’une vente illustrative récente — image, titre, prix et horodatage. Aucun défilement en direct ni vente réelle.",
  ],
  rsSoldFor: ["Sold for", "Vendu"],
  rsTime2m: ["2 min ago", "il y a 2 min"],
  rsTime18m: ["18 min ago", "il y a 18 min"],
  rsTime1h: ["1 h ago", "il y a 1 h"],
  rsTimeYesterday: ["Yesterday", "Hier"],
  rsListLabel: ["Recent sample sales", "Exemples de ventes récentes"],
  rsNote: ["These sample sales are illustrative and static — they don’t reflect real transactions.", "Ces exemples de ventes sont illustratifs et statiques — ils ne reflètent aucune transaction réelle."],
  rsDo: ["Label the timestamp and price so the sold reference is unambiguous.", "Étiquetez l’horodatage et le prix pour que la référence de vente soit claire."],
  rsDont: ["Don’t auto-scroll a ticker without a reduced-motion-safe container.", "Ne faites pas défiler automatiquement sans conteneur respectant la réduction des animations."],

  // ---- Notification item ----
  niTitle: ["Notification items", "Éléments de notification"],
  niIntro: [
    "List items for the notification centre: read/unread, informational/success/warning/error tones, an optional action, and a compact size. Marking read toggles local state only.",
    "Éléments de liste pour le centre de notifications : lu/non lu, tons informatif/succès/avertissement/erreur, une action optionnelle et une taille compacte. Marquer comme lu ne change que l’état local.",
  ],
  niTonesTitle: ["Tones", "Tons"],
  niInfoTitle: ["Price drop on your watchlist", "Baisse de prix sur votre liste"],
  niInfoBody: ["Charizard ex (151) is now $18.40 from a verified seller.", "Charizard ex (151) est maintenant à 18,40 $ chez un vendeur vérifié."],
  niSuccessTitle: ["Order confirmed", "Commande confirmée"],
  niSuccessBody: ["Your sample order of 3 cards is on its way.", "Votre exemple de commande de 3 cartes est en route."],
  niWarningTitle: ["Payment method expiring", "Mode de paiement bientôt expiré"],
  niWarningBody: ["Update your card before your next purchase.", "Mettez à jour votre carte avant votre prochain achat."],
  niErrorTitle: ["A seller cancelled an item", "Un vendeur a annulé un article"],
  niErrorBody: ["Lightning Bolt is no longer available from this seller.", "Lightning Bolt n’est plus disponible chez ce vendeur."],
  niUnread: ["Unread", "Non lu"],
  niRead: ["Read", "Lu"],
  niWithAction: ["With action", "Avec action"],
  niCompact: ["Compact", "Compact"],
  niViewOffers: ["View offers", "Voir les offres"],
  niMarkRead: ["Mark as read", "Marquer comme lu"],
  niMarkUnread: ["Mark as unread", "Marquer comme non lu"],
  niTimeNow: ["Just now", "À l’instant"],
  niTime5m: ["5 min ago", "il y a 5 min"],
  niTime1h: ["1 h ago", "il y a 1 h"],
  niTime1d: ["Yesterday", "Hier"],
  niToggleNote: ["Toggling read status only updates local demo state.", "Basculer le statut de lecture ne met à jour que l’état local de démo."],
  niDo: ["Pair each tone with an icon and label so meaning never relies on colour.", "Associez chaque ton à une icône et un libellé pour que le sens ne repose jamais sur la couleur."],
  niDont: ["Don’t hide the unread state behind colour alone.", "Ne cachez pas l’état non lu derrière la couleur seule."],

  // ---- Collection progress ----
  cpTitle: ["Collection progress", "Progression de collection"],
  cpIntro: [
    "A card summarising how far a set is complete: count, percentage, and complete/empty/loading states in compact and full sizes. Visual only — no collection is stored.",
    "Une fiche résumant l’avancement d’une série : nombre, pourcentage et états complet/vide/chargement en tailles compacte et complète. Visuel seulement — aucune collection n’est stockée.",
  ],
  cpSetTitle: ["Pokémon · 151", "Pokémon · 151"],
  cpSetSubtitle: ["Master set", "Série complète"],
  cpProgressLabel: ["Set completion", "Progression de la série"],
  cpOf: ["of", "sur"],
  cpCardsOwned: ["{n} of {total} cards", "{n} sur {total} cartes"],
  cpEmptyTitle: ["Magic 2011 · Base set", "Magic 2011 · Série de base"],
  cpEmpty: ["No cards tracked yet. Add cards to start your progress.", "Aucune carte suivie. Ajoutez des cartes pour commencer votre progression."],
  cpEmptyValue: ["0 of 249 cards", "0 sur 249 cartes"],
  cpCompleteTitle: ["One Piece · OP05", "One Piece · OP05"],
  cpComplete: ["Set complete", "Série complète"],
  cpCompleteValue: ["120 of 120 cards", "120 sur 120 cartes"],
  cpFull: ["Full", "Complète"],
  cpEmptyState: ["Empty", "Vide"],
  cpCompact: ["Compact", "Compact"],
  cpLoadingLabel: ["Loading collection progress", "Chargement de la progression"],
  cpDo: ["Show both the count and the percentage so progress is unambiguous.", "Affichez le nombre et le pourcentage pour que la progression soit claire."],
  cpDont: ["Don’t imply the collection is saved; this card is visual only.", "Ne laissez pas croire que la collection est sauvegardée ; cette fiche est visuelle seulement."],
} as const

export type MarketCardMessageKey = keyof typeof marketCardMessages

export function useMarketCardMessages() {
  const { locale } = usePreferences()
  const index = locale === "en" ? 0 : 1
  const ts = (key: MarketCardMessageKey) => marketCardMessages[key][index]
  return { ts }
}
