import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useGetCampaign, useGetMyRewardsStatus } from '@/api/campaigns';
import { useUploadInvoice } from '@/api/invoices';
import { useGetTiktokAccounts, useGetTiktokVideos, useGetTiktokAuthUrl } from '@/api/tiktok';
import { useCreateSubmission, useGetPublicCampaignSubmissions, useGetSubmissions, useDeleteSubmission, useGetCampaignSubmissions, useValidateSubmission, useRefuseSubmission } from '@/api/submissions';
import { useAuthStore } from '@/stores/auth';
import { queryClient } from '@/api/query-config';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CampaignActions } from '@/components/campaign-actions';
import type { TiktokVideo, TiktokAccount } from '@shared/types/tiktok';
import type { SubmissionWithRelations } from '@shared/types/submissions';
import type { RewardStatus } from '@shared/types/rewards';
import type { AdsCodeInput } from '@shared/types/invoices';
import { 
  ArrowLeft, 
  PlayCircle, 
  Target, 
  TrendingUp, 
  Video, 
  CheckCircle2,
  Loader2,
  Eye,
  ExternalLink,
  Trash2,
  Users,
  FileVideo,
  Clock,
  Check,
  X,
  Lock,
  Upload,
  Receipt,
  FileText,
  ChevronUp,
  Gift,
  CreditCard
} from 'lucide-react';

// Fonction utilitaire pour convertir une URL YouTube en URL d'embed
const getYouTubeEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  
  // Patterns pour extraire l'ID de la vidéo (incluant YouTube Shorts)
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/.*[?&]v=([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/, // Support pour YouTube Shorts
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      const videoId = match[1].split('&')[0].split('?')[0]; // Nettoyer les paramètres supplémentaires
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }
  
  return null;
};

