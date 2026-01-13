import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTiktokCallback } from '@/api/tiktok';
import { queryClient } from '@/api/query-config';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export const TiktokCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const { mutateAsync: processCallback } = useTiktokCallback({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok'] });
    },
  });

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        setStatus('error');
        setErrorMessage(errorDescription || `Erreur TikTok: ${error}`);
        return;
      }

      if (!code) {
        setStatus('error');
        setErrorMessage('Code OAuth manquant');
        return;
      }

      const savedState = sessionStorage.getItem('tiktok_oauth_state');
      if (!savedState || savedState !== state) {
        setStatus('error');
        setErrorMessage('Erreur de sécurité (State mismatch)');
        return;
      }

      const codeVerifier = sessionStorage.getItem('tiktok_code_verifier');
      if (!codeVerifier) {
        setStatus('error');
        setErrorMessage('Erreur de sécurité (Verifier manquant)');
        return;
      }

      sessionStorage.removeItem('tiktok_oauth_state');
      sessionStorage.removeItem('tiktok_code_verifier');

      try {
        await processCallback({ code, state: state || '', codeVerifier });
        setStatus('success');
        setTimeout(() => {
          navigate('/profile', { replace: true });
        }, 2000);
      } catch (err) {
        setStatus('error');
        setErrorMessage(
          err instanceof Error ? err.message : 'Erreur lors de la connexion'
        );
      }
    };

    handleCallback();
  }, [searchParams, processCallback, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <CardContent className="p-8 text-center">
        {status === 'loading' && (
            <div className="space-y-4">
              <Loader2 className="w-12 h-12 text-[#ED5D3B] animate-spin mx-auto" />
              <p className="text-xl font-bold text-slate-900">Connexion en cours...</p>
              <p className="text-slate-500">Nous finalisons la liaison avec TikTok.</p>
            </div>
        )}

        {status === 'success' && (
            <div className="space-y-4">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
              <p className="text-xl font-bold text-slate-900">Succès !</p>
              <p className="text-slate-500">Compte connecté avec succès. Redirection...</p>
            </div>
        )}

        {status === 'error' && (
            <div className="space-y-4">
              <XCircle className="w-12 h-12 text-red-500 mx-auto" />
              <p className="text-xl font-bold text-slate-900">Erreur</p>
              <p className="text-red-600 bg-red-50 p-3 rounded-lg text-sm">{errorMessage}</p>
              <Button 
                onClick={() => navigate('/profile', { replace: true })}
                className="w-full rounded-xl"
              >
                Retour au profil
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
