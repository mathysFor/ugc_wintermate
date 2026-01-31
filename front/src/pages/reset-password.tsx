import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useResetPassword } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthPageLayout } from '@/layouts/auth-page-layout';
import { useState } from 'react';

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { mutateAsync: resetMutation, isPending, isError } = useResetPassword();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (newPassword !== confirmPassword) return;
    try {
      await resetMutation({ token, newPassword });
      navigate('/login', { replace: true, state: { message: 'Mot de passe mis à jour.' } });
    } catch (err) {
      console.error(err);
    }
  };

  if (!token) {
    return (
      <AuthPageLayout
        title="Lien invalide"
        subtitle="Ce lien de réinitialisation est absent ou invalide."
      >
        <div className="space-y-5">
          <p className="text-sm text-slate-400">
            Demandez un nouveau lien depuis la page mot de passe oublié.
          </p>
          <Link
            to="/forgot-password"
            className="inline-block w-full text-center h-12 leading-12 text-base font-bold text-[#0EA5E9] hover:text-[#0284C7] transition-colors"
          >
            Mot de passe oublié
          </Link>
          <p className="text-center text-sm text-slate-400">
            <Link to="/login" className="text-[#0EA5E9] font-semibold hover:text-[#0284C7] transition-colors">
              Retour à la connexion
            </Link>
          </p>
        </div>
      </AuthPageLayout>
    );
  }

  const passwordsMatch = newPassword === confirmPassword;
  const canSubmit = newPassword.length >= 6 && passwordsMatch;

  return (
    <AuthPageLayout
      title="Nouveau mot de passe"
      subtitle="Choisissez un nouveau mot de passe sécurisé."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {isError && (
          <div className="p-4 text-sm text-red-400 bg-red-500/10 rounded-xl border border-red-500/20 backdrop-blur-sm">
            Lien expiré ou invalide. Demandez un nouveau lien.
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Nouveau mot de passe</label>
          <Input
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            className="h-12 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#0EA5E9] focus:ring-[#0EA5E9]/20"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Confirmer le mot de passe</label>
          <Input
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="h-12 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#0EA5E9] focus:ring-[#0EA5E9]/20"
          />
          {confirmPassword && !passwordsMatch && (
            <p className="text-sm text-red-400">Les mots de passe ne correspondent pas.</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-12 text-base font-bold bg-[#0EA5E9] hover:bg-[#0284C7] text-white shadow-lg shadow-[#0EA5E9]/20 hover:shadow-[#0EA5E9]/30 transition-all"
          disabled={isPending || !canSubmit}
        >
          {isPending ? 'Enregistrement...' : 'Changer le mot de passe'}
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
