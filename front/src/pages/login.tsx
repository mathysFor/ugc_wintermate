import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { useLogin } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthPageLayout } from '@/layouts/auth-page-layout';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const { mutateAsync: loginMutation, isPending, isError } = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await loginMutation({ email, password });
      login(data.user, data.token);
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AuthPageLayout
      title="Bon retour 👋"
      subtitle="Entrez vos identifiants pour accéder à votre espace."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {isError && (
          <div className="p-4 text-sm text-red-400 bg-red-500/10 rounded-xl border border-red-500/20 backdrop-blur-sm">
            Email ou mot de passe incorrect.
          </div>
        )}
        
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Email</label>
          <Input
            type="email"
            placeholder="nom@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#0EA5E9] focus:ring-[#0EA5E9]/20"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Mot de passe</label>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-12 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#0EA5E9] focus:ring-[#0EA5E9]/20"
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-slate-400 cursor-pointer hover:text-slate-300 transition-colors">
            <input type="checkbox" className="rounded border-slate-600 bg-slate-900/50 text-[#0EA5E9] accent-[#0EA5E9] focus:ring-[#0EA5E9]/20" />
            Se souvenir de moi
          </label>
          <a href="#" className="text-[#0EA5E9] hover:text-[#0284C7] transition-colors">Mot de passe oublié ?</a>
        </div>

        <Button 
          type="submit" 
          className="w-full h-12 text-base font-bold bg-[#0EA5E9] hover:bg-[#0284C7] text-white shadow-lg shadow-[#0EA5E9]/20 hover:shadow-[#0EA5E9]/30 transition-all" 
          disabled={isPending}
        >
          {isPending ? 'Connexion...' : 'Se connecter'}
        </Button>

        <p className="text-center text-sm text-slate-400 mt-6">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-[#0EA5E9] font-semibold hover:text-[#0284C7] transition-colors">
            S'inscrire
          </Link>
        </p>
      </form>
    </AuthPageLayout>
  );
};
