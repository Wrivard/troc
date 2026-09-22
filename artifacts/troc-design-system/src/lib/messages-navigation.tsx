/**
 * Centralized English / Canadian-French copy for the Chunk 4 brand & navigation
 * stories (logo, global-search, site-navigation, locale-switcher,
 * theme-switcher, pagination). Kept separate from the shared lib/messages
 * catalog so the pilot copy stays untouched. Stories read locale from
 * usePreferences and resolve strings through useNavigationMessages; the
 * reusable components themselves take plain label props and never depend on
 * this module. French strings are intentionally longer to prove label
 * resilience.
 */
import { usePreferences } from "../hooks/use-preferences"

export const navigationMessages = {
  // Shared demo scaffolding
  brandNav: ["Brand & navigation", "Marque et navigation"],
  variants: ["Variants", "Variantes"],
  states: ["States", "États"],
  default: ["Default", "Par défaut"],
  demoOnly: ["Local demo only · nothing is saved, no real cart or account.", "Démonstration locale seulement · rien n’est enregistré, aucun panier ni compte réel."],
  do: ["Do", "À faire"],
  dont: ["Don’t", "À éviter"],

  // Logo
  logoTitle: ["TROC logo", "Logo TROC"],
  logoIntro: ["The supplied wordmark artwork, presented faithfully. It is never redrawn, stretched, or typeset from a font.", "L’illustration du logotype fournie, présentée fidèlement. Elle n’est jamais redessinée, étirée ni recomposée à partir d’une police."],
  logoAuto: ["Automatic (follows theme)", "Automatique (suit le thème)"],
  logoAutoNote: ["The auto variant resolves its artwork from the nearest theme boundary, so nested regions stay correct.", "La variante automatique choisit son illustration selon la limite de thème la plus proche, donc les zones imbriquées restent correctes."],
  logoOnDark: ["On dark background", "Sur fond foncé"],
  logoOnLight: ["On light background", "Sur fond clair"],
  logoMono: ["Monochrome", "Monochrome"],
  logoWordmark: ["Wordmark + leaf", "Logotype et feuille"],
  logoCompact: ["Compact (leaf mark)", "Compact (marque feuille)"],
  logoClearSpace: ["Clear space", "Zone de dégagement"],
  logoMinSize: ["Minimum size", "Taille minimale"],
  logoClearNote: ["Keep at least one leaf-width of clear space on every side.", "Conservez au moins une largeur de feuille de dégagement sur chaque côté."],
  logoMinNote: ["Do not render the lockup below 24 px tall.", "N’affichez pas le bloc-signature sous 24 px de hauteur."],
  nestedDark: ["Nested dark region", "Zone foncée imbriquée"],
  nestedLight: ["Nested light region", "Zone claire imbriquée"],

  // Global search
  searchTitle: ["Global search", "Recherche globale"],
  searchIntro: ["A marketplace search field with keyboard-navigable suggestions, plus loading, empty, and error states. No search backend.", "Un champ de recherche avec suggestions navigables au clavier, ainsi que des états de chargement, vide et erreur. Aucun moteur de recherche."],
  searchLabel: ["Search cards, sets, and sellers", "Rechercher des cartes, des éditions et des vendeurs"],
  searchPlaceholder: ["One search. Every seller.", "Une recherche. Tous les vendeurs."],
  searchClear: ["Clear search", "Effacer la recherche"],
  searchSubmit: ["Search", "Rechercher"],
  searchLoading: ["Searching the demo list…", "Recherche dans la liste de démonstration…"],
  searchEmpty: ["No matches in the demo list.", "Aucune correspondance dans la liste de démonstration."],
  searchError: ["The demo search could not load. Try again.", "La recherche de démonstration n’a pas pu se charger. Réessayez."],
  searchTry: ["Try typing", "Essayez d’écrire"],
  searchIdle: ["Start typing to see live suggestions filtered from a small local list.", "Commencez à écrire pour voir des suggestions filtrées d’une petite liste locale."],
  searchSelected: ["Selected", "Sélectionné"],
  searchGroupCards: ["Cards", "Cartes"],
  searchGroupSets: ["Sets", "Éditions"],
  searchGroupSellers: ["Sellers", "Vendeurs"],
  searchStateLoading: ["Loading state", "État de chargement"],
  searchStateEmpty: ["Empty state", "État vide"],
  searchStateError: ["Error state", "État d’erreur"],
  searchStateNote: ["Toggle a state, then focus the field and type to see it.", "Activez un état, puis ciblez le champ et écrivez pour le voir."],

  // Site navigation
  navTitle: ["Site navigation", "Navigation du site"],
  navIntro: ["The desktop header and a restrained mobile concept. All clicks change only local demo state — no navigation, cart, or sign-in happens.", "L’en-tête de bureau et un concept mobile sobre. Tous les clics ne changent que l’état local de démonstration — aucune navigation, panier ni connexion réels."],
  navDesktop: ["Desktop header", "En-tête de bureau"],
  navMobile: ["Mobile concept", "Concept mobile"],
  navPrimary: ["Primary navigation", "Navigation principale"],
  navBottom: ["Bottom navigation", "Navigation inférieure"],
  navShop: ["Shop", "Acheter"],
  navSell: ["Sell", "Vendre"],
  navCollect: ["Collect", "Collectionner"],
  navHome: ["Home", "Accueil"],
  navSearch: ["Search", "Recherche"],
  navCart: ["Cart", "Panier"],
  navAccount: ["Account", "Compte"],
  navSignIn: ["Sign in", "Se connecter"],
  navSignedInAs: ["Signed in", "Connecté"],
  navToggleAccount: ["Toggle signed-in demo state", "Basculer l’état connecté de démonstration"],
  navMemberName: ["A. Tremblay", "A. Tremblay"],
  navLastAction: ["Last demo action", "Dernière action de démonstration"],
  navNone: ["none yet", "aucune pour l’instant"],
  navClicked: ["clicked", "cliqué"],
  navBrandLabel: ["TROC — home", "TROC — accueil"],
  navFrameNote: ["Bounded example. The sticky bar is anchored to this frame, not the page.", "Exemple délimité. La barre fixe est ancrée à ce cadre, pas à la page."],
  navItemStates: ["Navigation item states", "États des éléments de navigation"],
  navItemStatesNote: ["Any destination can be shown loading (busy, with a spinner beside its label) or disabled. These are visual states only — no route or sign-in is implied.", "Une destination peut être affichée en chargement (occupée, avec un indicateur à côté de son libellé) ou désactivée. Ce sont uniquement des états visuels — aucune route ni connexion n’est impliquée."],
  navToggleLoading: ["Toggle “Sell” loading", "Basculer le chargement de « Vendre »"],
  navToggleDisabled: ["Toggle “Collect” disabled", "Basculer la désactivation de « Collectionner »"],

  // Locale switcher
  localeTitle: ["Locale switcher", "Sélecteur de langue"],
  localeIntro: ["A controlled, provider-independent language control. The story wires it to the guide’s own preference so longer French labels stay readable.", "Un contrôle de langue contrôlé et indépendant du fournisseur. La démonstration le relie à la préférence du guide pour vérifier que les libellés français plus longs restent lisibles."],
  localeGroup: ["Language", "Langue"],
  localeEnglish: ["English", "English"],
  localeFrench: ["Français", "Français"],
  localeCurrent: ["Current language", "Langue actuelle"],
  localeControlled: ["Bound to the guide preference", "Lié à la préférence du guide"],
  localeStandalone: ["Standalone (local state)", "Autonome (état local)"],

  // Theme switcher
  themeTitle: ["Theme switcher", "Sélecteur de thème"],
  themeIntro: ["A controlled TROC Dark / TROC Light control with icon plus accessible text. Extensible without adding themes now.", "Un contrôle contrôlé TROC Sombre / TROC Clair avec icône et texte accessible. Extensible sans ajouter de thèmes pour l’instant."],
  themeGroup: ["Theme", "Thème"],
  themeDark: ["TROC Dark", "TROC Sombre"],
  themeLight: ["TROC Light", "TROC Clair"],
  themeCurrent: ["Current theme", "Thème actuel"],
  themeControlled: ["Bound to the guide preference", "Lié à la préférence du guide"],
  themeStandalone: ["Standalone (local state)", "Autonome (état local)"],
  themeIconOnly: ["Icon-only (compact)", "Icône seule (compact)"],

  // Pagination
  paginationTitle: ["Pagination", "Pagination"],
  paginationIntro: ["Page navigation with real local page changes, active and boundary states, an ellipsis, and a compact mobile form.", "Navigation de pages avec changements de page locaux réels, états actif et de limite, points de suspension et forme mobile compacte."],
  paginationLabel: ["Pagination", "Pagination"],
  paginationPrev: ["Previous page", "Page précédente"],
  paginationNext: ["Next page", "Page suivante"],
  paginationPrevShort: ["Previous", "Précédent"],
  paginationNextShort: ["Next", "Suivant"],
  paginationEllipsis: ["More pages", "Autres pages"],
  paginationPage: ["Page", "Page"],
  paginationGoTo: ["Go to page", "Aller à la page"],
  paginationOf: ["of", "sur"],
  paginationResults: ["Showing results — local demo only.", "Affichage des résultats — démonstration locale seulement."],
  paginationCompact: ["Compact (mobile)", "Compact (mobile)"],
  paginationFull: ["Full (desktop)", "Complet (bureau)"],

  // Guidelines
  logoDo: ["Use the supplied artwork and keep its proportions; pick the variant that fits the background.", "Utilisez l’illustration fournie et conservez ses proportions ; choisissez la variante adaptée au fond."],
  logoDont: ["Don’t recreate the wordmark with a font, recolour it freely, or add a maple leaf.", "Ne recréez pas le logotype avec une police, ne le recolorez pas librement et n’ajoutez pas de feuille d’érable."],
  searchDo: ["Give search a clear label and keep suggestions keyboard-navigable with visible states.", "Donnez à la recherche un libellé clair et gardez les suggestions navigables au clavier avec des états visibles."],
  searchDont: ["Don’t hide the empty, loading, or error feedback behind a silent blank field.", "Ne cachez pas les retours vide, chargement ou erreur derrière un champ silencieusement vide."],
  navDo: ["Keep primary navigation to a few clear destinations and design search for mobile.", "Limitez la navigation principale à quelques destinations claires et pensez la recherche pour le mobile."],
  navDont: ["Don’t overpopulate the header or let a sticky bar escape its container.", "Ne surchargez pas l’en-tête et ne laissez pas une barre fixe sortir de son conteneur."],
  localeDo: ["Reflect the current language, allow override, and leave room for longer French labels.", "Reflétez la langue actuelle, permettez le remplacement et prévoyez de la place pour les libellés français plus longs."],
  localeDont: ["Don’t rely on flags alone or truncate the language name.", "Ne vous fiez pas aux seuls drapeaux et ne tronquez pas le nom de la langue."],
  themeDo: ["Pair the theme icon with accessible text and persist the choice for the consumer.", "Associez l’icône de thème à un texte accessible et laissez le choix persister côté consommateur."],
  themeDont: ["Don’t add new themes here or signal the active theme with colour alone.", "N’ajoutez pas de nouveaux thèmes ici et ne signalez pas le thème actif par la seule couleur."],
  paginationDo: ["Mark the current page, disable the boundaries, and offer a compact mobile form.", "Marquez la page courante, désactivez les limites et offrez une forme mobile compacte."],
  paginationDont: ["Don’t leave previous/next active at the first/last page or omit accessible page labels.", "Ne laissez pas précédent/suivant actifs aux première/dernière pages et n’omettez pas les libellés de page accessibles."],
} as const

export type NavigationMessageKey = keyof typeof navigationMessages

export function useNavigationMessages() {
  const { locale } = usePreferences()
  const index = locale === "en" ? 0 : 1
  const tn = (key: NavigationMessageKey) => navigationMessages[key][index]
  return { tn }
}
