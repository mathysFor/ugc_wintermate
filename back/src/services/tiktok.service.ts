/**
 * Service TikTok - Gestion des interactions avec l'API TikTok
 * OAuth, tokens, vidéos, statistiques
 */

import * as crypto from 'crypto';

// ============================================
// TYPES INTERNES
// ============================================

interface TiktokTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  open_id: string;
  scope: string;
  token_type: string;
}

interface TiktokUserInfoResponse {
  data: {
    user: {
      open_id: string;
      union_id: string;
      avatar_url: string;
      avatar_url_100: string;
      avatar_large_url: string;
      display_name: string;
      bio_description: string;
      profile_deep_link: string;
      is_verified: boolean;
      username: string;
      follower_count: number;
      following_count: number;
      likes_count: number;
      video_count: number;
    };
  };
  error: {
    code: string;
    message: string;
    log_id: string;
  };
}

interface TiktokVideoListResponse {
  data: {
    videos: Array<{
      id: string;
      title: string;
      video_description: string;
      cover_image_url: string;
      share_url: string;
      embed_link: string;
      create_time: number;
      duration: number;
    }>;
    cursor: number;
    has_more: boolean;
  };
  error: {
    code: string;
    message: string;
    log_id: string;
  };
}

interface TiktokVideoQueryResponse {
  data: {
    videos: Array<{
      id: string;
      title: string;
      video_description: string;
      cover_image_url: string;
      share_url: string;
      create_time: number;
      view_count: number;
      like_count: number;
      comment_count: number;
      share_count: number;
    }>;
  };
  error: {
    code: string;
    message: string;
    log_id: string;
  };
}

// ============================================
// CONFIGURATION
// ============================================

const TIKTOK_AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize/';
const TIKTOK_TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';
const TIKTOK_USER_INFO_URL = 'https://open.tiktokapis.com/v2/user/info/';
const TIKTOK_VIDEO_LIST_URL = 'https://open.tiktokapis.com/v2/video/list/';
const TIKTOK_VIDEO_QUERY_URL = 'https://open.tiktokapis.com/v2/video/query/';

// Scopes disponibles sur l'app TikTok
const REQUIRED_SCOPES = [
  'user.info.profile',
  'user.info.stats',
  'video.list',
];

// ============================================
// HELPERS
// ============================================

/**
 * Génère un state aléatoire pour la protection CSRF
 */
