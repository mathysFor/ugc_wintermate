import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ComposedChart,
  Bar,
  Line,
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
        totalViews: month.totalViews,
      };

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

      return data;
    });
  }, [dashboardStats, selectedCampaignId, uniqueCampaigns]);

  const selectedCampaignName = selectedCampaignId === 'all'
    ? 'Toutes les campagnes'
    : uniqueCampaigns.find(c => c.id === selectedCampaignId)?.title || 'Campagne';

  // Détermine les Bars à afficher (style ComposedChart comme creator)
  const barsToRender = useMemo(() => {
    if (selectedCampaignId !== 'all') {
      return [{ id: 'single', dataKey: 'views', name: 'Vues', color: '#ED5D3B' }];
    }
    if (uniqueCampaigns.length > 0) {
      return uniqueCampaigns.map((c) => ({
        id: c.id,
        dataKey: `campaign_${c.id}`,
        name: c.title,
        color: c.color,
      }));
    }
    return [{ id: 'total', dataKey: 'totalViews', name: 'Vues totales', color: '#ED5D3B' }];
  }, [selectedCampaignId, uniqueCampaigns]);

  // Check if we have data to display
  const hasData = chartData.some((d) => Number(d.totalViews) > 0);

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

      {/* Main Chart - Full Width */}
      <Card className="overflow-hidden border-0 shadow-xl shadow-slate-200/50">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-100 p-3 sm:p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <CardTitle className="text-base sm:text-lg font-semibold text-slate-800">
                Vues par mois
              </CardTitle>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
                Performance de vos vidéos sur les 12 derniers mois
              </p>
            </div>
            
            {/* Campaign Filter Dropdown */}
            <div className="relative">
              <Button
                variant="outline"
                className="min-w-[160px] sm:min-w-[200px] justify-between text-xs sm:text-sm"
                onClick={() => setShowCampaignDropdown(!showCampaignDropdown)}
              >
                <span className="truncate">{selectedCampaignName}</span>
                <ChevronDown size={14} className="ml-1.5 sm:ml-2 flex-shrink-0" />
              </Button>
              
              {showCampaignDropdown && (
                <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-white rounded-lg sm:rounded-xl shadow-xl border border-slate-100 z-50 py-1.5 sm:py-2 max-h-64 overflow-y-auto">
                  <button
                    className={`w-full px-3 sm:px-4 py-1.5 sm:py-2 text-left hover:bg-slate-50 transition-colors text-xs sm:text-sm ${
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
                      className={`w-full px-3 sm:px-4 py-1.5 sm:py-2 text-left hover:bg-slate-50 transition-colors flex items-center gap-2 text-xs sm:text-sm ${
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
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6">
          {loadingStats ? (
            <Skeleton className="h-[220px] sm:h-[280px] md:h-[350px] w-full rounded-lg sm:rounded-xl" />
          ) : !hasData ? (
            <div className="h-[220px] sm:h-[280px] md:h-[350px] flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg sm:rounded-xl border border-dashed border-slate-200">
              <div className="text-center px-4">
                <BarChart3 size={36} className="mx-auto mb-2 sm:mb-3 opacity-50 sm:w-12 sm:h-12" />
                <p className="text-sm sm:text-base">Aucune donnée disponible</p>
                <p className="text-xs sm:text-sm mt-1">Créez votre première campagne pour voir vos stats</p>
              </div>
            </div>
          ) : (
            <div className="h-[220px] sm:h-[280px] md:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  {barsToRender.map((bar) => (
                    <linearGradient
                      key={bar.id}
                      id={`gradient_${bar.id}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor={bar.color} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={bar.color} stopOpacity={0.4} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatNumber}
                />
                {selectedCampaignId === 'all' && uniqueCampaigns.length > 1 && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatNumber}
                  />
                )}
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value, name) => {
                    if (value === undefined || typeof value !== 'number') return ['', ''];
                    const label = barsToRender.find(b => b.dataKey === name)?.name || 
                                  (name === 'totalViews' ? 'Total' : name);
                    return [formatNumber(value), label];
                  }}
                />
                {barsToRender.map((bar) => (
                  <Bar
                    key={bar.id}
                    yAxisId="left"
                    dataKey={bar.dataKey}
                    stackId={selectedCampaignId === 'all' && uniqueCampaigns.length > 0 ? '1' : undefined}
                    fill={`url(#gradient_${bar.id})`}
                    radius={[4, 4, 0, 0]}
                    name={bar.dataKey}
                  />
                ))}
                {selectedCampaignId === 'all' && uniqueCampaigns.length > 1 && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="totalViews"
                    stroke="#ED5D3B"
                    strokeWidth={3}
                    dot={{ fill: '#ED5D3B', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#ED5D3B', strokeWidth: 2, fill: 'white' }}
                    name="totalViews"
                  />
                )}
                <Legend
                  wrapperStyle={{ paddingTop: '12px' }}
                  formatter={(value: string) => {
                    const bar = barsToRender.find(b => b.dataKey === value);
                    const label = bar?.name || (value === 'totalViews' ? 'Total vues' : value);
                    return <span className="text-xs sm:text-sm text-slate-600">{label}</span>;
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {/* Total Views */}
        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardContent className="p-3 sm:p-4 md:p-6 relative">
            <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
              <p className="text-xs sm:text-sm font-medium text-slate-500">Vues totales</p>
              <div className="p-1.5 sm:p-2 bg-sky-100 text-[#0EA5E9] rounded-lg group-hover:scale-110 transition-transform">
                <Eye size={16} className="sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 sm:gap-2">
              {loadingStats ? (
                <Skeleton className="h-6 sm:h-8 w-16 sm:w-24" />
              ) : (
                <>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
                    <AnimatedNumber value={dashboardStats?.totalViews || 0} />
                  </p>
                  {dashboardStats?.viewsTrend !== 0 && (
                    <Badge
                      variant={dashboardStats?.viewsTrend && dashboardStats.viewsTrend > 0 ? 'success' : 'destructive'}
                      className="text-[10px] sm:text-xs"
                    >
                      {dashboardStats?.viewsTrend && dashboardStats.viewsTrend > 0 ? '+' : ''}
                      {dashboardStats?.viewsTrend}%
                    </Badge>
                  )}
                </>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1 sm:mt-2">vs mois précédent</p>
          </CardContent>
        </Card>

        {/* Total Spent */}
        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardContent className="p-3 sm:p-4 md:p-6 relative">
            <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
              <p className="text-xs sm:text-sm font-medium text-slate-500">Budget dépensé</p>
              <div className="p-1.5 sm:p-2 bg-emerald-100 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform">
                <Euro size={16} className="sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 sm:gap-2">
              {loadingStats ? (
                <Skeleton className="h-6 sm:h-8 w-16 sm:w-24" />
              ) : (
                <>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
                    {((dashboardStats?.totalSpent || 0) / 100).toFixed(0)}€
                  </p>
                  {dashboardStats?.spentTrend !== 0 && (
                    <Badge
                      variant={dashboardStats?.spentTrend && dashboardStats.spentTrend > 0 ? 'warning' : 'success'}
                      className="text-[10px] sm:text-xs"
                    >
                      {dashboardStats?.spentTrend && dashboardStats.spentTrend > 0 ? '+' : ''}
                      {dashboardStats?.spentTrend}%
                    </Badge>
                  )}
                </>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1 sm:mt-2">factures payées</p>
          </CardContent>
        </Card>

        {/* Active Campaigns */}
        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden relative">
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

        {/* ROI */}
        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden relative bg-gradient-to-br from-sky-50 to-cyan-50 border-sky-200">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardContent className="p-3 sm:p-4 md:p-6 relative">
            <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
              <p className="text-xs sm:text-sm font-medium text-amber-700">ROI moyen</p>
              <div className="p-1.5 sm:p-2 bg-amber-200 text-amber-700 rounded-lg group-hover:scale-110 transition-transform">
                <TrendingUp size={16} className="sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 sm:gap-2">
              {loadingStats ? (
                <Skeleton className="h-6 sm:h-8 w-16 sm:w-24" />
              ) : (
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-800">
                  {formatNumber(Math.round(dashboardStats?.averageRoi || 0))}
                </p>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-amber-600 mt-1 sm:mt-2">vues par euro dépensé</p>
          </CardContent>
        </Card>
      </div>

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
