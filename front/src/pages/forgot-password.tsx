import { useForgotPassword } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthPageLayout } from '@/layouts/auth-page-layout';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export const ForgotPasswordPage = () => {
  const { mutateAsync: forgotMutation, isPending, isError, isSuccess } = useForgotPassword();
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await forgotMutation({ email: email.trim() });
    } catch (err) {
      console.error(err);
    }
  };

  if (isSuccess) {
    return (
      <AuthPageLayout
        title="Email envoyé"
        subtitle="Si cet email est connu, vous recevrez un lien pour réinitialiser votre mot de passe."
      >
        <div className="space-y-5">
          <p className="text-sm text-slate-400">
            Pensez à vérifier vos spams si vous ne voyez pas l'email.
          </p>
          <Link
            to="/login"
            className="inline-block w-full text-center h-12 leading-12 text-base font-bold text-[#0EA5E9] hover:text-[#0284C7] transition-colors"
          >
            Retour à la connexion
          </Link>
        </div>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout
      title="Mot de passe oublié"
      subtitle="Entrez votre email pour recevoir un lien de réinitialisation."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {isError && (
          <div className="p-4 text-sm text-red-400 bg-red-500/10 rounded-xl border border-red-500/20 backdrop-blur-sm">
            Une erreur est survenue. Réessayez plus tard.
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

        <Button
          type="submit"
          className="w-full h-12 text-base font-bold bg-[#0EA5E9] hover:bg-[#0284C7] text-white shadow-lg shadow-[#0EA5E9]/20 hover:shadow-[#0EA5E9]/30 transition-all"
          disabled={isPending}
        >
          {isPending ? 'Envoi...' : 'Envoyer le lien'}
        </Button>

        <p className="text-center text-sm text-slate-400 mt-6">
          <Link to="/login" className="text-[#0EA5E9] font-semibold hover:text-[#0284C7] transition-colors">
            Retour à la connexion
          </Link>
        </p>
      </form>
    </AuthPageLayout>
  );
};
