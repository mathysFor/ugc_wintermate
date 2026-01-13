import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { useGetAllCampaigns } from '@/api/campaigns';
import { queryClient } from '@/api/query-config';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CampaignActions } from '@/components/campaign-actions';
import type { CampaignWithRelations, CampaignStatus } from '@shared/types/campaigns';
import { 
  Plus,
  Rocket,
  FileEdit,
  Pause,
  Eye,
  TrendingUp,
  ArrowRight,
  Video
} from 'lucide-react';

// Carte de campagne pour la vue marque
const BrandCampaignCard = ({ 
  campaign,
  onActionComplete 
}: { 
  campaign: CampaignWithRelations;
  onActionComplete: () => void;
}) => {
  const maxReward = Math.max(...campaign.rewards.map((r) => r.amountEur), 0);
  const minViews = Math.min(...campaign.rewards.map((r) => r.viewsTarget)) || 0;
  const totalBudget = campaign.rewards.reduce((sum, r) => sum + r.amountEur, 0);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-slate-50 rounded-xl group hover:bg-slate-100 transition-colors">
      {/* Thumbnail */}
      <div className="w-full sm:w-20 h-32 sm:h-14 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
        {campaign.coverImageUrl ? (
          <img 
            src={campaign.coverImageUrl} 
            alt={campaign.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video className="w-6 h-6 text-slate-400" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link 
          to={`/campaign/${campaign.id}`}
          className="font-semibold text-slate-900 hover:text-[#ED5D3B] transition-colors line-clamp-1"
        >
          {campaign.title}
        </Link>
        
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Eye size={12} />
            Min. {minViews.toLocaleString()} vues
          </span>
          <span className="text-xs text-slate-500">•</span>
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <TrendingUp size={12} />
            Jusqu'à {(maxReward / 100).toFixed(0)}€
          </span>
          <span className="text-xs text-slate-500">•</span>
          <span className="text-xs text-slate-500">
            Budget: {(totalBudget / 100).toFixed(0)}€
          </span>
        </div>

        <p className="text-xs text-slate-400 mt-1">
          Créée le {new Date(campaign.createdAt).toLocaleDateString('fr-FR')}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <Link to={`/campaign/${campaign.id}`}>
          <Button variant="ghost" size="sm" className="text-slate-600">
            <ArrowRight size={16} />
          </Button>
        </Link>
        
        <Link to={`/campaign/${campaign.id}/edit`}>
          <Button variant="outline" size="sm" className="text-slate-600">
            <FileEdit size={16} className="mr-1" />
            <span className="hidden sm:inline">Modifier</span>
          </Button>
        </Link>

        <CampaignActions 
          campaignId={campaign.id}
          currentStatus={campaign.status}
          variant="dropdown"
          onActionComplete={onActionComplete}
        />
      </div>
    </div>
  );
};

// Contenu d'un onglet
const TabContent = ({ 
  status 
}: { 
  status: CampaignStatus;
}) => {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, refetch } = useGetAllCampaigns({ status: 'all' });

  // Filtrer les campagnes de l'utilisateur par statut
  const campaigns = data?.items.filter(
    (c) => c.brand.userId === user?.id && c.status === status
  ) || [];

  const handleActionComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    refetch();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          {status === 'active' ? (
            <>
              <Rocket className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 mb-4">Aucune campagne active.</p>
              <p className="text-sm text-slate-400">Publiez un brouillon pour le rendre visible aux créateurs.</p>
            </>
          ) : status === 'draft' ? (
            <>
              <FileEdit className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 mb-4">Aucun brouillon.</p>
              <Link to="/campaign/create">
                <Button>
                  <Plus size={16} className="mr-2" />
                  Créer une campagne
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Pause className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">Aucune campagne en pause.</p>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {campaigns.map((campaign) => (
        <BrandCampaignCard 
          key={campaign.id} 
          campaign={campaign}
          onActionComplete={handleActionComplete}
        />
      ))}
    </div>
  );
};

export const BrandCampaignsPage = () => {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useGetAllCampaigns({ status: 'all' });

  // Compter les campagnes par statut
  const myCampaigns = data?.items.filter((c) => c.brand.userId === user?.id) || [];
  const activeCount = myCampaigns.filter((c) => c.status === 'active').length;
  const draftCount = myCampaigns.filter((c) => c.status === 'draft').length;
  const pausedCount = myCampaigns.filter((c) => c.status === 'paused').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mes campagnes</h1>
          <p className="text-slate-500">
            Gérez toutes vos campagnes et leur statut de publication.
          </p>
        </div>

        <Link to="/campaign/create">
          <Button className="rounded-full shadow-lg shadow-sky-500/20 bg-[#0EA5E9] hover:bg-[#0284C7]">
            <Plus size={18} className="mr-2" />
            Nouvelle campagne
          </Button>
        </Link>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <Rocket className="w-5 h-5 mx-auto mb-1 text-green-600" />
            <p className="text-2xl font-bold text-green-600">
              {isLoading ? '-' : activeCount}
            </p>
            <p className="text-xs text-green-700">Actives</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-4 text-center">
            <FileEdit className="w-5 h-5 mx-auto mb-1 text-slate-600" />
            <p className="text-2xl font-bold text-slate-600">
              {isLoading ? '-' : draftCount}
            </p>
            <p className="text-xs text-slate-500">Brouillons</p>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 text-center">
            <Pause className="w-5 h-5 mx-auto mb-1 text-amber-600" />
            <p className="text-2xl font-bold text-amber-600">
              {isLoading ? '-' : pausedCount}
            </p>
            <p className="text-xs text-amber-700">En pause</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="active" className="flex-1 sm:flex-none">
            <Rocket size={16} className="mr-2" />
            Actives
            {activeCount > 0 && (
              <Badge variant="success" className="ml-2 text-[10px] px-1.5 py-0">
                {activeCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="draft" className="flex-1 sm:flex-none">
            <FileEdit size={16} className="mr-2" />
            Brouillons
            {draftCount > 0 && (
              <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">
                {draftCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="paused" className="flex-1 sm:flex-none">
            <Pause size={16} className="mr-2" />
            En pause
            {pausedCount > 0 && (
              <Badge variant="warning" className="ml-2 text-[10px] px-1.5 py-0">
                {pausedCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <TabContent status="active" />
        </TabsContent>

        <TabsContent value="draft">
          <TabContent status="draft" />
        </TabsContent>

        <TabsContent value="paused">
          <TabContent status="paused" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