// Composant pour afficher une miniature de vidéo en grid
const VideoThumbnail = ({ 
  submission, 
  showBadge,
  badgeVariant,
  badgeText,
  showDeleteButton,
  onDelete,
  isDeleting,
}: { 
  submission: SubmissionWithRelations;
  showBadge?: boolean;
  badgeVariant?: 'success' | 'destructive' | 'warning' | 'outline';
  badgeText?: string;
  showDeleteButton?: boolean;
  onDelete?: () => void;
  isDeleting?: boolean;
}) => {
  const tiktokVideoUrl = `https://www.tiktok.com/@${submission.tiktokAccount.username}/video/${submission.tiktokVideoId}`;
  const views = submission.currentStats?.views ?? 0;

  return (
    <a
      href={tiktokVideoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block rounded-lg sm:rounded-xl overflow-hidden bg-slate-100 aspect-[9/16] hover:ring-2 hover:ring-[#ED5D3B] transition-all"
    >
      {/* Miniature */}
      {submission.coverImageUrl ? (
        <img
          src={submission.coverImageUrl}
          alt={`Vidéo de @${submission.tiktokAccount.username}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-slate-200">
          <Video className="w-8 h-8 text-slate-400" />
        </div>
      )}

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Badge statut (en haut à gauche) */}
      {showBadge && badgeText && (
        <div className="absolute top-2 left-2">
          <Badge variant={badgeVariant} className="text-[10px] px-1.5 py-0.5">
            {badgeText}
          </Badge>
        </div>
      )}

      {/* Bouton supprimer (en haut à droite) */}
      {showDeleteButton && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete?.();
          }}
          disabled={isDeleting}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/80 hover:bg-red-500 text-white transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={12} />
        </button>
      )}

      {/* Infos en bas */}
      <div className="absolute bottom-0 left-0 right-0 p-2">
        {/* Nombre de vues */}
        <div className="flex items-center gap-1 text-white font-semibold text-sm mb-1">
          <Eye size={14} />
          <span>{views.toLocaleString()}</span>
        </div>
        {/* Username */}
        <p className="text-white/80 text-[10px] truncate">
          @{submission.tiktokAccount.username}
        </p>
      </div>

      {/* Icône externe au hover */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {!showDeleteButton && (
          <div className="p-1.5 rounded-full bg-white/20 backdrop-blur-sm">
            <ExternalLink size={12} className="text-white" />
          </div>
        )}
      </div>
    </a>
  );
};

// Composant pour afficher une miniature de soumission en attente avec actions (pour le owner)
const PendingVideoThumbnail = ({ 
  submission, 
  campaignId,
  onActionComplete 
}: { 
  submission: SubmissionWithRelations;
  campaignId: number;
  onActionComplete: () => void;
}) => {
  const [showRefuseModal, setShowRefuseModal] = useState(false);
  const [refuseReason, setRefuseReason] = useState('');

  const { mutateAsync: validate, isPending: isValidating } = useValidateSubmission(submission.id, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', campaignId, 'submissions'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', campaignId, 'submissions', 'public'] });
      onActionComplete();
    },
  });

  const { mutateAsync: refuse, isPending: isRefusing } = useRefuseSubmission(submission.id, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', campaignId, 'submissions'] });
      setShowRefuseModal(false);
      setRefuseReason('');
      onActionComplete();
    },
  });

  const handleValidate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await validate(undefined);
  };

  const handleRefuse = async () => {
    await refuse({ reason: refuseReason || undefined });
  };

  const tiktokVideoUrl = `https://www.tiktok.com/@${submission.tiktokAccount.username}/video/${submission.tiktokVideoId}`;
  const views = submission.currentStats?.views ?? 0;

  return (
    <>
      <div className="group relative rounded-lg sm:rounded-xl overflow-hidden bg-slate-100 aspect-[9/16] ring-2 ring-amber-400">
        {/* Lien vers TikTok */}
        <a
          href={tiktokVideoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full h-full"
        >
          {/* Miniature */}
          {submission.coverImageUrl ? (
            <img
              src={submission.coverImageUrl}
              alt={`Vidéo de @${submission.tiktokAccount.username}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-200">
              <Video className="w-8 h-8 text-slate-400" />
            </div>
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Badge en attente */}
          <div className="absolute top-2 left-2">
            <Badge variant="warning" className="text-[10px] px-1.5 py-0.5">
              En attente
            </Badge>
          </div>

          {/* Icône externe */}
          <div className="absolute top-2 right-2">
            <div className="p-1.5 rounded-full bg-white/20 backdrop-blur-sm">
              <ExternalLink size={12} className="text-white" />
            </div>
          </div>

          {/* Infos en bas */}
          <div className="absolute bottom-12 left-0 right-0 p-2">
            <div className="flex items-center gap-1 text-white font-semibold text-sm mb-1">
              <Eye size={14} />
              <span>{views.toLocaleString()}</span>
            </div>
            <p className="text-white/80 text-[10px] truncate">
              @{submission.tiktokAccount.username}
            </p>
          </div>
        </a>

        {/* Boutons d'action en bas */}
        <div className="absolute bottom-0 left-0 right-0 p-2 flex gap-1">
          <button
            onClick={handleValidate}
            disabled={isValidating}
            className="flex-1 py-1.5 rounded-lg bg-green-500 hover:bg-green-400 text-white text-xs font-medium flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
          >
            <Check size={12} />
            {isValidating ? '...' : 'Valider'}
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowRefuseModal(true);
            }}
            className="flex-1 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-white text-xs font-medium flex items-center justify-center gap-1 transition-colors"
          >
            <X size={12} />
            Refuser
          </button>
        </div>
      </div>

      {/* Modal de refus */}
      {showRefuseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-sm shadow-xl">
            <p className="font-semibold text-slate-900 mb-4">Refuser cette vidéo</p>
            <input
              type="text"
              placeholder="Raison du refus (optionnel)"
              value={refuseReason}
              onChange={(e) => setRefuseReason(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ED5D3B] mb-4"
            />
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowRefuseModal(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleRefuse}
                disabled={isRefusing}
                className="flex-1"
              >
                {isRefusing ? 'Refus...' : 'Confirmer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Composant wrapper pour mes soumissions avec gestion de suppression
const MyVideoThumbnail = ({ submission }: { submission: SubmissionWithRelations }) => {
  const { mutateAsync: deleteSubmission, isPending: isDeleting } = useDeleteSubmission(submission.id, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', submission.campaignId, 'submissions', 'public'] });
    },
  });

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette soumission ?')) {
      await deleteSubmission(undefined);
    }
  };

  const statusConfig = {
    accepted: { variant: 'success' as const, text: 'Approuvée' },
    refused: { variant: 'destructive' as const, text: 'Refusée' },
    pending: { variant: 'warning' as const, text: 'En attente' },
  };

  const config = statusConfig[submission.status];

  return (
    <VideoThumbnail
      submission={submission}
      showBadge={true}
      badgeVariant={config.variant}
      badgeText={config.text}
      showDeleteButton={submission.status === 'pending'}
      onDelete={handleDelete}
      isDeleting={isDeleting}
    />
  );
};

// Composant pour afficher un palier de récompense avec son état personnalisé
const RewardStatusCard = ({ 
  reward,
  isCreator,
  onClaimClick,
}: { 
  reward: RewardStatus;
  index: number;
  isCreator: boolean;
  onClaimClick: (reward: RewardStatus) => void;
}) => {
  // Déterminer l'état du palier
  const hasInvoice = !!reward.invoice;
  const isPaid = reward.invoice?.status === 'paid';
  const isUploaded = reward.invoice?.status === 'uploaded';
  const isUnlocked = reward.isUnlocked;

  // Classes de style selon l'état
  const getBgClass = () => {
    if (isPaid) return 'bg-green-500/20 border-green-500/30';
    if (isUploaded) return 'bg-amber-500/20 border-amber-500/30';
    if (isUnlocked) return 'bg-sky-500/20 border-sky-500/30';
    return 'bg-white/5 border-white/10';
  };

  const getIconClass = () => {
    if (isPaid) return 'bg-green-500/30 text-green-400';
    if (isUploaded) return 'bg-amber-500/30 text-amber-400';
    if (isUnlocked) return 'bg-sky-500/30 text-sky-400';
    return 'bg-white/10 text-slate-400';
  };

  // Calculer la progression
  const progressPercent = Math.min((reward.totalViews / reward.viewsTarget) * 100, 100);

  return (
    <div className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl border ${getBgClass()} transition-all`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${getIconClass()}`}>
            {isPaid ? (
              <Check size={14} className="sm:w-4 sm:h-4" />
            ) : isUploaded ? (
              <Clock size={14} className="sm:w-4 sm:h-4" />
            ) : isUnlocked ? (
              <CheckCircle2 size={14} className="sm:w-4 sm:h-4" />
            ) : (
              <Lock size={14} className="sm:w-4 sm:h-4" />
            )}
          </div>
          <div>
            <p className="font-medium text-xs sm:text-sm text-slate-200">
              {reward.viewsTarget.toLocaleString()} vues
            </p>
            {isCreator && (
              <p className="text-[8px] sm:text-[10px] text-slate-400">
                {isPaid ? (
                  'Payé'
                ) : isUploaded ? (
                  'Facture en attente'
                ) : isUnlocked ? (
                  'Débloqué !'
                ) : (
                  `${reward.totalViews.toLocaleString()} / ${reward.viewsTarget.toLocaleString()}`
                )}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <span className={`text-lg sm:text-xl font-bold ${isUnlocked || hasInvoice ? 'text-green-400' : 'text-slate-400'}`}>
            {(reward.amountEur / 100).toFixed(0)}€
          </span>
        </div>
      </div>

      {/* Barre de progression pour les créateurs si le palier n'est pas encore débloqué */}
      {isCreator && !isUnlocked && !hasInvoice && (
        <div className="mt-1.5 sm:mt-2">
          <div className="w-full bg-white/10 rounded-full h-1 sm:h-1.5">
            <div 
              className="bg-[#ED5D3B] h-1 sm:h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Bouton pour réclamer si débloqué et pas de facture */}
      {isCreator && isUnlocked && !hasInvoice && reward.anchorSubmissionId && (
        <Button
          size="sm"
          onClick={() => onClaimClick(reward)}
          className="w-full mt-2 sm:mt-3 bg-green-600 hover:bg-green-500 text-white text-[10px] sm:text-xs h-7 sm:h-8"
        >
          <Receipt size={12} className="mr-1 sm:w-3.5 sm:h-3.5" />
          Réclamer ma récompense
        </Button>
      )}
    </div>
  );
};

export const CampaignDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const campaignId = parseInt(id || '0', 10);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data: campaign, isLoading } = useGetCampaign(campaignId);

  // Vérifier si l'utilisateur est le propriétaire de la campagne
  const isOwner = user?.id === campaign?.brand.userId;
  const { data: tiktokAccounts } = useGetTiktokAccounts({ enabled: isAuthenticated && user?.isCreator });
  const { refetch: getTiktokAuthUrl } = useGetTiktokAuthUrl();

  // Soumissions publiques (vidéos approuvées)
  const { data: publicSubmissions, isLoading: isLoadingPublicSubmissions } = useGetPublicCampaignSubmissions(campaignId);

  // Mes soumissions (si créateur)
  const { data: mySubmissionsData, isLoading: isLoadingMySubmissions } = useGetSubmissions(
    { campaignId: String(campaignId) },
    { enabled: isAuthenticated && user?.isCreator }
  );
  const mySubmissions = mySubmissionsData?.items || [];

  // Soumissions en attente (si owner)
  const { data: pendingSubmissionsData, isLoading: isLoadingPendingSubmissions, refetch: refetchPendingSubmissions } = useGetCampaignSubmissions(
    campaignId,
    { status: 'pending' },
    { enabled: isAuthenticated && user?.isBrand }
  );
  const pendingSubmissions = pendingSubmissionsData?.items || [];
  
  const { mutateAsync: submit, isPending: isSubmitting, isError: isSubmitError, error: submitError, reset: resetSubmit } = useCreateSubmission(campaignId, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', campaignId, 'submissions', 'public'] });
      setShowModal(false);
    },
  });

  // Statut des paliers pour le créateur connecté
  const { data: rewardsStatus } = useGetMyRewardsStatus(campaignId, {
    enabled: isAuthenticated && user?.isCreator,
  });

  // Mutation pour uploader une facture
  const { mutateAsync: uploadInvoice, isPending: isUploadingInvoice } = useUploadInvoice({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', campaignId, 'my-rewards-status'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['submissions'] }); // Pour mettre à jour les codes d'ads
      setShowInvoiceModal(false);
      setSelectedReward(null);
      setInvoiceFile(null);
      setInvoiceStep(1);
      setAdsCodes({});
    },
  });

  const [showModal, setShowModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<TiktokVideo | null>(null);
  
  // État pour la bottom sheet des récompenses sur mobile
  const [isRewardsSheetOpen, setIsRewardsSheetOpen] = useState(false);
  
  // États pour le modal de facture (stepper)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState<RewardStatus | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [invoiceStep, setInvoiceStep] = useState<1 | 2>(1);
  const [adsCodes, setAdsCodes] = useState<Record<number, string>>({});
  const [isGiftCard, setIsGiftCard] = useState(false);
  const [reconnectAccount, setReconnectAccount] = useState<TiktokAccount | null>(null);

  // Charger les vidéos quand un compte est sélectionné
  const { data: videosData, isLoading: isLoadingVideos } = useGetTiktokVideos(
    selectedAccount ?? 0,
    undefined,
    { enabled: !!selectedAccount }
  );

  const handleSubmit = async () => {
    if (!selectedAccount || !selectedVideo) return;
    await submit({ 
      tiktokAccountId: selectedAccount, 
      tiktokVideoId: selectedVideo.id as string,
      coverImageUrl: selectedVideo.coverImageUrl,
    });
  };

  // Reset la vidéo sélectionnée quand on change de compte
  const handleSelectAccount = (accountId: number) => {
    setSelectedAccount(accountId);
    setSelectedVideo(null);
  };

  const handleReconnectTiktok = async () => {
    if (!reconnectAccount) return;
    try {
      sessionStorage.setItem(
        'tiktok_oauth_return_path',
        window.location.pathname + window.location.search
      );
      const { data } = await getTiktokAuthUrl();
      if (data) {
        sessionStorage.setItem('tiktok_oauth_state', data.state);
        sessionStorage.setItem('tiktok_code_verifier', data.codeVerifier);
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Failed to get TikTok auth URL', error);
    }
  };

  // Obtenir les soumissions acceptées pour cette campagne
  const acceptedSubmissions = mySubmissions.filter((s) => s.status === 'accepted');

  // Ouvrir le modal de facture pour un palier
  const handleClaimReward = (reward: RewardStatus) => {
    setSelectedReward(reward);
    setInvoiceStep(1);
    setInvoiceFile(null);
    setIsGiftCard(false);
    // Initialiser les codes d'ads avec les valeurs existantes
    const initialAdsCodes: Record<number, string> = {};
    acceptedSubmissions.forEach((sub) => {
      initialAdsCodes[sub.id] = sub.adsCode || '';
    });
    setAdsCodes(initialAdsCodes);
    setShowInvoiceModal(true);
  };

  // Passer à l'étape 2 (codes d'ads)
  const handleGoToStep2 = () => {
    // Si carte cadeau, pas besoin de fichier
    if (!isGiftCard && !invoiceFile) return;
    setInvoiceStep(2);
  };

  // Revenir à l'étape 1
  const handleBackToStep1 = () => {
    setInvoiceStep(1);
  };

  // Vérifier si tous les codes d'ads sont remplis
  const allAdsCodesProvided = acceptedSubmissions.every(
    (sub) => adsCodes[sub.id] && adsCodes[sub.id].trim() !== ''
  );

  // Mettre à jour un code d'ads
  const handleAdsCodeChange = (submissionId: number, value: string) => {
    setAdsCodes((prev) => ({ ...prev, [submissionId]: value }));
  };

  // Soumettre la facture avec les codes d'ads
  const handleUploadInvoice = async () => {
    if (!selectedReward?.anchorSubmissionId || !allAdsCodesProvided) return;
    // Si paiement par facture, le fichier est obligatoire
    if (!isGiftCard && !invoiceFile) return;
    
    const adsCodesArray: AdsCodeInput[] = acceptedSubmissions.map((sub) => ({
      submissionId: sub.id,
      adsCode: adsCodes[sub.id].trim(),
    }));

    await uploadInvoice({
      submissionId: selectedReward.anchorSubmissionId,
      rewardId: selectedReward.rewardId,
      paymentMethod: isGiftCard ? 'gift_card' : 'invoice',
      file: invoiceFile ?? undefined,
      adsCodes: adsCodesArray,
    });
  };

  // Gestion du drag & drop pour le fichier PDF
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        setInvoiceFile(file);
      } else {
        alert('Seuls les fichiers PDF sont acceptés');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        setInvoiceFile(file);
      } else {
        alert('Seuls les fichiers PDF sont acceptés');
      }
    }
  };

  // Contenu des récompenses réutilisable (sidebar desktop + bottom sheet mobile)
  const rewardsContent = campaign ? (
    <div className="space-y-3 sm:space-y-4">
      {user?.isCreator && rewardsStatus ? (
        // Affichage personnalisé pour les créateurs
        rewardsStatus
          .sort((a, b) => a.viewsTarget - b.viewsTarget)
          .map((reward, index) => (
            <RewardStatusCard
              key={reward.rewardId}
              reward={reward}
              index={index}
              isCreator={true}
              onClaimClick={handleClaimReward}
            />
          ))
      ) : (
        // Affichage standard pour les visiteurs/marques
        campaign.rewards
          .sort((a, b) => a.viewsTarget - b.viewsTarget)
          .map((reward, index) => (
            <div key={reward.id} className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center text-xs sm:text-sm font-bold">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-xs sm:text-sm text-slate-200">
                    {reward.viewsTarget.toLocaleString()} vues
                  </p>
                  <p className="text-[8px] sm:text-[10px] text-slate-400">
                    {reward.allowMultipleVideos ? 'Cumulable' : '1 vidéo'}
                  </p>
                </div>
              </div>
              <span className="text-lg sm:text-xl font-bold text-green-400">
                {(reward.amountEur / 100).toFixed(0)}€
              </span>
            </div>
          ))
      )}
    </div>
  ) : null;

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        <Skeleton className="h-[260px] sm:h-[320px] md:h-[400px] w-full rounded-xl sm:rounded-2xl md:rounded-3xl" />
        <div className="space-y-3 sm:space-y-4">
          <Skeleton className="h-8 sm:h-10 w-2/3" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    );
  }

  if (!campaign) return null;

  return (
    <div className="pb-18 md:pb-20">
      {/* Header avec bouton retour et actions owner */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <Link to={isOwner ? "/dashboard/brand" : "/campaigns"} className="inline-flex items-center text-xs sm:text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft size={14} className="mr-1 sm:w-4 sm:h-4" /> {isOwner ? 'Retour au dashboard' : 'Retour aux campagnes'}
        </Link>

        {/* Actions pour le propriétaire */}
        {isOwner && (
          <div className="flex items-center gap-1 sm:gap-2">

            <CampaignActions 
              campaignId={campaignId}
              currentStatus={campaign.status}
              variant="buttons"
              onActionComplete={() => {
                queryClient.invalidateQueries({ queryKey: ['campaigns', campaignId] });
                // Si suppression, rediriger vers le dashboard
                if (campaign.status === 'deleted') {
                  navigate('/dashboard/brand');
                }
              }}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 md:space-y-8">
          {/* Hero */}
          <div className="relative h-[260px] sm:h-[320px] md:h-[400px] rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden shadow-sm group">
        {campaign.coverImageUrl ? (
          <img
            src={campaign.coverImageUrl}
            alt={campaign.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                <Video className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-slate-400" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            
            <div className="absolute bottom-0 left-0 p-4 sm:p-6 md:p-8 text-white w-full">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 md:mb-4 flex-wrap">
                <div className="flex items-center gap-1.5 sm:gap-2 bg-white/20 backdrop-blur-md px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                  {campaign.brand.logoUrl ? (
                    <img src={campaign.brand.logoUrl} className="w-4 h-4 sm:w-5 sm:h-5 rounded-full" />
                  ) : (
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#ED5D3B] flex items-center justify-center text-[8px] sm:text-[10px] font-bold">
                      {campaign.brand.name[0]}
                    </div>
                  )}
                  <span className="text-xs sm:text-sm font-medium">{campaign.brand.name}</span>
                </div>
                <Badge variant={
                  campaign.status === 'active' ? 'success' : 
                  campaign.status === 'paused' ? 'outline' : 'secondary'
                } className="border-none text-[10px] sm:text-xs">
                  {campaign.status === 'draft' ? 'Brouillon' : 
                   campaign.status === 'active' ? 'Active' : 
                   campaign.status === 'paused' ? 'En pause' : campaign.status}
                </Badge>
              </div>
              
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">{campaign.title}</p>
              <p className="text-slate-200 line-clamp-2 max-w-2xl text-xs sm:text-sm md:text-base">{campaign.description}</p>
            </div>
          </div>

          {/* Details & Brief */}
          <Card>
            <CardContent className="p-4 sm:p-6 md:p-8">
              <p className="text-base sm:text-lg md:text-xl font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
                <Target className="text-[#ED5D3B]" size={20} />
                Le Brief
              </p>
              <div className="prose prose-slate max-w-none text-slate-600 text-sm sm:text-base">
                <p className="whitespace-pre-wrap leading-relaxed">{campaign.description}</p>
          </div>

          {campaign.youtubeUrl && (
                <div className="mt-6 sm:mt-8">
                  <p className="font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                    <PlayCircle size={18} className="sm:w-5 sm:h-5" /> Vidéo explicative
                  </p>
                  <div className="aspect-video rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden bg-black">
                {(() => {
                  const embedUrl = getYouTubeEmbedUrl(campaign.youtubeUrl);
                  if (!embedUrl) return null;
                  return (
                    <iframe
                      src={embedUrl}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      title="Vidéo explicative YouTube"
                    />
                  );
                })()}
              </div>
            </div>
          )}
            </CardContent>
          </Card>

          {/* Vidéos de la communauté (approuvées) */}
          <Card>
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Users className="text-[#ED5D3B]" size={18} />
                Vidéos de la communauté
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              {isLoadingPublicSubmissions ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="aspect-[9/16] w-full rounded-lg sm:rounded-xl" />
                  ))}
                </div>
              ) : publicSubmissions?.items && publicSubmissions.items.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                  {[...publicSubmissions.items]
                    .sort((a, b) => (b.currentStats?.views ?? 0) - (a.currentStats?.views ?? 0))
                    .map((submission) => (
                      <VideoThumbnail key={submission.id} submission={submission} />
                    ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8 text-slate-500">
                  <Video className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs sm:text-sm">Aucune vidéo approuvée pour le moment.</p>
                  <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Soyez le premier à participer !</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vidéos en attente de validation (si owner) */}
          {isOwner && (
            <Card className="border-amber-200 bg-amber-50/30">
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Clock className="text-amber-600" size={18} />
                  Vidéos en attente de validation
                  {pendingSubmissions.length > 0 && (
                    <Badge variant="warning" className="ml-1 sm:ml-2 text-[10px] sm:text-xs">
                      {pendingSubmissions.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                {isLoadingPendingSubmissions ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="aspect-[9/16] w-full rounded-lg sm:rounded-xl" />
                    ))}
                  </div>
                ) : pendingSubmissions.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                    {[...pendingSubmissions]
                      .sort((a, b) => (b.currentStats?.views ?? 0) - (a.currentStats?.views ?? 0))
                      .map((submission) => (
                        <PendingVideoThumbnail 
                          key={submission.id} 
                          submission={submission}
                          campaignId={campaignId}
                          onActionComplete={() => refetchPendingSubmissions()}
                        />
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8 text-slate-500">
                    <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 text-green-300" />
                    <p className="text-xs sm:text-sm">Aucune vidéo en attente de validation.</p>
                    <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Toutes les soumissions ont été traitées.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Mes soumissions (si créateur) */}
          {user?.isCreator && (
            <Card>
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <FileVideo className="text-green-600" size={18} />
                  Mes soumissions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                {isLoadingMySubmissions ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="aspect-[9/16] w-full rounded-lg sm:rounded-xl" />
                    ))}
                  </div>
                ) : mySubmissions.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                    {[...mySubmissions]
                      .sort((a, b) => (b.currentStats?.views ?? 0) - (a.currentStats?.views ?? 0))
                      .map((submission) => (
                        <MyVideoThumbnail 
                          key={submission.id} 
                          submission={submission}
                        />
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8 text-slate-500">
                    <Video className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs sm:text-sm">Vous n'avez pas encore soumis de vidéo.</p>
                    {campaign.status === 'active' && (
                      <Button 
                        onClick={() => {
                          resetSubmit();
                          setShowModal(true);
                        }} 
                        className="mt-3 sm:mt-4 text-xs sm:text-sm"
                        size="sm"
                      >
                        Soumettre une vidéo
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* Rewards Card - Hidden on mobile, visible on lg+ */}
          <Card className="hidden lg:block bg-slate-900 text-white border-none overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0EA5E9]/20 to-sky-600/20" />
            <CardContent className="p-4 sm:p-5 md:p-6 relative z-10">
              <p className="text-base sm:text-lg font-semibold mb-4 sm:mb-5 md:mb-6 flex items-center gap-2">
                <TrendingUp size={18} className="text-sky-400 sm:w-5 sm:h-5" />
                Récompenses
              </p>
              
              {rewardsContent}

              {user?.isCreator && campaign.status === 'active' && (
                <Button 
                  onClick={() => {
                    resetSubmit();
                    setShowModal(true);
                  }}
                  className="w-full mt-6 sm:mt-8 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-[#ED5D3B] hover:bg-[#d94f30] text-white font-semibold text-sm sm:text-base"
                >
                  Participer maintenant
                </Button>
              )}
              
              {!isAuthenticated && (
                <Link to="/login">
                  <Button className="w-full mt-6 sm:mt-8 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-sm sm:text-base">
                    Se connecter
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card>
            <CardContent className="p-4 sm:p-5 md:p-6">
              <p className="font-semibold mb-3 sm:mb-4 text-xs sm:text-sm uppercase tracking-wider text-slate-500">
                À propos de la marque
              </p>
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <Avatar src={campaign.brand.logoUrl} fallback={campaign.brand.name[0]} className="w-10 h-10 sm:w-12 sm:h-12" />
                <div>
                  <p className="font-bold text-slate-900 text-sm sm:text-base">{campaign.brand.name}</p>
                  <p className="text-xs sm:text-sm text-slate-500">{campaign.brand.sector}</p>
                </div>
              </div>
              {campaign.brand.website && (
                <Button 
                  variant="outline" 
                  className="w-full rounded-lg sm:rounded-xl text-xs sm:text-sm" 
                  size="sm" 
                  onClick={() => window.open(campaign.brand.website!, '_blank')}
                >
                  Voir le site
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile Bottom Sheet - Rewards */}
      <div className="lg:hidden">
        {/* Sticky collapsed bar */}
        {!isRewardsSheetOpen && (
          <button
            onClick={() => setIsRewardsSheetOpen(true)}
            className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-lg rounded-t-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0EA5E9] to-sky-600 flex items-center justify-center">
                <Gift size={20} className="text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Voir les récompenses</p>
                <p className="text-xs text-slate-400">
                  {campaign.rewards.length} palier{campaign.rewards.length > 1 ? 's' : ''} disponible{campaign.rewards.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <ChevronUp size={20} className="text-slate-400" />
          </button>
        )}

        {/* Expanded bottom sheet */}
        {isRewardsSheetOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            {/* Overlay */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
              onClick={() => setIsRewardsSheetOpen(false)}
            />
            
            {/* Sheet content */}
            <div className="relative bg-slate-900 rounded-t-3xl max-h-[85vh] overflow-hidden animate-slide-up">
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-2">
                <button
                  onClick={() => setIsRewardsSheetOpen(false)}
                  className="w-10 h-1 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors"
                />
              </div>
              
              {/* Header */}
              <div className="px-5 pb-4 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp size={20} className="text-sky-400" />
                    <p className="text-lg font-semibold text-white">Récompenses</p>
                  </div>
                  <button
                    onClick={() => setIsRewardsSheetOpen(false)}
                    className="p-2 rounded-full hover:bg-slate-800 transition-colors"
                  >
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-5 overflow-y-auto max-h-[60vh]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0EA5E9]/10 to-sky-600/10 pointer-events-none" />
                <div className="relative z-10">
                  {rewardsContent}
                  
                  {user?.isCreator && campaign.status === 'active' && (
                    <Button 
                      onClick={() => {
                        setIsRewardsSheetOpen(false);
                        resetSubmit();
                        setShowModal(true);
                      }}
                      className="w-full mt-6 h-12 rounded-xl bg-[#ED5D3B] hover:bg-[#d94f30] text-white font-semibold text-sm"
                    >
                      Participer maintenant
                    </Button>
                  )}
                  
                  {!isAuthenticated && (
                    <Link to="/login" onClick={() => setIsRewardsSheetOpen(false)}>
                      <Button className="w-full mt-6 h-12 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-sm">
                        Se connecter
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submission Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 w-full max-w-lg sm:max-w-xl md:max-w-2xl shadow-2xl transform transition-all max-h-[90vh] overflow-y-auto">
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 mb-1 sm:mb-2">Soumettre une vidéo</p>
            <p className="text-slate-500 mb-4 sm:mb-6 md:mb-8 text-sm sm:text-base">
              Sélectionnez votre compte TikTok puis choisissez la vidéo à soumettre.
            </p>

            <div className="space-y-4 sm:space-y-6">
              {/* Sélection du compte TikTok */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
                  Compte TikTok
                </label>
                <div className="grid grid-cols-1 gap-1.5 sm:gap-2">
                  {tiktokAccounts?.map((account) => (
                    <div 
                      key={account.id}
                      onClick={() =>
                        account.isValid
                          ? handleSelectAccount(account.id)
                          : setReconnectAccount(account)
                      }
                      className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                        selectedAccount === account.id 
                          ? 'border-[#0EA5E9] bg-sky-50' 
                          : 'border-slate-100 hover:border-slate-200'
                      } ${!account.isValid && 'opacity-50'}`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Avatar fallback="T" className="bg-black text-white w-6 h-6 sm:w-8 sm:h-8 text-xs" />
                        <span className="font-medium text-sm sm:text-base">@{account.username}</span>
                      </div>
                      {selectedAccount === account.id && (
                        <CheckCircle2 className="text-[#ED5D3B]" size={18} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sélection de la vidéo */}
              {selectedAccount && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
                    Sélectionnez une vidéo
                  </label>
                  
                  {isLoadingVideos ? (
                    <div className="flex items-center justify-center py-8 sm:py-12">
                      <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-[#ED5D3B]" />
                    </div>
                  ) : videosData?.videos && videosData.videos.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5 sm:gap-2 max-h-[240px] sm:max-h-[300px] overflow-y-auto pr-1">
                      {videosData.videos.map((video) => (
                        <div
                          key={video.id}
                          onClick={() => setSelectedVideo(video)}
                          className={`relative rounded-lg overflow-hidden cursor-pointer transition-all border-2 ${
                            selectedVideo?.id === video.id
                              ? 'border-[#ED5D3B] ring-2 ring-[#ED5D3B]/20'
                              : 'border-transparent hover:border-slate-200'
                          }`}
                        >
                          {/* Thumbnail */}
                          <div className="aspect-[9/16] bg-slate-100">
                            {video.coverImageUrl ? (
                              <img
                                src={video.coverImageUrl}
                                alt={video.title || 'Vidéo TikTok'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Video className="w-6 h-6 text-slate-300" />
                              </div>
                            )}
                          </div>
                          
                          {/* Overlay avec infos */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-1.5">
                            <p className="text-white text-[10px] font-medium line-clamp-1">
                              {video.title || 'Sans titre'}
                            </p>
                            <p className="text-white/70 text-[8px] mt-0.5">
                              {video.createdAt ? new Date(video.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue'}
                            </p>
                          </div>

                          {/* Check sélectionné */}
                          {selectedVideo?.id === video.id && (
                            <div className="absolute top-1 right-1 bg-[#ED5D3B] rounded-full p-0.5">
                              <CheckCircle2 className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 sm:py-8 text-slate-500">
                      <Video className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-slate-300" />
                      <p className="text-sm sm:text-base">Aucune vidéo trouvée sur ce compte</p>
                    </div>
                  )}
                </div>
              )}

              {/* Message d'erreur */}
              {isSubmitError && (
                <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm">
                  {(submitError as { response?: { data?: { error?: string } } })?.response?.data?.error || "Une erreur est survenue"}
                </div>
              )}

              {/* Boutons d'action */}
              <div className="flex gap-2 sm:gap-4 pt-3 sm:pt-4">
                <Button variant="ghost" onClick={() => setShowModal(false)} className="flex-1 h-10 sm:h-12 text-sm sm:text-base">
                  Annuler
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedAccount || !selectedVideo || isSubmitting}
                  className="flex-1 h-10 sm:h-12 bg-[#ED5D3B] hover:bg-[#d94f30] text-sm sm:text-base"
                >
                  {isSubmitting ? 'Envoi...' : 'Confirmer'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialog reconnexion TikTok (compte désactivé) */}
      <Dialog open={!!reconnectAccount} onOpenChange={(open) => !open && setReconnectAccount(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Session expirée</DialogTitle>
            <DialogDescription>
              {reconnectAccount
                ? `La session de @${reconnectAccount.username} a expiré. Reconnectez ce compte pour continuer.`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="ghost" onClick={() => setReconnectAccount(null)}>
              Annuler
            </Button>
            <Button onClick={handleReconnectTiktok} className="bg-[#ED5D3B] hover:bg-[#d94f30]">
              Reconnecter
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Upload Modal - Stepper 2 étapes */}
      {showInvoiceModal && selectedReward && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 w-full max-w-sm sm:max-w-md md:max-w-lg shadow-2xl transform transition-all max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div>
                <p className="text-base sm:text-lg md:text-xl font-bold text-slate-900">Réclamer ma récompense</p>
                <p className="text-xs sm:text-sm text-slate-500">
                  Palier de {selectedReward.viewsTarget.toLocaleString()} vues atteint !
                </p>
              </div>
            </div>

            {/* Indicateur d'étapes */}
            <div className="flex items-center gap-1.5 sm:gap-2 mb-4 sm:mb-6">
              <div className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium ${
                invoiceStep === 1 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
              }`}>
                <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-current/20 flex items-center justify-center text-[10px] sm:text-xs">1</span>
                Facture
              </div>
              <div className="flex-1 h-0.5 bg-slate-200" />
              <div className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium ${
                invoiceStep === 2 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
              }`}>
                <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-current/20 flex items-center justify-center text-[10px] sm:text-xs">2</span>
                Codes d'ads
              </div>
            </div>

            {/* Montant de la récompense */}
            <div className="bg-green-50 border border-green-200 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-green-700">Montant de la récompense</span>
                <span className="text-xl sm:text-2xl font-bold text-green-600">
                  {(selectedReward.amountEur / 100).toFixed(0)}€
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-green-600 mt-1">
                Vos vidéos ont cumulé {selectedReward.totalViews.toLocaleString()} vues
              </p>
            </div>

            {/* Étape 1 : Upload PDF ou Carte cadeau */}
            {invoiceStep === 1 && (
              <div className="space-y-4">
                {/* Option carte cadeau */}
                <div 
                  onClick={() => setIsGiftCard(!isGiftCard)}
                  className={`flex items-center gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 cursor-pointer transition-all ${
                    isGiftCard 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isGiftCard ? 'bg-purple-100' : 'bg-slate-100'
                  }`}>
                    <CreditCard className={`w-5 h-5 ${isGiftCard ? 'text-purple-600' : 'text-slate-400'}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isGiftCard ? 'text-purple-700' : 'text-slate-700'}`}>
                      Être payé en carte cadeau
                    </p>
                    <p className="text-xs text-slate-500">
                      Si vous n'avez pas de société ou auto-entreprise
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    isGiftCard ? 'border-purple-500 bg-purple-500' : 'border-slate-300'
                  }`}>
                    {isGiftCard && <Check size={12} className="text-white" />}
                  </div>
                </div>

                {/* Zone de upload PDF (masquée si carte cadeau) */}
                {!isGiftCard && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Votre facture (PDF)
                    </label>
                    
                    {/* Zone de drag & drop */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-lg sm:rounded-xl p-4 sm:p-6 transition-all cursor-pointer ${
                        isDragging 
                          ? 'border-green-500 bg-green-50' 
                          : invoiceFile 
                            ? 'border-green-300 bg-green-50/50' 
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      
                      {invoiceFile ? (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {invoiceFile.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {(invoiceFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInvoiceFile(null);
                            }}
                            className="p-1.5 rounded-full hover:bg-slate-200 transition-colors"
                          >
                            <X size={16} className="text-slate-500" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                          <p className="text-sm text-slate-600">
                            <span className="font-medium text-green-600">Cliquez pour sélectionner</span>
                            {' '}ou glissez-déposez
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            PDF uniquement (max. 10 MB)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setShowInvoiceModal(false);
                      setSelectedReward(null);
                      setInvoiceFile(null);
                      setInvoiceStep(1);
                      setIsGiftCard(false);
                    }} 
                    className="flex-1 h-12"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleGoToStep2}
                    disabled={!isGiftCard && !invoiceFile}
                    className="flex-1 h-12 bg-green-600 hover:bg-green-500"
                  >
                    Suivant
                    <ArrowLeft size={16} className="ml-2 rotate-180" />
                  </Button>
                </div>
              </div>
            )}

            {/* Étape 2 : Codes d'ads */}
            {invoiceStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Codes d'ads TikTok
                  </label>
                  <p className="text-xs text-slate-500 mb-4">
                    Renseignez le code d'ads pour chaque vidéo acceptée. Vous pouvez trouver ce code dans l'application TikTok.
                  </p>
                  
                  <div className="space-y-2 sm:space-y-3 max-h-[260px] sm:max-h-[300px] overflow-y-auto pr-1">
                    {acceptedSubmissions.map((submission) => (
                      <div key={submission.id} className="bg-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Video className="w-5 h-5 text-slate-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              @{submission.tiktokAccount.username}
                            </p>
                            <p className="text-xs text-slate-500">
                              {submission.currentStats ? `${submission.currentStats.views.toLocaleString()} vues` : 'Stats en attente'}
                            </p>
                          </div>
                          <a
                            href={`https://www.tiktok.com/@${submission.tiktokAccount.username}/video/${submission.tiktokVideoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
                          >
                            <ExternalLink size={14} className="text-slate-400" />
                          </a>
                        </div>
                        <input
                          type="text"
                          placeholder="Code d'ads TikTok"
                          value={adsCodes[submission.id] || ''}
                          onChange={(e) => handleAdsCodeChange(submission.id, e.target.value)}
                          className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                            adsCodes[submission.id]?.trim() 
                              ? 'border-green-300 bg-green-50/50' 
                              : 'border-slate-200 bg-white'
                          }`}
                        />
                      </div>
                    ))}
                  </div>

                  {!allAdsCodesProvided && (
                    <p className="text-xs text-amber-600 mt-3 flex items-center gap-1">
                      <Clock size={12} />
                      Tous les codes d'ads doivent être renseignés
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="ghost" 
                    onClick={handleBackToStep1}
                    className="flex-1 h-12"
                  >
                    <ArrowLeft size={16} className="mr-2" />
                    Retour
                  </Button>
                  <Button
                    onClick={handleUploadInvoice}
                    disabled={!allAdsCodesProvided || isUploadingInvoice}
                    className="flex-1 h-12 bg-green-600 hover:bg-green-500"
                  >
                    {isUploadingInvoice ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Envoyer
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
