import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetBrandSubmissions, useValidateSubmission, useRefuseSubmission, useDeleteSubmission } from '@/api/submissions';
import { queryClient } from '@/api/query-config';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { SubmissionWithRelations } from '@shared/types/submissions';
import { 
  Video, 
  Eye, 
  EyeOff,
  Heart, 
  MessageCircle, 
  Share2, 
  ExternalLink,
  Check,
  X,
  Clock,
  CheckCircle2,
  Trash2
} from 'lucide-react';

// Composant pour les actions de validation/refus
const SubmissionActions = ({ submission, onActionComplete }: { 
  submission: SubmissionWithRelations; 
  onActionComplete: () => void;
}) => {
  const [showRefuseInput, setShowRefuseInput] = useState(false);
  const [refuseReason, setRefuseReason] = useState('');

  const { mutateAsync: validate, isPending: isValidating } = useValidateSubmission(submission.id, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-submissions'] });
      onActionComplete();
    },
  });

  const { mutateAsync: refuse, isPending: isRefusing } = useRefuseSubmission(submission.id, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-submissions'] });
      setShowRefuseInput(false);
      setRefuseReason('');
      onActionComplete();
    },
  });

  const handleValidate = async (visibleInCommunity: boolean) => {
    await validate({ visibleInCommunity });
  };

  const handleRefuse = async () => {
    await refuse({ reason: refuseReason || undefined });
  };

  if (showRefuseInput) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Raison du refus (optionnel)"
          value={refuseReason}
          onChange={(e) => setRefuseReason(e.target.value)}
          className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ED5D3B]"
        />
        <Button
          size="sm"
          variant="destructive"
          onClick={handleRefuse}
          disabled={isRefusing}
        >
          {isRefusing ? 'Refus...' : 'Confirmer'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowRefuseInput(false)}
        >
          Annuler
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
        onClick={() => handleValidate(true)}
        disabled={isValidating}
        title="Valider et afficher dans les vidéos de la communauté"
      >
        <Check size={16} className="mr-1" />
        {isValidating ? 'Validation...' : 'Valider et afficher'}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="text-green-600/80 border-green-200/80 hover:bg-green-50/80 hover:text-green-700"
        onClick={() => handleValidate(false)}
        disabled={isValidating}
        title="Valider sans afficher dans les vidéos de la communauté"
      >
        <EyeOff size={16} className="mr-1" />
        {isValidating ? '...' : 'Valider (masquer)'}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
        onClick={() => setShowRefuseInput(true)}
      >
        <X size={16} className="mr-1" />
        Refuser
      </Button>
    </div>
  );
};

// Composant pour les actions de suppression (pour les soumissions acceptées)
const DeleteSubmissionAction = ({ submission, onActionComplete }: { 
  submission: SubmissionWithRelations; 
  onActionComplete: () => void;
}) => {
  const { mutateAsync: deleteSubmission, isPending: isDeleting } = useDeleteSubmission(submission.id, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-submissions'] });
      if (onActionComplete) {
        onActionComplete();
      }
    },
  });

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette soumission ? Cette action est irréversible.')) {
      await deleteSubmission(undefined);
    }
  };

  return (
    <Button
      size="sm"
      variant="destructive"
      onClick={handleDelete}
      disabled={isDeleting}
      className="min-w-[120px] bg-red-600 hover:bg-red-700 text-white border-0"
    >
      <Trash2 size={16} className="mr-1" />
      {isDeleting ? 'Suppression...' : 'Supprimer'}
    </Button>
  );
};

// Composant carte de soumission pour la marque
const BrandSubmissionCard = ({ 
  submission, 
  showActions = false,
  showDeleteAction = false,
  onActionComplete 
}: { 
  submission: SubmissionWithRelations;
  showActions?: boolean;
  showDeleteAction?: boolean;
  onActionComplete?: () => void;
}) => {
  const tiktokVideoUrl = `https://www.tiktok.com/@${submission.tiktokAccount.username}/video/${submission.tiktokVideoId}`;
  const views = submission.currentStats?.views ?? 0;

  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl">
      <div className="flex items-center gap-4">
        {/* Thumbnail avec lien TikTok */}
        <a
          href={tiktokVideoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative w-16 h-24 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0 group"
        >
          {submission.coverImageUrl ? (
            <img
              src={submission.coverImageUrl}
              alt={`Vidéo de @${submission.tiktokAccount.username}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Video className="w-6 h-6 text-slate-400" />
            </div>
          )}
          {/* Overlay avec vues */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end justify-center pb-1">
            <span className="text-white text-[10px] font-medium flex items-center gap-0.5">
              <Eye size={10} />
              {views.toLocaleString()}
            </span>
          </div>
          {/* Icône externe au hover */}
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="p-1 rounded-full bg-white/30 backdrop-blur-sm">
              <ExternalLink size={10} className="text-white" />
            </div>
          </div>
        </a>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link 
              to={`/campaign/${submission.campaignId}`}
              className="text-sm font-medium text-[#0EA5E9] hover:text-sky-600 hover:underline"
            >
              {submission.campaign.title}
            </Link>
          </div>
          
          <p className="text-sm text-slate-600 mb-1">
            @{submission.tiktokAccount.username}
          </p>
          
          <p className="text-xs text-slate-500 mb-2">
            Soumise le {new Date(submission.submittedAt).toLocaleDateString('fr-FR')}
          </p>

          {/* Stats */}
          {submission.currentStats && (
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Eye size={12} />
                {submission.currentStats.views.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Heart size={12} />
                {submission.currentStats.likes.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle size={12} />
                {submission.currentStats.comments.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Share2 size={12} />
                {submission.currentStats.shares.toLocaleString()}
              </span>
            </div>
          )}

          {submission.validatedAt && (
            <p className="text-xs text-green-600 mt-1">
              Validée le {new Date(submission.validatedAt).toLocaleDateString('fr-FR')}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      {showActions && onActionComplete && (
        <SubmissionActions submission={submission} onActionComplete={onActionComplete} />
      )}
      
      {/* Action de suppression (pour les soumissions acceptées) */}
      {showDeleteAction && (
        <div className="flex justify-end pt-2 border-t border-slate-200 mt-2">
          <DeleteSubmissionAction 
            submission={submission} 
            onActionComplete={onActionComplete || (() => {})} 
          />
        </div>
      )}
    </div>
  );
};

// Contenu d'un onglet
const TabContent = ({ 
  status, 
  showActions = false 
}: { 
  status: 'pending' | 'accepted';
  showActions?: boolean;
}) => {
  const { data, isLoading, refetch } = useGetBrandSubmissions({ status });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!data?.items || data.items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          {status === 'pending' ? (
            <>
              <Clock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">Aucune soumission en attente.</p>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">Aucune soumission validée pour le moment.</p>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {data.items.map((submission) => (
        <BrandSubmissionCard 
          key={submission.id} 
          submission={submission}
          showActions={showActions}
          showDeleteAction={status === 'accepted'}
          onActionComplete={() => refetch()}
        />
      ))}
    </div>
  );
};

export const BrandSubmissionsPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Soumissions</h1>
        <p className="text-slate-500">
          Gérez les vidéos soumises à vos campagnes.
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="pending" className="flex-1 sm:flex-none">
            <Clock size={16} className="mr-2" />
            En attente
          </TabsTrigger>
          <TabsTrigger value="accepted" className="flex-1 sm:flex-none">
            <CheckCircle2 size={16} className="mr-2" />
            Validées
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <TabContent status="pending" showActions />
        </TabsContent>

        <TabsContent value="accepted">
          <TabContent status="accepted" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

