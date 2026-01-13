import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { useRegister } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthPageLayout } from '@/layouts/auth-page-layout';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { code: referralCodeFromUrl } = useParams<{ code?: string }>();
  const login = useAuthStore((s) => s.login);
  const { mutateAsync: registerMutation, isPending, isError } = useRegister();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    referralCode: ''
  });

  // Préremplir le code de parrainage depuis l'URL
  useEffect(() => {
    if (referralCodeFromUrl) {
      setFormData(prev => ({ ...prev, referralCode: referralCodeFromUrl.toUpperCase() }));
    }
  }, [referralCodeFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await registerMutation({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        referralCode: formData.referralCode || undefined,
      });
      login(data.user, data.token);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AuthPageLayout
      title="Créer un compte 🚀"
      subtitle="Rejoignez le programme ambassadeurs Down dès aujourd'hui."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {isError && (
          <div className="p-4 text-sm text-red-400 bg-red-500/10 rounded-xl border border-red-500/20 backdrop-blur-sm">
            Une erreur est survenue lors de l'inscription.
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Prénom</label>
            <Input
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
              className="h-12 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#0EA5E9] focus:ring-[#0EA5E9]/20"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Nom</label>
            <Input
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
              className="h-12 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#0EA5E9] focus:ring-[#0EA5E9]/20"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Email</label>
          <Input
            type="email"
            placeholder="nom@exemple.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="h-12 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#0EA5E9] focus:ring-[#0EA5E9]/20"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Mot de passe</label>
          <Input
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            className="h-12 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#0EA5E9] focus:ring-[#0EA5E9]/20"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Téléphone</label>
          <Input
            type="tel"
            placeholder="+33 6 12 34 56 78"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
            className="h-12 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#0EA5E9] focus:ring-[#0EA5E9]/20"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">
            Code de parrainage <span className="text-slate-500 font-normal">(optionnel)</span>
          </label>
          <Input
            value={formData.referralCode}
            onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
            placeholder="ABC123"
            className="h-12 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#0EA5E9] focus:ring-[#0EA5E9]/20 uppercase disabled:opacity-50 disabled:cursor-not-allowed"
            maxLength={6}
            disabled={!!referralCodeFromUrl}
          />
          {referralCodeFromUrl && (
            <p className="text-xs text-[#0EA5E9] mt-1">
              Code de parrainage appliqué automatiquement
            </p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full h-12 text-base font-bold mt-2 bg-[#0EA5E9] hover:bg-[#0284C7] text-white shadow-lg shadow-[#0EA5E9]/20 hover:shadow-[#0EA5E9]/30 transition-all" 
          disabled={isPending}
        >
          {isPending ? 'Création...' : 'Créer mon compte'}
        </Button>

        <p className="text-center text-sm text-slate-400 mt-6">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-[#0EA5E9] font-semibold hover:text-[#0284C7] transition-colors">
            Se connecter
          </Link>
        </p>
      </form>
    </AuthPageLayout>
  );
};
