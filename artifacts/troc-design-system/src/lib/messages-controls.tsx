/**
 * Centralized English / Canadian-French copy for the Chunk 2 core-control
 * stories (selection controls, quantity control, chips, badge & status, tabs,
 * breadcrumbs). Kept out of the shared lib/messages catalog so the pilot copy
 * stays untouched. Stories read locale from usePreferences and resolve strings
 * through useControlsMessages; the reusable components themselves take plain
 * label props and never depend on this module.
 */
import { usePreferences } from "../hooks/use-preferences"

export const controlsMessages = {
  // Shared demo scaffolding
  states: ["States", "États"],
  variants: ["Variants", "Variantes"],
  default: ["Default", "Par défaut"],
  interactive: ["Interactive", "Interactif"],
  demoOnly: ["Local demo only · no data is saved.", "Démonstration locale seulement · aucune donnée n’est enregistrée."],
  keyboardHint: ["Try the keyboard: Tab to focus, arrows and Space to operate.", "Essayez le clavier : Tab pour cibler, flèches et Espace pour agir."],
  do: ["Do", "À faire"],
  dont: ["Don’t", "À éviter"],

  // Selection controls
  selectionEyebrow: ["Core controls", "Contrôles de base"],
  selectionTitle: ["Selection controls", "Contrôles de sélection"],
  selectionIntro: ["Checkbox, radio, and switch built on accessible primitives. Status is never colour-only.", "Cases, boutons radio et interrupteurs sur des primitives accessibles. Un état ne repose jamais sur la couleur seule."],
  checkbox: ["Checkbox", "Case à cocher"],
  radioGroup: ["Radio group", "Groupe de boutons radio"],
  switch: ["Switch", "Interrupteur"],
  emailUpdates: ["Email me price drops", "M’aviser des baisses de prix"],
  emailUpdatesHint: ["Weekly digest for cards on your watchlist.", "Résumé hebdomadaire des cartes suivies."],
  selectAll: ["Select all conditions", "Sélectionner toutes les conditions"],
  indeterminate: ["Indeterminate", "Indéterminé"],
  chooseCondition: ["Preferred condition", "État préféré"],
  nearMint: ["Near Mint (NM)", "Quasi neuf (NM)"],
  lightlyPlayed: ["Lightly Played (LP)", "Légèrement joué (LP)"],
  moderatelyPlayed: ["Moderately Played (MP)", "Modérément joué (MP)"],
  showFoil: ["Show foils only", "Afficher les foils seulement"],
  disabledOption: ["Reserved (unavailable)", "Réservé (indisponible)"],
  checked: ["Checked", "Coché"],
  unchecked: ["Unchecked", "Non coché"],
  focus: ["Focus-visible", "Focus visible"],
  disabled: ["Disabled", "Désactivé"],
  error: ["Error", "Erreur"],
  selectionError: ["Choose at least one condition to continue.", "Choisissez au moins une condition pour continuer."],

  // Quantity control
  quantityEyebrow: ["Core controls", "Contrôles de base"],
  quantityTitle: ["Quantity control", "Contrôle de quantité"],
  quantityIntro: ["An Input framed by icon Buttons. Values clamp to the range and stay editable.", "Un champ encadré de boutons à icône. Les valeurs restent bornées et modifiables."],
  quantityLabel: ["Quantity", "Quantité"],
  decrease: ["Decrease quantity", "Diminuer la quantité"],
  increase: ["Increase quantity", "Augmenter la quantité"],
  compactCart: ["Compact (cart / offer row)", "Compact (panier / ligne d’offre)"],
  minMax: ["Range 1–10", "Plage 1–10"],
  atMin: ["Minimum reached", "Minimum atteint"],
  atMax: ["Maximum reached", "Maximum atteint"],
  inStock: ["In stock", "En stock"],
  quantityValue: ["Selected quantity", "Quantité sélectionnée"],
  editHint: ["Type a value, then Enter or blur to commit; out-of-range entries clamp.", "Saisissez une valeur, puis Entrée ou sortie du champ pour valider ; les valeurs hors plage sont ramenées à la limite."],

  // Chips
  chipsEyebrow: ["Core controls", "Contrôles de base"],
  chipsTitle: ["Chips & filter chips", "Puces et puces de filtre"],
  chipsIntro: ["Static, selectable filter, removable, and game chips. Interactive chips use button semantics.", "Puces statiques, filtres sélectionnables, retirables et de jeu. Les puces interactives utilisent la sémantique de bouton."],
  staticChips: ["Static", "Statique"],
  filterChips: ["Selectable filters", "Filtres sélectionnables"],
  removableChips: ["Removable (active filters)", "Retirables (filtres actifs)"],
  gameChips: ["Game chips", "Puces de jeu"],
  remove: ["Remove filter", "Retirer le filtre"],
  activeFilters: ["Active filters", "Filtres actifs"],
  noFilters: ["No active filters.", "Aucun filtre actif."],
  resetFilters: ["Reset filters", "Réinitialiser les filtres"],
  selectedGames: ["Selected", "Sélectionnés"],
  none: ["None", "Aucun"],
  foil: ["Foil", "Foil"],
  graded: ["Graded", "Gradée"],
  firstEdition: ["1st Edition", "1re édition"],
  sealed: ["Sealed", "Scellé"],

  // Badge & status
  badgeEyebrow: ["Core controls", "Contrôles de base"],
  badgeTitle: ["Badge & status", "Badge et statut"],
  badgeIntro: ["Compact labels and order-status treatments. Meaning is carried by text and shape, not colour alone.", "Étiquettes compactes et statuts de commande. Le sens passe par le texte et la forme, pas la couleur seule."],
  badgeVariantsTitle: ["Badge variants", "Variantes de badge"],
  neutral: ["Neutral", "Neutre"],
  accent: ["Accent", "Accent"],
  positive: ["Positive", "Positif"],
  warning: ["Warning", "Avertissement"],
  destructive: ["Destructive", "Destructif"],
  sponsored: ["Sponsored", "Commandité"],
  outline: ["Outline", "Contour"],
  new: ["New", "Nouveau"],
  verified: ["Verified", "Vérifié"],
  lowStock: ["Low stock", "Stock faible"],
  soldOut: ["Sold out", "Épuisé"],
  orderStatusTitle: ["Order status", "Statut de commande"],
  statusPending: ["Payment pending", "Paiement en attente"],
  statusProcessing: ["Processing", "En traitement"],
  statusShipped: ["Shipped", "Expédié"],
  statusDelivered: ["Delivered", "Livré"],
  statusCancelled: ["Cancelled", "Annulé"],
  statusNote: ["Each status pairs an icon or dot with words for colour-independent meaning.", "Chaque statut associe une icône ou un point à des mots pour un sens indépendant de la couleur."],

  // Tabs
  tabsEyebrow: ["Core controls", "Contrôles de base"],
  tabsTitle: ["Tabs", "Onglets"],
  tabsIntro: ["Controlled and uncontrolled tabs with roving keyboard focus and mobile overflow scrolling.", "Onglets contrôlés et non contrôlés avec focus clavier itinérant et défilement en cas de débordement mobile."],
  uncontrolled: ["Uncontrolled", "Non contrôlé"],
  controlled: ["Controlled", "Contrôlé"],
  overflow: ["Overflow (scrolls on narrow screens)", "Débordement (défile sur écrans étroits)"],
  tabDetails: ["Details", "Détails"],
  tabSellers: ["Sellers", "Vendeurs"],
  tabHistory: ["Price history", "Historique des prix"],
  tabDetailsBody: ["Set, rarity, and printing details for the selected card.", "Détails d’édition, de rareté et d’impression de la carte sélectionnée."],
  tabSellersBody: ["Offers from Canadian sellers, sorted by delivered price.", "Offres de vendeurs canadiens, triées par prix rendu."],
  tabHistoryBody: ["Recent sold prices over the last 90 days.", "Prix de vente récents des 90 derniers jours."],
  tabDisabled: ["Grading", "Gradation"],
  activeTab: ["Active tab", "Onglet actif"],
  tabAll: ["All", "Toutes"],
  tabPokemon: ["Pokémon", "Pokémon"],
  tabMagic: ["Magic", "Magic"],
  tabYugioh: ["Yu-Gi-Oh!", "Yu-Gi-Oh!"],
  tabOnePiece: ["One Piece", "One Piece"],
  tabLorcana: ["Lorcana", "Lorcana"],
  tabPanelBody: ["Local demo panel for the selected tab.", "Panneau de démonstration local pour l’onglet sélectionné."],

  // Breadcrumbs
  breadcrumbsEyebrow: ["Core controls", "Contrôles de base"],
  breadcrumbsTitle: ["Breadcrumbs", "Fil d’Ariane"],
  breadcrumbsIntro: ["Semantic navigation with links, a current page, separators, and a collapsed ellipsis. Wraps on narrow screens.", "Navigation sémantique avec liens, page courante, séparateurs et repli. S’enroule sur écrans étroits."],
  breadcrumbLabel: ["Breadcrumb", "Fil d’Ariane"],
  breadcrumbShort: ["Short trail", "Fil court"],
  breadcrumbCollapsed: ["Collapsed (ellipsis)", "Replié (points de suspension)"],
  crumbHome: ["Home", "Accueil"],
  crumbPokemon: ["Pokémon", "Pokémon"],
  crumbSet: ["Scarlet & Violet", "Écarlate et Violet"],
  crumbCard: ["Charizard ex · 199/165", "Dracaufeu ex · 199/165"],
  crumbMoreLabel: ["Show hidden pages", "Afficher les pages masquées"],
  crumbNote: ["Separators and the ellipsis are decorative; only real destinations are focusable links.", "Les séparateurs et les points de suspension sont décoratifs ; seuls les vrais liens sont focusables."],

  // Guidelines
  selectionDo: ["Give every control a visible label and keep the whole row a 44 px target.", "Donnez un libellé visible à chaque contrôle et gardez la ligne comme cible de 44 px."],
  selectionDont: ["Don’t signal errors with red alone — add associated error text.", "Ne signalez pas les erreurs par le rouge seul — ajoutez un message associé."],
  quantityDo: ["Clamp to the available stock and keep the field editable for large jumps.", "Bornez à l’inventaire disponible et gardez le champ modifiable pour les grands sauts."],
  quantityDont: ["Don’t let the value exceed the maximum or drop below the minimum.", "Ne laissez pas la valeur dépasser le maximum ni passer sous le minimum."],
  chipsDo: ["Use selectable chips for filters and removable chips to show what is active.", "Utilisez des puces sélectionnables pour filtrer et retirables pour montrer l’actif."],
  chipsDont: ["Don’t use red-filled chips for anything but a genuine active selection.", "N’utilisez pas de puces rouges sauf pour une sélection réellement active."],
  badgeDo: ["Pair status colour with an icon or word so meaning survives colour-blindness.", "Associez la couleur d’état à une icône ou un mot pour un sens perceptible."],
  badgeDont: ["Don’t use accent red for large areas or purely decorative badges.", "N’utilisez pas le rouge d’accent pour de grandes zones ou des badges décoratifs."],
  tabsDo: ["Keep tab labels short and let the list scroll on small screens.", "Gardez des libellés courts et laissez la liste défiler sur petits écrans."],
  tabsDont: ["Don’t hide critical actions behind a disabled or overflowed tab.", "Ne cachez pas d’actions essentielles derrière un onglet désactivé ou débordé."],
  breadcrumbsDo: ["Mark the current page and keep separators decorative and non-focusable.", "Marquez la page courante et gardez les séparateurs décoratifs et non focusables."],
  breadcrumbsDont: ["Don’t make the current page a link or rely on breadcrumbs as the only navigation.", "Ne faites pas de la page courante un lien et n’en faites pas la seule navigation."],
} as const

export type ControlsMessageKey = keyof typeof controlsMessages

export function useControlsMessages() {
  const { locale } = usePreferences()
  const index = locale === "en" ? 0 : 1
  const tc = (key: ControlsMessageKey) => controlsMessages[key][index]
  return { tc }
}
