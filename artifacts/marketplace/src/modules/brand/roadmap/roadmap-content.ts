type Pair = readonly [string, string];
export interface RoadmapPhase {
  title: Pair;
  status: "local" | "current" | "planned";
  description: Pair;
  milestones: string;
  items: { label: Pair; local: boolean }[];
}
/** Public editorial grouping of existing milestones, not new product milestones. See the mapping handoff. */
export const roadmapPhases: readonly RoadmapPhase[] = [
  {
    title: ["The foundations", "Les fondations"],
    status: "local",
    description: [
      "The visual system and catalog foundations are implemented locally.",
      "Le système visuel et les bases du catalogue sont réalisés localement.",
    ],
    milestones: "0–2.5",
    items: [
      {
        label: ["Approved design system", "Système visuel approuvé"],
        local: true,
      },
      {
        label: ["Canonical catalog IDs", "Identifiants du catalogue"],
        local: true,
      },
      { label: ["English and French", "Français et anglais"], local: true },
      { label: ["Bounded demo catalog", "Catalogue démo limité"], local: true },
    ],
  },
  {
    title: ["Cards into orders", "Des cartes aux commandes"],
    status: "local",
    description: [
      "Local commerce and inventory tools. Hosted activation is still pending.",
      "Commerce et inventaire locaux. L’activation hébergée reste à valider.",
    ],
    milestones: "3–3.5",
    items: [
      { label: ["Multi-seller cart", "Panier multivendeur"], local: true },
      {
        label: ["Delivered-cost comparison", "Comparaison avec livraison"],
        local: true,
      },
      { label: ["Simulated checkout", "Paiement simulé"], local: true },
      { label: ["CSV inventory tools", "Inventaire par CSV"], local: true },
    ],
  },
  {
    title: ["Prepare for launch", "Préparer le lancement"],
    status: "current",
    description: [
      "Seller tools and early-access work are underway. Release checks remain open.",
      "Outils vendeur et accès anticipé en cours. Les validations restent ouvertes.",
    ],
    milestones: "4 · 6 · 6.5",
    items: [
      { label: ["Seller workspace", "Espace vendeur"], local: false },
      {
        label: ["Early-access journeys", "Parcours d’accès anticipé"],
        local: false,
      },
      {
        label: ["Hosted authentication", "Authentification hébergée"],
        local: false,
      },
      {
        label: ["Readiness verification", "Validation avant lancement"],
        local: false,
      },
    ],
  },
  {
    title: ["Connect sellers", "Connecter les vendeurs"],
    status: "planned",
    description: [
      "Connected inventory and qualified seller programs, with configurable terms.",
      "Inventaire connecté et programmes vendeur qualifiés, aux modalités configurables.",
    ],
    milestones: "4.5 · 5.5",
    items: [
      {
        label: ["Seller API and sync", "API vendeur et synchro"],
        local: false,
      },
      { label: ["Reliable webhooks", "Webhooks fiables"], local: false },
      {
        label: ["Founding qualification", "Qualification des fondateurs"],
        local: false,
      },
      {
        label: ["Qualified referrals", "Recommandations qualifiées"],
        local: false,
      },
    ],
  },
  {
    title: ["Collect with intent", "Collectionner avec intention"],
    status: "planned",
    description: [
      "Connect collection goals and demand to future buying tools.",
      "Relier objectifs de collection et demande aux futurs outils d’achat.",
    ],
    milestones: "5 · 7.5 · 8.5",
    items: [
      {
        label: ["Collections and trust", "Collections et confiance"],
        local: false,
      },
      { label: ["Wishlists and demand", "Souhaits et demande"], local: false },
      { label: ["Eligible alerts", "Alertes admissibles"], local: false },
      {
        label: ["Smart Cart expansion", "Évolution de Smart Cart"],
        local: false,
      },
    ],
  },
  {
    title: ["Learn and grow", "Apprendre et grandir"],
    status: "planned",
    description: [
      "Market insight grounded in eligible transactions and real collection activity.",
      "Des données fondées sur des transactions admissibles et l’activité réelle.",
    ],
    milestones: "9.5 · 10.5",
    items: [
      {
        label: ["Canadian market data", "Données du marché canadien"],
        local: false,
      },
      {
        label: ["Transparent methodology", "Méthodologie transparente"],
        local: false,
      },
      {
        label: ["Collection-to-listing flow", "De la collection à la vente"],
        local: false,
      },
      {
        label: ["Collection gap matching", "Recherche des cartes manquantes"],
        local: false,
      },
    ],
  },
];
