import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Eye, Wallet } from 'lucide-react';
import { WinterMateLogo } from '@/components/wintermate-logo';
import { useState, useRef } from 'react';
import { HeroSection } from '@/components/landing/hero-section';
import { motion } from 'framer-motion';

// Vidéos TikTok des créateurs qui participent aux campagnes WinterMate
const featuredVideos = [
  { type: 'tiktok', id: "7535402685021867286" },
  { type: 'tiktok', id: "7508724778455403798" },
  { type: 'tiktok', id: "7515000177791339798" },
  { type: 'tiktok', id: "7583969056554863894" },
  { type: 'tiktok', id: "7583637457112075543" },
  { type: 'tiktok', id: "7583008792435215638" },
];

const VideoSlider = ({ videos }: { videos: { type: string, src?: string, id?: string }[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollTo = (index: number) => {
    if (scrollRef.current) {
      const scrollAmount = index * (320 + 16);
      scrollRef.current.scrollTo({
        left: scrollAmount,
        behavior: 'smooth'
      });
      setActiveIndex(index);
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const index = Math.round(scrollRef.current.scrollLeft / (320 + 16));
      setActiveIndex(index);
    }
  };

  return (
    <div className="relative max-w-7xl mx-auto">
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto gap-4 md:gap-6 pb-8 px-6 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {videos.map((item, idx) => (
          <div key={idx} className="snap-center shrink-0 w-[85vw] max-w-[320px] aspect-[9/16] rounded-3xl overflow-hidden relative group shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_60px_-12px_rgba(59,130,246,0.3)] border border-zinc-700/50" style={{ backgroundColor: '#222222' }}>
            {item.type === 'video' ? (
              <>
                <video 
                  src={item.src}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-black">
                <iframe 
                  src={`https://www.tiktok.com/embed/v2/${item.id}`}
                  className="w-full h-full"
                  style={{ border: 'none' }}
                  allow="encrypted-media;"
                ></iframe>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {videos.map((_, idx) => (
          <button
            key={idx}
            onClick={() => scrollTo(idx)}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === activeIndex 
                ? 'bg-blue-500 w-8' 
                : 'bg-zinc-600 w-2 hover:bg-zinc-500'
            }`}
            aria-label={`Aller à la diapositive ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

// Steps data
const steps = [
  {
    number: "01",
    title: "Connecte TikTok",
    description: "Lie ton compte en 30 secondes.",
    icon: Zap,
  },
  {
    number: "02", 
    title: "Poste ta vidéo",
    description: "Mentionne WinterMate dans ton contenu.",
    icon: Eye,
  },
  {
    number: "03",
    title: "Gagne de l'argent",
    description: "On te paye à chaque vue.",
    icon: Wallet,
  },
];

export const LandingPage = () => {
  return (
    <div className="min-h-screen font-sans selection:bg-blue-500/30" style={{ backgroundColor: '#2B2B2B' }}>
      {/* Background with Image and Gradient Overlay */}
      <div className="absolute top-0 left-0 right-0 h-[100vh] min-h-[700px] overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1551524559-8af4e6624178?q=80&w=2126&auto=format&fit=crop")' }}
        />
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(43, 43, 43, 0.5) 0%, rgba(43, 43, 43, 0.8) 50%, rgba(43, 43, 43, 1) 100%)'
          }}
        />
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` 
          }} 
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 transition-all duration-300">
        <div className="absolute inset-0 backdrop-blur-xl border-b border-zinc-700/50" style={{ backgroundColor: 'rgba(43, 43, 43, 0.85)' }} />
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WinterMateLogo className="h-12 md:h-14 w-auto" />
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden md:block text-sm font-medium text-zinc-400 hover:text-white transition-colors px-4 py-2">
              Connexion
            </Link>
            <Link to="/register">
              <Button className="rounded-full px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all group border-0">
                Commencer
                <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative pt-28 pb-0 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          
          <HeroSection />

          {/* How it works Section */}
          <section className="py-24 relative z-10">
            {/* Section Header */}
            <div className="text-center mb-16">
              <motion.span 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-block text-blue-400 text-sm font-bold uppercase tracking-widest mb-4"
              >
                Comment ça marche
              </motion.span>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4"
              >
                3 étapes. C'est tout.
              </motion.h2>
            </div>

            {/* Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {steps.map((step, idx) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15 }}
                  className="group relative"
                >
                  <div className="relative p-8 rounded-3xl border border-zinc-700/50 backdrop-blur-sm transition-all duration-500 hover:border-blue-500/30 hover:shadow-[0_0_60px_-12px_rgba(59,130,246,0.15)]" style={{ backgroundColor: 'rgba(34, 34, 34, 0.8)' }}>
                    {/* Step Number */}
                    <div className="absolute -top-4 left-8 px-3 py-1 bg-blue-500 rounded-full text-white text-xs font-bold">
                      {step.number}
                    </div>
                    
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-500/10 transition-colors border border-zinc-700/50 group-hover:border-blue-500/30" style={{ backgroundColor: '#333333' }}>
                      <step.icon className="w-7 h-7 text-blue-400" />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

 
          </section>

          {/* Earnings Highlight */}
          <section className="py-16 relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 p-[1px]"
            >
              <div className="relative rounded-[2.5rem] p-8 md:p-12 lg:p-16" style={{ backgroundColor: '#222222' }}>
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                  <div className="text-center lg:text-left">
                    <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4">
                      Une vidéo peut te rapporter jusqu'à <span className="text-blue-400">150€</span> (ou plus).
                    </h3>
                    <p className="text-zinc-400 text-lg max-w-xl">
                      Simple. Transparent. Pas de minimum. Tu postes, on track, tu gagnes.
                    </p>
                  </div>
                  <Link to="/register">
                    <Button className="rounded-full px-8 py-4 bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-base shadow-2xl shadow-white/10 hover:shadow-white/20 transition-all group whitespace-nowrap">
                      Commencer
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full blur-[80px] pointer-events-none" />
              </div>
            </motion.div>
          </section>

          {/* Videos Section */}
          <section id="videos" className="py-24 relative z-10">
            <div className="text-center mb-12">
              <motion.span 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-block text-blue-400 text-sm font-bold uppercase tracking-widest mb-4"
              >
                Nos créateurs
              </motion.span>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4"
              >
                Ils parlent de <span className="text-blue-400">WinterMate</span>.
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-zinc-400 text-lg max-w-xl mx-auto"
              >
                Et ils gagnent de l'argent en le faisant.
              </motion.p>
            </div>
            
            <VideoSlider videos={featuredVideos} />
          </section>

          {/* Final CTA */}
          <section className="py-24 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6">
                Prêt à rider et gagner ?
              </h2>
              <p className="text-zinc-400 text-lg mb-10 max-w-md mx-auto">
                Rejoins 200+ créateurs qui monétisent déjà leur passion pour le ski.
              </p>
              <Link to="/register">
                <Button className="rounded-full px-10 py-5 bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all group border-0">
                  Rejoindre maintenant
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-700/30 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <WinterMateLogo className="h-6 w-auto opacity-60" />
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-zinc-500">
            <a href="#" className="hover:text-white transition-colors">À propos</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
            <Link to="/privacy-policy" className="hover:text-white transition-colors">Confidentialité</Link>
          </div>
          <p className="text-sm text-zinc-600">© 2025 WinterMate</p>
        </div>
      </footer>
    </div>
  );
};
