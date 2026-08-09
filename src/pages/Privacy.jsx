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

export default function Privacy() {
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
        .legal-article { margin-top:44px; }
        .legal-article h2 { font-size:19px; font-weight:600; margin-bottom:12px; }
        .legal-article p, .legal-article li { font-size:14.5px; line-height:1.75; color: var(--text-muted); }
        .legal-article ul { margin: 10px 0 10px 20px; list-style: disc; }
        .legal-article li { margin-bottom:6px; }
        .legal-sub { font-weight:600; color: var(--text); margin-top:16px; margin-bottom:6px; font-size:14.5px; }
        .legal-table { width:100%; border-collapse: collapse; margin-top:14px; font-size:13.5px; }
        .legal-table th, .legal-table td { text-align:left; padding:10px 12px; border-bottom:1px solid var(--border); vertical-align:top; }
        .legal-table th { color: var(--text-dim); font-weight:600; font-size:11.5px; text-transform:uppercase; letter-spacing:.04em; }
        .legal-table td { color: var(--text-muted); }
        .status-active { color:#6fd18a; font-family:'IBM Plex Mono',monospace; font-size:11px; }
        .status-future { color:#e6947a; font-family:'IBM Plex Mono',monospace; font-size:11px; }
      `}</style>
      <SiteNav />
      <main>
        <div className="legal-wrap">
          <h1>Privacyverklaring</h1>
          <p className="legal-updated">VELRIX — Intelligent systems for business.</p>

          <Art n={1} title="Wie is verantwoordelijk">
            <p>
              Deze privacyverklaring is van toepassing op de website van VELRIX (<span style={{ color: "var(--gold-bright)" }}>velrix.nl</span>).
              VELRIX is verantwoordelijke voor de verwerking van persoonsgegevens zoals beschreven in dit document.
              Vragen? Mail <a href="mailto:daniel@velrix.nl" style={{ color: "var(--gold-bright)" }}>daniel@velrix.nl</a>.
            </p>
          </Art>

          <Art n={2} title="Wanneer verwerken we gegevens">
            <p>VELRIX kan persoonsgegevens verwerken wanneer je:</p>
            <ul>
              <li>de website bezoekt;</li>
              <li>een kennismakingsgesprek plant via de boekingsfunctie;</li>
              <li>contact opneemt via e-mail;</li>
              <li>gebruikmaakt van een demo op de website;</li>
              <li>klant wordt van VELRIX.</li>
            </ul>
          </Art>

          <Art n={3} title="Welke gegevens">
            <ul>
              <li>Naam</li>
              <li>E-mailadres</li>
              <li>Eventueel telefoonnummer — <em>alleen indien dit in de toekomst expliciet wordt gevraagd; op dit moment vraagt de website geen telefoonnummer</em></li>
              <li>Afspraakgegevens (gekozen datum en tijd, type gesprek)</li>
              <li>Technische gegevens zoals IP-adres en loggegevens, voor zover dit door de gebruikte hostingpartij standaard wordt vastgelegd</li>
            </ul>
          </Art>

          <Art n={4} title="Doeleinden en grondslagen">
            <table className="legal-table">
              <thead>
                <tr><th>Doel</th><th>Grondslag</th></tr>
              </thead>
              <tbody>
                <tr><td>Een kennismakingsgesprek inplannen en bevestigen</td><td>Uitvoering van (voorbereiding op) een overeenkomst</td></tr>
                <tr><td>Reageren op een e-mail of contactverzoek</td><td>Gerechtvaardigd belang: adequaat kunnen reageren op vragen</td></tr>
                <tr><td>De demo laten functioneren</td><td>Gerechtvaardigd belang: laten zien hoe de dienst werkt</td></tr>
                <tr><td>Website laten functioneren en technische problemen opsporen</td><td>Gerechtvaardigd belang: een werkende, veilige website</td></tr>
                <tr><td>Klantrelatie onderhouden na het worden van klant</td><td>Uitvoering van de overeenkomst</td></tr>
              </tbody>
            </table>
          </Art>

          <Art n={5} title="Bewaartermijnen">
            <p>
              Gegevens van een kennismakingsgesprek of contactverzoek worden bewaard zolang dat nodig is om het
              gesprek te voeren en eventueel vervolgcontact te onderhouden, en worden daarna verwijderd of
              geanonimiseerd tenzij een langere bewaartermijn wettelijk verplicht is (bijvoorbeeld fiscale
              bewaarplicht na het sluiten van een overeenkomst). Word je klant, dan gelden de bewaartermijnen die
              horen bij de uitvoering en administratie van de overeenkomst.
            </p>
          </Art>

          <Art n={6} title="Ontvangers, verwerkers en externe dienstverleners">
            <p>
              VELRIX deelt persoonsgegevens uitsluitend met derden voor zover dat noodzakelijk is voor het
              beschreven doel, of wanneer daartoe een wettelijke verplichting bestaat. Onderstaand overzicht geeft
              eerlijk weer wat op dit moment daadwerkelijk wordt gebruikt en wat (nog) niet:
            </p>
            <table className="legal-table">
              <thead>
                <tr><th>Dienst</th><th>Status</th><th>Toelichting</th></tr>
              </thead>
              <tbody>
                <tr><td>Vercel (hosting)</td><td><span className="status-active">ACTIEF</span></td><td>Host de website; kan technische/loggegevens verwerken die nodig zijn om de website te laten werken.</td></tr>
                <tr><td>Google Calendar</td><td><span className="status-future">NOG NIET ACTIEF</span></td><td>De boekingsfunctie draait momenteel in testmodus. Zodra de koppeling actief is, worden naam, e-mailadres en afspraakgegevens gedeeld met Google om de afspraak in de agenda te zetten en een uitnodiging te versturen. Deze verklaring wordt bijgewerkt zodra dat zo is.</td></tr>
                <tr><td>Google Workspace</td><td><span className="status-future">INDIEN GEBRUIKT</span></td><td>Voor zover VELRIX e-mail via Google Workspace afhandelt, kan Google als verwerker optreden voor binnenkomende e-mail. Niet gekoppeld aan de website zelf.</td></tr>
                <tr><td>n8n</td><td><span className="status-future">NOG NIET GEKOPPELD AAN DE WEBSITE</span></td><td>Wordt door VELRIX intern gebruikt voor bedrijfsprocessen, maar verwerkt op dit moment geen gegevens die via de website worden verzameld.</td></tr>
                <tr><td>Toekomstige voice-AI-providers</td><td><span className="status-future">NIET ACTIEF</span></td><td>Er wordt op dit moment geen gebruik gemaakt van een externe voice-AI-provider voor de website-demo. Wanneer dat verandert, wordt dit hier vermeld vóórdat de functie live gaat.</td></tr>
              </tbody>
            </table>
          </Art>

          <Art n={7} title="Cookies en tracking">
            <p>
              Deze website plaatst op dit moment geen cookies en gebruikt geen analytics-, advertentie- of
              trackingtechnologieën. Mocht dat in de toekomst veranderen (bijvoorbeeld door het toevoegen van
              website-statistieken), dan wordt hiervoor eerst een correcte cookiemelding met toestemmingsflow
              toegevoegd, en wordt deze privacyverklaring bijgewerkt.
            </p>
          </Art>

          <Art n={8} title="Jouw rechten">
            <p>Je hebt het recht om:</p>
            <ul>
              <li>inzage te vragen in de gegevens die VELRIX van je verwerkt;</li>
              <li>onjuiste gegevens te laten corrigeren;</li>
              <li>gegevens te laten verwijderen, voor zover er geen wettelijke bewaarplicht geldt;</li>
              <li>bezwaar te maken tegen verwerking op basis van gerechtvaardigd belang;</li>
              <li>een klacht in te dienen bij de Autoriteit Persoonsgegevens.</li>
            </ul>
            <p>Voor het uitoefenen van deze rechten kun je mailen naar <a href="mailto:daniel@velrix.nl" style={{ color: "var(--gold-bright)" }}>daniel@velrix.nl</a>.</p>
          </Art>

          <Art n={9} title="Beveiliging">
            <p>
              VELRIX neemt passende technische en organisatorische maatregelen om persoonsgegevens te beschermen
              tegen verlies of onrechtmatige verwerking, waaronder het gebruik van betrouwbare hostingpartijen en
              beperkte toegang tot gegevens tot wie dat nodig heeft.
            </p>
          </Art>

          <Art n={10} title="Contact voor privacyvragen">
            <p>
              Vragen, verzoeken of klachten over deze privacyverklaring kun je sturen naar{" "}
              <a href="mailto:daniel@velrix.nl" style={{ color: "var(--gold-bright)" }}>daniel@velrix.nl</a>.
            </p>
          </Art>

          <Art n={11} title="Wijzigingen">
            <p>
              VELRIX kan deze privacyverklaring aanpassen, bijvoorbeeld wanneer nieuwe diensten of leveranciers
              (zoals een actieve Google Calendar-koppeling) daadwerkelijk in gebruik worden genomen. De meest
              actuele versie staat altijd op deze pagina.
            </p>
          </Art>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
