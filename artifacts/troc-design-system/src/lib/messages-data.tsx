/**
 * Centralized English / Canadian-French copy for the Chunk 7 data families
 * (data-controls, data-table, metric-stat, chart). Kept out of the shared
 * lib/messages catalog so the pilot copy stays untouched. Stories read locale
 * from usePreferences and resolve strings through useDataMessages; the reusable
 * components themselves take plain label props and never depend on this module.
 */
import { usePreferences } from "../hooks/use-preferences"

export const dataMessages = {
  // Shared
  eyebrow: ["Data & controls", "Données et contrôles"],
  demoOnly: ["Local demo only · sample values, not real business metrics.", "Démonstration locale · valeurs d’exemple, pas de vraies mesures d’affaires."],
  sampleLabel: ["Sample data", "Données d’exemple"],
  do: ["Do", "À faire"],
  dont: ["Don’t", "À éviter"],
  close: ["Close filters", "Fermer les filtres"],

  // Data controls
  controlsTitle: ["Filters & sort", "Filtres et tri"],
  controlsIntro: ["Filter and sort a local sample set. Inline on desktop, in a drawer on mobile, fully keyboard-operable.", "Filtrez et triez un jeu d’exemple local. En ligne sur ordinateur, dans un panneau sur mobile, entièrement au clavier."],
  filtersLabel: ["Filters", "Filtres"],
  filterGame: ["Game", "Jeu"],
  filterCondition: ["Condition", "État"],
  filterInStock: ["In stock only", "En stock seulement"],
  clearAll: ["Clear all", "Tout effacer"],
  activeFilters: ["active filters", "filtres actifs"],
  sortBy: ["Sort by", "Trier par"],
  sortRelevance: ["Relevance", "Pertinence"],
  sortPriceAsc: ["Price: low to high", "Prix : croissant"],
  sortPriceDesc: ["Price: high to low", "Prix : décroissant"],
  sortNameAsc: ["Name: A to Z", "Nom : A à Z"],
  openFilters: ["Filters", "Filtres"],
  applyFilters: ["Show results", "Voir les résultats"],
  resultsCount: ["results", "résultats"],
  noResults: ["No cards match these filters.", "Aucune carte ne correspond à ces filtres."],
  loadingLabel: ["Loading results", "Chargement des résultats"],
  toggleLoading: ["Simulate loading", "Simuler le chargement"],
  gamePokemon: ["Pokémon", "Pokémon"],
  gameMagic: ["Magic", "Magic"],
  gameOnePiece: ["One Piece", "One Piece"],
  condNM: ["Near Mint", "Quasi neuf"],
  condLP: ["Lightly Played", "Légèrement joué"],
  condMP: ["Moderately Played", "Modérément joué"],
  controlsDo: ["Reflect the active filter count and let people clear everything at once.", "Affichez le nombre de filtres actifs et permettez de tout effacer d’un coup."],
  controlsDont: ["Don’t apply filters silently without showing what changed in the results.", "N’appliquez pas de filtres en silence sans montrer ce qui a changé dans les résultats."],

  // Data table
  tableTitle: ["Data table", "Tableau de données"],
  tableIntro: ["A seller inventory table: sortable columns, row selection, order status, and empty/loading/error states.", "Un tableau d’inventaire vendeur : colonnes triables, sélection de lignes, statut de commande et états vide/chargement/erreur."],
  tableCaption: ["Seller inventory — sample data", "Inventaire du vendeur — données d’exemple"],
  scrollLabel: ["Seller inventory table, scroll horizontally", "Tableau d’inventaire, défiler horizontalement"],
  colCard: ["Card", "Carte"],
  colGame: ["Game", "Jeu"],
  colCondition: ["Condition", "État"],
  colStock: ["Stock", "Stock"],
  colPrice: ["Price", "Prix"],
  colStatus: ["Status", "Statut"],
  colActions: ["Actions", "Actions"],
  sortColumn: ["Sort by", "Trier par"],
  selectAll: ["Select all rows", "Sélectionner toutes les lignes"],
  selectRow: ["Select", "Sélectionner"],
  editRow: ["Edit", "Modifier"],
  edited: ["Edit action triggered (local demo).", "Action de modification déclenchée (démo locale)."],
  selectedCount: ["selected", "sélectionnées"],
  statusLive: ["Listed", "En vente"],
  statusPending: ["Pending", "En attente"],
  statusSold: ["Sold", "Vendu"],
  tableEmpty: ["No inventory to show for this filter.", "Aucun inventaire à afficher pour ce filtre."],
  tableError: ["Couldn’t load inventory. Try again.", "Impossible de charger l’inventaire. Réessayez."],
  tableRetry: ["Try again", "Réessayer"],
  showState: ["Table state", "État du tableau"],
  stateReady: ["Ready", "Prêt"],
  stateLoading: ["Loading", "Chargement"],
  stateEmpty: ["Empty", "Vide"],
  stateError: ["Error", "Erreur"],
  pageLabel: ["Inventory pages", "Pages d’inventaire"],
  prevPage: ["Previous page", "Page précédente"],
  nextPage: ["Next page", "Page suivante"],
  cardCharizard: ["Charizard ex", "Dracaufeu ex"],
  cardPikachu: ["Pikachu V", "Pikachu V"],
  cardLuffy: ["Monkey D. Luffy", "Monkey D. Luffy"],
  cardBolt: ["Lightning Bolt", "Éclair"],
  cardMeta: ["199/165", "199/165"],
  tableDo: ["Keep the table scrollable and mark the sorted, selected, and current states.", "Gardez le tableau défilable et indiquez les états de tri, de sélection et courant."],
  tableDont: ["Don’t hide the row action behind hover only — keep it keyboard reachable.", "Ne cachez pas l’action de ligne au survol seul — gardez-la accessible au clavier."],

  // Metric / KPI
  metricTitle: ["Metrics & KPIs", "Indicateurs et KPI"],
  metricIntro: ["Sample seller KPIs. Change direction is shown with an icon and text, never colour alone.", "KPI de vendeur d’exemple. Le sens du changement est indiqué par une icône et du texte, jamais par la couleur seule."],
  kpiTitle: ["KPI block", "Bloc de KPI"],
  compactTitle: ["Compact", "Compact"],
  denseTitle: ["Dense grid", "Grille dense"],
  loadingTitle: ["Loading", "Chargement"],
  metricSales: ["Sales (30d)", "Ventes (30 j)"],
  metricSalesValue: ["$4,820", "4 820 $"],
  metricSalesChange: ["+12% vs previous 30d", "+12 % vs 30 j préc."],
  metricViews: ["Listing views", "Vues des annonces"],
  metricViewsValue: ["18,240", "18 240"],
  metricViewsChange: ["+3% vs previous 30d", "+3 % vs 30 j préc."],
  metricOrders: ["Open orders", "Commandes ouvertes"],
  metricOrdersValue: ["7", "7"],
  metricOrdersChange: ["-2 vs last week", "-2 vs sem. dern."],
  metricRating: ["Avg. rating", "Note moyenne"],
  metricRatingValue: ["4.8", "4,8"],
  metricRatingChange: ["No change", "Aucun changement"],
  metricListed: ["Cards listed", "Cartes en vente"],
  metricListedValue: ["1,240", "1 240"],
  metricShipTime: ["Avg. ship time", "Délai d’expédition"],
  metricShipTimeValue: ["1.2 days", "1,2 jour"],
  metricMeta: ["Sample metric", "Indicateur d’exemple"],
  metricDo: ["Pair the change value with a direction icon and a plain comparison window.", "Associez la valeur de variation à une icône de sens et une période de comparaison claire."],
  metricDont: ["Don’t imply these sample numbers are real traction or account data.", "Ne laissez pas croire que ces chiffres d’exemple sont un achalandage ou des données de compte réels."],

  // Chart
  chartTitle: ["Chart treatment", "Traitement graphique"],
  chartIntro: ["Simple line and bar treatments in semantic tokens, with tooltip, legend, and an accessible data table.", "Traitements simples en courbes et barres avec jetons sémantiques, infobulle, légende et tableau de données accessible."],
  lineTitle: ["Sold price trend (line)", "Tendance des prix vendus (courbe)"],
  barTitle: ["Sales by game (bar)", "Ventes par jeu (barres)"],
  chartLineLabel: ["Sold price over the last 6 weeks, sample data", "Prix vendu sur 6 semaines, données d’exemple"],
  chartBarLabel: ["Sample sales by game", "Ventes d’exemple par jeu"],
  seriesLow: ["Lowest", "Le plus bas"],
  seriesAvg: ["Average", "Moyen"],
  seriesUnits: ["Units sold", "Unités vendues"],
  chartStateLabel: ["Chart state", "État du graphique"],
  chartLoading: ["Loading chart", "Chargement du graphique"],
  chartEmpty: ["No data for this range yet.", "Aucune donnée pour cette période."],
  chartError: ["Couldn’t load the chart.", "Impossible de charger le graphique."],
  dataAltCaption: ["Chart data (accessible table)", "Données du graphique (tableau accessible)"],
  colWeek: ["Week", "Semaine"],
  colGameName: ["Game", "Jeu"],
  chartDo: ["Give every series a symbol and dash style plus a labelled data table.", "Donnez à chaque série un symbole et un style de trait, avec un tableau de données étiqueté."],
  chartDont: ["Don’t distinguish series by colour alone or add decorative gradients.", "Ne distinguez pas les séries par la couleur seule et n’ajoutez pas de dégradés décoratifs."],
} as const

export type DataMessageKey = keyof typeof dataMessages

export function useDataMessages() {
  const { locale } = usePreferences()
  const index = locale === "en" ? 0 : 1
  const td = (key: DataMessageKey) => dataMessages[key][index]
  return { td }
}
