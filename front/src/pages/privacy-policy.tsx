import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BricksCreatorsLogo } from '@/components/bricks-creators-logo';

export const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-[#FDFBF9] font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-slate-600 hover:text-[#0A2337] transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Retour</span>
          </Link>
          <BricksCreatorsLogo className="h-6 w-auto text-[#0A2337]" />
        </div>
      </nav>

      <main className="pt-24 pb-16 px-4 md:px-6">
        <article className="max-w-4xl mx-auto prose prose-slate prose-headings:text-[#0A2337] prose-a:text-[#FA6C37] prose-a:no-underline hover:prose-a:underline">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Politique de Confidentialité</h1>
          
          <p className="text-slate-500 text-sm mb-8">Dernière mise à jour : 19 décembre 2025</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
            <p>
              La présente Politique de Confidentialité décrit la manière dont Bricks.co (ci-après « nous », 
              « notre » ou « Bricks ») collecte, utilise et protège vos données personnelles lorsque vous 
              utilisez la plateforme Bricks Creators (ci-après « la Plateforme »).
            </p>
            <p>
              Nous nous engageons à respecter votre vie privée et à protéger vos données personnelles 
              conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi 
              Informatique et Libertés.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Responsable du traitement</h2>
            <p>
              Le responsable du traitement des données personnelles est :
            </p>
            <p className="bg-slate-50 p-4 rounded-lg">
              <strong>Bricks.co</strong><br />
              Société par actions simplifiée<br />
              Email : <a href="mailto:privacy@bricks.co">privacy@bricks.co</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Données collectées</h2>
            <p>Nous collectons les catégories de données suivantes :</p>
            
            <h3 className="text-lg font-medium mt-4 mb-2">Données d'identification</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Nom et prénom</li>
              <li>Adresse email</li>
              <li>Identifiants de connexion</li>
              <li>Photo de profil (optionnel)</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">Données de compte TikTok</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Identifiant TikTok</li>
              <li>Nom d'utilisateur TikTok</li>
              <li>Statistiques publiques du compte</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">Données de paiement</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Coordonnées bancaires (IBAN)</li>
              <li>Historique des paiements</li>
              <li>Factures générées</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">Données d'utilisation</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Vidéos et contenus soumis</li>
              <li>Participation aux campagnes</li>
              <li>Historique de navigation sur la Plateforme</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Finalités du traitement</h2>
            <p>Vos données personnelles sont collectées pour les finalités suivantes :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Gestion de votre compte</strong> : création, authentification et gestion de votre espace personnel</li>
              <li><strong>Fourniture des services</strong> : participation aux campagnes, soumission de contenus, suivi des performances</li>
              <li><strong>Paiements</strong> : traitement des rémunérations et génération des factures</li>
              <li><strong>Communication</strong> : envoi de notifications relatives à votre activité et aux campagnes</li>
              <li><strong>Amélioration des services</strong> : analyse anonymisée pour améliorer la Plateforme</li>
              <li><strong>Obligations légales</strong> : respect de nos obligations comptables et fiscales</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Base légale du traitement</h2>
            <p>Le traitement de vos données repose sur les bases légales suivantes :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Exécution du contrat</strong> : traitement nécessaire à l'exécution des services</li>
              <li><strong>Consentement</strong> : pour certaines communications marketing</li>
              <li><strong>Intérêt légitime</strong> : amélioration de nos services, prévention de la fraude</li>
              <li><strong>Obligation légale</strong> : conservation des données comptables</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Durée de conservation</h2>
            <p>Vos données sont conservées pendant les durées suivantes :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Données de compte</strong> : pendant la durée de votre inscription + 3 ans après suppression</li>
              <li><strong>Données de paiement</strong> : 10 ans (obligations comptables)</li>
              <li><strong>Contenus soumis</strong> : pendant la durée de la campagne + 5 ans</li>
              <li><strong>Données de navigation</strong> : 13 mois maximum</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Partage des données</h2>
            <p>Vos données peuvent être partagées avec :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Nos sous-traitants techniques</strong> : hébergement, paiement, envoi d'emails</li>
              <li><strong>Les marques partenaires</strong> : dans le cadre des campagnes auxquelles vous participez</li>
              <li><strong>Les autorités</strong> : sur demande légale</li>
            </ul>
            <p className="mt-4">
              Nous ne vendons jamais vos données personnelles à des tiers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Transferts hors UE</h2>
            <p>
              Certaines données peuvent être transférées vers des pays hors de l'Union Européenne 
              (notamment vers les États-Unis pour certains de nos prestataires). Ces transferts sont 
              encadrés par des garanties appropriées (clauses contractuelles types, certifications).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Sécurité des données</h2>
            <p>
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour 
              protéger vos données contre la perte, l'accès non autorisé, la divulgation ou la 
              destruction :
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Chiffrement des données sensibles</li>
              <li>Authentification sécurisée</li>
              <li>Accès restreint aux données</li>
              <li>Surveillance et audits réguliers</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Vos droits</h2>
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Droit d'accès</strong> : obtenir une copie de vos données personnelles</li>
              <li><strong>Droit de rectification</strong> : corriger vos données inexactes</li>
              <li><strong>Droit à l'effacement</strong> : demander la suppression de vos données</li>
              <li><strong>Droit à la limitation</strong> : limiter le traitement de vos données</li>
              <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
              <li><strong>Droit d'opposition</strong> : vous opposer au traitement de vos données</li>
              <li><strong>Droit de retirer votre consentement</strong> : à tout moment</li>
            </ul>
            <p className="mt-4">
              Pour exercer ces droits, contactez-nous à : <a href="mailto:privacy@bricks.co">privacy@bricks.co</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">11. Cookies</h2>
            <p>
              La Plateforme utilise des cookies pour son fonctionnement et l'amélioration de 
              l'expérience utilisateur :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Cookies essentiels</strong> : nécessaires au fonctionnement (authentification, sécurité)</li>
              <li><strong>Cookies analytiques</strong> : mesure d'audience anonymisée</li>
            </ul>
            <p className="mt-4">
              Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">12. Réclamation</h2>
            <p>
              Si vous estimez que le traitement de vos données personnelles constitue une violation 
              de vos droits, vous pouvez introduire une réclamation auprès de la CNIL 
              (Commission Nationale de l'Informatique et des Libertés) :
            </p>
            <p className="bg-slate-50 p-4 rounded-lg">
              <strong>CNIL</strong><br />
              3 Place de Fontenoy, TSA 80715<br />
              75334 Paris Cedex 07<br />
              Site web : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">13. Modifications</h2>
            <p>
              Nous pouvons modifier cette Politique de Confidentialité à tout moment. En cas de 
              modification substantielle, nous vous en informerons par email ou par notification 
              sur la Plateforme.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">14. Contact</h2>
            <p>
              Pour toute question concernant cette Politique de Confidentialité ou vos données 
              personnelles, contactez notre Délégué à la Protection des Données :
            </p>
            <p>
              Email : <a href="mailto:privacy@bricks.co">privacy@bricks.co</a>
            </p>
          </section>
        </article>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-8 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-slate-400">© 2025 Bricks.co - Tous droits réservés</p>
        </div>
      </footer>
    </div>
  );
};

