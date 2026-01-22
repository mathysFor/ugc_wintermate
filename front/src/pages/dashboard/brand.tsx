import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ComposedChart,
  Bar,
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useAuthStore } from '@/stores/auth';
import { useGetAllCampaigns } from '@/api/campaigns';
import { useGetMyBrand } from '@/api/brands';
import { useGetBrandDashboardStats } from '@/api/dashboard';
import { queryClient } from '@/api/query-config';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CampaignActions } from '@/components/campaign-actions';
import {
  Plus,
  Rocket,
  Eye,
  Euro,
  TrendingUp,
  ArrowRight,
  BarChart3,
  ChevronDown,
  Users,
  CheckCircle,
} from 'lucide-react';

// Couleurs vibrantes pour les campagnes
const CAMPAIGN_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f43f5e', // rose
  '#0EA5E9', // sky
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
];

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const formatMonth = (monthStr: string): string => {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
};

// Animation counter component
const AnimatedNumber = ({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) => {
  return (
    <span className="tabular-nums">
      {prefix}{formatNumber(value)}{suffix}
    </span>
  );
};

export const BrandDashboardPage = () => {
  const user = useAuthStore((s) => s.user);
  const { data: brand, isLoading: loadingBrand } = useGetMyBrand();
  const { data: campaigns, isLoading: loadingCampaigns } = useGetAllCampaigns({ status: 'all' });
  const { data: dashboardStats, isLoading: loadingStats } = useGetBrandDashboardStats();

  const [selectedCampaignId, setSelectedCampaignId] = useState<number | 'all'>('all');
  const [showCampaignDropdown, setShowCampaignDropdown] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'views' | 'spent' | 'acceptedVideos' | 'activeCampaigns' | 'creators' | 'cpm'>('views');

  // Filter campaigns
  const myCampaigns = campaigns?.items.filter((c) => c.brand.userId === user?.id) || [];

  // Get unique campaigns for legend (MUST be before chartData)
  const uniqueCampaigns = useMemo(() => {
    if (!dashboardStats?.monthlyData) return [];
    const campaignMap = new Map<number, string>();
    dashboardStats.monthlyData.forEach((month) => {
      month.campaignBreakdown.forEach((cb) => {
        campaignMap.set(cb.campaignId, cb.campaignTitle);
      });
    });
    return Array.from(campaignMap.entries()).map(([id, title], idx) => ({
      id,
      title,
      color: CAMPAIGN_COLORS[idx % CAMPAIGN_COLORS.length],
    }));
  }, [dashboardStats]);

  // Prepare chart data - ensure all campaign keys exist in every data point
  const chartData = useMemo(() => {
    if (!dashboardStats?.monthlyData) return [];

    return dashboardStats.monthlyData.map((month) => {
      const data: Record<string, number | string> = {
        month: formatMonth(month.month),
      };

      // Selon la métrique sélectionnée, ajouter les bonnes données
      if (selectedMetric === 'views') {
        data.totalViews = month.totalViews;
        // Add breakdown per campaign if 'all' selected
        if (selectedCampaignId === 'all') {
          // Initialize ALL campaigns to 0 first (fix for missing keys)
          uniqueCampaigns.forEach((c) => {
            data[`campaign_${c.id}`] = 0;
          });
          // Then fill with actual values
          month.campaignBreakdown.forEach((cb) => {
            data[`campaign_${cb.campaignId}`] = cb.views;
          });
        } else {
          const campaignData = month.campaignBreakdown.find(
            (cb) => cb.campaignId === selectedCampaignId
          );
          data.views = campaignData?.views || 0;
        }
      } else if (selectedMetric === 'spent') {
        data.totalSpent = month.totalCost / 100; // Convertir centimes en euros
      } else if (selectedMetric === 'acceptedVideos') {
        data.acceptedVideos = month.acceptedVideosCount;
      } else if (selectedMetric === 'activeCampaigns') {
        data.activeCampaigns = month.activeCampaignsCount;
      } else if (selectedMetric === 'creators') {
        data.creators = month.creatorsCount;
      } else if (selectedMetric === 'cpm') {
        data.cpm = month.averageCpm / 100; // Convertir centimes en euros
      }

      return data;
    });
  }, [dashboardStats, selectedCampaignId, uniqueCampaigns, selectedMetric]);

  const selectedCampaignName = selectedCampaignId === 'all'
    ? 'Toutes les campagnes'
    : uniqueCampaigns.find(c => c.id === selectedCampaignId)?.title || 'Campagne';

  // Détermine les données à afficher selon la métrique sélectionnée
  const chartConfig = useMemo(() => {
    const configs: Record<string, { dataKey: string; name: string; color: string; gradient: string }> = {
      views: { dataKey: 'totalViews', name: 'Vues totales', color: '#22d3ee', gradient: 'url(#gradientViews)' },
      spent: { dataKey: 'totalSpent', name: 'Budget dépensé', color: '#4ade80', gradient: 'url(#gradientSpent)' },
      acceptedVideos: { dataKey: 'acceptedVideos', name: 'Vidéos acceptées', color: '#a78bfa', gradient: 'url(#gradientVideos)' },
      activeCampaigns: { dataKey: 'activeCampaigns', name: 'Campagnes actives', color: '#f472b6', gradient: 'url(#gradientCampaigns)' },
      creators: { dataKey: 'creators', name: 'Créateurs', color: '#fbbf24', gradient: 'url(#gradientCreators)' },
      cpm: { dataKey: 'cpm', name: 'CPM moyen', color: '#fb923c', gradient: 'url(#gradientCpm)' },
    };
    
    // Si on est sur les vues avec une campagne spécifique
    if (selectedMetric === 'views' && selectedCampaignId !== 'all') {
      return { dataKey: 'views', name: 'Vues', color: '#22d3ee', gradient: 'url(#gradientViews)' };
    }
    
    return configs[selectedMetric] || configs.views;
  }, [selectedMetric, selectedCampaignId]);

  // Détermine les Bars à afficher selon la métrique sélectionnée (pour le mode multi-campagnes)
  const barsToRender = useMemo(() => {
    if (selectedMetric === 'views') {
      if (selectedCampaignId !== 'all') {
        return [{ id: 'single', dataKey: 'views', name: 'Vues', color: '#22d3ee' }];
      }
      if (uniqueCampaigns.length > 0) {
        return uniqueCampaigns.map((c) => ({
          id: c.id,
          dataKey: `campaign_${c.id}`,
          name: c.title,
          color: c.color,
        }));
      }
      return [{ id: 'total', dataKey: 'totalViews', name: 'Vues totales', color: '#22d3ee' }];
    } else if (selectedMetric === 'spent') {
      return [{ id: 'spent', dataKey: 'totalSpent', name: 'Budget dépensé', color: '#4ade80' }];
    } else if (selectedMetric === 'acceptedVideos') {
      return [{ id: 'videos', dataKey: 'acceptedVideos', name: 'Vidéos acceptées', color: '#a78bfa' }];
    } else if (selectedMetric === 'activeCampaigns') {
      return [{ id: 'campaigns', dataKey: 'activeCampaigns', name: 'Campagnes actives', color: '#f472b6' }];
    } else if (selectedMetric === 'creators') {
      return [{ id: 'creators', dataKey: 'creators', name: 'Créateurs', color: '#fbbf24' }];
    } else if (selectedMetric === 'cpm') {
      return [{ id: 'cpm', dataKey: 'cpm', name: 'CPM moyen', color: '#fb923c' }];
    }
    return [];
  }, [selectedCampaignId, uniqueCampaigns, selectedMetric]);

  // Check if we have data to display
  const hasData = useMemo(() => {
    if (selectedMetric === 'views') {
      return chartData.some((d) => Number(d.totalViews || 0) > 0);
    } else if (selectedMetric === 'spent') {
      return chartData.some((d) => Number(d.totalSpent || 0) > 0);
    } else if (selectedMetric === 'acceptedVideos') {
      return chartData.some((d) => Number(d.acceptedVideos || 0) > 0);
    } else if (selectedMetric === 'activeCampaigns') {
      return chartData.some((d) => Number(d.activeCampaigns || 0) > 0);
    } else if (selectedMetric === 'creators') {
      return chartData.some((d) => Number(d.creators || 0) > 0);
    } else if (selectedMetric === 'cpm') {
      return chartData.some((d) => Number(d.cpm || 0) > 0);
    }
    return false;
  }, [chartData, selectedMetric]);

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-0.5 sm:mt-1">Suivez vos performances et optimisez vos campagnes</p>
        </div>
        <Link to="/campaign/create">
          <Button className="rounded-full shadow-lg shadow-sky-500/25 bg-gradient-to-r from-[#0EA5E9] to-sky-500 hover:from-[#0284C7] hover:to-sky-600 transition-all duration-300 hover:scale-105 text-sm sm:text-base">
            <Plus size={16} className="mr-1.5 sm:mr-2" />
            Nouvelle campagne
          </Button>
        </Link>
      </div>

      {/* Alert - No Brand Profile */}
      {!loadingBrand && !brand && (
        <Card className="border-sky-200 bg-gradient-to-r from-sky-50 to-cyan-50 animate-pulse-slow">
          <CardContent className="p-3 sm:p-4 md:p-6 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-amber-800 mb-0.5 sm:mb-1 text-sm sm:text-base">Profil incomplet</p>
              <p className="text-amber-700 text-xs sm:text-sm">
                Configurez votre profil de marque pour publier des campagnes.
              </p>
            </div>
            <Link to="/profile">
              <Button
                variant="outline"
                size="sm"
                className="border-amber-300 text-amber-800 hover:bg-amber-100 text-xs sm:text-sm"
              >
                Configurer
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* KPIs Grid - 6 cartes avec layout personnalisé */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {/* Vues totales - prend 50% (2 colonnes) */}
        <Card 
          className={`group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden relative col-span-2 cursor-pointer ${
            selectedMetric === 'views' ? 'ring-2 ring-[#0EA5E9] bg-sky-50/50' : ''
          }`}
          onClick={() => setSelectedMetric('views')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardContent className="p-3 sm:p-4 md:p-6 relative">
            <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
              <p className="text-xs sm:text-sm font-medium text-slate-500">Vues totales</p>
              <div className="p-1.5 sm:p-2 bg-sky-100 text-[#0EA5E9] rounded-lg group-hover:scale-110 transition-transform">
                <Eye size={16} className="sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="flex flex-col gap-1 sm:gap-2">
              {loadingStats ? (
                <Skeleton className="h-6 sm:h-8 w-16 sm:w-24" />
              ) : (
                <>
                  <div className="flex items-baseline gap-1 sm:gap-2">
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
                      {formatNumber(dashboardStats?.totalViews || 0)}
                    </p>
                    {dashboardStats?.viewsTrend !== undefined && (
                      <Badge
                        variant={dashboardStats.viewsTrend >= 0 ? 'success' : 'destructive'}
                        className="text-[10px] sm:text-xs"
                      >
                        {dashboardStats.viewsTrend >= 0 ? '+' : ''}
                        {dashboardStats.viewsTrend}%
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-400 mt-1 sm:mt-2">vs mois précédent</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Budget dépensé - prend 25% (1 colonne) */}
        <Card 
          className={`group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden relative col-span-1 cursor-pointer ${
            selectedMetric === 'spent' ? 'ring-2 ring-emerald-500 bg-emerald-50/50' : ''
          }`}
          onClick={() => setSelectedMetric('spent')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardContent className="p-3 sm:p-4 md:p-6 relative">
            <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
              <p className="text-xs sm:text-sm font-medium text-slate-500">Budget dépensé</p>
              <div className="p-1.5 sm:p-2 bg-emerald-100 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform">
                <Euro size={16} className="sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="flex flex-col gap-1 sm:gap-2">
              {loadingStats ? (
                <Skeleton className="h-6 sm:h-8 w-16 sm:w-24" />
              ) : (
                <>
                  <div className="flex items-baseline gap-1 sm:gap-2">
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
                      {((dashboardStats?.totalSpent || 0) / 100).toFixed(0)}€
                    </p>
                    {dashboardStats?.spentTrend !== undefined && (
                      <Badge
                        variant={dashboardStats.spentTrend >= 0 ? 'destructive' : 'success'}
                        className="text-[10px] sm:text-xs"
                      >
                        {dashboardStats.spentTrend >= 0 ? '+' : ''}
                        {dashboardStats.spentTrend}%
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-400 mt-1 sm:mt-2">factures payées</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Campagnes actives - prend 25% (1 colonne) */}
        <Card 
          className={`group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden relative col-span-1 cursor-pointer ${
            selectedMetric === 'activeCampaigns' ? 'ring-2 ring-sky-500 bg-sky-50/50' : ''
          }`}
          onClick={() => setSelectedMetric('activeCampaigns')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardContent className="p-3 sm:p-4 md:p-6 relative">
            <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
              <p className="text-xs sm:text-sm font-medium text-slate-500">Campagnes actives</p>
              <div className="p-1.5 sm:p-2 bg-sky-100 text-sky-600 rounded-lg group-hover:scale-110 transition-transform">
                <Rocket size={16} className="sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 sm:gap-2">
              {loadingStats ? (
                <Skeleton className="h-6 sm:h-8 w-12 sm:w-16" />
              ) : (
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
                  {dashboardStats?.activeCampaigns || 0}
                </p>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1 sm:mt-2">en cours</p>
          </CardContent>
        </Card>

        {/* Créateurs - prend 25% (1 colonne) */}
        <Card 
          className={`group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden relative col-span-1 cursor-pointer ${
            selectedMetric === 'creators' ? 'ring-2 ring-sky-500 bg-sky-50/50' : ''
          }`}
          onClick={() => setSelectedMetric('creators')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardContent className="p-3 sm:p-4 md:p-6 relative">
            <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
              <p className="text-xs sm:text-sm font-medium text-slate-500">Créateurs</p>
              <div className="p-1.5 sm:p-2 bg-sky-100 text-sky-600 rounded-lg group-hover:scale-110 transition-transform">
                <Users size={16} className="sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 sm:gap-2">
              {loadingStats ? (
                <Skeleton className="h-6 sm:h-8 w-12 sm:w-16" />
              ) : (
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
                  {dashboardStats?.creatorsCount || 0}
                </p>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1 sm:mt-2">sur la plateforme</p>
          </CardContent>
        </Card>

        {/* Vidéos acceptées - prend 25% (1 colonne) */}
        <Card 
          className={`group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden relative col-span-1 cursor-pointer ${
            selectedMetric === 'acceptedVideos' ? 'ring-2 ring-sky-500 bg-sky-50/50' : ''
          }`}
          onClick={() => setSelectedMetric('acceptedVideos')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardContent className="p-3 sm:p-4 md:p-6 relative">
            <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
              <p className="text-xs sm:text-sm font-medium text-slate-500">Vidéos acceptées</p>
              <div className="p-1.5 sm:p-2 bg-sky-100 text-sky-600 rounded-lg group-hover:scale-110 transition-transform">
                <CheckCircle size={16} className="sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="flex flex-col gap-1 sm:gap-2">
              {loadingStats ? (
                <Skeleton className="h-6 sm:h-8 w-12 sm:w-16" />
              ) : (
                <>
                  <div className="flex items-baseline gap-1 sm:gap-2">
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
                      {dashboardStats?.acceptedVideosCount || 0}
                    </p>
                    {dashboardStats?.acceptedVideosTrend !== undefined && (
                      <Badge
                        variant={dashboardStats.acceptedVideosTrend >= 0 ? 'success' : 'destructive'}
                        className="text-[10px] sm:text-xs"
                      >
                        {dashboardStats.acceptedVideosTrend >= 0 ? '+' : ''}
                        {dashboardStats.acceptedVideosTrend}%
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-400 mt-1 sm:mt-2">sur la plateforme</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* CPM moyen - prend 50% (2 colonnes) */}
        <Card 
          className={`group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden relative bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 col-span-2 cursor-pointer ${
            selectedMetric === 'cpm' ? 'ring-2 ring-amber-500' : ''
          }`}
          onClick={() => setSelectedMetric('cpm')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardContent className="p-3 sm:p-4 md:p-6 relative">
            <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
              <p className="text-xs sm:text-sm font-medium text-amber-700">CPM moyen</p>
              <div className="p-1.5 sm:p-2 bg-amber-200 text-amber-700 rounded-lg group-hover:scale-110 transition-transform">
                <TrendingUp size={16} className="sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 sm:gap-2">
              {loadingStats ? (
                <Skeleton className="h-6 sm:h-8 w-16 sm:w-24" />
              ) : (
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-800">
                  {((dashboardStats?.averageCpm || 0) / 100).toFixed(2)}€
                </p>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-amber-600 mt-1 sm:mt-2">coût pour 1000 vues</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart - Modern Clean Design */}
      <Card className="overflow-hidden border-0 shadow-xl bg-white rounded-2xl">
        <CardHeader className="p-4 sm:p-5 md:p-6 pb-0 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
            {/* Left: Icon + Title */}
            <div className="flex items-start gap-3">
              <div 
                className="p-2.5 rounded-xl"
                style={{ backgroundColor: `${chartConfig.color}15` }}
              >
                {selectedMetric === 'views' && <Eye className="w-5 h-5" style={{ color: chartConfig.color }} />}
                {selectedMetric === 'spent' && <Euro className="w-5 h-5" style={{ color: chartConfig.color }} />}
                {selectedMetric === 'acceptedVideos' && <CheckCircle className="w-5 h-5" style={{ color: chartConfig.color }} />}
                {selectedMetric === 'activeCampaigns' && <Rocket className="w-5 h-5" style={{ color: chartConfig.color }} />}
                {selectedMetric === 'creators' && <Users className="w-5 h-5" style={{ color: chartConfig.color }} />}
                {selectedMetric === 'cpm' && <TrendingUp className="w-5 h-5" style={{ color: chartConfig.color }} />}
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-semibold text-slate-900">
                  {selectedMetric === 'views' && 'Vues par mois'}
                  {selectedMetric === 'spent' && 'Budget dépensé par mois'}
                  {selectedMetric === 'acceptedVideos' && 'Vidéos acceptées par mois'}
                  {selectedMetric === 'activeCampaigns' && 'Campagnes actives par mois'}
                  {selectedMetric === 'creators' && 'Créateurs par mois'}
                  {selectedMetric === 'cpm' && 'CPM moyen par mois'}
                </CardTitle>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  {selectedMetric === 'views' && 'Performance sur les 12 derniers mois'}
                  {selectedMetric === 'spent' && 'Évolution des dépenses'}
                  {selectedMetric === 'acceptedVideos' && 'Vidéos acceptées'}
                  {selectedMetric === 'activeCampaigns' && 'Campagnes en cours'}
                  {selectedMetric === 'creators' && 'Créateurs participants'}
                  {selectedMetric === 'cpm' && 'Coût pour 1000 vues'}
                </p>
              </div>
            </div>
            
            {/* Right: Total value */}
            <div className="text-right">
              <p className="text-2xl sm:text-3xl font-bold text-slate-900">
                {selectedMetric === 'views' && formatNumber(dashboardStats?.totalViews || 0)}
                {selectedMetric === 'spent' && `${((dashboardStats?.totalSpent || 0) / 100).toFixed(0)}€`}
                {selectedMetric === 'acceptedVideos' && (dashboardStats?.acceptedVideosCount || 0)}
                {selectedMetric === 'activeCampaigns' && (dashboardStats?.activeCampaigns || 0)}
                {selectedMetric === 'creators' && (dashboardStats?.creatorsCount || 0)}
                {selectedMetric === 'cpm' && `${((dashboardStats?.averageCpm || 0) / 100).toFixed(2)}€`}
              </p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Total</p>
            </div>
          </div>
          
          {/* Campaign Filter Dropdown - seulement pour les vues */}
          {selectedMetric === 'views' && (
            <div className="relative mt-4">
              <Button
                variant="outline"
                className="min-w-[160px] sm:min-w-[200px] justify-between text-xs sm:text-sm bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                onClick={() => setShowCampaignDropdown(!showCampaignDropdown)}
              >
                <span className="truncate">{selectedCampaignName}</span>
                <ChevronDown size={14} className="ml-1.5 sm:ml-2 flex-shrink-0" />
              </Button>
              
              {showCampaignDropdown && (
                <div className="absolute left-0 mt-2 w-56 sm:w-64 bg-white rounded-xl shadow-xl border border-slate-200 z-50 py-1.5 sm:py-2 max-h-64 overflow-y-auto">
                  <button
                    className={`w-full px-3 sm:px-4 py-1.5 sm:py-2 text-left hover:bg-slate-50 transition-colors text-xs sm:text-sm text-slate-700 ${
                      selectedCampaignId === 'all' ? 'bg-sky-50 text-sky-700' : ''
                    }`}
                    onClick={() => {
                      setSelectedCampaignId('all');
                      setShowCampaignDropdown(false);
                    }}
                  >
                    Toutes les campagnes
                  </button>
                  {uniqueCampaigns.map((campaign) => (
                    <button
                      key={campaign.id}
                      className={`w-full px-3 sm:px-4 py-1.5 sm:py-2 text-left hover:bg-slate-50 transition-colors flex items-center gap-2 text-xs sm:text-sm text-slate-700 ${
                        selectedCampaignId === campaign.id ? 'bg-sky-50 text-sky-700' : ''
                      }`}
                      onClick={() => {
                        setSelectedCampaignId(campaign.id);
                        setShowCampaignDropdown(false);
                      }}
                    >
                      <div
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: campaign.color }}
                      />
                      <span className="truncate">{campaign.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="p-4 sm:p-5 md:p-6 pt-2 bg-white">
          {loadingStats ? (
            <Skeleton className="h-[220px] sm:h-[280px] md:h-[300px] w-full rounded-xl" />
          ) : !hasData ? (
            <div className="h-[220px] sm:h-[280px] md:h-[300px] flex items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <div className="text-center px-4">
                <BarChart3 size={36} className="mx-auto mb-2 sm:mb-3 opacity-50 sm:w-12 sm:h-12" />
                <p className="text-sm sm:text-base">Aucune donnée disponible</p>
                <p className="text-xs sm:text-sm mt-1 text-slate-500">Créez votre première campagne pour voir vos stats</p>
              </div>
            </div>
          ) : (
            <div className="h-[220px] sm:h-[280px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradientViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradientSpent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4ade80" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#4ade80" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradientVideos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradientCampaigns" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f472b6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#f472b6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradientCreators" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradientCpm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fb923c" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#fb923c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#e2e8f0" 
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    dy={8}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value: number) => {
                      if (selectedMetric === 'spent' || selectedMetric === 'cpm') {
                        return `${value.toFixed(selectedMetric === 'cpm' ? 1 : 0)}€`;
                      } else if (selectedMetric === 'acceptedVideos' || selectedMetric === 'activeCampaigns' || selectedMetric === 'creators') {
                        return value.toString();
                      }
                      return formatNumber(value);
                    }}
                    width={45}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    }}
                    labelStyle={{ color: '#64748b', marginBottom: '4px', fontWeight: 500 }}
                    itemStyle={{ color: chartConfig.color }}
                    formatter={(value) => {
                      if (value === undefined || typeof value !== 'number') return ['', ''];
                      if (selectedMetric === 'spent' || selectedMetric === 'cpm') {
                        return [`${value.toFixed(selectedMetric === 'cpm' ? 2 : 0)}€`, chartConfig.name];
                      } else if (selectedMetric === 'acceptedVideos' || selectedMetric === 'activeCampaigns' || selectedMetric === 'creators') {
                        return [value.toString(), chartConfig.name];
                      }
                      return [formatNumber(value), chartConfig.name];
                    }}
                    cursor={{ stroke: chartConfig.color, strokeWidth: 1, strokeDasharray: '5 5' }}
                  />
                  <Area
                    type="monotone"
                    dataKey={chartConfig.dataKey}
                    stroke={chartConfig.color}
                    strokeWidth={2.5}
                    fill={chartConfig.gradient}
                    dot={false}
                    activeDot={{ 
                      r: 6, 
                      stroke: chartConfig.color, 
                      strokeWidth: 2, 
                      fill: 'white' 
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Campaigns Table */}
      <Card className="border-0 shadow-lg shadow-slate-200/50">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-slate-50 to-transparent border-b border-slate-100 p-3 sm:p-4 md:p-6">
          <CardTitle className="text-base sm:text-lg">Campagnes récentes</CardTitle>
          <Link
            to="/brand/campaigns"
            className="text-xs sm:text-sm text-[#0EA5E9] hover:text-sky-600 flex items-center gap-1 hover:gap-2 transition-all"
          >
            Voir tout <ArrowRight size={12} className="sm:w-3.5 sm:h-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6">
          {loadingCampaigns ? (
            <div className="space-y-2 sm:space-y-3 md:space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 sm:h-16 w-full rounded-lg sm:rounded-xl" />
              ))}
            </div>
          ) : myCampaigns.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-slate-400 bg-slate-50 rounded-lg sm:rounded-xl border border-dashed border-slate-200">
              <Rocket size={32} className="mx-auto mb-2 sm:mb-3 opacity-50 sm:w-10 sm:h-10" />
              <p className="text-sm sm:text-base">Aucune campagne créée</p>
              <Link to="/campaign/create" className="mt-3 sm:mt-4 inline-block">
                <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                  Créer ma première campagne
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {myCampaigns.slice(0, 5).map((campaign, idx) => (
                <div
                  key={campaign.id}
                  className="flex items-center gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-slate-100 hover:bg-gradient-to-r hover:from-slate-50 hover:to-transparent transition-all duration-300 group"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="h-10 w-12 sm:h-12 sm:w-16 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0">
                    {campaign.coverImageUrl ? (
                      <img
                        src={campaign.coverImageUrl}
                        alt=""
                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-400 text-[10px] sm:text-xs">
                        IMG
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate group-hover:text-[#0EA5E9] transition-colors text-sm sm:text-base">
                      {campaign.title}
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-500 truncate">
                      Budget: {campaign.rewards.reduce((sum, r) => sum + r.amountEur, 0) / 100}€
                    </p>
                  </div>

                  <Badge
                    variant={
                      campaign.status === 'active'
                        ? 'success'
                        : campaign.status === 'draft'
                        ? 'secondary'
                        : campaign.status === 'paused'
                        ? 'outline'
                        : 'outline'
                    }
                    className="text-[10px] sm:text-xs hidden sm:inline-flex"
                  >
                    {campaign.status === 'draft'
                      ? 'Brouillon'
                      : campaign.status === 'active'
                      ? 'Active'
                      : campaign.status === 'paused'
                      ? 'En pause'
                      : campaign.status}
                  </Badge>

                  <Link to={`/campaign/${campaign.id}`} className="hidden sm:block">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                    >
                      <ArrowRight size={14} />
                    </Button>
                  </Link>

                  <CampaignActions
                    campaignId={campaign.id}
                    currentStatus={campaign.status}
                    variant="dropdown"
                    onActionComplete={() => queryClient.invalidateQueries({ queryKey: ['campaigns'] })}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
