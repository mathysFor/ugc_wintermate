import { Link } from 'react-router-dom';
import { useGetAllCampaigns } from '@/api/campaigns';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Eye, TrendingUp, ArrowRight } from 'lucide-react';

export const CampaignsPage = () => {
  const { data: campaigns, isLoading } = useGetAllCampaigns({ status: 'active' });

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
        <div>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">Explorer les campagnes</p>
          <p className="text-slate-500 mt-0.5 sm:mt-1 text-sm sm:text-base">
            Découvrez les meilleures opportunités pour monétiser votre audience.
          </p>
        </div>
      </div>

      {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[300px] sm:h-[340px] md:h-[380px] w-full rounded-lg sm:rounded-xl md:rounded-2xl" />
            ))}
          </div>
        ) : campaigns?.items.length === 0 ? (
        <div className="text-center py-12 sm:py-16 md:py-24 bg-white rounded-lg sm:rounded-xl md:rounded-2xl border border-dashed border-slate-200">
          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-slate-400" />
          </div>
          <p className="text-base sm:text-lg font-semibold text-slate-900">Aucune campagne disponible</p>
          <p className="text-slate-500 max-w-sm mx-auto mt-1 sm:mt-2 text-sm sm:text-base px-4">
            Revenez plus tard pour découvrir de nouvelles offres de marques.
          </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {campaigns?.items.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
    </div>
  );
};

const CampaignCard = ({
  campaign,
}: {
  campaign: {
    id: number;
    title: string;
    description: string;
    status: 'draft' | 'active' | 'paused' | 'deleted';
    coverImageUrl: string | null;
    brand: { name: string; logoUrl: string | null };
    rewards: { viewsTarget: number; amountEur: number }[];
  };
}) => {
  const maxReward = Math.max(...campaign.rewards.map((r) => r.amountEur), 0);
  const minViews = Math.min(...campaign.rewards.map((r) => r.viewsTarget)) || 0;

  return (
    <Link to={`/campaign/${campaign.id}`} className="block h-full">
      <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-300 group border-slate-200">
        {/* Image Area */}
        <div className="relative h-36 sm:h-40 md:h-44 lg:h-48 overflow-hidden bg-slate-100">
          {campaign.coverImageUrl ? (
            <img
              src={campaign.coverImageUrl}
              alt={campaign.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-50 to-cyan-50">
              <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-sky-200" />
            </div>
          )}
          
          <div className="absolute top-2 sm:top-3 md:top-4 left-2 sm:left-3 md:left-4">
            <div className="flex items-center gap-1.5 sm:gap-2 bg-white/90 backdrop-blur px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full shadow-sm">
              <Avatar 
                src={campaign.brand.logoUrl} 
                fallback={campaign.brand.name[0]} 
                size="sm"
                className="w-4 h-4 sm:w-5 sm:h-5 text-[8px] sm:text-[10px]"
              />
              <span className="text-xs sm:text-sm font-medium text-slate-900">{campaign.brand.name}</span>
            </div>
          </div>

          {maxReward > 0 && (
            <div className="absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4">
              <Badge variant="success" className="shadow-sm text-[10px] sm:text-xs">
                Jusqu'à {(maxReward / 100).toFixed(0)}€
              </Badge>
            </div>
          )}
        </div>

        {/* Content Area */}
        <CardContent className="p-3 sm:p-4 md:p-5 flex flex-col h-[calc(100%-9rem)] sm:h-[calc(100%-10rem)] md:h-[calc(100%-11rem)] lg:h-[calc(100%-12rem)]">
          <div className="flex-1">
            <p className="font-bold text-sm sm:text-base md:text-lg text-slate-900 mb-1 sm:mb-2 line-clamp-1 group-hover:text-[#ED5D3B] transition-colors">
              {campaign.title}
            </p>
            <p className="text-slate-500 text-xs sm:text-sm line-clamp-2 mb-2 sm:mb-3 md:mb-4">
              {campaign.description}
            </p>
          </div>

          <div className="pt-2 sm:pt-3 md:pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-500">
              <Eye size={14} className="sm:w-4 sm:h-4" />
              <span>Min. {minViews.toLocaleString()} vues</span>
            </div>
            <Button variant="ghost" size="sm" className="text-[#0EA5E9] hover:text-sky-600 hover:bg-sky-50 -mr-2 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3">
              Voir <ArrowRight size={14} className="ml-0.5 sm:ml-1" />
            </Button>
        </div>
        </CardContent>
      </Card>
    </Link>
  );
};