function generateState(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Génère un code_verifier pour PKCE (43-128 caractères)
 */
function generateCodeVerifier(): string {
  // Base64url encoding sans padding
  return crypto.randomBytes(32)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Génère le code_challenge à partir du code_verifier (SHA256 + base64url)
 */
async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const hash = crypto.createHash('sha256').update(codeVerifier).digest();
  // Base64url encoding sans padding
  return hash
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Récupère les variables d'environnement TikTok
 * @param useApp1 Si true, utilise TIKTOK_APP_1_* credentials, sinon utilise TIKTOK_* credentials
 */
function getConfig(useApp1?: boolean) {
  let clientKey: string | undefined;
  let clientSecret: string | undefined;
  let redirectUri: string | undefined;

  if (useApp1 === true) {
    clientKey = process.env.TIKTOK_APP_1_CLIENT_KEY;
    clientSecret = process.env.TIKTOK_APP_1_CLIENT_SECRET;
    redirectUri = process.env.TIKTOK_APP_1_REDIRECT_URI;

    if (!clientKey || !clientSecret || !redirectUri) {
      throw new Error('Configuration TikTok APP_1 manquante. Vérifiez TIKTOK_APP_1_CLIENT_KEY, TIKTOK_APP_1_CLIENT_SECRET et TIKTOK_APP_1_REDIRECT_URI');
    }
  } else {
    clientKey = process.env.TIKTOK_CLIENT_KEY;
    clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    redirectUri = process.env.TIKTOK_REDIRECT_URI;

    if (!clientKey || !clientSecret || !redirectUri) {
      throw new Error('Configuration TikTok manquante. Vérifiez TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET et TIKTOK_REDIRECT_URI');
    }
  }

  return { clientKey, clientSecret, redirectUri };
}

// ============================================
// SERVICE TIKTOK
// ============================================

export const tiktokService = {
  /**
   * Génère l'URL d'autorisation OAuth TikTok avec PKCE
   * @param useApp1 Si true, utilise TIKTOK_APP_1_* credentials
   * @returns URL d'autorisation, state CSRF et code_verifier PKCE
   */
  async generateAuthUrl(useApp1?: boolean): Promise<{ authUrl: string; state: string; codeVerifier: string }> {
    const { clientKey, redirectUri } = getConfig(useApp1);
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    const params = new URLSearchParams({
      client_key: clientKey,
      redirect_uri: redirectUri,
      scope: REQUIRED_SCOPES.join(','),
      response_type: 'code',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    const authUrl = `${TIKTOK_AUTH_URL}?${params.toString()}`;

    return { authUrl, state, codeVerifier };
  },

  /**
   * Échange le code d'autorisation contre des tokens
   * @param code Code reçu de TikTok après autorisation
   * @param codeVerifier Code verifier PKCE généré lors de l'auth
   * @param useApp1 Si true, utilise TIKTOK_APP_1_* credentials
   * @returns Tokens d'accès et de rafraîchissement
   */
  async exchangeCodeForTokens(code: string, codeVerifier: string, useApp1?: boolean): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    openId: string;
  }> {
    const { clientKey, clientSecret, redirectUri } = getConfig(useApp1);

    const response = await fetch(TIKTOK_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur TikTok OAuth: ${response.status} - ${errorText}`);
    }

    const data: TiktokTokenResponse = await response.json();

    if (!data.access_token) {
      throw new Error('Réponse TikTok invalide: access_token manquant');
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      openId: data.open_id,
    };
  },

  /**
   * Renouvelle un token d'accès expiré
   * @param refreshToken Token de rafraîchissement
   * @param useApp1 Si true, utilise TIKTOK_APP_1_* credentials
   * @returns Nouveaux tokens
   */
  async refreshAccessToken(refreshToken: string, useApp1?: boolean): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const { clientKey, clientSecret } = getConfig(useApp1);

    const response = await fetch(TIKTOK_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur refresh token TikTok: ${response.status} - ${errorText}`);
    }

    const data: TiktokTokenResponse = await response.json();

    if (!data.access_token) {
      throw new Error('Réponse TikTok invalide lors du refresh');
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  },

  /**
   * Récupère les informations de l'utilisateur TikTok
   * Scopes requis: user.info.profile, user.info.stats
   * @param accessToken Token d'accès valide
   * @param openId Open ID de l'utilisateur (récupéré depuis le token)
   * @returns Informations du profil utilisateur
   */
  async getUserInfo(accessToken: string, openId: string): Promise<{
    openId: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    followerCount: number;
    followingCount: number;
    likesCount: number;
    videoCount: number;
  }> {
    // Champs disponibles avec user.info.profile et user.info.stats
    // (sans user.info.basic, open_id n'est pas dispo via cet endpoint)
    const fields = [
      'avatar_url',
      'display_name',
      'username',
      'bio_description',
      'is_verified',
      'follower_count',
      'following_count',
      'likes_count',
      'video_count',
    ].join(',');

    const response = await fetch(`${TIKTOK_USER_INFO_URL}?fields=${fields}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur récupération user info TikTok: ${response.status} - ${errorText}`);
    }

    const data: TiktokUserInfoResponse = await response.json();

    if (data.error?.code && data.error.code !== 'ok') {
      throw new Error(`Erreur TikTok: ${data.error.message}`);
    }

    const user = data.data.user;

    return {
      openId, // Passé en paramètre car non dispo sans user.info.basic
      username: user.username || user.display_name,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      followerCount: user.follower_count || 0,
      followingCount: user.following_count || 0,
      likesCount: user.likes_count || 0,
      videoCount: user.video_count || 0,
    };
  },

  /**
   * Récupère la liste des vidéos d'un utilisateur
   * @param accessToken Token d'accès valide
   * @param cursor Cursor pour pagination (optionnel)
   * @param maxCount Nombre max de vidéos (défaut: 20, max: 20)
   * @returns Liste des vidéos avec pagination
   */
  async getUserVideos(
    accessToken: string,
    cursor?: number,
    maxCount: number = 20
  ): Promise<{
    videos: Array<{
      id: string;
      title: string;
      description: string;
      coverImageUrl: string;
      shareUrl: string;
      embedLink: string;
      createdAt: string;
      duration: number;
    }>;
    cursor: number | null;
    hasMore: boolean;
  }> {
    const fields = [
      'id',
      'title',
      'video_description',
      'cover_image_url',
      'share_url',
      'embed_link',
      'create_time',
      'duration',
    ].join(',');

    const body: Record<string, unknown> = {
      max_count: Math.min(maxCount, 20),
    };

    if (cursor) {
      body.cursor = cursor;
    }

    const response = await fetch(`${TIKTOK_VIDEO_LIST_URL}?fields=${fields}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur récupération vidéos TikTok: ${response.status} - ${errorText}`);
    }

    const data: TiktokVideoListResponse = await response.json();
    console.log('[TikTok API] Video list response:', JSON.stringify(data, null, 2));

    if (data.error?.code && data.error.code !== 'ok') {
      throw new Error(`Erreur TikTok: ${data.error.message}`);
    }

    const videos = (data.data.videos || []).map((video) => ({
      id: video.id,
      title: video.title || '',
      description: video.video_description || '',
      coverImageUrl: video.cover_image_url || '',
      shareUrl: video.share_url || '',
      embedLink: video.embed_link || '',
      createdAt: new Date(video.create_time * 1000).toISOString(),
      duration: video.duration || 0,
    }));

    return {
      videos,
      cursor: data.data.has_more ? data.data.cursor : null,
      hasMore: data.data.has_more || false,
    };
  },

  /**
   * Récupère les statistiques de vidéos spécifiques
   * @param accessToken Token d'accès valide
   * @param videoIds Liste des IDs de vidéos
   * @returns Statistiques des vidéos
   */
  async getVideoStats(
    accessToken: string,
    videoIds: string[]
  ): Promise<
    Array<{
      id: string;
      views: number;
      likes: number;
      comments: number;
      shares: number;
      coverImageUrl: string | null;
    }>
  > {
    if (videoIds.length === 0) {
      return [];
    }

    // L'API TikTok limite à 20 vidéos par requête
    const batchSize = 20;
    const results: Array<{
      id: string;
      views: number;
      likes: number;
      comments: number;
      shares: number;
      coverImageUrl: string | null;
    }> = [];

    for (let i = 0; i < videoIds.length; i += batchSize) {
      const batch = videoIds.slice(i, i + batchSize);

      const fields = [
        'id',
        'view_count',
        'like_count',
        'comment_count',
        'share_count',
        'cover_image_url',
      ].join(',');

      const response = await fetch(`${TIKTOK_VIDEO_QUERY_URL}?fields=${fields}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters: {
            video_ids: batch,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erreur récupération stats vidéos TikTok: ${response.status} - ${errorText}`);
        continue;
      }

      const data: TiktokVideoQueryResponse = await response.json();

      if (data.error?.code && data.error.code !== 'ok') {
        console.error(`Erreur TikTok stats: ${data.error.message}`);
        continue;
      }

      for (const video of data.data.videos || []) {
        results.push({
          id: video.id,
          views: video.view_count || 0,
          likes: video.like_count || 0,
          comments: video.comment_count || 0,
          shares: video.share_count || 0,
          coverImageUrl: video.cover_image_url || null,
        });
      }
    }

    return results;
  },

  /**
   * Vérifie si un token est expiré ou proche de l'expiration
   * @param expiresAt Date d'expiration
   * @param bufferMinutes Minutes de marge (défaut: 5)
   * @returns true si le token doit être rafraîchi
   */
  isTokenExpired(expiresAt: Date, bufferMinutes: number = 5): boolean {
    const now = new Date();
    const buffer = bufferMinutes * 60 * 1000;
    return now.getTime() >= expiresAt.getTime() - buffer;
  },
};

export default tiktokService;

