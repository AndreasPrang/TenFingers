import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Legal.css';

const Privacy: React.FC = () => {
  return (
    <div className="legal-container">
      <div className="legal-content">
        <h1>Datenschutzerklärung</h1>
        <p className="legal-last-updated">Stand: {new Date().toLocaleDateString('de-DE')}</p>

        <section className="legal-section">
          <h2>1. Datenschutz auf einen Blick</h2>

          <h3>Allgemeine Hinweise</h3>
          <p>
            Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen
            Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit
            denen Sie persönlich identifiziert werden können.
          </p>

          <h3>Wer ist verantwortlich für die Datenerfassung?</h3>
          <p>
            Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber.
            Dessen Kontaktdaten können Sie dem <Link to="/impressum">Impressum</Link> entnehmen.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Welche Daten erfassen wir?</h2>

          <h3>Bei der Registrierung</h3>
          <p>Wir erfassen folgende Daten, wenn Sie sich registrieren:</p>
          <ul>
            <li><strong>Benutzername</strong> (Pflichtfeld) - zur Anmeldung und Identifikation</li>
            <li><strong>Passwort</strong> (Pflichtfeld) - verschlüsselt gespeichert (bcrypt)</li>
            <li><strong>E-Mail-Adresse</strong> (optional für Schüler, Pflicht für Lehrer) - für Kontaktaufnahme</li>
            <li><strong>Rolle</strong> (Schüler oder Lehrer) - zur Funktionssteuerung</li>
            <li><strong>Klassenzugehörigkeit</strong> (bei Schülern) - zur Klassenverwaltung</li>
          </ul>

          <h3>Während der Nutzung</h3>
          <ul>
            <li><strong>Übungsfortschritt</strong> - Welche Lektionen Sie absolviert haben</li>
            <li><strong>Tipp-Statistiken</strong> - Geschwindigkeit (WPM), Genauigkeit, Zeitstempel</li>
            <li><strong>Login-Zeitstempel</strong> - Wann Sie sich angemeldet haben</li>
          </ul>

          <h3>Server-Logs</h3>
          <p>
            Unser Webserver erfasst automatisch folgende technische Informationen:
          </p>
          <ul>
            <li>IP-Adresse (anonymisiert nach 7 Tagen)</li>
            <li>Browsertyp und -version</li>
            <li>Zugriffszeitpunkt</li>
            <li>Referrer URL</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. Rechtsgrundlage der Verarbeitung</h2>
          <p>
            Die Verarbeitung Ihrer personenbezogenen Daten erfolgt auf Grundlage von:
          </p>
          <ul>
            <li><strong>Art. 6 Abs. 1 lit. a DSGVO</strong> - Ihre Einwilligung bei der Registrierung</li>
            <li><strong>Art. 6 Abs. 1 lit. b DSGVO</strong> - Vertragserfüllung (Bereitstellung des Dienstes)</li>
            <li><strong>Art. 6 Abs. 1 lit. f DSGVO</strong> - Berechtigte Interessen (Systemsicherheit)</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Speicherort und Sicherheit</h2>

          <h3>Wo werden Daten gespeichert?</h3>
          <p>
            Alle Daten werden ausschließlich auf einem Server in Deutschland gespeichert.
            Es findet keine Datenübermittlung an Drittländer statt.
          </p>

          <h3>Wie schützen wir Ihre Daten?</h3>
          <ul>
            <li>HTTPS-Verschlüsselung für alle Übertragungen</li>
            <li>Passwörter werden mit bcrypt gehashed (nicht im Klartext gespeichert)</li>
            <li>Regelmäßige Sicherheitsupdates</li>
            <li>Zugriffsbeschränkungen auf Datenbankebene</li>
            <li>Tägliche Backups (verschlüsselt)</li>
          </ul>

          <h3>Wie lange werden Daten gespeichert?</h3>
          <ul>
            <li><strong>Aktive Accounts</strong>: Solange Sie den Dienst nutzen</li>
            <li><strong>Inaktive Accounts</strong>: 2 Jahre nach letztem Login, dann automatische Löschung</li>
            <li><strong>Gelöschte Accounts</strong>: Sofortige Löschung aller personenbezogenen Daten</li>
            <li><strong>Server-Logs</strong>: Automatische Anonymisierung nach 7 Tagen</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. Besondere Hinweise für Schulen</h2>

          <h3>Mindestalter</h3>
          <p>
            Gemäß Art. 8 DSGVO benötigen Personen unter 16 Jahren die Einwilligung ihrer Eltern oder
            Erziehungsberechtigten zur Nutzung dieses Dienstes.
          </p>

          <h3>Lehrer als Verantwortliche</h3>
          <p>
            Wenn Lehrer Schüler-Accounts erstellen, handeln sie als Verantwortliche im Sinne der DSGVO.
            Die Schule muss:
          </p>
          <ul>
            <li>Eine Einwilligung der Eltern einholen (bei Schülern unter 16)</li>
            <li>Die Schüler über die Datenverarbeitung informieren</li>
            <li>Ein Verarbeitungsverzeichnis führen</li>
            <li>Ggf. eine Datenschutz-Folgenabschätzung durchführen</li>
          </ul>

          <h3>E-Mail-Adressen bei Schülern</h3>
          <p>
            E-Mail-Adressen sind für Schüler-Accounts <strong>optional</strong>. Lehrer können Schüler
            auch nur mit Benutzername und Passwort anlegen, um die Datenverarbeitung zu minimieren.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Weitergabe von Daten</h2>
          <p>
            Ihre Daten werden <strong>nicht an Dritte weitergegeben</strong>, außer:
          </p>
          <ul>
            <li>Bei gesetzlicher Verpflichtung (z.B. auf Anordnung von Behörden)</li>
            <li>Zur Durchsetzung unserer Nutzungsbedingungen</li>
          </ul>
          <p>
            <strong>Keine Weitergabe an Werbepartner, Tracking-Dienste oder Social Media!</strong>
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Ihre Rechte</h2>
          <p>Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:</p>

          <h3>Auskunftsrecht (Art. 15 DSGVO)</h3>
          <p>Sie können Auskunft über Ihre gespeicherten Daten verlangen.</p>

          <h3>Berichtigungsrecht (Art. 16 DSGVO)</h3>
          <p>Sie können die Berichtigung falscher Daten verlangen.</p>

          <h3>Löschungsrecht (Art. 17 DSGVO)</h3>
          <p>
            Sie können die Löschung Ihrer Daten verlangen. Lehrer können Schüler-Accounts in der
            Klassenverwaltung löschen. Alle Daten werden dabei unwiderruflich entfernt.
          </p>

          <h3>Einschränkung der Verarbeitung (Art. 18 DSGVO)</h3>
          <p>Sie können die Einschränkung der Verarbeitung verlangen.</p>

          <h3>Datenübertragbarkeit (Art. 20 DSGVO)</h3>
          <p>
            Sie können Ihre Daten in einem strukturierten, maschinenlesbaren Format erhalten.
            Kontaktieren Sie uns dafür.
          </p>

          <h3>Widerspruchsrecht (Art. 21 DSGVO)</h3>
          <p>Sie können der Verarbeitung Ihrer Daten widersprechen.</p>

          <h3>Beschwerderecht</h3>
          <p>
            Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.
            Zuständig ist die Aufsichtsbehörde Ihres Bundeslandes.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Cookies und Tracking</h2>
          <p>
            Diese Website verwendet <strong>keine Cookies</strong> für Tracking oder Werbung.
          </p>
          <p>
            Wir verwenden ausschließlich technisch notwendige Speichermechanismen:
          </p>
          <ul>
            <li><strong>LocalStorage</strong> - Speichert Ihr Login-Token (JWT) lokal im Browser</li>
            <li>Kein Tracking, keine Analyse-Tools, kein Google Analytics</li>
            <li>Keine Social-Media-Plugins, keine externen Schriftarten</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>9. Kontakt Datenschutz</h2>
          <p>
            Bei Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte können Sie uns kontaktieren:
          </p>
          <p>
            Siehe <Link to="/impressum">Impressum</Link> für Kontaktdaten.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. Änderungen der Datenschutzerklärung</h2>
          <p>
            Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie an geänderte
            Rechtslagen oder Funktionen anzupassen. Die aktuelle Version ist immer unter
            dieser URL verfügbar.
          </p>
        </section>

        <div className="legal-footer">
          <Link to="/" className="btn-secondary">Zurück zur Startseite</Link>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
