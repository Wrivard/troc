/**
 * Centralized English / Canadian-French demo copy for the Chunk 5 market
 * economics families: price, marketplace-badges, seller-badges, promotion, and
 * marketplace-progress. Kept out of the shared lib/messages catalog so the
 * pilot copy stays untouched.
 *
 * Stories read locale from usePreferences and resolve strings through
 * useMarketEconomicsMessages; the reusable components themselves take plain
 * label props and never depend on this module. Prices below use CAD sample
 * values only and never imply real business traction.
 */
import { usePreferences } from "../hooks/use-preferences"

export const marketEconomicsMessages = {
  // Shared demo scaffolding
  eyebrow: ["Cards & marketplace", "Cartes et marché"],
  states: ["States", "États"],
  variants: ["Variants", "Variantes"],
  sizes: ["Sizes", "Tailles"],
  compact: ["Compact", "Compact"],
  standard: ["Default", "Normal"],
  demoOnly: ["Sample CAD values only · no live catalog, prices, or traction are real.", "Valeurs CAD à titre indicatif seulement · aucun catalogue, prix ou achalandage réel."],
  do: ["Do", "À faire"],
  dont: ["Don’t", "À éviter"],

  // ---------------------------------------------------------------- Price
  priceTitle: ["Marketplace prices", "Prix du marché"],
  priceIntro: ["Tabular CAD price typography for tiles, rows, and detail views. Amounts and labels are formatted with Intl and supplied per locale.", "Typographie de prix CAD tabulaire pour les fiches, lignes et vues détaillées. Les montants et libellés sont formatés avec Intl selon la langue."],
  priceLargeTitle: ["Large & small", "Grand et petit"],
  priceLarge: ["Large (detail view)", "Grand (vue détaillée)"],
  priceDefault: ["Default", "Normal"],
  priceSmall: ["Small (row)", "Petit (ligne)"],
  referenceTitle: ["Reference & lowest available", "Prix de référence et plus bas disponible"],
  referenceLabel: ["Reference price", "Prix de référence"],
  lowestLabel: ["Lowest available", "Plus bas disponible"],
  saleTitle: ["Sale price treatment", "Traitement du prix en solde"],
  saleLabel: ["Sale price", "Prix en solde"],
  saleWas: ["Was", "Avant"],
  saleSave: ["Save", "Économisez"],
  subDollarTitle: ["Sub-dollar cards", "Cartes sous 1 $"],
  subDollarNote: ["Cards priced below $1 are a core TROC principle, not an edge case.", "Les cartes sous 1 $ sont un principe fondamental de TROC, pas un cas limite."],
  unavailableTitle: ["Unavailable", "Non disponible"],
  unavailableLabel: ["Price unavailable", "Prix non disponible"],
  denseRowTitle: ["Dense row", "Ligne dense"],
  denseCard: ["Charizard · Base Set", "Dracaufeu · Set de base"],
  denseMeta: ["NM · English · #4/102", "NM · Anglais · #4/102"],
  priceDo: ["Keep prices tabular and right-aligned so buyers can scan and compare quickly.", "Gardez les prix tabulaires et alignés à droite pour comparer rapidement."],
  priceDont: ["Don’t hide sub-dollar prices or drop the CAD currency from the format.", "N’escamotez pas les prix sous 1 $ et n’enlevez pas la devise CAD du format."],

  // -------------------------------------------------- Marketplace badges
  cardBadgeTitle: ["Card badges", "Badges de carte"],
  cardBadgeIntro: ["Condition, language, game, set, and variant badges. Meaning is carried by text and shape, never colour alone, and each works as a filter chip.", "Badges d’état, de langue, de jeu, de set et de variante. Le sens vient du texte et de la forme, jamais de la couleur seule, et chacun fonctionne comme filtre."],
  conditionTitle: ["Condition", "État"],
  condNm: ["Near Mint (NM)", "Quasi neuf (NM)"],
  condLp: ["Lightly Played (LP)", "Peu joué (LP)"],
  condMp: ["Moderately Played (MP)", "Moyennement joué (MP)"],
  condHp: ["Heavily Played (HP)", "Très joué (HP)"],
  condDmg: ["Damaged (DMG)", "Endommagé (DMG)"],
  conditionSelectedTitle: ["Selected / filter", "Sélectionné / filtre"],
  languageTitle: ["Language", "Langue"],
  langEnglish: ["English", "Anglais"],
  langFrench: ["French", "Français"],
  langJapanese: ["Japanese", "Japonais"],
  gameTitle: ["Game", "Jeu"],
  setTitle: ["Set & variant", "Set et variante"],
  setValue: ["Base Set", "Set de base"],
  variantHolo: ["Holo", "Holo"],
  variantReverse: ["Reverse Holo", "Reverse Holo"],
  variantFirstEd: ["1st Edition", "1re édition"],
  cardBadgeDo: ["Spell out the condition abbreviation the first time and keep badges compact in dense rows.", "Explicitez l’abréviation d’état la première fois et gardez les badges compacts dans les lignes denses."],
  cardBadgeDont: ["Don’t rely on colour to tell conditions apart or invent new accent colours per game.", "Ne comptez pas sur la couleur pour distinguer les états ni n’inventez de couleurs par jeu."],

  // ------------------------------------------------------ Seller badges
  sellerBadgeTitle: ["Seller badges", "Badges des vendeurs"],
  sellerBadgeIntro: ["Five seller trust signals with icon and text. Verification is neutral and factual; only Sponsored is visually set apart, and nothing implies real accounts.", "Cinq signaux de confiance vendeur avec icône et texte. La vérification est neutre et factuelle ; seul « Commandité » se distingue, et rien n’implique de comptes réels."],
  sbVerifiedSeller: ["Verified Seller", "Vendeur vérifié"],
  sbVerifiedHobby: ["Verified Hobby Shop", "Boutique spécialisée vérifiée"],
  sbTopSeller: ["Top Seller", "Vendeur vedette"],
  sbFounding: ["Founding Seller", "Vendeur fondateur"],
  sbSponsored: ["Sponsored", "Commandité"],
  sbMeaningTitle: ["What each badge means", "Signification de chaque badge"],
  sbVerifiedSellerMeaning: ["Identity confirmed by TROC.", "Identité confirmée par TROC."],
  sbVerifiedHobbyMeaning: ["A verified bricks-and-mortar hobby shop.", "Une boutique spécialisée physique vérifiée."],
  sbTopSellerMeaning: ["Consistently high ratings and fast shipping.", "Notes élevées et expédition rapide de façon constante."],
  sbFoundingMeaning: ["Joined TROC in its first season.", "A rejoint TROC dès sa première saison."],
  sbSponsoredMeaning: ["A paid placement, clearly marked.", "Un placement payé, clairement indiqué."],
  sellerBadgeDo: ["Pair the icon with the full label so the meaning survives translation.", "Associez l’icône au libellé complet pour que le sens survive à la traduction."],
  sellerBadgeDont: ["Don’t colour verification like a sale or blur the line with Sponsored placements.", "Ne colorez pas la vérification comme un solde et ne confondez pas avec les placements commandités."],

  // --------------------------------------------------------- Promotion
  promotionTitle: ["Promotions", "Promotions"],
  promotionIntro: ["Promotion badges and a seller promotion card with active, eligible, locked, and expired states. Terms are concise and the optional action is a real Button.", "Badges de promotion et carte de promotion vendeur avec états actif, admissible, verrouillé et expiré. Les conditions sont concises et l’action optionnelle est un vrai bouton."],
  promoBadgeTitle: ["Promotion badge", "Badge de promotion"],
  promoActive: ["Active", "Active"],
  promoEligible: ["Eligible", "Admissible"],
  promoLocked: ["Locked", "Verrouillée"],
  promoExpired: ["Expired", "Expirée"],
  promoBadgeActive: ["10% off", "10 % de rabais"],
  promoBadgeEligible: ["Bundle deal", "Offre groupée"],
  promoBadgeLocked: ["Unlock at 5 cards", "Débloqué à 5 cartes"],
  promoBadgeExpired: ["Ended Sep 21", "Terminée le 21 sept."],
  promoCardTitle: ["Promotion card", "Carte de promotion"],
  promoCardHeading: ["10% off 5+ cards", "10 % sur 5 cartes et plus"],
  promoCardTerms: ["Buy any 5 cards from this seller and save 10% at checkout. Single order, English or French cards.", "Achetez 5 cartes de ce vendeur et économisez 10 % au paiement. Une seule commande, cartes en anglais ou en français."],
  promoCardActive: ["Applied to your cart", "Appliquée à votre panier"],
  promoCardEligible: ["Add to cart to qualify", "Ajoutez au panier pour être admissible"],
  promoCardLocked: ["Add 3 more cards to unlock 10% off", "Ajoutez 3 cartes pour obtenir 10 % de rabais"],
  promoCardExpired: ["This promotion has ended", "Cette promotion est terminée"],
  promoAction: ["View cards", "Voir les cartes"],
  promoActionApplied: ["View cart", "Voir le panier"],
  promotionDo: ["State the promotion terms plainly and mark expired offers instead of hiding them.", "Énoncez clairement les conditions et marquez les offres expirées au lieu de les cacher."],
  promotionDont: ["Don’t over-decorate promotions or use accent colours beyond the intentional red.", "Ne surchargez pas les promotions et n’utilisez pas de couleurs au-delà du rouge intentionnel."],

  // ----------------------------------------------- Marketplace progress
  marketProgressTitle: ["Seller & shipping progress", "Progression vendeur et livraison"],
  marketProgressIntro: ["Seller minimum, free-shipping, and promotion progress built on the shared Progress bar. Every bar carries a plain-language value and a remaining-amount helper.", "Progression du minimum vendeur, de la livraison gratuite et des promotions, sur la barre Progress partagée. Chaque barre porte une valeur claire et un texte du restant."],
  addExampleTitle: ["Add-example controls", "Contrôles d’exemple d’ajout"],
  addExampleHelp: ["Adjust the sample cart to see zero, in-progress, and complete states.", "Ajustez le panier d’exemple pour voir les états vide, en cours et terminé."],
  addExampleAdd: ["Add a $1.19 card", "Ajouter une carte à 1,19 $"],
  addExampleRemove: ["Remove a card", "Retirer une carte"],
  addExampleReset: ["Reset example", "Réinitialiser l’exemple"],
  cartSubtotal: ["Sample subtotal", "Sous-total d’exemple"],
  cardsInCart: ["Cards in sample cart", "Cartes dans le panier d’exemple"],

  sellerMinTitle: ["Seller minimum order", "Commande minimum du vendeur"],
  sellerMinLabel: ["Seller minimum", "Minimum du vendeur"],
  sellerMinZero: ["Empty cart", "Panier vide"],
  sellerMinProgress: ["In progress", "En cours"],
  sellerMinComplete: ["Minimum reached", "Minimum atteint"],
  sellerMinReachedHelp: ["Seller minimum reached.", "Minimum du vendeur atteint."],
  sellerMinRefValue: ["$1.42 / $5 minimum", "1,42 $ / 5 $ minimum"],
  sellerMinRefRemaining: ["Add $3.58 more from this seller", "Ajoutez 3,58 $ de plus chez ce vendeur"],

  freeShipTitle: ["Free-shipping progress", "Progression de la livraison gratuite"],
  freeShipLabel: ["Free shipping", "Livraison gratuite"],
  freeShipReachedHelp: ["You’ve unlocked free shipping.", "Vous avez débloqué la livraison gratuite."],

  promoProgressTitle: ["Promotion progress", "Progression de la promotion"],
  promoProgressLabel: ["Promotion progress", "Progression de la promotion"],
  promoProgressReachedHelp: ["Promotion unlocked — 10% off applied.", "Promotion débloquée — 10 % de rabais appliqué."],

  unavailableProgressTitle: ["Unavailable", "Non disponible"],
  unavailableProgressLabel: ["Free shipping", "Livraison gratuite"],
  unavailableProgressValue: ["Not offered by this seller", "Non offert par ce vendeur"],

  marketProgressDo: ["Show the remaining amount or count so the buyer knows exactly what to add.", "Affichez le montant ou le nombre restant pour indiquer exactement quoi ajouter."],
  marketProgressDont: ["Don’t announce a threshold without saying how far there is left to go.", "N’annoncez pas un seuil sans indiquer ce qu’il reste à faire."],
} as const

export type MarketEconomicsMessageKey = keyof typeof marketEconomicsMessages

export function useMarketEconomicsMessages() {
  const { locale } = usePreferences()
  const index = locale === "en" ? 0 : 1
  const tm = (key: MarketEconomicsMessageKey) => marketEconomicsMessages[key][index]
  return { tm }
}
