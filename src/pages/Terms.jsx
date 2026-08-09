import React from "react";
import SiteNav from "../components/SiteNav.jsx";
import SiteFooter from "../components/SiteFooter.jsx";

function Art({ n, title, children }) {
  return (
    <section className="legal-article">
      <h2>{n}. {title}</h2>
      {children}
    </section>
  );
}

export default function Terms() {
  return (
    <div className="legal-page">
      <style>{`
        .legal-page { --ink:#0a0b0d; --ink-2:#0e1013; --surface:#15171b; --border:#24272d; --border-strong:#34383f;
          --gold:#c9a668; --gold-bright:#e6cd94; --gold-dim:#8a733f; --text:#f3f1ec; --text-muted:#9a9c9f; --text-dim:#6b6d71;
          background: var(--ink); color: var(--text); min-height:100vh; font-family:'Inter',ui-sans-serif,system-ui,sans-serif; -webkit-font-smoothing: antialiased; }
        .legal-page h1, .legal-page h2 { font-family:'Fraunces',ui-serif,Georgia,serif; letter-spacing:-.01em; }
        .legal-wrap { max-width: 760px; margin: 0 auto; padding: 120px 20px 100px; }
        .legal-wrap h1 { font-size: clamp(1.9rem, 3.6vw, 2.6rem); font-weight:500; }
        .legal-updated { font-size:12.5px; color: var(--text-dim); margin-top:10px; font-family:'IBM Plex Mono',monospace; }
        .legal-notice { margin-top:28px; border:1px solid var(--border-strong); background: rgba(201,166,104,.07); border-radius:14px; padding:18px 20px; font-size:13.5px; line-height:1.65; color: var(--text-muted); }
        .legal-notice strong { color: var(--gold-bright); }
        .legal-article { margin-top:44px; }
        .legal-article h2 { font-size:19px; font-weight:600; margin-bottom:12px; }
        .legal-article p, .legal-article li { font-size:14.5px; line-height:1.75; color: var(--text-muted); }
        .legal-article ul { margin: 10px 0 10px 20px; list-style: disc; }
        .legal-article li { margin-bottom:6px; }
        .legal-placeholder { color: var(--gold-bright); font-family:'IBM Plex Mono',monospace; font-size:0.95em; }
        .legal-sub { font-weight:600; color: var(--text); margin-top:16px; margin-bottom:6px; font-size:14.5px; }
      `}</style>
      <SiteNav />
      <main>
        <div className="legal-wrap">
          <h1>Algemene voorwaarden</h1>
          <p className="legal-updated">VELRIX — Intelligent systems for business.</p>

          <div className="legal-notice">
            <strong>Let op — conceptdocument.</strong> Deze algemene voorwaarden zijn bedoeld als concept en
            dienen vóór definitief gebruik te worden gecontroleerd op de concrete rechtsvorm, activiteiten en
            contracten van VELRIX.
          </div>

          <Art n={1} title="Definities">
            <ul>
              <li><strong>VELRIX:</strong> handelsnaam van <span className="legal-placeholder">[STATUTAIRE NAAM]</span>, ingeschreven bij de Kamer van Koophandel onder nummer <span className="legal-placeholder">[KVK-NUMMER]</span>, kantoorhoudende aan <span className="legal-placeholder">[BEZOEKADRES]</span> (postadres: <span className="legal-placeholder">[POSTADRES]</span>).</li>
              <li><strong>Klant:</strong> de natuurlijke of rechtspersoon die met VELRIX een overeenkomst aangaat, doorgaans een onderneming (bijvoorbeeld een autogarage).</li>
              <li><strong>Diensten:</strong> alle door VELRIX geleverde producten en diensten, waaronder AI-software, AI-receptionist, AI-automatisering, websites, implementatie, onderhoud en aanverwante werkzaamheden.</li>
              <li><strong>Overeenkomst:</strong> elke afspraak tussen VELRIX en Klant over de levering van Diensten, inclusief offertes, orderbevestigingen en deze algemene voorwaarden.</li>
            </ul>
          </Art>

          <Art n={2} title="Toepasselijkheid">
            <p>
              Deze algemene voorwaarden zijn van toepassing op alle offertes, overeenkomsten en Diensten van VELRIX,
              tenzij schriftelijk anders is overeengekomen. Eventuele inkoop- of andere voorwaarden van de Klant
              worden uitdrukkelijk van de hand gewezen, tenzij VELRIX deze schriftelijk heeft aanvaard.
            </p>
          </Art>

          <Art n={3} title="Aanbod en totstandkoming van de overeenkomst">
            <p>
              Offertes van VELRIX zijn vrijblijvend en geldig gedurende de in de offerte genoemde termijn, of bij
              gebreke daarvan 30 dagen. Een overeenkomst komt tot stand zodra de Klant een offerte schriftelijk
              (waaronder per e-mail) heeft aanvaard, of zodra VELRIX met uitvoering is begonnen op verzoek van de
              Klant.
            </p>
          </Art>

          <Art n={4} title="Kostenstructuur: implementatie, abonnement en maatwerk">
            <p>VELRIX hanteert doorgaans drie soorten kosten, die per overeenkomst afzonderlijk worden benoemd:</p>
            <p className="legal-sub">A. Eenmalige implementatie/setup</p>
            <p>Eenmalige kosten voor het inrichten, configureren en opleveren van de afgesproken Diensten, verschuldigd bij aanvang van het project tenzij anders overeengekomen.</p>
            <p className="legal-sub">B. Maandelijkse abonnementskosten</p>
            <p>Terugkerende kosten voor doorlopend gebruik, hosting, onderhoud en ondersteuning van de geleverde Diensten, maandelijks vooraf gefactureerd tenzij anders overeengekomen.</p>
            <p className="legal-sub">C. Maatwerk en externe kosten</p>
            <p>Kosten voor werkzaamheden of licenties die buiten de standaardscope vallen (bijvoorbeeld extra integraties, uitbreidingen, of kosten van externe leveranciers zoals API- of telefonieproviders) worden vooraf besproken en, indien van toepassing, apart geoffreerd of doorbelast tegen kostprijs of een overeengekomen tarief.</p>
          </Art>

          <Art n={5} title="Uitvoering van de dienstverlening">
            <p>
              VELRIX levert AI-software, een AI-receptionist, AI-automatisering en/of websites op basis van de door
              de Klant verstrekte informatie en wensen. VELRIX spant zich in de Diensten met zorg te leveren, maar
              kan niet garanderen dat AI-gestuurde functionaliteit te allen tijde foutloos functioneert; VELRIX zal
              gemelde gebreken met voortvarendheid onderzoeken en waar redelijkerwijs mogelijk verhelpen.
            </p>
          </Art>

          <Art n={6} title="Onderhoud en ondersteuning">
            <p>
              Voor zover overeengekomen, verzorgt VELRIX onderhoud aan de geleverde Diensten, waaronder updates,
              foutherstel en beschikbaarheid van ondersteuning tijdens redelijke termijnen. De reikwijdte van
              onderhoud en ondersteuning wordt per overeenkomst of abonnement gespecificeerd.
            </p>
          </Art>

          <Art n={7} title="Externe software, API's en leveranciers">
            <p>
              De Diensten van VELRIX kunnen gebruikmaken van software en diensten van derden, zoals (maar niet
              beperkt tot) hostingpartijen, Google Calendar, telefonie-/spraakproviders en andere API's en
              integraties. VELRIX selecteert deze leveranciers met zorg, maar is niet aansprakelijk voor
              tekortkomingen, uitval of wijzigingen in diensten van deze derde partijen die buiten de invloedssfeer
              van VELRIX liggen. Wijzigingen in voorwaarden, prijzen of beschikbaarheid van externe leveranciers
              kunnen worden doorberekend of leiden tot aanpassing van de Dienst, met redelijke voorafgaande
              kennisgeving aan de Klant waar mogelijk.
            </p>
          </Art>

          <Art n={8} title="Betaling en facturatie">
            <p>
              Facturen dienen te worden voldaan binnen 14 dagen na factuurdatum, tenzij schriftelijk anders is
              overeengekomen. Bij niet-tijdige betaling is de Klant van rechtswege in verzuim en kan VELRIX de
              wettelijke handelsrente en redelijke incassokosten in rekening brengen. VELRIX kan bij uitblijvende
              betaling de Diensten (tijdelijk) opschorten, na de Klant hierover te hebben geïnformeerd.
            </p>
          </Art>

          <Art n={9} title="Looptijd en opzegging">
            <p>
              Abonnementen worden aangegaan voor de in de overeenkomst genoemde periode en lopen daarna stilzwijgend
              door voor onbepaalde tijd, tenzij anders overeengekomen. Beide partijen kunnen doorlopende
              overeenkomsten schriftelijk opzeggen met inachtneming van een redelijke opzegtermijn zoals vermeld in
              de overeenkomst, of bij gebreke daarvan één kalendermaand.
            </p>
          </Art>

          <Art n={10} title="Wijzigingen">
            <p>
              VELRIX kan deze algemene voorwaarden en de inhoud van abonnementen wijzigen. Wezenlijke wijzigingen
              worden vooraf aan de Klant gecommuniceerd. Bij wezenlijke, voor de Klant nadelige wijzigingen heeft de
              Klant het recht de overeenkomst tegen de datum van inwerkingtreding van de wijziging op te zeggen.
            </p>
          </Art>

          <Art n={11} title="Intellectueel eigendom">
            <p>
              Alle rechten van intellectuele eigendom op door VELRIX ontwikkelde software, modellen, ontwerpen en
              documentatie berusten bij VELRIX of haar licentiegevers, tenzij schriftelijk anders overeengekomen. De
              Klant verkrijgt een niet-exclusief, niet-overdraagbaar gebruiksrecht voor de duur van de overeenkomst,
              beperkt tot het overeengekomen gebruiksdoel. Door de Klant aangeleverd materiaal (waaronder
              bedrijfsgegevens, content en merkmateriaal) blijft eigendom van de Klant.
            </p>
          </Art>

          <Art n={12} title="Vertrouwelijkheid en gegevensverwerking">
            <p>
              Partijen behandelen elkaars vertrouwelijke informatie zorgvuldig en delen deze niet met derden, tenzij
              dit noodzakelijk is voor de uitvoering van de overeenkomst, wettelijk verplicht is, of de andere partij
              hiervoor toestemming heeft gegeven. Voor zover VELRIX bij de uitvoering van de Diensten
              persoonsgegevens verwerkt namens de Klant, worden hierover passende afspraken gemaakt (bijvoorbeeld in
              een verwerkersovereenkomst). Zie voor meer informatie ook de <a href="/privacy" style={{ color: "var(--gold-bright)" }}>privacyverklaring</a>.
            </p>
          </Art>

          <Art n={13} title="Aansprakelijkheid">
            <p>
              VELRIX is aansprakelijk voor directe schade die het rechtstreekse gevolg is van een toerekenbare
              tekortkoming in de uitvoering van de overeenkomst, met dien verstande dat de totale aansprakelijkheid
              per gebeurtenis (een reeks samenhangende gebeurtenissen geldt als één gebeurtenis) is beperkt tot het
              bedrag dat de Klant in de zes maanden voorafgaand aan de schadeveroorzakende gebeurtenis aan VELRIX
              heeft betaald, met een maximum dat in de overeenkomst kan worden vastgelegd. Aansprakelijkheid voor
              indirecte schade, waaronder gevolgschade en gederfde omzet, is uitgesloten, tenzij sprake is van opzet
              of bewuste roekeloosheid van VELRIX. Niets in deze voorwaarden beoogt de aansprakelijkheid van VELRIX
              verder te beperken dan wettelijk is toegestaan, en niets in deze voorwaarden legt de volledige
              verantwoordelijkheid voor de Dienst automatisch bij de Klant.
            </p>
          </Art>

          <Art n={14} title="Overmacht">
            <p>
              Geen van beide partijen is gehouden tot nakoming van enige verplichting indien zij daartoe verhinderd
              is als gevolg van overmacht. Onder overmacht wordt onder meer verstaan: storingen bij externe
              leveranciers (waaronder hosting-, telefonie- of API-providers), internetstoringen, en andere
              omstandigheden die redelijkerwijs buiten de macht van partijen liggen.
            </p>
          </Art>

          <Art n={15} title="Toepasselijk recht en bevoegde rechter">
            <p>
              Op alle overeenkomsten tussen VELRIX en de Klant is Nederlands recht van toepassing. Geschillen worden
              voorgelegd aan de bevoegde rechter in het arrondissement waar VELRIX is gevestigd, tenzij dwingend
              recht anders voorschrijft.
            </p>
          </Art>

          <Art n={16} title="Contact">
            <p>
              Vragen over deze algemene voorwaarden kunnen worden gestuurd naar{" "}
              <a href="mailto:daniel@velrix.nl" style={{ color: "var(--gold-bright)" }}>daniel@velrix.nl</a>.
            </p>
          </Art>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
