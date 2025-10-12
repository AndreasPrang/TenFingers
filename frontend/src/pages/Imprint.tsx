import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Legal.css';

const Imprint: React.FC = () => {
  return (
    <div className="legal-container">
      <div className="legal-content">
        <h1>Impressum</h1>

        <div className="legal-notice">
          <p>
            <strong>Hinweis:</strong> Dieses Angebot wird nicht-gewerblich und unentgeltlich
            als privates Bildungsprojekt betrieben.
          </p>
        </div>

        <section className="legal-section">
          <h2>Verantwortlich für den Inhalt</h2>
          <p>
            <strong>Name:</strong> [DEIN NAME]<br />
            <strong>E-Mail:</strong> [DEINE E-MAIL]
          </p>
          <p className="legal-hint">
            (Verantwortlich nach § 55 Abs. 2 RStV und Art. 4 Nr. 7 DSGVO)
          </p>
        </section>

        <section className="legal-section">
          <h2>Über TenFingers</h2>
          <p>
            TenFingers ist ein kostenloser Tipptrainer für das 10-Finger-System auf der deutschen
            QWERTZ-Tastatur. Das Projekt wurde entwickelt, um Schülern und Lehrern ein modernes,
            datenschutzfreundliches Werkzeug für den Informatikunterricht zur Verfügung zu stellen.
          </p>
          <p>
            <strong>Keine kommerzielle Nutzung</strong> - Dieses Angebot ist kostenlos und wird
            ohne Gewinnabsicht betrieben. Es werden keine Gebühren erhoben, keine Werbung geschaltet
            und keine Daten zu kommerziellen Zwecken verarbeitet.
          </p>
        </section>

        <section className="legal-section">
          <h2>Haftung für Inhalte</h2>
          <p>
            Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten
            nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als
            Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
            Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
            Tätigkeit hinweisen.
          </p>
          <p>
            Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den
            allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch
            erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei
            Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend
            entfernen.
          </p>
        </section>

        <section className="legal-section">
          <h2>Haftung für Links</h2>
          <p>
            Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen
            Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.
            Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der
            Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf
            mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung
            nicht erkennbar.
          </p>
          <p>
            Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete
            Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen
            werden wir derartige Links umgehend entfernen.
          </p>
        </section>

        <section className="legal-section">
          <h2>Urheberrecht</h2>
          <p>
            Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen
            dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art
            der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen
            Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind
            nur für den privaten, nicht kommerziellen Gebrauch gestattet.
          </p>
          <p>
            Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die
            Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche
            gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden,
            bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen
            werden wir derartige Inhalte umgehend entfernen.
          </p>
        </section>

        <div className="legal-footer">
          <Link to="/" className="btn-secondary">Zurück zur Startseite</Link>
        </div>
      </div>
    </div>
  );
};

export default Imprint;
