/**
 * Service Cloudflare R2 - Gestion du stockage de fichiers
 * Compatible avec l'API S3
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import * as crypto from 'crypto';

// ============================================
// CONFIGURATION
// ============================================

/**
 * Récupère les variables d'environnement Cloudflare R2
 */
function getConfig() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
    throw new Error(
      'Configuration Cloudflare R2 manquante. Vérifiez R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME et R2_PUBLIC_URL'
    );
  }

  return { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl };
}

/**
 * Crée un client S3 configuré pour Cloudflare R2
 */
function createS3Client(): S3Client {
  const { accountId, accessKeyId, secretAccessKey } = getConfig();

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

// ============================================
// TYPES
// ============================================

/**
 * Dossiers de stockage disponibles
 */
export type StorageFolder = 'invoices' | 'brands/logos' | 'campaigns/covers';

// ============================================
// HELPERS
// ============================================

/**
 * Génère un nom de fichier unique avec timestamp et UUID
 * @param originalName Nom original du fichier
 * @param folder Dossier de destination
 * @returns Nom de fichier unique avec chemin complet
 */
function generateUniqueFileName(originalName: string, folder: StorageFolder = 'invoices'): string {
  const timestamp = Date.now();
  const randomId = crypto.randomUUID();
  const extension = originalName.split('.').pop() || 'bin';
  const sanitizedName = originalName
    .replace(/\.[^/.]+$/, '') // Enlève l'extension
    .replace(/[^a-zA-Z0-9-_]/g, '_') // Remplace les caractères spéciaux
    .substring(0, 50); // Limite la longueur

  return `${folder}/${timestamp}-${randomId}-${sanitizedName}.${extension}`;
}

// ============================================
// SERVICE CLOUDFLARE R2
// ============================================

export const cloudflareR2Service = {
  /**
   * Upload un fichier vers Cloudflare R2
   * @param buffer Contenu du fichier
   * @param fileName Nom original du fichier
   * @param contentType Type MIME du fichier
   * @param folder Dossier de destination (par défaut: invoices)
   * @returns URL publique du fichier uploadé
   */
  async uploadFile(
    buffer: Buffer,
    fileName: string,
    contentType: string,
    folder: StorageFolder = 'invoices'
  ): Promise<string> {
    const { bucketName, publicUrl } = getConfig();
    const client = createS3Client();

    const key = generateUniqueFileName(fileName, folder);

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await client.send(command);

    // Retourne l'URL publique du fichier
    return `${publicUrl}/${key}`;
  },

  /**
   * Supprime un fichier de Cloudflare R2
   * @param fileUrl URL publique du fichier ou clé
   */
  async deleteFile(fileUrl: string): Promise<void> {
    const { bucketName, publicUrl } = getConfig();
    const client = createS3Client();

    // Extrait la clé de l'URL si c'est une URL complète
    const key = fileUrl.startsWith(publicUrl)
      ? fileUrl.replace(`${publicUrl}/`, '')
      : fileUrl;

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await client.send(command);
  },

  /**
   * Génère un nom de fichier unique (exposé pour tests)
   */
  generateUniqueFileName,
};

export default cloudflareR2Service;

