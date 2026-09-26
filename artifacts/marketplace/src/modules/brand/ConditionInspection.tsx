import "./condition-inspection.css";

export function ConditionInspection({ locale }: { locale: "en" | "fr" }) {
  const t = (en: string, fr: string) => (locale === "fr" ? fr : en);
  const zones = [
    [
      t("Corners", "Coins"),
      t(
        "Look for whitening, bending and softened points.",
        "Repérez le blanchiment, les courbures et les pointes émoussées.",
      ),
    ],
    [
      t("Edges", "Bords"),
      t(
        "Check all four edges for chips and wear, on both sides.",
        "Vérifiez les quatre bords des deux côtés : éclats et usure.",
      ),
    ],
    [
      t("Surface", "Surface"),
      t(
        "Tilt gently under soft light to reveal scratches, dents and print marks.",
        "Inclinez doucement sous une lumière diffuse pour repérer rayures, enfoncements et marques d’impression.",
      ),
    ],
    [
      t("Structure", "Structure"),
      t(
        "Check for creases, water damage or changes to the card. Never bend it to test.",
        "Cherchez les plis, les dommages causés par l’eau et les altérations. Ne pliez jamais la carte pour la tester.",
      ),
    ],
  ];
  const examples = [
    [
      "whitening",
      t("Edge whitening", "Blanchiment des bords"),
      t(
        "Pale spots where the printed edge has worn. Show which edges are affected and how far the wear extends.",
        "Zones pâles où le bord imprimé est usé. Montrez les bords concernés et l’étendue de l’usure.",
      ),
      "M42 29 L42 39 M42 46 L42 54 M45 26 L56 26",
    ],
    [
      "scratch",
      t("Surface scratches", "Rayures de surface"),
      t(
        "Thin marks on the face or back. Photograph at a second angle so reflections do not hide them.",
        "Marques fines au recto ou au verso. Photographiez sous un autre angle pour éviter que les reflets les masquent.",
      ),
      "M68 71 L111 57 M74 80 L104 70",
    ],
    [
      "dent",
      t("Dents and impressions", "Enfoncements et empreintes"),
      t(
        "A localized depression can be hard to see head-on. Add a close-up with light coming from the side.",
        "Un enfoncement local peut être peu visible de face. Ajoutez un gros plan avec un éclairage latéral.",
      ),
      "M80 63 Q89 55 97 64 Q99 73 90 78",
    ],
    [
      "crease",
      t("Creases", "Plis"),
      t(
        "A fold line through the card. Show its full length and check the reverse; do not flatten or bend the card for a photo.",
        "Une ligne de pli dans la carte. Montrez toute sa longueur et vérifiez le verso; ne pliez pas la carte et ne tentez pas de l’aplatir pour la photo.",
      ),
      "M44 108 L73 91 L94 85 L136 57",
    ],
  ];
  return (
    <div className="condition-inspection">
      <section
        aria-labelledby="inspection-heading"
        className="condition-inspection-panel"
      >
        <div className="condition-diagram" aria-hidden="true">
          <div className="condition-diagram-card">
            <span className="condition-zone condition-zone-one">1</span>
            <span className="condition-zone condition-zone-two">2</span>
            <span className="condition-zone condition-zone-three">3</span>
            <span className="condition-zone condition-zone-four">4</span>
            <div className="condition-card-art" />
            <div className="condition-card-lines" />
          </div>
          <p>
            {t(
              "Illustration · not a grading scale",
              "Illustration · pas une échelle de gradation",
            )}
          </p>
        </div>
        <div>
          <h2 id="inspection-heading">
            {t(
              "Four places to look. Both sides to check.",
              "Quatre zones à examiner. Deux côtés à vérifier.",
            )}
          </h2>
          <p>
            {t(
              "Take the card out of its sleeve carefully and inspect it on a clean surface. One photo rarely tells the whole story.",
              "Retirez délicatement la carte de sa pochette et examinez-la sur une surface propre. Une seule photo raconte rarement toute l’histoire.",
            )}
          </p>
          <ol className="condition-zone-list">
            {zones.map(([title, detail], index) => (
              <li key={title}>
                <span>{index + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section
        className="condition-advice-grid"
        aria-label={t(
          "Before listing or buying",
          "Avant de vendre ou d’acheter",
        )}
      >
        <article>
          <h2>
            {t("Photograph the actual card", "Photographiez la vraie carte")}
          </h2>
          <p>
            {t(
              "Show the front, back and any defect in focus. Add a closer view when needed. Catalog artwork identifies the printing; it is not evidence of the seller’s copy.",
              "Montrez le recto, le verso et tout défaut avec une image nette. Ajoutez un gros plan au besoin. L’image du catalogue identifie l’édition; elle ne prouve pas l’état de l’exemplaire vendu.",
            )}
          </p>
        </article>
        <article>
          <h2>
            {t("Describe what you can see", "Décrivez ce que vous voyez")}
          </h2>
          <p>
            {t(
              "Use the condition labels below alongside a specific description of wear. If the condition is uncertain, ask for more detail before buying rather than assuming a higher grade.",
              "Utilisez les états ci-dessous avec une description précise de l’usure. En cas de doute, demandez des détails avant d’acheter plutôt que de supposer un meilleur état.",
            )}
          </p>
        </article>
        <article>
          <h2>
            {t(
              "Raw condition ≠ a professional grade",
              "État brut ≠ note professionnelle",
            )}
          </h2>
          <p>
            {t(
              "Near mint does not promise a numerical grade. For a graded card, check the grading company, label, certification number and slab photos. A matching certificate alone does not authenticate the item.",
              "Presque neuf ne garantit aucune note chiffrée. Pour une carte gradée, vérifiez l’organisme, l’étiquette, le numéro de certificat et les photos du boîtier. Un certificat correspondant ne suffit pas à authentifier l’objet.",
            )}
          </p>
        </article>
      </section>
      <section
        className="condition-examples"
        aria-labelledby="condition-examples-heading"
      >
        <h2 id="condition-examples-heading">
          {t(
            "Recognize the wear. Describe the detail.",
            "Reconnaître l’usure. Décrire les détails.",
          )}
        </h2>
        <p>
          {t(
            "Simplified illustrations, not photos or grade thresholds. Consider the whole card; a single mark does not determine its condition.",
            "Illustrations simplifiées, sans photo ni seuil de gradation. Examinez la carte entière : une seule marque ne détermine pas son état.",
          )}
        </p>
        <div className="condition-examples-grid">
          {examples.map(([id, title, description, path]) => (
            <article key={id}>
              <svg viewBox="0 0 180 150" aria-hidden="true" focusable="false">
                <rect
                  x="40"
                  y="24"
                  width="100"
                  height="108"
                  rx="7"
                  className="condition-example-card"
                />
                <rect
                  x="50"
                  y="34"
                  width="80"
                  height="64"
                  rx="3"
                  className="condition-example-art"
                />
                <path
                  d="M52 110 H126 M52 118 H107"
                  className="condition-example-lines"
                />
                <path
                  d={path}
                  className={"condition-example-mark condition-example-" + id}
                />
              </svg>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
      <aside className="condition-reference">
        <strong>{t("Further reading", "Pour approfondir")}</strong>
        <p>
          {t(
            "These are external references, not a promise that grading systems are interchangeable.",
            "Ces références externes ne signifient pas que les systèmes de gradation sont interchangeables.",
          )}
        </p>
        <div>
          <a href="https://help.tcgplayer.com/hc/en-us/articles/221430307-Card-Conditioning-Overview">
            TCGplayer · {t("Condition overview", "Guide des états")}
          </a>
          <a href="https://www.psacard.com/gradingstandards">
            PSA · {t("Grading standards", "Normes de gradation")}
          </a>
          <a href="https://www.psacard.com/cert">
            PSA · {t("Certificate lookup", "Vérification du certificat")}
          </a>
        </div>
      </aside>
    </div>
  );
}
