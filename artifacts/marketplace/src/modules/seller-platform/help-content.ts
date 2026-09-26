export type HelpArticle = {
  id: string;
  category: string;
  title: [string, string];
  summary: [string, string];
  steps: [string, string][];
  link?: string;
  linkLabel?: [string, string];
};
export const helpCategories = [
  [
    "start",
    "Getting started",
    "Premiers pas",
    "Set up your store",
    "Préparez votre boutique",
  ],
  [
    "listings",
    "Listings",
    "Annonces",
    "Cards, stock and imports",
    "Cartes, stock et importations",
  ],
  [
    "orders",
    "Orders",
    "Commandes",
    "Prepare, ship and follow up",
    "Préparer, expédier et suivre",
  ],
  [
    "payouts",
    "Payouts",
    "Versements",
    "Balances and transfers",
    "Soldes et virements",
  ],
  [
    "fees",
    "Fees & pricing",
    "Frais et prix",
    "Understand the numbers",
    "Comprendre les montants",
  ],
  [
    "policies",
    "Policies",
    "Politiques",
    "Selling clearly and fairly",
    "Vendre avec transparence",
  ],
  [
    "account",
    "Account & settings",
    "Compte et paramètres",
    "Your profile and team",
    "Votre profil et votre équipe",
  ],
  [
    "trouble",
    "Troubleshooting",
    "Dépannage",
    "Get back on track",
    "Résoudre un problème",
  ],
] as const;
export const helpArticles: HelpArticle[] = [
  {
    id: "sale-price", category: "fees",
    title: ["Set or remove a sale price", "Ajouter ou retirer un prix soldé"],
    summary: ["Keep the regular price and understand the price paid at checkout.", "Conservez le prix régulier et comprenez le prix payé au panier."],
    steps: [
      ["In Inventory, edit a listing and enter its optional sale price in CAD. It must be positive and no higher than the regular price. Leave it blank to remove the sale, then save.", "Dans Inventaire, modifiez une annonce et saisissez son prix soldé facultatif en CAD. Il doit être positif et ne pas dépasser le prix régulier. Laissez le champ vide pour retirer le rabais, puis enregistrez."],
      ["The catalogue and cart use the sale price while it is set. Basket discounts do not stack on a sale item. The inventory export keeps the regular price and includes a separate sale-price column.", "Le catalogue et le panier utilisent le prix soldé tant qu’il est défini. Les remises panier ne se cumulent pas sur un article soldé. L’export d’inventaire conserve le prix régulier et inclut une colonne de prix soldé distincte."],
      ["If stock is reserved or another edit changed the listing, the save can be refused. Check the latest listing before retrying. A price edit does not change stock or rewrite an existing order. Transactions remain simulated in this preview.", "Si le stock est réservé ou si une autre modification a changé l’annonce, l’enregistrement peut être refusé. Vérifiez l’annonce actuelle avant de réessayer. Une modification de prix ne change pas le stock et ne réécrit pas une commande existante. Les transactions restent simulées dans cet aperçu."],
    ],
    link: "/seller/inventory", linkLabel: ["Open inventory", "Ouvrir l’inventaire"],
  },

  {
    id: "checkout-recovery",
    category: "trouble",
    title: [
      "Continue after a checkout error",
      "Reprendre après une erreur de paiement",
    ],
    summary: [
      "Keep your address, check the latest estimate and retry safely in this preview.",
      "Conservez votre adresse, vérifiez le calcul actualisé et réessayez dans cet aperçu.",
    ],
    steps: [
      [
        "If checkout reports a temporary error, keep the page open. Your entered address stays in the form and your cart is preserved. Use the same order button to retry; do not treat an error as an order confirmation. Reloading the page can clear the address fields.",
        "Si le paiement indique une erreur temporaire, gardez la page ouverte. L’adresse saisie reste dans le formulaire et le panier est conservé. Réessayez avec le même bouton de commande; une erreur ne confirme pas une commande. Recharger la page peut effacer les champs d’adresse.",
      ],
      [
        "If the estimate is out of date, select Retry estimate and review the updated amounts before continuing. Changing quantities, a coupon or your province requires a new estimate. Retrying an estimate does not submit an order.",
        "Si le calcul est périmé, sélectionnez Réessayer le devis et vérifiez les montants actualisés avant de continuer. Modifier les quantités, un code promotionnel ou la province exige un nouveau calcul. Relancer ce calcul ne soumet pas de commande.",
      ],
      [
        "Enter a Canadian address and postal code, such as K1A 0B1. Format validation does not verify residence or delivery eligibility. If asked to sign in from checkout, the sign-in link brings you back afterward. This preview uses simulated checkout: no real payment is charged.",
        "Indiquez une adresse canadienne et un code postal, par exemple K1A 0B1. La validation du format ne confirme ni la résidence ni l’admissibilité à la livraison. Si une connexion est requise, le lien du paiement vous ramène ensuite à cette étape. Le paiement de cet aperçu est simulé : aucun montant réel n’est prélevé.",
      ],
    ],
    link: "/cart",
    linkLabel: ["Review my cart", "Vérifier mon panier"],
  },
  {
    id: "inventory-integrations",
    category: "listings",
    title: [
      "Inventory tools and live synchronization",
      "Outils d’inventaire et synchronisation",
    ],
    summary: [
      "CSV import, catalog matching and live connections are different things.",
      "Import CSV, correspondance catalogue et connexions en direct sont distincts.",
    ],
    steps: [
      [
        "A CSV export from an inventory tool can be mapped and reviewed through TROC’s import flow. Check the file format and each matching result; an exported name alone does not establish the exact card printing.",
        "Un export CSV d’un outil d’inventaire peut être associé et vérifié dans TROC. Contrôlez le format et chaque correspondance; un nom exporté ne suffit pas à identifier l’édition exacte.",
      ],
      [
        "Choosing a source label records provenance. CardUploader, SortSwift and other tools mentioned in launch questions are not connected simply by choosing that label. No credentials, one-click upload or automatic stock sync are activated by this action.",
        "Choisir une étiquette de source indique la provenance. CardUploader, SortSwift et les autres outils cités dans les questions de lancement ne sont pas connectés par ce choix. Celui-ci n’active ni identifiants de connexion, ni import en un clic, ni synchronisation automatique du stock.",
      ],
      [
        "Use the reviewed import and inventory tools available now. Live connectors need separate provider access and verification; never assume a sale elsewhere has updated your TROC stock automatically.",
        "Utilisez les outils actuels d’import avec vérification et de gestion d’inventaire. Les connecteurs nécessitent accès fournisseur et validation distincts; ne supposez jamais qu’une vente ailleurs a automatiquement mis à jour le stock TROC.",
      ],
    ],
    link: "/developers",
    linkLabel: ["Integration overview", "Vue d’ensemble des intégrations"],
  },
  {
    id: "packing-cards",
    category: "orders",
    title: [
      "Prepare cards for shipping",
      "Préparer les cartes pour l’expédition",
    ],
    summary: [
      "Protect the cards and verify the parcel before marking it shipped.",
      "Protégez les cartes et vérifiez l’envoi avant de le marquer expédié.",
    ],
    steps: [
      [
        "Match every card to the order: printing, language, finish, condition and quantity. Use the confirmed delivery address and keep different orders separate while packing.",
        "Vérifiez chaque carte selon la commande : édition, langue, finition, état et quantité. Utilisez l’adresse de livraison confirmée et séparez les commandes pendant l’emballage.",
      ],
      [
        "Use sleeves and suitable rigid protection, prevent movement and protect against moisture. Keep adhesive away from card surfaces. These are practical suggestions, not a guarantee against damage.",
        "Utilisez des pochettes et une protection rigide adaptée, limitez les mouvements et protégez de l’humidité. Évitez tout adhésif sur les cartes. Ces conseils pratiques ne constituent pas une garantie contre les dommages.",
      ],
      [
        "Measure the final packaged weight and thickness against your chosen carrier service. The preview estimates packaging; it does not buy postage or certify carrier eligibility. Record tracking when applicable and mark shipped only after handing over the parcel.",
        "Mesurez le poids et l’épaisseur de l’envoi emballé selon le service du transporteur choisi. L’aperçu estime l’emballage; il n’achète pas l’affranchissement et ne certifie pas l’admissibilité au transport. Enregistrez le suivi si applicable et marquez expédié seulement après la remise de l’envoi.",
      ],
    ],
    link: "/seller/orders",
    linkLabel: ["Review seller orders", "Vérifier les commandes vendeur"],
  },
  {
    id: "buyer-shipping",
    category: "orders",
    title: [
      "Understand shipping before ordering",
      "Comprendre la livraison avant de commander",
    ],
    summary: [
      "Compare each seller’s shipping with the full cart total.",
      "Comparez la livraison de chaque vendeur et le total du panier.",
    ],
    steps: [
      [
        "Cards from one seller share a shipping calculation. Different sellers prepare separate shipments, so a cheaper card does not necessarily mean a cheaper delivered order.",
        "Les cartes d’un vendeur partagent un calcul de livraison. Les vendeurs préparent des envois distincts; une carte moins chère ne garantit donc pas une commande livrée moins chère.",
      ],
      [
        "The preview selects an eligible service using quantity, weight and thickness. Tracking is required for graded or sealed products and when the configured value threshold is reached. Handling days describe preparation, not a guaranteed arrival date.",
        "L’aperçu choisit un service admissible selon quantité, poids et épaisseur. Le suivi est requis pour les produits gradés ou scellés et lorsque le seuil de valeur configuré est atteint. Les jours de préparation ne garantissent pas une date d’arrivée.",
      ],
      [
        "A seller minimum uses the merchandise subtotal before promotions. Free-shipping progress uses the subtotal after seller discounts and only appears for eligible sellers. Check the current cart quote after changing quantities. Shipping and payment remain simulated in this preview.",
        "Le minimum vendeur utilise le sous-total des articles avant promotions. La progression vers la livraison gratuite utilise le sous-total après remises vendeur, uniquement pour les vendeurs admissibles. Vérifiez le calcul actualisé après modification des quantités. Livraison et paiement restent simulés dans cet aperçu.",
      ],
    ],
    link: "/cart",
    linkLabel: ["Review my cart", "Vérifier mon panier"],
  },
  {
    id: "delivery-question",
    category: "orders",
    title: [
      "A delivery is late or a card arrived damaged",
      "Livraison en retard ou carte endommagée",
    ],
    summary: [
      "Collect the relevant details and contact the seller from the order.",
      "Rassemblez les détails utiles et contactez le vendeur depuis la commande.",
    ],
    steps: [
      [
        "Check which seller shipment is affected and whether tracking was recorded. Untracked mail has no parcel-tracking history; an order status alone does not prove delivery.",
        "Vérifiez quel envoi vendeur est concerné et si un suivi a été enregistré. Un courrier sans suivi ne dispose pas d’historique de colis; le statut de commande ne prouve pas à lui seul la livraison.",
      ],
      [
        "Use the conversation associated with that order. Explain the issue and keep the packaging and clear photos of any damage. Do not publish your address, passwords or payment details in public messages.",
        "Utilisez la conversation liée à cette commande. Décrivez le problème et conservez l’emballage ainsi que des photos nettes des dommages. Ne publiez pas votre adresse, vos mots de passe ou vos données de paiement.",
      ],
      [
        "Refund eligibility, deadlines and lost-mail responsibility still require finalized marketplace policies. This preview does not promise compensation or process real carrier claims. Do not return an item without agreed instructions.",
        "L’admissibilité au remboursement, les délais et la responsabilité du courrier perdu nécessitent encore des politiques finalisées. Cet aperçu ne promet aucune indemnisation et ne traite aucune réclamation réelle auprès d’un transporteur. Ne retournez pas un article sans instructions convenues.",
      ],
    ],
    link: "/account/orders",
    linkLabel: ["Find my order", "Retrouver ma commande"],
  },
  {
    id: "collection-availability",
    category: "start",
    title: [
      "Collections, wanted cards and price alerts",
      "Collections, cartes recherchées et alertes de prix",
    ],
    summary: [
      "See which buying tools are previews and which actions save data.",
      "Distinguez les démonstrations des actions qui enregistrent des données.",
    ],
    steps: [
      [
        "Use the collection exercise to explore a set and budget. It is a local simulation, not a saved inventory of your personal collection, and it does not buy or reserve cards.",
        "Utilisez l’exercice de collection pour explorer une extension et un budget. Il s’agit d’une simulation locale, pas d’un inventaire enregistré de votre collection; elle n’achète et ne réserve aucune carte.",
      ],
      [
        "Wishlist and price-alert account pages are planned. They do not save wanted cards, price targets or notification preferences, and no price-alert email is sent.",
        "Les pages de favoris et d’alertes de prix du compte sont prévues. Elles n’enregistrent ni cartes recherchées, ni prix cibles, ni préférences de notification; aucun courriel d’alerte de prix n’est envoyé.",
      ],
      [
        "You can browse the catalog, compare actual preview offers and adjust your cart today. Review the cart again before using its simulated checkout; a collection demonstration is separate from your cart.",
        "Vous pouvez parcourir le catalogue, comparer les offres de l’aperçu et modifier le panier. Vérifiez ce dernier avant son paiement simulé; la démonstration de collection est distincte du panier.",
      ],
    ],
    link: "/collection",
    linkLabel: [
      "Explore the collection demo",
      "Explorer la démonstration de collection",
    ],
  },
  {
    id: "compare-offers",
    category: "orders",
    title: [
      "Compare cards and seller offers",
      "Comparer les cartes et les offres",
    ],
    summary: [
      "Choose the right printing and compare the order, not just one card price.",
      "Choisissez la bonne édition et comparez la commande, pas seulement le prix d’une carte.",
    ],
    steps: [
      [
        "Confirm the set, collector number, language, finish and condition before choosing an offer. Card artwork identifies the product; inspect any seller photos separately.",
        "Confirmez l’extension, le numéro, la langue, la finition et l’état avant de choisir une offre. Le visuel identifie le produit; consultez séparément les photos du vendeur.",
      ],
      [
        "Buy cheapest adds one copy from the lowest eligible card-price offer. It does not guarantee the lowest delivered total. Seller minimums and shipping are checked in the cart.",
        "Acheter au meilleur prix ajoute un exemplaire de l’offre admissible au prix unitaire le plus bas. Cela ne garantit pas le total livré le plus bas. Minimums et livraison sont vérifiés dans le panier.",
      ],
      [
        "Compare seller groups in the cart. Handling time describes preparation, not an arrival date. The current preview simulates shipping and checkout; adding a card does not reserve stock or place a real order.",
        "Comparez les groupes de vendeurs dans le panier. Le délai de préparation n’est pas une date d’arrivée. L’aperçu simule livraison et paiement; ajouter une carte ne réserve pas le stock et ne crée pas une commande réelle.",
      ],
    ],
    link: "/search",
    linkLabel: ["Compare cards", "Comparer les cartes"],
  },
  {
    id: "account-access",
    category: "account",
    title: [
      "Your account, seller access and waitlist",
      "Votre compte, l’accès vendeur et la liste d’attente",
    ],
    summary: [
      "Understand what your account can access before launch.",
      "Comprenez les accès de votre compte avant le lancement.",
    ],
    steps: [
      [
        "Sign in with your existing account. If you cannot sign in, use Forgot password. Google is usable only when the sign-in page shows it as available; local test access does not prove the hosted provider is connected.",
        "Connectez-vous à votre compte existant. En cas de difficulté, utilisez Mot de passe oublié. Google est utilisable seulement lorsque la page l’indique disponible; l’accès de test ne confirme pas la connexion du fournisseur hébergé.",
      ],
      [
        "A seller can also buy. Buyers do not have seller-dashboard access; seller tools depend on an active store membership and its permissions. Choosing a selling interest on the waitlist does not grant those permissions.",
        "Un vendeur peut aussi acheter. Les acheteurs n’ont pas accès au tableau de bord vendeur; ses outils dépendent d’une appartenance active à une boutique et de ses permissions. Déclarer un intérêt pour vendre ne confère pas ces permissions.",
      ],
      [
        "Your account and waitlist registration are separate states. Follow any incomplete-registration prompt and wait for confirmation before treating your answers as submitted. Joining the waitlist does not promise a launch date or approved seller access.",
        "Le compte et l’inscription à la liste d’attente sont deux états distincts. Suivez tout avis d’inscription incomplète et attendez la confirmation avant de considérer vos réponses comme soumises. La liste d’attente ne garantit ni date de lancement ni accès vendeur approuvé.",
      ],
      [
        "Open Your waitlist registration in the account menu to review your status in account preferences. If an action cannot be confirmed, choose Check registration status before trying again. Withdrawing leaves your account open; rejoining asks you to review your answers and consent.",
        "Ouvrez Votre inscription à la waitlist dans le menu du compte pour consulter le statut dans les préférences. Si une action n’est pas confirmée, choisissez Vérifier mon inscription avant de réessayer. Le retrait laisse votre compte ouvert; rejoindre à nouveau demande de revoir vos réponses et votre consentement.",
      ],
    ],
    link: "/sign-in",
    linkLabel: ["Sign in", "Se connecter"],
  },
  {
    id: "buyer-order-help",
    category: "orders",
    title: [
      "Find a purchase or ask about a card",
      "Retrouver un achat ou poser une question sur une carte",
    ],
    summary: [
      "Use the right conversation so the seller has useful context.",
      "Utilisez la bonne conversation pour donner du contexte au vendeur.",
    ],
    steps: [
      [
        "Open My orders from your account menu to review purchases. Seller Hub orders are your sales, not your purchases. In the preview, order examples are fictional.",
        "Ouvrez Mes commandes dans le menu du compte pour consulter vos achats. Les commandes de l’espace vendeur sont vos ventes, pas vos achats. Dans l’aperçu, les exemples sont fictifs.",
      ],
      [
        "For an existing order, open its details and use the linked conversation. Include the order reference and explain the problem; never send your password or full payment-card details.",
        "Pour une commande existante, ouvrez ses détails et sa conversation. Indiquez la référence et décrivez le problème; ne transmettez jamais votre mot de passe ni les données complètes d’une carte de paiement.",
      ],
      [
        "Before buying, open the seller’s storefront from an offer and use its contact action. Include the card name and printing. A conversation can exist without an order. Sending a question does not reserve the card or create a purchase.",
        "Avant d’acheter, ouvrez la boutique du vendeur depuis une offre et utilisez son action de contact. Indiquez la carte et son édition. Une conversation peut exister sans commande. Une question ne réserve pas la carte et ne crée pas d’achat.",
      ],
    ],
    link: "/account/orders",
    linkLabel: ["My orders", "Mes commandes"],
  },
  {
    id: "create-listing",
    category: "listings",
    title: ["How to create a listing", "Créer une annonce"],
    summary: [
      "Match the exact card, then choose stock, condition and price.",
      "Choisissez la carte exacte, puis le stock, l’état et le prix.",
    ],
    steps: [
      [
        "Open Inventory and choose Add listings. Find the canonical card and confirm its printing, language and finish.",
        "Dans Inventaire, choisissez Ajouter des annonces. Confirmez la carte, son édition, sa langue et sa finition.",
      ],
      [
        "Enter an accurate condition, quantity and price in CAD. Review the details before publishing. A listing is your offer; it does not create a new catalog card.",
        "Indiquez précisément l’état, la quantité et le prix en CAD. Vérifiez avant publication. Une annonce est votre offre; elle ne crée pas une nouvelle carte au catalogue.",
      ],
      [
        "Use the inventory filters to find the listing afterwards. Update stock when availability changes.",
        "Retrouvez l’annonce avec les filtres d’inventaire. Actualisez le stock lorsque la disponibilité change.",
      ],
    ],
    link: "/seller/inventory?tab=manual",
    linkLabel: ["Add a listing", "Ajouter une annonce"],
  },
  {
    id: "shipping",
    category: "orders",
    title: ["How shipping works on TROC", "Comment fonctionne la livraison"],
    summary: [
      "Each store fulfils its own orders.",
      "Chaque boutique prépare ses commandes.",
    ],
    steps: [
      [
        "Start with Ready to ship in Orders. Open the order to review the items and delivery address before packing.",
        "Commencez par À expédier dans Commandes. Ouvrez la commande pour vérifier les articles et l’adresse avant l’emballage.",
      ],
      [
        "Orders from different stores ship separately. Cards from the same seller share a shipping quote, subject to the seller’s rules.",
        "Les commandes de boutiques différentes sont expédiées séparément. Les cartes d’un même vendeur partagent un tarif selon ses règles.",
      ],
      [
        "Record tracking in the order detail when available. Buying postage or shipping labels is not connected in this preview.",
        "Ajoutez le suivi dans le détail de commande lorsqu’il est disponible. L’achat d’affranchissement ou d’étiquettes n’est pas connecté dans cet aperçu.",
      ],
    ],
    link: "/seller/orders",
    linkLabel: ["Open orders", "Voir les commandes"],
  },
  {
    id: "payout-timing",
    category: "payouts",
    title: [
      "When will I receive my payouts?",
      "Quand recevrai-je mes versements ?",
    ],
    summary: [
      "Use the provider’s confirmed transfer status, not order totals.",
      "Fiez-vous au statut de virement confirmé, et non au total des commandes.",
    ],
    steps: [
      [
        "Open Payouts to check the account connection and transfer history. Sample view is fictional and never moves money.",
        "Ouvrez Versements pour consulter la connexion du compte et l’historique. La vue d’exemple est fictive et ne déplace jamais d’argent.",
      ],
      [
        "Live transfer dates, available funds and reserves are unavailable until the payout provider is connected. A sale or completed order does not, by itself, confirm a bank transfer.",
        "Dates de virement, fonds disponibles et réserves restent indisponibles jusqu’à la connexion du fournisseur. Une vente ou commande terminée ne confirme pas à elle seule un virement.",
      ],
      [
        "For a question, keep the relevant order or payout ID. Never include passwords or full bank details in a support request.",
        "Pour une question, conservez l’identifiant de commande ou de versement. N’incluez jamais de mot de passe ni de coordonnées bancaires complètes.",
      ],
    ],
    link: "/seller/payouts",
    linkLabel: ["View payouts", "Voir les versements"],
  },
  {
    id: "fees",
    category: "fees",
    title: ["Understanding seller fees", "Comprendre les frais vendeur"],
    summary: [
      "Separate merchandise, shipping, refunds and fees.",
      "Distinguez articles, livraison, remboursements et frais.",
    ],
    steps: [
      [
        "Order value is not profit or a payout balance. Analytics includes shipping in order value and shows refunds separately.",
        "La valeur des commandes n’est ni un bénéfice ni un solde de versement. Les statistiques incluent la livraison dans la valeur et présentent les remboursements séparément.",
      ],
      [
        "For an individual order, open its detail to inspect the recorded breakdown. Use the current configured fees shown there rather than a rate copied from a design example.",
        "Ouvrez une commande pour consulter sa ventilation enregistrée. Utilisez les frais configurés qui y figurent, plutôt qu’un taux repris d’une maquette.",
      ],
      [
        "Sample payout statements use illustrative amounts. Final provider charges and live statements require activation.",
        "Les relevés d’exemple utilisent des montants illustratifs. Les frais fournisseur définitifs et relevés réels nécessitent l’activation.",
      ],
    ],
    link: "/seller/orders",
    linkLabel: ["Review an order", "Consulter une commande"],
  },
  {
    id: "selling-standards",
    category: "policies",
    title: [
      "Describe your cards accurately",
      "Décrire ses cartes avec précision",
    ],
    summary: [
      "Make the card identity and condition easy to understand.",
      "Présentez clairement l’identité et l’état de la carte.",
    ],
    steps: [
      [
        "Confirm the printing, language, finish and condition for every listing. A raw-card condition and a professional grade are different information.",
        "Confirmez édition, langue, finition et état de chaque annonce. L’état d’une carte brute et une note professionnelle sont des informations différentes.",
      ],
      [
        "Answer a buyer’s condition questions before purchase in Messages → Pre-sale enquiries. Keep order-specific follow-up in the order conversation.",
        "Répondez aux questions avant achat dans Messages → Questions avant achat. Gardez le suivi d’une commande dans sa conversation.",
      ],
      [
        "Final marketplace legal policies and enforcement terms have not been activated in this preview. This guide explains the current workflow, not final legal terms.",
        "Les politiques juridiques et modalités d’application définitives ne sont pas activées dans cet aperçu. Ce guide décrit le fonctionnement actuel, pas des conditions juridiques finales.",
      ],
    ],
    link: "/condition-guide",
    linkLabel: ["Read the condition guide", "Lire le guide d’état"],
  },
  {
    id: "store-setup",
    category: "start",
    title: [
      "Make your store ready for buyers",
      "Préparer sa boutique pour les acheteurs",
    ],
    summary: [
      "Start with your identity, inventory and team.",
      "Commencez par l’identité, l’inventaire et l’équipe.",
    ],
    steps: [
      [
        "Set your store name and handling preferences in Settings. Keep personal account preferences separate from store settings.",
        "Définissez le nom et les préférences de préparation dans Paramètres. Distinguez les préférences personnelles des paramètres de boutique.",
      ],
      [
        "Edit storefront lets an owner publish English and French descriptions. Logo and banner previews remain browser-local drafts until image storage is connected.",
        "Modifier la vitrine permet au propriétaire de publier les descriptions française et anglaise. Les aperçus du logo et de la bannière restent locaux tant que le stockage des images n’est pas connecté.",
      ],
      [
        "Add a small batch of listings, check it, then import more stock. Give teammates only the roles needed for their work.",
        "Ajoutez un petit lot d’annonces, vérifiez-le, puis importez davantage de stock. Accordez uniquement les rôles nécessaires à vos collaborateurs.",
      ],
    ],
    link: "/seller/storefront",
    linkLabel: ["Edit storefront", "Modifier la vitrine"],
  },
  {
    id: "csv",
    category: "listings",
    title: ["Import inventory from a CSV", "Importer un inventaire CSV"],
    summary: [
      "Map columns, resolve matches and review before publishing.",
      "Associez les colonnes, résolvez les correspondances et vérifiez avant publication.",
    ],
    steps: [
      [
        "Export a comma-separated CSV with unique column headers: at most 20,000 data rows and 4 MB. Prices are CAD with a decimal point, such as 12.50, without a currency symbol. Preserve SKU and collector-number columns as text.",
        "Exportez un CSV séparé par des virgules avec des en-têtes uniques : au maximum 20 000 lignes de données et 4 Mo. Prix en CAD avec un point décimal, comme 12.50, sans symbole monétaire. Gardez SKU et numéros de collection au format texte.",
      ],
      [
        "Map price, quantity, condition and seller SKU. Identify cards with a TROC variant ID, a supported provider/catalog ID pair, or card details. Save a named mapping to reuse the column choices for your store.",
        "Associez prix, quantité, état et SKU vendeur. Identifiez les cartes par identifiant de variante TROC, paire fournisseur/identifiant catalogue reconnue ou détails de carte. Enregistrez une correspondance nommée pour réutiliser ces choix dans votre boutique.",
      ],
      [
        "Preview the import and review every flagged row, including other pages. Correct unmatched, ambiguous, invalid and duplicate rows in the source file, then upload again. Existing SKUs are not silently overwritten; this flow creates new raw-single listings.",
        "Affichez l’aperçu et vérifiez chaque ligne signalée, y compris les autres pages. Corrigez les lignes introuvables, ambiguës, invalides ou en double dans le fichier, puis réimportez. Les SKU existants ne sont pas écrasés automatiquement; ce parcours crée de nouvelles annonces de cartes non gradées.",
      ],
      [
        "Publishing stays unavailable until every row matches. After publication, check listing statuses: cards requiring photos remain drafts. If inventory changed since the preview, upload again to review current duplicates. A source label does not connect a provider or start live sync.",
        "La publication reste indisponible tant que toutes les lignes ne correspondent pas. Après publication, vérifiez les statuts : les cartes exigeant des photos restent en brouillon. Si l’inventaire a changé depuis l’aperçu, réimportez pour revoir les doublons. Une étiquette de source ne connecte pas un fournisseur et ne lance pas de synchronisation.",
      ],
    ],
    link: "/seller/inventory?tab=import",
    linkLabel: ["Import a CSV", "Importer un CSV"],
  },
  {
    id: "messages",
    category: "orders",
    title: [
      "Message a buyer before or after an order",
      "Échanger avant ou après une commande",
    ],
    summary: [
      "Use the right conversation context.",
      "Choisissez le bon contexte de conversation.",
    ],
    steps: [
      [
        "A buyer can use Contact seller on a public storefront without placing an order. These questions appear in Pre-sale enquiries.",
        "Un acheteur peut utiliser Contacter le vendeur sans commander. Ses questions apparaissent dans Questions avant achat.",
      ],
      [
        "Order conversations include the order, card and fulfilment context. Use them for follow-up after purchase.",
        "Les conversations de commande incluent la carte et le contexte d’expédition. Utilisez-les pour le suivi après achat.",
      ],
      [
        "A failed send keeps your draft. Load earlier messages or mark a conversation as read explicitly. This tracks your unread messages; it does not show whether the other person read a reply. Attachments and realtime notifications are not connected yet.",
        "Un envoi échoué conserve le brouillon. Chargez les messages précédents ou marquez la conversation comme lue. Cela suit vos messages non lus, sans indiquer si votre interlocuteur a lu une réponse. Pièces jointes et notifications en temps réel restent indisponibles.",
      ],
    ],
    link: "/seller/messages",
    linkLabel: ["Open messages", "Ouvrir les messages"],
  },
  {
    id: "message-safety",
    category: "policies",
    title: [
      "Report a message or pause pre-sale contact",
      "Signaler un message ou bloquer les échanges avant achat",
    ],
    summary: [
      "Reporting a message and blocking contact are separate actions.",
      "Signaler un message et bloquer les échanges sont deux actions distinctes.",
    ],
    steps: [
      [
        "In a pre-sale conversation, report a message you received: choose a reason, add relevant details and wait for confirmation. A report does not automatically block contact, remove a message or decide an order dispute.",
        "Dans une conversation avant achat, signalez un message reçu : choisissez un motif, ajoutez les détails utiles et attendez la confirmation. Le signalement ne bloque pas automatiquement les échanges, ne supprime pas le message et ne tranche pas un litige de commande.",
      ],
      [
        "Store owners and administrators can block pre-sale contact with a buyer. This pauses new messages in both directions across that store’s pre-sale conversations with that buyer. It does not suspend the buyer’s account or affect other stores.",
        "Les propriétaires de boutique et les administrateurs peuvent bloquer les échanges avant achat avec un acheteur. Les nouveaux messages sont suspendus dans les deux sens pour cette boutique et cet acheteur. Le compte de l’acheteur et les autres boutiques ne sont pas affectés.",
      ],
      [
        "History, reporting and existing order conversations remain available. Unblocking allows new pre-sale messages again. If a change fails, keep your draft and refresh before retrying; an error is not confirmation of a block.",
        "L’historique, le signalement et les conversations de commandes existantes restent accessibles. Le déblocage autorise à nouveau les messages avant achat. En cas d’échec, conservez votre brouillon et actualisez avant de réessayer; une erreur ne confirme pas le blocage.",
      ],
    ],
    link: "/seller/messages",
    linkLabel: ["Open messages", "Ouvrir les messages"],
  },
  {
    id: "team",
    category: "account",
    title: [
      "Choose the right teammate role",
      "Choisir le rôle d’un collaborateur",
    ],
    summary: [
      "Keep access specific to the job.",
      "Adaptez l’accès aux tâches de chacun.",
    ],
    steps: [
      [
        "Owners manage the team. Add an existing TROC account by email, choose a role and confirm. This grants access directly; no invitation email is sent.",
        "Les propriétaires gèrent l’équipe. Ajoutez un compte TROC existant par courriel, choisissez un rôle et confirmez. L’accès est accordé directement; aucun courriel d’invitation n’est envoyé.",
      ],
      [
        "Inventory handles listings; Fulfilment handles orders; Customer service handles buyer replies. Read the role guide before choosing broader access.",
        "Inventaire gère les annonces; Expédition gère les commandes; Service client répond aux acheteurs. Consultez le guide avant d’accorder un accès élargi.",
      ],
      [
        "Keep at least one active owner. Removing store access does not delete the person’s personal TROC account.",
        "Conservez au moins un propriétaire actif. Retirer l’accès à une boutique ne supprime pas le compte personnel.",
      ],
    ],
    link: "/seller/team",
    linkLabel: ["Manage the team", "Gérer l’équipe"],
  },
  {
    id: "smart-cart",
    category: "start",
    title: [
      "Compare offers with Smart Cart",
      "Comparer les offres avec Smart Cart",
    ],
    summary: [
      "Look at the total delivered cost.",
      "Comparez le coût total livré.",
    ],
    steps: [
      [
        "A reference price is a comparison point, not a seller offer. Lowest available is before shipping.",
        "Un prix de référence est un repère, pas une offre vendeur. Le plus bas prix disponible est indiqué avant livraison.",
      ],
      [
        "Smart Cart compares compatible offers and shipping. Review substitutions before applying a result; lock an offer to keep it.",
        "Smart Cart compare les offres compatibles et la livraison. Vérifiez les substitutions avant application; verrouillez une offre pour la conserver.",
      ],
      [
        "Seller minimums and available stock still apply. Savings depend on the available basket, not a guaranteed percentage.",
        "Les minimums vendeur et stocks disponibles s’appliquent. Les économies dépendent du panier, pas d’un pourcentage garanti.",
      ],
    ],
    link: "/smart-cart",
    linkLabel: ["Explore Smart Cart", "Découvrir Smart Cart"],
  },
  {
    id: "draft-recovery",
    category: "trouble",
    title: [
      "My changes were not saved",
      "Mes modifications n’ont pas été enregistrées",
    ],
    summary: [
      "Keep your draft and check the status before retrying.",
      "Conservez votre brouillon et vérifiez le statut avant de réessayer.",
    ],
    steps: [
      [
        "Read the message beside the form. If the service could not confirm a change, keep the page open and retry.",
        "Lisez le message du formulaire. Si le service ne confirme pas une modification, gardez la page ouverte et réessayez.",
      ],
      [
        "Published descriptions and saved promotion drafts use your store account. Logo and banner drafts remain in this browser; clearing site data can remove those image drafts.",
        "Les descriptions publiées et brouillons de promotions enregistrés utilisent votre compte boutique. Les images restent dans ce navigateur; effacer ses données peut supprimer ces brouillons.",
      ],
      [
        "For stock or team changes, reload the relevant page to confirm the recorded state. A conflict means the data changed; review the latest version before editing again.",
        "Pour le stock ou l’équipe, rechargez la page pour confirmer l’état enregistré. Un conflit signifie que les données ont changé : consultez la version récente avant de modifier.",
      ],
    ],
  },
  {
    id: "promotions",
    category: "fees",
    title: ["Prepare a promotion safely", "Préparer une promotion"],
    summary: [
      "Plan the scope and review the customer price.",
      "Définissez la portée et vérifiez le prix pour l’acheteur.",
    ],
    steps: [
      [
        "Use Promotions to save a draft to your store account. Give it a clear name and choose a discount, minimum and proposed dates. Previous browser drafts can be explicitly imported.",
        "Enregistrez un brouillon dans votre compte boutique via Promotions. Choisissez nom, remise, minimum et dates prévues. Les anciens brouillons du navigateur peuvent être importés.",
      ],
      [
        "Review the price example before saving. Drafts and sample campaigns do not change listing prices or activate checkout discounts.",
        "Vérifiez l’exemple de prix avant d’enregistrer. Brouillons et campagnes fictives ne modifient pas les prix ni les remises du paiement.",
      ],
      [
        "In this local preview, use the publication review to select a saved draft, check its scope and UTC dates, then confirm. Saving a draft alone does not publish it. Withdrawal stops future eligible quotes; it does not rewrite existing orders. Performance samples remain illustrative.",
        "Dans cet aperçu local, ouvrez la révision de publication, choisissez un brouillon enregistré, vérifiez sa portée et ses dates UTC, puis confirmez. Enregistrer ne publie pas. Le retrait arrête son application aux prochains calculs admissibles; il ne réécrit pas les commandes existantes. Les performances d’exemple restent illustratives.",
      ],
    ],
    link: "/seller/promotions",
    linkLabel: ["Plan a promotion", "Préparer une promotion"],
  },
  {
    id: "demo",
    category: "trouble",
    title: [
      "What is real in this preview?",
      "Qu’est-ce qui est réel dans cet aperçu ?",
    ],
    summary: [
      "Understand local actions and simulated data.",
      "Distinguez actions locales et données simulées.",
    ],
    steps: [
      [
        "Test-account settings, inventory changes, order messages and team permissions use the isolated local database.",
        "Paramètres de test, modifications d’inventaire, messages et autorisations utilisent la base locale isolée.",
      ],
      [
        "Seller examples, prices and stock are fictional. No real purchase, shipment or bank transfer occurs. Payout samples and promotion results are illustrations.",
        "Vendeurs, prix et stocks d’exemple sont fictifs. Aucun achat, envoi ou virement réel n’a lieu. Versements et résultats promotionnels sont illustratifs.",
      ],
      [
        "Hosted authentication, payment providers and support delivery require activation. Do not use this preview to process real customer transactions.",
        "Authentification hébergée, fournisseurs de paiement et envoi au support nécessitent une activation. N’utilisez pas cet aperçu pour traiter de vraies transactions.",
      ],
    ],
  },
];
