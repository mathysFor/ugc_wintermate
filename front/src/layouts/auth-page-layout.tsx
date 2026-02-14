import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { WinterMateLogo } from '@/components/wintermate-logo';

interface AuthPageLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export const AuthPageLayout = ({ children, title, subtitle }: AuthPageLayoutProps) => {
  return (
    <div className="min-h-screen flex bg-zinc-950 font-sans">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background with Image and Gradient Overlay */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
            style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1551524559-8af4e6624178?q=80&w=2126&auto=format&fit=crop")' }}
          />
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, rgba(9, 9, 11, 0.5) 0%, rgba(9, 9, 11, 0.8) 60%, rgba(9, 9, 11, 1) 100%)'
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
        
        <div className="relative z-10 w-full h-full flex flex-col justify-between p-12 text-white">
          <div>
            <div className="mb-8">
              <WinterMateLogo className="h-10 w-auto" />
            </div>
            <p className="text-4xl font-black max-w-md leading-tight mb-4">
              Rejoignez le programme créateurs <span className="text-blue-400">Winter Mate</span> et monétisez votre passion pour le ski.
            </p>
            <p className="text-lg text-zinc-300 max-w-md">
              Partagez votre amour du ski et générez des revenus avec vos vidéos TikTok.
            </p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-zinc-700/50">
            <p className="text-lg mb-4">"Grâce à Winter Mate, j'ai pu partager ma passion pour le ski et générer des revenus complémentaires avec mes vidéos TikTok."</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center font-bold text-blue-400 border border-blue-500/30">
                L
              </div>
              <div>
                <p className="font-semibold">Lucas D.</p>
                <p className="text-sm text-zinc-400">Créateur Winter Mate</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 lg:px-24 py-12 bg-zinc-950">
        <div className="max-w-md mx-auto w-full">
          <div className="mb-10">
            <Link to="/" className="lg:hidden inline-block mb-8">
              <WinterMateLogo className="h-10 w-auto" />
            </Link>
            <p className="text-3xl font-black text-white mb-2">{title}</p>
            <p className="text-zinc-400">{subtitle}</p>
          </div>
          
          {children}
        </div>
      </div>
    </div>
  );
};
