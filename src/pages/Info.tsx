import { ArrowLeft, Database, Shield, Heart, Scale, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Info = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-accent py-6 px-4 rounded-b-3xl shadow-lg">
        <div className="container max-w-lg mx-auto">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="text-accent-foreground hover:bg-accent-foreground/20">
                <ArrowLeft className="w-6 h-6" />
              </Button>
            </Link>
            <h1 className="text-2xl font-display font-bold">ℹ️ Info & Quellen</h1>
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Impressum - Legal Notice */}
        <section className="bg-card rounded-2xl p-6 shadow-card space-y-4">
          <h2 className="text-xl font-display font-bold flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            Impressum
          </h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold">Angaben gemäß § 5 TMG</p>
              <p className="text-muted-foreground mt-1">
                [Dein Name]<br />
                [Straße und Hausnummer]<br />
                [PLZ Ort]
              </p>
            </div>
            <div>
              <p className="font-semibold flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Kontakt
              </p>
              <p className="text-muted-foreground mt-1">
                E-Mail: [deine@email.de]
              </p>
            </div>
            <div className="p-3 bg-muted rounded-xl">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Hinweis:</strong> Bitte ersetze die Platzhalter oben mit deinen echten Kontaktdaten, 
                bevor du die App öffentlich bereitstellst.
              </p>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="bg-card rounded-2xl p-6 shadow-card space-y-4">
          <h2 className="text-xl font-display font-bold flex items-center gap-2">
            <Heart className="w-5 h-5 text-info" />
            Über KFZlotti
          </h2>
          <p className="text-muted-foreground">
            KFZlotti hilft dir, deutsche KFZ-Kennzeichen zu entdecken! 
            Gib ein Kürzel ein und finde heraus, zu welchem Landkreis oder welcher Stadt es gehört.
          </p>
          <p className="text-muted-foreground">
            Die App funktioniert auch ohne Internet, nachdem sie einmal geladen wurde. 
            Perfekt für unterwegs! 🚗
          </p>
        </section>

        {/* Data Sources */}
        <section className="bg-card rounded-2xl p-6 shadow-card space-y-4">
          <h2 className="text-xl font-display font-bold flex items-center gap-2">
            <Database className="w-5 h-5 text-secondary" />
            Datenquellen
          </h2>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-muted rounded-xl">
              <p className="font-semibold">Wikipedia</p>
              <p className="text-muted-foreground">Liste der Kfz-Kennzeichen in Deutschland</p>
              <p className="text-xs text-muted-foreground mt-1">CC BY-SA 4.0</p>
            </div>
            <div className="p-3 bg-muted rounded-xl">
              <p className="font-semibold">Bundesamt für Kartographie und Geodäsie (BKG)</p>
              <p className="text-muted-foreground">KFZ250 Datensatz mit Kreisgeometrien</p>
              <p className="text-xs text-muted-foreground mt-1">© GeoBasis-DE / BKG 2024</p>
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section className="bg-card rounded-2xl p-6 shadow-card space-y-4">
          <h2 className="text-xl font-display font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-success" />
            Datenschutz
          </h2>
          <ul className="space-y-2 text-muted-foreground text-sm">
            <li className="flex items-start gap-2">
              <span className="text-success">✓</span>
              <span>Keine Tracking-Cookies oder Analyse-Tools</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-success">✓</span>
              <span>Dein Standort wird nicht gespeichert oder übertragen</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-success">✓</span>
              <span>Alle Daten bleiben auf deinem Gerät</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-success">✓</span>
              <span>Keine Accounts oder Registrierung nötig</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-success">✓</span>
              <span>100% Open Source</span>
            </li>
          </ul>
          <div className="p-3 bg-muted rounded-xl">
            <p className="text-xs text-muted-foreground">
              Diese App erhebt, speichert und überträgt keine personenbezogenen Daten. 
              Die optionale Standortabfrage erfolgt ausschließlich lokal auf deinem Gerät.
            </p>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="bg-muted rounded-2xl p-4 text-center">
          <p className="text-xs text-muted-foreground">
            💡 Ein KFZ-Kennzeichen zeigt nicht garantiert den aktuellen Wohnort. 
            Man kann sein Kennzeichen nach einem Umzug behalten!
          </p>
        </section>
      </main>
    </div>
  );
};

export default Info;
