import { ArrowUpRight, Eye, TrendingUp, Play } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { ConicGradientButton } from '@/components/ui/conic-gradient-button';
import { ExpandableButton } from '@/components/ui/expandable-button';

const chartData = [
  { name: 'Jan', value: 30 },
  { name: 'Fév', value: 45 },
  { name: 'Mar', value: 35 },
  { name: 'Avr', value: 60 },
  { name: 'Mai', value: 55 },
  { name: 'Juin', value: 85 },
  { name: 'Juil', value: 75 },
];

export function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    },
  };

  return (
    <div className="relative pt-8 pb-6 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          
          {/* Hero Content */}
          <div className="text-center mb-4 relative z-10">
            {/* Animated Shiny Badge */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center mb-6"
            >
              <ConicGradientButton href="/register">
                 <div className="flex items-center gap-2 text-sm text-blue-400">
                     <span className="relative flex h-2 w-2">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400"></span>
                     </span>
                     <span className="whitespace-nowrap font-medium">Campagne hiver 2025 ouverte</span>
                     <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-0.5 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5"><path d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                  </div>
              </ConicGradientButton>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              {/* Main Headline - Short & Punchy */}
              <motion.h1 
                variants={itemVariants}
                className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 tracking-tight leading-[0.95] drop-shadow-2xl"
              >
                <span className="block">Ski.</span>
                <span className="block">Film.</span>
                <span className="block text-blue-400">Get Paid.</span>
              </motion.h1>

              {/* Subheadline - One liner */}
              <motion.p 
                variants={itemVariants}
                className="text-xl md:text-2xl text-white/90 max-w-xl mx-auto mb-8 font-light"
              >
                Créez du contenu TikTok pour <span className="font-semibold text-blue-400">WinterMate</span>.
                <br className="hidden md:block" />
                Plus ta vidéo performe, plus tu gagnes.
              </motion.p>

              {/* Stats Bar - Social Proof */}
              <motion.div 
                variants={itemVariants}
                className="flex flex-wrap justify-center gap-6 md:gap-10 mb-10"
              >
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-black text-white">2M+</div>
                  <div className="text-sm text-white/60 uppercase tracking-wider">Vues générées</div>
                </div>
                <div className="w-px h-12 bg-white/20 hidden md:block" />
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-black text-blue-400">15K€</div>
                  <div className="text-sm text-white/60 uppercase tracking-wider">Distribués</div>
                </div>
                <div className="w-px h-12 bg-white/20 hidden md:block" />
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-black text-white">200+</div>
                  <div className="text-sm text-white/60 uppercase tracking-wider">Créateurs</div>
                </div>
              </motion.div>

              {/* CTA Section */}
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-20 mb-4">
                  <ExpandableButton href="/register">
                    Rejoindre la campagne
                  </ExpandableButton>
                  <a 
                    href="#videos" 
                    className="group flex items-center gap-2 px-6 py-3 text-white/80 hover:text-white transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <Play className="w-4 h-4 fill-current" />
                    </div>
                    <span className="font-medium">Voir les vidéos</span>
                  </a>
              </motion.div>
            </motion.div>
          </div>

          {/* Hero Visuals - Floating Dashboard */}
          <motion.div 
            initial={{ opacity: 0, rotateX: 20, y: 50, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              rotateX: 9.2, 
              y: -37, 
              scale: 0.9,
              transition: { 
                duration: 1.2, 
                ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
                delay: 0.6
              }
            }}
            style={{ 
              perspective: 1000,
              transformStyle: "preserve-3d",
            }}
            className="relative max-w-5xl mx-auto h-[500px] mb-0 hidden md:block"
          >
            {/* Center Main Chart Card */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] h-[360px] backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border border-zinc-700/50 z-20 p-8 flex flex-col" style={{ backgroundColor: 'rgba(34, 34, 34, 0.95)' }}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-400 mb-1">Tes revenus ce mois</h3>
                  <div className="text-4xl font-black text-white">847,50 €</div>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-sm bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                  <TrendingUp className="w-4 h-4" />
                  +34%
                </div>
              </div>
              
              {/* Chart */}
              <div className="flex-1 w-full -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      fill="url(#colorGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex justify-between text-xs text-zinc-500 px-2 mt-2 font-medium">
                <span>Jan</span>
                <span>Fév</span>
                <span>Mar</span>
                <span>Avr</span>
                <span>Mai</span>
                <span>Juin</span>
                <span>Juil</span>
              </div>
            </div>

            {/* Left Card - Total Balance */}
            <div className="absolute left-[8%] top-[45%] -translate-y-1/2 w-[200px] border border-zinc-700/50 rounded-2xl shadow-[0_20px_40px_-12px_rgba(0,0,0,0.4)] z-10 p-5 animate-in slide-in-from-left-10 duration-1000" style={{ backgroundColor: '#222222' }}>
              <div className="text-xs text-zinc-400 mb-1 uppercase tracking-wider">Total gagné</div>
              <div className="text-2xl font-black text-white mb-2">3,245 €</div>
              <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: '#333333' }}>
                <div className="h-full w-3/4 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" />
              </div>
            </div>

            {/* Right Card 1 - Active Campaigns */}
            <div className="absolute right-[10%] top-[30%] w-[180px] border border-zinc-700/50 rounded-2xl shadow-[0_20px_40px_-12px_rgba(0,0,0,0.4)] z-10 p-5 animate-in slide-in-from-right-10 duration-1000 delay-100" style={{ backgroundColor: '#222222' }}>
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs text-zinc-400 uppercase tracking-wider">Campagnes</span>
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                   <ArrowUpRight className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <div className="text-3xl font-black text-white">3</div>
              <div className="text-xs text-zinc-500">actives</div>
            </div>

            {/* Right Card 2 - Total Views */}
            <div className="absolute right-[10%] top-[58%] w-[180px] bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-[0_20px_40px_-12px_rgba(59,130,246,0.4)] z-30 p-5 animate-in slide-in-from-right-10 duration-1000 delay-200">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs text-white/80 uppercase tracking-wider">Vues</span>
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                   <Eye className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <div className="text-3xl font-black text-white">1.5M</div>
              <div className="text-xs text-white/70">ce mois</div>
            </div>

            {/* Decorative Blur behind main card */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-blue-500/20 rounded-full blur-[100px] -z-10" />

            {/* Floating Platform Logo - TikTok */}
            <div className="absolute -left-[3%] top-[18%] w-[70px] h-[70px] border border-zinc-700/50 rounded-2xl shadow-2xl flex items-center justify-center animate-[float_6s_ease-in-out_infinite] z-30" style={{ backgroundColor: '#222222' }}>
              <img 
                src="https://sf-tb-sg.ibytedtos.com/obj/eden-sg/uhtyvueh7nulogpoguhm/tiktok-icon2.png" 
                alt="TikTok" 
                className="w-9 h-9 object-contain"
              />
            </div>
          </motion.div>
        </div>
    </div>
  );
}
