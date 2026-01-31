/**
 * Service d'envoi d'emails transactionnels (reset mot de passe, etc.)
 * Utilise Resend si RESEND_API_KEY est défini, sinon log en dev pour tester le flux.
 */

import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM ?? 'onboarding@resend.dev';

function getClient(): Resend | null {
  if (!RESEND_API_KEY) return null;
  return new Resend(RESEND_API_KEY);
}

/**
 * Envoie l'email de réinitialisation de mot de passe.
 * Si RESEND_API_KEY n'est pas défini, log le lien en console (dev).
 */
export async function sendPasswordResetEmail(
  to: string,
  resetLink: string
): Promise<void> {
  const client = getClient();

  if (!client) {
    console.log('[Email] RESEND_API_KEY not set. Reset link (dev):', resetLink);
    return;
  }

  try {
    await client.emails.send({
      from: RESEND_FROM,
      to: [to],
      subject: 'Réinitialisation de votre mot de passe',
      html: `
        <p>Bonjour,</p>
        <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous :</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>Ce lien expire dans 1 heure.</p>
        <p>Si vous n'avez pas fait cette demande, ignorez cet email.</p>
      `,
    });
  } catch (error) {
    console.error('[Email] sendPasswordResetEmail failed:', error);
    throw error;
  }
}
