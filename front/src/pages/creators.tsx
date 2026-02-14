import { Link } from 'react-router-dom';
import {
  ArrowRight,
  DollarSign,
  GraduationCap,
  Users,
  Sparkles,
  Gift,
  Clock,
  MessageCircle,
  Wallet,
  Award,
  Smartphone,
  Laptop,
  Car,
  FileText,
} from 'lucide-react';
import { WinterMateLogo } from '@/components/wintermate-logo';
import { motion } from 'framer-motion';

const APP_NAME = 'Winter Mate';

/* ─── Gradient text utility ─── */
const GradientText = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <span
    className={`bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 ${className}`}
  >
    {children}
  </span>
);

/* ─── TikTok icon SVG ─── */
const TikTokIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.76a8.26 8.26 0 0 0 4.76 1.5v-3.4a4.83 4.83 0 0 1-1-.17z" />
  </svg>
);

/* ─── Data ─── */
const secondaryBenefits = [
  {
    icon: GraduationCap,
    title: 'Une formation pour créer des vidéos qui performent',
    description: 'Apprends les bonnes pratiques pour du contenu ski qui cartonne sur TikTok.',
  },
  {
    icon: Users,
    title: `Des coaching avec le CEO de ${APP_NAME}`,
    description: 'Et des experts en contenu et en montagne.',
  },
  {
    icon: Sparkles,
    title: `Un accès privilégié à la marque ${APP_NAME}`,
    description: 'Équipement, avantages et visibilité au cœur du programme créateurs.',
  },
  {
    icon: Gift,
    title: 'Des bonus sur la totalité des vues',
    description: 'Gagne des récompenses supplémentaires à mesure que tu progresses.',
  },
];

const bonusTiers = [
  { views: '100K', reward: 'Coaching 1-1', sub: "avec l'équipe (valeur 500€)", icon: MessageCircle },
  { views: '1M', reward: '300€', sub: 'Cash', icon: Wallet },
  { views: '2M', reward: `Ambassadeur ${APP_NAME}`, sub: 'avec salaire fixe', icon: Award },
  { views: '5M', reward: 'iPhone 17', icon: Smartphone },
  { views: '20M', reward: 'MacBook Air', icon: Laptop },
  { views: '50M', reward: 'Voiture', icon: Car },
  { views: '100M', reward: `CDI de créateur ${APP_NAME}`, sub: '5000€/mois', icon: FileText },
];

const creatorHandles = [
  { handle: '@theblueberry36', url: 'https://www.tiktok.com/@theblueberry36' },
  { handle: '@robin_dormion', url: 'https://www.tiktok.com/@robin_dormion' },
  { handle: '@viralbypatrik', url: 'https://www.tiktok.com/@viralbypatrik' },
  { handle: '@ylann.go.viral', url: 'https://www.tiktok.com/@ylann.go.viral' },
  { handle: '@cdm.business1', url: 'https://www.tiktok.com/@cdm.business1' },
  { handle: '@expert.algorithme', url: 'https://www.tiktok.com/@expert.algorithme' },
];

