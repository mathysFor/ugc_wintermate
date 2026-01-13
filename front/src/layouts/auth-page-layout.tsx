import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { DownSkisLogo } from '@/components/down-skis-logo';

interface AuthPageLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export const AuthPageLayout = ({ children, title, subtitle }: AuthPageLayoutProps) => {
  return (
    <div className="min-h-screen flex bg-slate-950 font-sans">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background with Image and Gradient Overlay */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
            style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1605540436563-5bca919ae766?q=80&w=2069&auto=format&fit=crop")' }}
          />
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, rgba(2, 6, 23, 0.5) 0%, rgba(2, 6, 23, 0.8) 60%, rgba(2, 6, 23, 1) 100%)'
            }}
          />
          {/* Noise texture overlay */}
          <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%" height="100%" filter="url(%23noise)"/%3E%3C/svg%3E")' }} />
        </div>
        
        <div className="relative z-10 w-full h-full flex flex-col justify-between p-12 text-white">
          <div>
            <div className="mb-8">
              <DownSkisLogo className="h-8 w-auto text-white" />
            </div>
            <p className="text-4xl font-black max-w-md leading-tight mb-4">
              Rejoignez le programme ambassadeurs <span className="text-[#0EA5E9]">Down Skis</span> et monétisez votre passion pour le ski.
            </p>
            <p className="text-lg text-slate-300 max-w-md">
              Partagez votre amour du ski et générez des revenus avec vos vidéos TikTok.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
            <p className="text-lg mb-4">"Grâce à Down Skis, j'ai pu partager ma passion pour le ski et générer des revenus complémentaires avec mes vidéos TikTok."</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0EA5E9]/20 flex items-center justify-center font-bold text-[#0EA5E9] border border-[#0EA5E9]/30">
                L
              </div>
              <div>
                <p className="font-semibold">Lucas D.</p>
                <p className="text-sm text-slate-300">Ambassadeur Down Skis</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 lg:px-24 py-12 bg-slate-950">
        <div className="max-w-md mx-auto w-full">
          <div className="mb-10">
            <Link to="/" className="lg:hidden inline-block mb-8">
              <DownSkisLogo className="h-8 w-auto text-white" />
            </Link>
            <p className="text-3xl font-black text-white mb-2">{title}</p>
            <p className="text-slate-400">{subtitle}</p>
          </div>
          
          {children}
        </div>
      </div>
    </div>
  );
};
