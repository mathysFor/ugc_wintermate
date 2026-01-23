import { Link } from 'react-router-dom';
import { WinterMateLogo } from '@/components/wintermate-logo';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const TermsOfServicePage = () => {
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
              Conditions Générales d'Utilisation
            </h1>
            <p className="text-zinc-400 text-sm mb-8">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <div className="space-y-8 text-zinc-300">
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">1. Acceptation des conditions</h2>
                <p className="leading-relaxed">
                  En accédant et en utilisant WinterMate, vous acceptez d'être lié par les présentes Conditions Générales d'Utilisation. 
                  Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">2. Description du service</h2>
                <p className="leading-relaxed">
                  WinterMate est une plateforme qui connecte les créateurs de contenu TikTok avec des marques pour créer des campagnes 
                  de marketing d'influence. Les créateurs peuvent gagner de l'argent en créant et en publiant du contenu conforme 
                  aux exigences des campagnes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">3. Compte utilisateur</h2>
                <p className="leading-relaxed mb-4">
                  Pour utiliser WinterMate, vous devez :
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Créer un compte avec des informations exactes et à jour</li>
                  <li>Maintenir la sécurité de votre compte et de votre mot de passe</li>
                  <li>Être âgé d'au moins 18 ans ou avoir l'autorisation d'un parent/tuteur</li>
                  <li>Connecter votre compte TikTok valide</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">4. Obligations des créateurs</h2>
                <p className="leading-relaxed mb-4">
                  En tant que créateur, vous vous engagez à :
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Créer du contenu original et conforme aux directives de la campagne</li>
                  <li>Respecter les droits de propriété intellectuelle</li>
                  <li>Respecter les règles de la communauté TikTok</li>
                  <li>Ne pas publier de contenu offensant, illégal ou trompeur</li>
                  <li>Mentionner clairement WinterMate dans votre contenu conformément aux exigences</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">5. Paiements</h2>
                <p className="leading-relaxed mb-4">
                  Les paiements aux créateurs sont effectués selon les termes spécifiés dans chaque campagne. 
                  Les montants sont calculés en fonction des vues validées et peuvent varier selon la campagne.
                </p>
                <p className="leading-relaxed">
                  WinterMate se réserve le droit de retenir ou d'annuler un paiement en cas de non-respect des conditions 
                  de la campagne ou de violation de ces conditions générales.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">6. Propriété intellectuelle</h2>
                <p className="leading-relaxed">
                  Vous conservez tous les droits sur le contenu que vous créez. En participant à une campagne, vous accordez 
                  à WinterMate et à la marque partenaire une licence non exclusive pour utiliser, reproduire et distribuer 
                  votre contenu dans le cadre de la campagne et à des fins promotionnelles.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">7. Limitation de responsabilité</h2>
                <p className="leading-relaxed">
                  WinterMate ne peut être tenu responsable des dommages directs, indirects, accessoires ou consécutifs résultant 
                  de l'utilisation ou de l'impossibilité d'utiliser notre service. Nous ne garantissons pas que le service sera 
                  ininterrompu, sécurisé ou exempt d'erreurs.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">8. Modification des conditions</h2>
                <p className="leading-relaxed">
                  WinterMate se réserve le droit de modifier ces conditions à tout moment. Les modifications entreront en vigueur 
                  dès leur publication sur cette page. Il est de votre responsabilité de consulter régulièrement ces conditions.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">9. Résiliation</h2>
                <p className="leading-relaxed">
                  Nous nous réservons le droit de suspendre ou de résilier votre compte à tout moment en cas de violation de ces 
                  conditions générales ou pour toute autre raison légitime.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">10. Contact</h2>
                <p className="leading-relaxed">
                  Pour toute question concernant ces Conditions Générales d'Utilisation, vous pouvez nous contacter via 
                  les moyens de contact disponibles sur notre plateforme.
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


