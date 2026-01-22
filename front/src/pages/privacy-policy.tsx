import { Link } from 'react-router-dom';
import { WinterMateLogo } from '@/components/wintermate-logo';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#2B2B2B' }}>
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 transition-all duration-300">
        <div className="absolute inset-0 backdrop-blur-xl border-b border-zinc-700/50" style={{ backgroundColor: 'rgba(43, 43, 43, 0.85)' }} />
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <WinterMateLogo className="h-12 md:h-14 w-auto" />
          </Link>
          <Link to="/">
            <Button variant="ghost" className="text-zinc-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>
        </div>
      </nav>

      <main className="relative pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-invert max-w-none">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
              Politique de Confidentialité
            </h1>
            <p className="text-zinc-400 text-sm mb-8">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <div className="space-y-8 text-zinc-300">
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
                <p className="leading-relaxed">
                  WinterMate s'engage à protéger votre vie privée. Cette Politique de Confidentialité explique comment nous 
                  collectons, utilisons, partageons et protégeons vos informations personnelles lorsque vous utilisez notre 
                  plateforme.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">2. Informations que nous collectons</h2>
                <p className="leading-relaxed mb-4">
                  Nous collectons les types d'informations suivants :
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Informations de compte :</strong> nom, adresse e-mail, mot de passe (crypté)</li>
                  <li><strong>Informations de profil :</strong> photo de profil, biographie, informations de contact</li>
                  <li><strong>Informations TikTok :</strong> données de votre compte TikTok connecté (nom d'utilisateur, statistiques, contenu)</li>
                  <li><strong>Informations de paiement :</strong> coordonnées bancaires pour les paiements (traitées par des prestataires tiers sécurisés)</li>
                  <li><strong>Données d'utilisation :</strong> logs, cookies, identifiants de dispositif</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">3. Comment nous utilisons vos informations</h2>
                <p className="leading-relaxed mb-4">
                  Nous utilisons vos informations pour :
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Fournir, maintenir et améliorer nos services</li>
                  <li>Traiter vos transactions et gérer vos paiements</li>
                  <li>Vous connecter avec des marques et des campagnes appropriées</li>
                  <li>Communiquer avec vous concernant votre compte et nos services</li>
                  <li>Analyser l'utilisation de la plateforme et améliorer l'expérience utilisateur</li>
                  <li>Détecter et prévenir la fraude et les abus</li>
                  <li>Respecter nos obligations légales</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">4. Partage d'informations</h2>
                <p className="leading-relaxed mb-4">
                  Nous pouvons partager vos informations dans les cas suivants :
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Avec les marques partenaires :</strong> informations de profil nécessaires pour les campagnes (nom, statistiques TikTok, contenu créé)</li>
                  <li><strong>Avec les prestataires de services :</strong> services de paiement, hébergement, analyse (sous contrat de confidentialité)</li>
                  <li><strong>Conformité légale :</strong> si requis par la loi ou pour protéger nos droits</li>
                  <li><strong>Avec votre consentement :</strong> dans tout autre cas avec votre autorisation explicite</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">5. Cookies et technologies similaires</h2>
                <p className="leading-relaxed">
                  Nous utilisons des cookies et des technologies similaires pour améliorer votre expérience, analyser l'utilisation 
                  de notre site et personnaliser le contenu. Vous pouvez gérer vos préférences de cookies dans les paramètres de 
                  votre navigateur.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">6. Sécurité des données</h2>
                <p className="leading-relaxed">
                  Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos 
                  informations personnelles contre l'accès non autorisé, la perte, la destruction ou la modification. Cependant, 
                  aucune méthode de transmission sur Internet n'est 100% sécurisée.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">7. Vos droits</h2>
                <p className="leading-relaxed mb-4">
                  Conformément au RGPD et aux lois applicables, vous avez le droit de :
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Accéder à vos informations personnelles</li>
                  <li>Corriger des informations inexactes</li>
                  <li>Demander la suppression de vos données</li>
                  <li>Vous opposer au traitement de vos données</li>
                  <li>Demander la portabilité de vos données</li>
                  <li>Retirer votre consentement à tout moment</li>
                </ul>
                <p className="leading-relaxed mt-4">
                  Pour exercer ces droits, contactez-nous via les moyens disponibles sur la plateforme.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">8. Conservation des données</h2>
                <p className="leading-relaxed">
                  Nous conservons vos informations personnelles aussi longtemps que nécessaire pour fournir nos services et 
                  respecter nos obligations légales. Lorsque vous supprimez votre compte, nous supprimerons ou anonymiserons 
                  vos données dans un délai raisonnable, sauf si la conservation est requise par la loi.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">9. Transferts internationaux</h2>
                <p className="leading-relaxed">
                  Vos informations peuvent être transférées et stockées dans des pays en dehors de votre pays de résidence. 
                  Nous nous assurons que des garanties appropriées sont en place pour protéger vos données conformément à 
                  cette politique.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">10. Modifications de cette politique</h2>
                <p className="leading-relaxed">
                  Nous pouvons modifier cette Politique de Confidentialité de temps à autre. Nous vous informerons de tout 
                  changement significatif en publiant la nouvelle politique sur cette page et en mettant à jour la date 
                  de "Dernière mise à jour".
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">11. Contact</h2>
                <p className="leading-relaxed">
                  Pour toute question concernant cette Politique de Confidentialité ou pour exercer vos droits, vous pouvez 
                  nous contacter via les moyens de contact disponibles sur notre plateforme.
                </p>
              </section>
            </div>

            <div className="mt-12 pt-8 border-t border-zinc-700">
              <Link to="/">
                <Button className="rounded-full px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à l'accueil
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
