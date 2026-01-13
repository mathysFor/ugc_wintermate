import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useGetSubmissions, useDeleteSubmission } from '@/api/submissions';
import { queryClient } from '@/api/query-config';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import type { SubmissionWithRelations } from '@shared/types/submissions';
import { 
  Video, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share2, 
  Trash2, 
  ExternalLink
} from 'lucide-react';

type GroupedSubmissions = Record<number, {
  campaign: SubmissionWithRelations['campaign'];
  submissions: SubmissionWithRelations[];
}>;

const SubmissionCard = ({ submission }: { submission: SubmissionWithRelations }) => {
  const { mutateAsync: deleteSubmission, isPending: isDeleting } = useDeleteSubmission(submission.id, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette soumission ?')) {
      await deleteSubmission(undefined);
    }
  };

  const tiktokVideoUrl = `https://www.tiktok.com/@${submission.tiktokAccount.username}/video/${submission.tiktokVideoId}`;
  const views = submission.currentStats?.views ?? 0;

  return (
    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 p-2.5 sm:p-3 md:p-4 bg-slate-50 rounded-lg sm:rounded-xl">
      {/* Thumbnail avec lien TikTok */}
      <a
        href={tiktokVideoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative w-12 h-[72px] sm:w-14 sm:h-20 md:w-16 md:h-24 bg-slate-200 rounded-md sm:rounded-lg overflow-hidden flex-shrink-0 group"
      >
        {submission.coverImageUrl ? (
          <img
            src={submission.coverImageUrl}
            alt={`Vidéo de @${submission.tiktokAccount.username}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
          </div>
        )}
        {/* Overlay avec vues */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end justify-center pb-0.5 sm:pb-1">
          <span className="text-white text-[8px] sm:text-[10px] font-medium flex items-center gap-0.5">
            <Eye size={8} className="sm:w-2.5 sm:h-2.5" />
            {views.toLocaleString()}
          </span>
        </div>
        {/* Icône externe au hover */}
        <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="p-0.5 sm:p-1 rounded-full bg-white/30 backdrop-blur-sm">
            <ExternalLink size={8} className="text-white sm:w-2.5 sm:h-2.5" />
          </div>
        </div>
      </a>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1 flex-wrap">
          <Badge variant={
            submission.status === 'accepted' ? 'success' :
            submission.status === 'refused' ? 'destructive' : 'warning'
          } className="text-[10px] sm:text-xs">
            {submission.status === 'accepted' ? 'Approuvée' :
             submission.status === 'refused' ? 'Refusée' : 'En attente'}
          </Badge>
          <span className="text-[10px] sm:text-xs text-slate-500 truncate">
            @{submission.tiktokAccount.username}
          </span>
        </div>
        
        <p className="text-xs sm:text-sm text-slate-600 mb-1.5 sm:mb-2">
          Soumise le {new Date(submission.submittedAt).toLocaleDateString('fr-FR')}
        </p>

        {/* Stats */}
        {submission.currentStats && (
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 text-[10px] sm:text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-0.5 sm:gap-1">
              <Eye size={10} className="sm:w-3 sm:h-3" />
              {submission.currentStats.views.toLocaleString()}
            </span>
            <span className="flex items-center gap-0.5 sm:gap-1">
              <Heart size={10} className="sm:w-3 sm:h-3" />
              {submission.currentStats.likes.toLocaleString()}
            </span>
            <span className="flex items-center gap-0.5 sm:gap-1 hidden sm:flex">
              <MessageCircle size={10} className="sm:w-3 sm:h-3" />
              {submission.currentStats.comments.toLocaleString()}
            </span>
            <span className="flex items-center gap-0.5 sm:gap-1 hidden sm:flex">
              <Share2 size={10} className="sm:w-3 sm:h-3" />
              {submission.currentStats.shares.toLocaleString()}
            </span>
          </div>
        )}

        {submission.refuseReason && (
          <p className="text-[10px] sm:text-xs text-red-600 mt-1.5 sm:mt-2">
            Raison du refus : {submission.refuseReason}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {submission.status === 'pending' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 w-7 sm:h-8 sm:w-8 p-0"
          >
            <Trash2 size={14} className="sm:w-4 sm:h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export const SubmissionsPage = () => {
  const { data: submissions, isLoading } = useGetSubmissions();

  // Grouper les soumissions par campagne
  const groupedSubmissions = useMemo<GroupedSubmissions>(() => {
    if (!submissions?.items) return {};

    return submissions.items.reduce<GroupedSubmissions>((acc, submission) => {
      const campaignId = submission.campaignId;
      
      if (!acc[campaignId]) {
        acc[campaignId] = {
          campaign: submission.campaign,
          submissions: [],
        };
      }
      
      acc[campaignId].submissions.push(submission);
      return acc;
    }, {});
  }, [submissions?.items]);

  const campaignIds = Object.keys(groupedSubmissions);

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <Skeleton className="h-6 sm:h-8 w-36 sm:w-48" />
        </div>
        <div className="space-y-3 sm:space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 sm:h-28 md:h-32 w-full rounded-lg sm:rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">Mes soumissions</h1>
          <p className="text-slate-500 text-sm sm:text-base mt-0.5 sm:mt-1">
            Retrouvez toutes vos vidéos soumises aux campagnes.
          </p>
        </div>
      </div>

      {/* Content */}
      {campaignIds.length === 0 ? (
        <Card>
          <CardContent className="py-8 sm:py-10 md:py-12 text-center">
            <Video className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-slate-300" />
            <p className="text-slate-500 mb-3 sm:mb-4 text-sm sm:text-base">Aucune soumission pour le moment.</p>
            <Link to="/campaigns">
              <Button className="text-sm sm:text-base">Trouver une campagne</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" defaultValue={campaignIds}>
          {campaignIds.map((campaignIdStr) => {
            const campaignId = parseInt(campaignIdStr, 10);
            const group = groupedSubmissions[campaignId];
            const acceptedCount = group.submissions.filter(s => s.status === 'accepted').length;
            const pendingCount = group.submissions.filter(s => s.status === 'pending').length;

            return (
              <AccordionItem key={campaignId} value={campaignIdStr}>
                <AccordionTrigger className="hover:bg-slate-50 px-2 sm:px-4">
                  <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                    {/* Campaign thumbnail */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md sm:rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                      {group.campaign.coverImageUrl ? (
                        <img 
                          src={group.campaign.coverImageUrl} 
                          alt={group.campaign.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="text-left">
                      <p className="font-semibold text-slate-900 text-sm sm:text-base">{group.campaign.title}</p>
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
                        <span className="text-[10px] sm:text-xs text-slate-500">
                          {group.submissions.length} vidéo{group.submissions.length > 1 ? 's' : ''}
                        </span>
                        {acceptedCount > 0 && (
                          <Badge variant="success" className="text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0">
                            {acceptedCount} approuvée{acceptedCount > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {pendingCount > 0 && (
                          <Badge variant="warning" className="text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0">
                            {pendingCount} en attente
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent>
                  <div className="space-y-2 sm:space-y-3">
                    {group.submissions.map((submission) => (
                      <SubmissionCard key={submission.id} submission={submission} />
                    ))}
                    
                    <Link to={`/campaign/${campaignId}`}>
                      <Button variant="outline" size="sm" className="w-full mt-1.5 sm:mt-2 text-xs sm:text-sm">
                        Voir la campagne
                      </Button>
                    </Link>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
};

