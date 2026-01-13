import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { useGetBrandSubmissions, useRefreshStats } from '@/api/submissions';
import { useGetAllCampaigns } from '@/api/campaigns';
import { queryClient } from '@/api/query-config';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import type { SubmissionWithRelations, SubmissionStatus } from '@shared/types/submissions';
import { 
  Video,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  ExternalLink,
  Copy,
  Check,
  Filter,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react';

// Composant Select personnalisé
const Select = ({ 
  value, 
  onChange, 
  options, 
  placeholder 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  options: { value: string; label: string }[];
  placeholder: string;
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="h-9 px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#ED5D3B] focus:border-transparent transition-all"
  >
    <option value="">{placeholder}</option>
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

// Badge de statut
const StatusBadge = ({ status }: { status: SubmissionStatus }) => {
  const config = {
    pending: { label: 'En attente', icon: Clock, variant: 'warning' as const },
    accepted: { label: 'Validée', icon: CheckCircle2, variant: 'success' as const },
    refused: { label: 'Refusée', icon: XCircle, variant: 'destructive' as const },
  };
  
  const { label, icon: Icon, variant } = config[status];
  
  return (
    <Badge variant={variant} className="text-xs">
      <Icon size={12} className="mr-1" />
      {label}
    </Badge>
  );
};

// Carte vidéo thumbnail
const VideoThumbnail = ({ 
  submission, 
  onClick 
}: { 
  submission: SubmissionWithRelations;
  onClick: () => void;
}) => {
  const views = submission.currentStats?.views ?? 0;

  return (
    <button
      onClick={onClick}
      className="group relative aspect-[9/16] rounded-xl overflow-hidden bg-slate-200 w-full cursor-pointer transition-all hover:ring-2 hover:ring-[#ED5D3B] hover:ring-offset-2"
    >
      {submission.coverImageUrl ? (
        <img
          src={submission.coverImageUrl}
          alt={`Vidéo de @${submission.tiktokAccount.username}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Video className="w-8 h-8 text-slate-400" />
        </div>
      )}
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      
      {/* Status badge */}
      <div className="absolute top-2 left-2">
        <StatusBadge status={submission.status} />
      </div>
      
      {/* Infos bas */}
      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
        <p className="text-xs font-medium truncate">@{submission.tiktokAccount.username}</p>
        <p className="text-[10px] opacity-80 truncate">{submission.campaign.title}</p>
        <div className="flex items-center gap-1 mt-1">
          <Eye size={10} />
          <span className="text-[10px]">{views.toLocaleString()}</span>
        </div>
      </div>
      
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <span className="text-white text-sm font-medium">Voir détails</span>
      </div>
    </button>
  );
};

// Modal de détail vidéo
const VideoDetailModal = ({ 
  submission, 
  open, 
  onOpenChange 
}: { 
  submission: SubmissionWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const [copied, setCopied] = useState(false);

  if (!submission) return null;

  const tiktokVideoUrl = `https://www.tiktok.com/@${submission.tiktokAccount.username}/video/${submission.tiktokVideoId}`;

  const handleCopyAdsCode = async () => {
    if (submission.adsCode) {
      await navigator.clipboard.writeText(submission.adsCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0">
        <DialogClose />
        <div className="flex flex-col lg:flex-row">
          {/* Colonne gauche - Vidéo */}
          <div className="lg:w-1/2 bg-slate-900 flex items-center justify-center p-6 min-h-[400px]">
            <div className="relative aspect-[9/16] max-h-[500px] w-full max-w-[280px] rounded-xl overflow-hidden bg-slate-800">
              {submission.coverImageUrl ? (
                <img
                  src={submission.coverImageUrl}
                  alt={`Vidéo de @${submission.tiktokAccount.username}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Video className="w-12 h-12 text-slate-600" />
                </div>
              )}
              
              {/* Play overlay */}
              <a
                href={tiktokVideoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
              >
                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                  <ExternalLink className="w-6 h-6 text-slate-900" />
                </div>
              </a>
            </div>
          </div>
          
          {/* Colonne droite - Infos */}
          <div className="lg:w-1/2 p-6">
            <DialogHeader className="p-0 mb-6">
              <DialogTitle className="text-xl">Détails de la vidéo</DialogTitle>
            </DialogHeader>
            
            {/* Status */}
            <div className="mb-6">
              <StatusBadge status={submission.status} />
            </div>
            
            {/* Créateur */}
            <div className="mb-6">
              <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                Créateur
              </h4>
              <a
                href={`https://www.tiktok.com/@${submission.tiktokAccount.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#ED5D3B] font-medium hover:underline"
              >
                @{submission.tiktokAccount.username}
              </a>
            </div>
            
            {/* Campagne */}
            <div className="mb-6">
              <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                Campagne
              </h4>
              <Link
                to={`/campaign/${submission.campaignId}`}
                className="text-slate-900 font-medium hover:text-[#ED5D3B] transition-colors"
              >
                {submission.campaign.title}
              </Link>
            </div>
            
            {/* Stats */}
            {submission.currentStats && (
              <div className="mb-6">
                <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                  Statistiques
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <Eye size={16} className="text-slate-400" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {submission.currentStats.views.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-500">Vues</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <Heart size={16} className="text-slate-400" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {submission.currentStats.likes.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-500">Likes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <MessageCircle size={16} className="text-slate-400" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {submission.currentStats.comments.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-500">Commentaires</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <Share2 size={16} className="text-slate-400" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {submission.currentStats.shares.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-500">Partages</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Code Ads */}
            <div className="mb-6">
              <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                Code Ads TikTok
              </h4>
              {submission.adsCode ? (
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-slate-100 rounded-lg text-sm font-mono text-slate-700 truncate">
                    {submission.adsCode}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyAdsCode}
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check size={14} className="mr-1 text-green-600" />
                        Copié
                      </>
                    ) : (
                      <>
                        <Copy size={14} className="mr-1" />
                        Copier
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">Non renseigné</p>
              )}
            </div>
            
            {/* Dates */}
            <div className="text-xs text-slate-500 space-y-1">
              <p>Soumise le {new Date(submission.submittedAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}</p>
              {submission.validatedAt && (
                <p className="text-green-600">
                  Validée le {new Date(submission.validatedAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              )}
            </div>
            
            {/* Lien TikTok */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <a
                href={tiktokVideoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="w-full">
                  <ExternalLink size={16} className="mr-2" />
                  Voir sur TikTok
                </Button>
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const BrandVideosPage = () => {
  const user = useAuthStore((s) => s.user);
  
  // Filtres
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [campaignFilter, setCampaignFilter] = useState<string>('');
  const [creatorFilter, setCreatorFilter] = useState<string>('');
  
  // Modal
  const [selectedVideo, setSelectedVideo] = useState<SubmissionWithRelations | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Récupérer les campagnes pour le filtre
  const { data: campaignsData } = useGetAllCampaigns({ status: 'all' });
  const myCampaigns = campaignsData?.items.filter((c) => c.brand.userId === user?.id) || [];
  
  // Récupérer les vidéos avec filtres
  const { data, isLoading } = useGetBrandSubmissions({
    status: statusFilter as SubmissionStatus | undefined || undefined,
    campaignId: campaignFilter || undefined,
    creatorUsername: creatorFilter || undefined,
    limit: 50,
  });
  
  // Refresh manuel des stats
  const { mutateAsync: refreshStats, isPending: isRefreshing } = useRefreshStats({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-submissions'] });
    },
  });
  
  // Extraire les créateurs uniques pour le filtre
  const uniqueCreators = useMemo(() => {
    if (!data?.items) return [];
    const creators = new Map<string, string>();
    data.items.forEach((s) => {
      creators.set(s.tiktokAccount.username, s.tiktokAccount.username);
    });
    return Array.from(creators.values()).sort();
  }, [data?.items]);
  
  const hasActiveFilters = statusFilter || campaignFilter || creatorFilter;
  
  const clearFilters = () => {
    setStatusFilter('');
    setCampaignFilter('');
    setCreatorFilter('');
  };
  
  const handleVideoClick = (submission: SubmissionWithRelations) => {
    setSelectedVideo(submission);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vidéos</h1>
          <p className="text-slate-500">
            Toutes les vidéos soumises à vos campagnes.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refreshStats(undefined)}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          {isRefreshing ? 'Actualisation...' : 'Actualiser les stats'}
        </Button>
      </div>
      
      {/* Filtres */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-slate-500">
              <Filter size={16} />
              <span className="text-sm font-medium">Filtres</span>
            </div>
            
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="Tous les statuts"
              options={[
                { value: 'pending', label: 'En attente' },
                { value: 'accepted', label: 'Validées' },
                { value: 'refused', label: 'Refusées' },
              ]}
            />
            
            <Select
              value={campaignFilter}
              onChange={setCampaignFilter}
              placeholder="Toutes les campagnes"
              options={myCampaigns.map((c) => ({
                value: c.id.toString(),
                label: c.title,
              }))}
            />
            
            <div className="relative">
              <input
                type="text"
                value={creatorFilter}
                onChange={(e) => setCreatorFilter(e.target.value)}
                placeholder="Rechercher un créateur..."
                className="h-9 px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#ED5D3B] focus:border-transparent transition-all w-48"
                list="creators-list"
              />
              <datalist id="creators-list">
                {uniqueCreators.map((username) => (
                  <option key={username} value={username} />
                ))}
              </datalist>
            </div>
            
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-slate-500 hover:text-slate-900"
              >
                <X size={14} className="mr-1" />
                Effacer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Grille de vidéos */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="aspect-[9/16] rounded-xl" />
          ))}
        </div>
      ) : !data?.items || data.items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Video className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 mb-2">Aucune vidéo trouvée.</p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Effacer les filtres
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-slate-500">
            {data.items.length} vidéo{data.items.length > 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {data.items.map((submission) => (
              <VideoThumbnail
                key={submission.id}
                submission={submission}
                onClick={() => handleVideoClick(submission)}
              />
            ))}
          </div>
        </>
      )}
      
      {/* Modal de détail */}
      <VideoDetailModal
        submission={selectedVideo}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
};