export const CreatorsLandingPage = () => {
  return (
    <div className="min-h-screen bg-[#2B2B2B] font-sans text-white selection:bg-blue-500/30">
      <main className="relative pt-16">
        {/* ═══════════════ HERO ═══════════════ */}
        <section className="text-center px-6 pb-16 md:pb-24 max-w-4xl mx-auto">
          {/* Logo centered */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-6"
          >
            <WinterMateLogo className="h-20 md:h-20 w-auto" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-black mb-4"
          >
            Rejoindre l'équipe <GradientText>{APP_NAME}</GradientText>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base md:text-lg text-slate-400 mb-12"
          >
            Gagne de l'argent en créant du contenu ski sur TikTok
          </motion.p>

          {/* Video embed — replace src with your own Loom/video */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-2xl overflow-hidden border border-white/10 aspect-video bg-black/50"
          >
            <iframe
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              className="w-full h-full"
              allow="autoplay; fullscreen"
              allowFullScreen
              title="Présentation créateurs"
            />
          </motion.div>

          {/* CTA after video */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mt-10"
          >
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-full px-14 py-6 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xl shadow-lg shadow-blue-500/20 transition-all group"
            >
              Postuler maintenant
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </section>

        {/* ─ separator ─ */}
        <div className="max-w-3xl mx-auto border-t border-white/5" />

        {/* ═══════════════ C'EST QUOI ═══════════════ */}
        <section className="text-center px-6 py-20 md:py-28 max-w-3xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-4xl font-black mb-6"
          >
            {APP_NAME} <GradientText>c'est quoi</GradientText> ?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-base md:text-lg text-slate-400 leading-relaxed"
          >
            {APP_NAME} est une marque de ski qui rémunère les créateurs TikTok. Tu postes du contenu qui met en avant
            la marque, on track les vues et tu es payé à la performance — simple et transparent.
          </motion.p>
        </section>

        {/* ─ separator ─ */}
        <div className="max-w-3xl mx-auto border-t border-white/5" />

        {/* ═══════════════ TA MISSION ═══════════════ */}
        <section className="text-center px-6 py-20 md:py-28 max-w-3xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-4xl font-black mb-8"
          >
            C'est quoi <GradientText>TA</GradientText> mission ?
          </motion.h2>

          {/* Mission card with gradient border */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="relative rounded-2xl p-[1px] bg-gradient-to-r from-blue-500 to-blue-400"
          >
            <div className="rounded-2xl bg-[#1e1e24] px-8 py-8">
              <p className="text-base md:text-lg text-slate-200 leading-relaxed">
                Créer des vidéos virales pour mettre en avant la marque {APP_NAME}.
              </p>
            </div>
          </motion.div>
        </section>

        {/* ─ separator ─ */}
        <div className="max-w-3xl mx-auto border-t border-white/5" />

        {/* ═══════════════ QU'EST CE QUE TU VAS OBTENIR ═══════════════ */}
        <section className="text-center px-6 py-20 md:py-28 max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-4xl font-black mb-12"
          >
            Qu'est ce que tu vas <GradientText>obtenir</GradientText> ?
          </motion.h2>

          {/* ── Primary benefit: Rémunération (full-width card) ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl bg-[#18181f] border border-white/5 p-6 md:p-8 mb-4 text-left"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <DollarSign className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold">Une rémunération à la performance dès le premier jour</h3>
                <p className="text-slate-400 text-sm">Même avec 0 abonnés</p>
              </div>
            </div>
            {/* Blue gradient highlight bar */}
            <div className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-5">
              <p className="text-xl md:text-2xl font-black text-white">1€ par 1000 vues</p>
              <p className="text-white/60 text-sm mt-1">= 123€ pour 123 000 vues</p>
            </div>
          </motion.div>

          {/* ── Secondary benefits: 2x2 grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {secondaryBenefits.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.06 }}
                className="rounded-2xl bg-[#18181f] border border-white/5 p-6 text-left flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-bold mb-1">{item.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Date limite badge */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-10 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-slate-400 text-sm"
          >
            <Clock className="w-4 h-4" />
            Date limite : 1er Juin
          </motion.div>
        </section>

        {/* ─ separator ─ */}
        <div className="max-w-3xl mx-auto border-t border-white/5" />

        {/* ═══════════════ BONUS EXCLUSIFS ═══════════════ */}
        <section className="text-center px-6 py-20 md:py-28 max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-4xl font-black mb-12"
          >
            Bonus <GradientText>exclusifs</GradientText>
          </motion.h2>

          {/* Bonus rows */}
          <div className="space-y-3">
            {bonusTiers.map((tier, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.04 }}
                className="rounded-2xl bg-[#18181f] border border-white/5 px-6 py-5 flex items-center gap-4"
              >
                {/* Left: views */}
                <div className="text-left shrink-0 w-20 md:w-24">
                  <div className="text-2xl md:text-3xl font-black text-white leading-none">{tier.views}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">vues</div>
                </div>

                {/* Dotted line */}
                <div className="flex-1 border-t border-dashed border-white/10" />

                {/* Right: reward + icon */}
                <div className="text-right shrink-0 flex items-center gap-3">
                  <div>
                    <div className="text-sm md:text-base font-bold text-white">{tier.reward}</div>
                    {tier.sub && <div className="text-xs text-slate-400">{tier.sub}</div>}
                  </div>
                  <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                    <tier.icon className="w-4 h-4 text-blue-400" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ─ separator ─ */}
        <div className="max-w-3xl mx-auto border-t border-white/5" />

        {/* ═══════════════ EQUIPE DE CRÉATEURS ═══════════════ */}
        <section className="text-center px-6 py-20 md:py-28 max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-4xl font-black mb-10"
          >
            L'équipe de créateurs <GradientText>{APP_NAME}</GradientText>
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-3"
          >
            {creatorHandles.map((c) => (
              <a
                key={c.handle}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#18181f] border border-white/5 text-white text-sm font-medium hover:border-blue-500/40 transition-colors"
              >
                <TikTokIcon className="w-4 h-4 text-slate-400" />
                {c.handle}
              </a>
            ))}
          </motion.div>
        </section>

        {/* ─ separator ─ */}
        <div className="max-w-3xl mx-auto border-t border-white/5" />

        {/* ═══════════════ FINAL CTA ═══════════════ */}
        <section className="text-center px-6 py-24 md:py-32 max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl lg:text-6xl font-black mb-10"
          >
            Prêt à <GradientText>rejoindre l'équipe</GradientText> ?
          </motion.h2>

          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-full px-14 py-6 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xl shadow-lg shadow-blue-500/20 transition-all group"
            >
              Postuler maintenant
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="flex flex-col items-center gap-4">
          <Link to="/">
            <WinterMateLogo className="h-5 w-auto opacity-40 hover:opacity-70 transition-opacity" />
          </Link>
          <p className="text-xs text-slate-600">© 2025 Winter Mate. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};
