import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthUser } from '@shared/types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

/**
 * Middleware d'authentification JWT
 * Vérifie le token et ajoute l'utilisateur à la requête
 */
export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/0c586d17-ebe2-41ba-8e31-f4aeee668c22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.middleware.ts:15',message:'authMiddleware called',data:{method:req.method,path:req.path,url:req.url,hasAuthHeader:!!req.headers.authorization},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/0c586d17-ebe2-41ba-8e31-f4aeee668c22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.middleware.ts:19',message:'Auth failed - no token',data:{path:req.path},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    res.status(401).json({ error: 'Token manquant', code: 'NO_TOKEN' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token invalide', code: 'INVALID_TOKEN' });
  }
};

// Alias pour la rétrocompatibilité
export const authenticateJWT = authMiddleware;
