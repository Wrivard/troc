/**
 * Centralized English / Canadian-French copy for the Chunk 3 feedback-family
 * stories (toast, alert, skeleton, state-feedback). Kept out of the shared
 * lib/messages catalog so the pilot copy stays untouched. Stories read locale
 * from usePreferences and resolve strings through useFeedbackMessages; the
 * reusable components themselves take plain label props and never depend on
 * this module.
 */
import { usePreferences } from "../hooks/use-preferences"

export const feedbackMessages = {
  // Shared demo scaffolding
  eyebrow: ["Feedback", "Rétroaction"],
  states: ["States", "États"],
  variants: ["Variants", "Variantes"],
  demoOnly: ["Local demo only · no data is saved.", "Démonstration locale seulement · aucune donnée n’est enregistrée."],
  do: ["Do", "À faire"],
  dont: ["Don’t", "À éviter"],
  dismiss: ["Dismiss", "Fermer"],
  close: ["Close", "Fermer"],
  retry: ["Try again", "Réessayer"],
  reset: ["Reset demo", "Réinitialiser la démo"],
  undo: ["Undo", "Annuler"],

  // Toast
  toastTitle: ["Toasts", "Notifications temporaires"],
  toastIntro: ["Timed, dismissible notifications announced to assistive tech. Nothing shows until you trigger it.", "Notifications temporaires et fermables, annoncées aux technologies d’assistance. Rien n’apparaît avant un déclenchement."],
  toastTrigger: ["Show notifications", "Afficher les notifications"],
  triggersTitle: ["Trigger a toast", "Déclencher une notification"],
  showNeutral: ["Neutral", "Neutre"],
  showSuccess: ["Success", "Succès"],
  showWarning: ["Warning", "Avertissement"],
  showError: ["Error", "Erreur"],
  showAction: ["With action", "Avec action"],
  toastNeutralTitle: ["Watchlist updated", "Liste de suivi mise à jour"],
  toastNeutralBody: ["This card is on your watchlist for this demo.", "Cette carte est suivie pour cette démonstration."],
  toastSuccessTitle: ["Added to collection", "Ajouté à la collection"],
  toastSuccessBody: ["Charizard ex was added to your demo collection.", "Dracaufeu ex a été ajouté à votre collection de démonstration."],
  toastWarningTitle: ["Low stock", "Stock faible"],
  toastWarningBody: ["Only two copies remain from this seller.", "Il ne reste que deux exemplaires chez ce vendeur."],
  toastErrorTitle: ["Couldn’t save", "Échec de l’enregistrement"],
  toastErrorBody: ["This is a local demo — nothing was actually saved.", "Ceci est une démonstration locale — rien n’a réellement été enregistré."],
  toastActionTitle: ["Removed from cart", "Retiré du panier"],
  toastActionBody: ["The demo item was removed. You can undo this action.", "L’article de démonstration a été retiré. Vous pouvez annuler."],
  toastUndone: ["Action undone in this demo.", "Action annulée dans cette démonstration."],
  toastNote: ["Toasts auto-dismiss, can be swiped away, and pause on hover or focus.", "Les notifications se ferment seules, peuvent être balayées et se figent au survol ou au focus."],
  toastDo: ["Keep toasts short, and offer an undo for reversible actions.", "Gardez les notifications brèves et offrez une annulation pour les actions réversibles."],
  toastDont: ["Don’t use a toast for critical errors that need a decision — use an alert or dialog.", "N’utilisez pas de notification pour une erreur critique qui exige une décision — préférez une alerte ou un dialogue."],

  // Alert
  alertTitle: ["Alerts & banners", "Alertes et bannières"],
  alertIntro: ["Inline, persistent messages for context that should stay visible. Meaning comes from icon and text.", "Messages persistants en ligne pour un contexte qui doit rester visible. Le sens vient de l’icône et du texte."],
  alertNeutralTitle: ["Prices shown in CAD", "Prix affichés en CAD"],
  alertNeutralBody: ["All amounts in this demo are Canadian dollars, taxes excluded.", "Tous les montants de cette démonstration sont en dollars canadiens, taxes en sus."],
  alertSuccessTitle: ["Profile saved", "Profil enregistré"],
  alertSuccessBody: ["Your demo seller profile is up to date.", "Votre profil vendeur de démonstration est à jour."],
  alertWarningTitle: ["Verify your address", "Vérifiez votre adresse"],
  alertWarningBody: ["Add a shipping address to see delivered prices in this demo.", "Ajoutez une adresse de livraison pour voir les prix rendus dans cette démonstration."],
  alertErrorTitle: ["Couldn’t load offers", "Impossible de charger les offres"],
  alertErrorBody: ["The demo offer list failed to load. Try again to reload it.", "La liste d’offres de démonstration n’a pas pu se charger. Réessayez pour la recharger."],
  dismissibleTitle: ["Dismissible banner", "Bannière fermable"],
  bannerDismissed: ["Banner dismissed. Reset the demo to bring it back.", "Bannière fermée. Réinitialisez la démo pour la réafficher."],
  withActionTitle: ["With an action", "Avec une action"],
  alertDo: ["Keep an alert visible while its condition is true; pair colour with an icon.", "Gardez l’alerte visible tant que sa condition tient ; associez la couleur à une icône."],
  alertDont: ["Don’t stack many banners at once or use red for non-critical information.", "N’empilez pas plusieurs bannières et n’utilisez pas le rouge pour une information non critique."],

  // Skeleton
  skeletonTitle: ["Loading skeletons", "Squelettes de chargement"],
  skeletonIntro: ["Structural placeholders that match final content. The loading region is labelled for assistive tech.", "Des repères de structure qui reflètent le contenu final. La zone de chargement est annoncée aux technologies d’assistance."],
  shapesTitle: ["Shapes", "Formes"],
  shapeText: ["Text lines", "Lignes de texte"],
  shapeRow: ["Compact row", "Ligne compacte"],
  shapeCard: ["Product card", "Fiche de carte"],
  loadingLabel: ["Loading content", "Chargement du contenu"],
  toggleLoading: ["Toggle loading", "Basculer le chargement"],
  loadedTitle: ["Content loaded", "Contenu chargé"],
  loadedBody: ["The skeletons were replaced by demo content.", "Les squelettes ont été remplacés par du contenu de démonstration."],
  cardName: ["Charizard ex", "Dracaufeu ex"],
  cardMeta: ["Scarlet & Violet · 199/165 · Near Mint", "Écarlate et Violet · 199/165 · Quasi neuf"],
  cardSeller: ["Maple Card Co. · ships from Ontario", "Maple Card Co. · expédié de l’Ontario"],
  skeletonDo: ["Match skeleton shapes to the real layout so content doesn’t jump.", "Faites correspondre les squelettes à la vraie mise en page pour éviter les sauts."],
  skeletonDont: ["Don’t animate endlessly or ignore reduced-motion preferences.", "N’animez pas sans fin et respectez la préférence de mouvement réduit."],

  // State feedback
  stateTitle: ["Empty, error & success", "Vide, erreur et succès"],
  stateIntro: ["Whole-region states with a meaningful icon, useful copy, and real recovery actions.", "États pleine zone avec une icône claire, un texte utile et de vraies actions de récupération."],
  fullTitle: ["Full states", "États pleine zone"],
  compactTitle: ["Compact states", "États compacts"],
  emptyTitle: ["No cards yet", "Aucune carte pour l’instant"],
  emptyBody: ["Cards you add to this demo collection will show up here.", "Les cartes ajoutées à cette collection de démonstration apparaîtront ici."],
  emptyPrimary: ["Browse the demo", "Parcourir la démo"],
  emptySecondary: ["Import a list", "Importer une liste"],
  errorTitle: ["Something went wrong", "Une erreur est survenue"],
  errorBody: ["We couldn’t load this demo section. Check your connection and try again.", "Impossible de charger cette section de démonstration. Vérifiez votre connexion et réessayez."],
  successTitle: ["Listing published", "Annonce publiée"],
  successBody: ["Your demo listing is live for this preview. Nothing was actually published.", "Votre annonce de démonstration est active pour cet aperçu. Rien n’a réellement été publié."],
  successPrimary: ["View listing", "Voir l’annonce"],
  successSecondary: ["Create another", "En créer une autre"],
  emptyCompact: ["No results for this filter.", "Aucun résultat pour ce filtre."],
  errorCompact: ["Couldn’t load results.", "Impossible de charger les résultats."],
  successCompact: ["Filters applied.", "Filtres appliqués."],
  clearFilters: ["Clear filters", "Effacer les filtres"],
  stateDemoNeutral: ["Try the primary or secondary action above.", "Essayez l’action principale ou secondaire ci-dessus."],
  stateActioned: ["Action triggered in this demo.", "Action déclenchée dans cette démonstration."],
  stateRetried: ["Retry triggered — still a local demo.", "Réessai déclenché — toujours une démonstration locale."],
  stateDo: ["Give each state a meaningful icon plus a clear next action.", "Donnez à chaque état une icône claire et une action suivante évidente."],
  stateDont: ["Don’t rely on colour or an illustration alone to explain what happened.", "Ne comptez pas sur la couleur ou une illustration seule pour expliquer la situation."],
} as const

export type FeedbackMessageKey = keyof typeof feedbackMessages

export function useFeedbackMessages() {
  const { locale } = usePreferences()
  const index = locale === "en" ? 0 : 1
  const tf = (key: FeedbackMessageKey) => feedbackMessages[key][index]
  return { tf }
}
