/**
 * Centralized English / Canadian-French copy for the Chunk 3 overlay stories
 * (tooltip, popover, dropdown menu, dialog, drawer & sheet). Kept out of the
 * shared lib/messages catalog so the pilot copy stays untouched. Stories read
 * locale from usePreferences and resolve strings through useOverlaysMessages;
 * the reusable components themselves take plain label props and never depend
 * on this module. All demos are local-only — no data is saved and no real
 * transactions occur.
 */
import { usePreferences } from "../hooks/use-preferences"

export const overlaysMessages = {
  // Shared demo scaffolding
  overlaysEyebrow: ["Overlays & feedback", "Superpositions et rétroaction"],
  demoOnly: ["Local demo only · no data is saved.", "Démonstration locale seulement · aucune donnée n’est enregistrée."],
  open: ["Open", "Ouvrir"],
  close: ["Close", "Fermer"],
  cancel: ["Cancel", "Annuler"],
  do: ["Do", "À faire"],
  dont: ["Don’t", "À éviter"],

  // Tooltip
  tooltipTitle: ["Tooltip", "Infobulle"],
  tooltipIntro: ["A short hint on hover or keyboard focus. Never the only place required information appears.", "Un court indice au survol ou au focus clavier. Jamais le seul endroit où l’information requise apparaît."],
  tooltipPlacements: ["Placements", "Positions"],
  tooltipTop: ["Top", "Haut"],
  tooltipRight: ["Right", "Droite"],
  tooltipBottom: ["Bottom", "Bas"],
  tooltipLeft: ["Left", "Gauche"],
  tooltipKeyboard: ["Keyboard & delay", "Clavier et délai"],
  tooltipConditionTrigger: ["What is NM?", "Qu’est-ce que NM ?"],
  tooltipConditionBody: ["Near Mint: minimal handling wear, sharp corners, clean surface.", "Quasi neuf : usure minimale, coins nets, surface propre."],
  tooltipPlacementBody: ["Hint anchored to the {side} side.", "Indice ancré du côté {side}."],
  tooltipKeyboardHint: ["Tab to the button, then hold focus to reveal the hint. It also appears on hover after a short delay.", "Tabulez jusqu’au bouton, puis gardez le focus pour révéler l’indice. Il apparaît aussi au survol après un court délai."],

  // Popover
  popoverTitle: ["Popover", "Popover"],
  popoverIntro: ["A floating panel for secondary content and quick forms, with focus management and escape/outside dismissal.", "Un panneau flottant pour du contenu secondaire et de courts formulaires, avec gestion du focus et fermeture par Échap ou clic externe."],
  popoverBasic: ["Informational", "Informatif"],
  popoverForm: ["Quick form", "Formulaire rapide"],
  popoverTrigger: ["Shipping details", "Détails de livraison"],
  popoverHeading: ["Delivered to Canada", "Livré au Canada"],
  popoverBody: ["Most Canadian sellers ship within 2 business days. Combined shipping applies per seller.", "La plupart des vendeurs canadiens expédient en 2 jours ouvrables. L’expédition combinée s’applique par vendeur."],
  popoverFormTrigger: ["Set a price alert", "Créer une alerte de prix"],
  popoverFormHeading: ["Alert me under", "M’aviser sous"],
  popoverFormLabel: ["Target price (CAD)", "Prix cible (CAD)"],
  popoverFormHelper: ["We’ll notify you when an offer drops below this price.", "Nous vous aviserons quand une offre passe sous ce prix."],
  popoverFormSave: ["Save alert", "Enregistrer l’alerte"],
  popoverSaved: ["Alert set for offers under {value} CAD.", "Alerte réglée pour les offres sous {value} CAD."],

  // Dropdown menu
  dropdownTitle: ["Dropdown menu", "Menu déroulant"],
  dropdownIntro: ["An action menu with items, checkbox and radio options, submenus, disabled and destructive states, and full keyboard support.", "Un menu d’actions avec éléments, options à cocher et radio, sous-menus, états désactivés et destructifs, et prise en charge clavier complète."],
  dropdownActions: ["Actions & states", "Actions et états"],
  dropdownSelections: ["Selections & submenu", "Sélections et sous-menu"],
  dropdownTrigger: ["Listing actions", "Actions de l’annonce"],
  dropdownViewTrigger: ["View options", "Options d’affichage"],
  dropdownSection: ["Manage listing", "Gérer l’annonce"],
  dropdownView: ["View card", "Voir la carte"],
  dropdownEdit: ["Edit listing", "Modifier l’annonce"],
  dropdownShare: ["Copy link", "Copier le lien"],
  dropdownDuplicate: ["Duplicate", "Dupliquer"],
  dropdownReserved: ["Reserved (unavailable)", "Réservé (indisponible)"],
  dropdownRemove: ["Remove listing", "Retirer l’annonce"],
  dropdownDensity: ["Density", "Densité"],
  dropdownComfortable: ["Comfortable", "Confortable"],
  dropdownCompact: ["Compact", "Compact"],
  dropdownShowFoil: ["Show foils only", "Afficher les foils seulement"],
  dropdownShowGraded: ["Show graded only", "Afficher les gradées seulement"],
  dropdownSortBy: ["Sort by", "Trier par"],
  dropdownSortPrice: ["Delivered price", "Prix rendu"],
  dropdownSortCondition: ["Condition", "État"],
  dropdownSortSeller: ["Seller rating", "Cote du vendeur"],
  dropdownSelectedNote: ["Selected: {value}", "Sélectionné : {value}"],

  // Dialog
  dialogTitle: ["Dialog", "Boîte de dialogue"],
  dialogIntro: ["A modal surface with a scrim, focus trap and return, labelled title and description, and destructive-confirmation and loading compositions.", "Une surface modale avec voile, piège de focus et retour, titre et description libellés, ainsi que des compositions de confirmation destructive et de chargement."],
  dialogBasic: ["Form dialog", "Dialogue de formulaire"],
  dialogDestructive: ["Destructive confirmation", "Confirmation destructive"],
  dialogEditTrigger: ["Edit listing", "Modifier l’annonce"],
  dialogEditHeading: ["Edit listing", "Modifier l’annonce"],
  dialogEditDescription: ["Update the price and quantity for this local demo listing.", "Mettez à jour le prix et la quantité de cette annonce de démonstration."],
  dialogPriceLabel: ["Asking price (CAD)", "Prix demandé (CAD)"],
  dialogPriceError: ["Enter a price greater than 0.", "Entrez un prix supérieur à 0."],
  dialogSave: ["Save changes", "Enregistrer"],
  dialogSaving: ["Saving…", "Enregistrement…"],
  dialogSaved: ["Listing updated in this demo.", "Annonce mise à jour dans cette démo."],
  dialogDeleteTrigger: ["Remove listing", "Retirer l’annonce"],
  dialogDeleteHeading: ["Remove this listing?", "Retirer cette annonce ?"],
  dialogDeleteDescription: ["This local demo listing will be removed from the sample list. This cannot be undone here.", "Cette annonce de démonstration sera retirée de la liste. Action irréversible ici."],
  dialogConfirmRemove: ["Remove listing", "Retirer l’annonce"],
  dialogRemoved: ["Listing removed in this demo.", "Annonce retirée dans cette démo."],

  // Drawer & sheet
  drawerTitle: ["Drawer & sheet", "Tiroir et panneau"],
  drawerIntro: ["An accessible sheet that slides from the bottom or a side, with a drag handle where supported, focus management, and mobile-safe height.", "Un panneau accessible glissant du bas ou d’un côté, avec poignée de glissement lorsque possible, gestion du focus et hauteur adaptée au mobile."],
  drawerBottom: ["Bottom sheet", "Panneau du bas"],
  drawerSide: ["Side sheet", "Panneau latéral"],
  drawerFiltersTrigger: ["Filters", "Filtres"],
  drawerFiltersHeading: ["Refine results", "Affiner les résultats"],
  drawerFiltersDescription: ["Adjust game, condition, and foil filters. Changes apply to this local demo only.", "Ajustez les filtres de jeu, d’état et de foil. Les changements s’appliquent à cette démo seulement."],
  drawerCartTrigger: ["Open cart", "Ouvrir le panier"],
  drawerCartHeading: ["Your cart", "Votre panier"],
  drawerCartDescription: ["A sample of cards grouped for this local demo. No checkout occurs.", "Un échantillon de cartes regroupées pour cette démo. Aucun paiement n’a lieu."],
  drawerApply: ["Apply filters", "Appliquer les filtres"],
  drawerCheckout: ["Continue (demo)", "Continuer (démo)"],
  drawerGame: ["Game", "Jeu"],
  drawerCondition: ["Condition", "État"],
  drawerFoilOnly: ["Foils only", "Foils seulement"],

  // Guidelines
  tooltipDo: ["Reserve tooltips for supplementary hints and keep them reachable by keyboard.", "Réservez les infobulles aux indices complémentaires et rendez-les accessibles au clavier."],
  tooltipDont: ["Don’t hide labels, prices, or required actions behind a tooltip.", "Ne cachez pas de libellés, de prix ou d’actions requises derrière une infobulle."],
  popoverDo: ["Use a popover for a focused task and return focus to the trigger on close.", "Utilisez un popover pour une tâche ciblée et redonnez le focus au déclencheur à la fermeture."],
  popoverDont: ["Don’t stack multiple popovers or place long scrolling content inside one.", "N’empilez pas plusieurs popovers et n’y placez pas de long contenu défilant."],
  dropdownDo: ["Group related actions, mark destructive ones, and pair selection state with an indicator.", "Regroupez les actions liées, marquez les destructives et associez l’état de sélection à un indicateur."],
  dropdownDont: ["Don’t bury primary page actions that belong on the surface inside a menu.", "N’enterrez pas les actions principales de la page dans un menu."],
  dialogDo: ["Give every dialog a title and description, and confirm destructive actions explicitly.", "Donnez à chaque dialogue un titre et une description, et confirmez explicitement les actions destructives."],
  dialogDont: ["Don’t use dialogs for non-blocking messages or let content overflow the viewport.", "N’utilisez pas de dialogues pour des messages non bloquants et ne laissez pas le contenu déborder."],
  drawerDo: ["Use a bottom sheet on mobile and a side sheet for filters or a cart, keeping height mobile-safe.", "Utilisez un panneau du bas sur mobile et un panneau latéral pour les filtres ou le panier, en gardant une hauteur adaptée."],
  drawerDont: ["Don’t place critical confirmations only in a draggable sheet or block the close control.", "Ne placez pas de confirmations critiques uniquement dans un panneau glissant et ne bloquez pas la fermeture."],
} as const

export type OverlaysMessageKey = keyof typeof overlaysMessages

export function useOverlaysMessages() {
  const { locale } = usePreferences()
  const index = locale === "en" ? 0 : 1
  const to = (key: OverlaysMessageKey, vars?: Record<string, string>) => {
    const raw = overlaysMessages[key][index]
    if (!vars) return raw
    return raw.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? `{${name}}`)
  }
  return { to }
}
