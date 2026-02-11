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
import { useGetCreatorDashboardStats } from '@/api/dashboard';
import { useGetGlobalViewTiers } from '@/api/global-view-tiers';
import { useGetTiktokAccounts } from '@/api/tiktok';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import {
  Euro,
  Eye,
  Clock,
  TrendingUp,
  Trophy,
  Medal,
  Flame,
  Sparkles,
  Video,
  ArrowRight,
  ExternalLink,
  Gift,
  Lock,
  CheckCircle2,
} from 'lucide-react';

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

const formatEuros = (cents: number): string => {
  return `${(cents / 100).toFixed(0)}€`;
};

const defaultViewTiers = [
  { threshold: 1_000_000, rewardLabel: 'Récompense palier 1' },
  { threshold: 1_500_000, rewardLabel: 'Récompense palier 2' },
  { threshold: 2_000_000, rewardLabel: 'Récompense palier 3' },
];

// Medal icons for podium
const MedalIcon = ({ rank }: { rank: number }) => {
  const colors = {
    1: 'from-amber-400 to-yellow-500',
    2: 'from-slate-300 to-slate-400',
    3: 'from-sky-400 to-cyan-600',
  };
  const bgColors = {
    1: 'bg-amber-100',
    2: 'bg-slate-100',
    3: 'bg-sky-100',
  };

  if (rank > 3) {
    return (
      <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs sm:text-sm font-bold text-slate-500">
        {rank}
      </span>
    );
  }

  return (
    <span
      className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full ${bgColors[rank as 1 | 2 | 3]} flex items-center justify-center text-sm sm:text-base`}
    >
      <span
        className={`bg-gradient-to-br ${colors[rank as 1 | 2 | 3]} bg-clip-text text-transparent font-bold`}
      >
        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
      </span>
    </span>
  );
};

export const CreatorDashboardPage = () => {
  const { data: dashboardStats, isLoading: loadingStats } = useGetCreatorDashboardStats();
  const { data: tiktokAccounts, isLoading: loadingAccounts } = useGetTiktokAccounts();
  const { data: globalViewTiers } = useGetGlobalViewTiers();

  // Prepare chart data
  const chartData =
    dashboardStats?.monthlyData?.map((month) => ({
      month: formatMonth(month.month),
      earningsPaid: month.earnings / 100,
      earningsPending: 0,
      views: 0,
    })) || [];

  const hasData = chartData.some((d) => d.earningsPaid > 0 || d.views > 0);
  const totalViews = dashboardStats?.totalViews || 0;
  const viewTiers =
    globalViewTiers && globalViewTiers.length > 0
      ? globalViewTiers
          .map((tier) => ({ threshold: tier.viewsTarget, rewardLabel: tier.rewardLabel }))
          .sort((a, b) => a.threshold - b.threshold)
      : defaultViewTiers;
  const maxTier = viewTiers[viewTiers.length - 1]?.threshold || 0;
  const progressValue = maxTier > 0 ? Math.min(100, (totalViews / maxTier) * 100) : 0;

  const unlockedCount = viewTiers.filter((t) => totalViews >= t.threshold).length;

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      {/* Views Rewards Progress — top of page */}
      <div className="relative rounded-lg sm:rounded-xl md:rounded-2xl bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 md:p-8">
        {/* Decorative background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-sky-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 bg-sky-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-6 sm:mb-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-2.5 bg-linear-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg shadow-amber-500/20">
                <Trophy size={18} className="text-white sm:w-5 sm:h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">Paliers de vues</h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  {unlockedCount}/{viewTiers.length} palier{unlockedCount > 1 ? 's' : ''} débloqué{unlockedCount > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold text-white">{formatNumber(totalViews)}</span>
              <span className="text-sm sm:text-base text-slate-400 font-medium">/ {formatNumber(maxTier)} vues</span>
            </div>
          </div>

          {/* Progress bar with milestones + hover tooltips */}
          <div className="relative pt-2 pb-2">
            {/* Track */}
            <div className="h-3 sm:h-4 rounded-full bg-slate-700/80 overflow-hidden">
              <div
                className="h-full rounded-full bg-linear-to-r from-sky-500 via-cyan-400 to-emerald-400 transition-all duration-1000 ease-out relative"
                style={{ width: `${progressValue}%` }}
              >
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent animate-pulse" />
              </div>
            </div>

            {/* Milestone markers with hover popup */}
            {viewTiers.map((tier, idx) => {
              const position = (tier.threshold / maxTier) * 100;
              const isUnlocked = totalViews >= tier.threshold;
              const isNext = !isUnlocked && (idx === 0 || totalViews >= viewTiers[idx - 1].threshold);
              const remaining = tier.threshold - totalViews;
              return (
                <div
                  key={tier.threshold}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group/tip"
                  style={{ left: `${position}%` }}
                >
                  {/* The dot */}
                  <div
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-300 group-hover/tip:scale-125 ${
                      isUnlocked
                        ? 'bg-emerald-400 border-emerald-300 shadow-lg shadow-emerald-400/40'
                        : 'bg-slate-700 border-slate-500 group-hover/tip:border-slate-400'
                    }`}
                  >
                    {isUnlocked ? (
                      <CheckCircle2 size={12} className="text-white sm:w-3.5 sm:h-3.5" />
                    ) : (
                      <Gift size={10} className="text-slate-400 group-hover/tip:text-slate-300 sm:w-3 sm:h-3" />
                    )}
                  </div>

                  {/* Tooltip popup on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 scale-95 pointer-events-none group-hover/tip:opacity-100 group-hover/tip:scale-100 group-hover/tip:pointer-events-auto transition-all duration-200 z-10">
                    <div className={`rounded-xl px-3 py-2.5 shadow-xl backdrop-blur-sm whitespace-nowrap text-center ${
                      isUnlocked
                        ? 'bg-emerald-900/90 border border-emerald-500/30'
                        : 'bg-slate-800/95 border border-slate-600/40'
                    }`}>
                      <p className={`text-[10px] sm:text-xs font-semibold mb-0.5 ${isUnlocked ? 'text-emerald-300' : isNext ? 'text-sky-400' : 'text-slate-400'}`}>
                        Palier {idx + 1}
                      </p>
                      <p className="text-sm sm:text-base font-bold text-white">
                        {formatNumber(tier.threshold)} vues
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-300 mt-0.5">{tier.rewardLabel}</p>
                      <div className="mt-1.5 pt-1.5 border-t border-white/10">
                        {isUnlocked ? (
                          <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium text-emerald-400">
                            <CheckCircle2 size={10} />
                            Débloqué
                          </span>
                        ) : isNext ? (
                          <span className="text-[10px] sm:text-xs text-sky-400">
                            Encore {formatNumber(remaining > 0 ? remaining : 0)} vues
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-slate-500">
                            <Lock size={9} />
                            Verrouillé
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Tooltip arrow */}
                    <div className={`w-2.5 h-2.5 rotate-45 mx-auto -mt-1.5 ${
                      isUnlocked ? 'bg-emerald-900/90 border-r border-b border-emerald-500/30' : 'bg-slate-800/95 border-r border-b border-slate-600/40'
                    }`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Header with gradient background */}
      <div className="relative overflow-hidden rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br from-[#0EA5E9] via-sky-500 to-cyan-500 p-4 sm:p-6 md:p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-50 pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
              <Sparkles size={18} className="text-yellow-300 sm:w-6 sm:h-6" />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Dashboard Ambassadeur</h1>
            </div>
            <p className="text-sky-100 text-sm sm:text-base">Suivez vos gains et vos performances en temps réel</p>
          </div>
          <Link to="/campaigns">
            <Button className="bg-white text-[#0EA5E9] hover:bg-sky-50 rounded-full shadow-lg shadow-sky-900/30 transition-all duration-300 hover:scale-105 text-sm sm:text-base">
              <Flame size={16} className="mr-1.5 sm:mr-2" />
              Trouver une campagne
            </Button>
          </Link>
        </div>

        {/* Quick Stats in Header */}
        <div className="relative mt-4 sm:mt-6 md:mt-8 grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 border border-white/20">
            <p className="text-sky-100 text-[10px] sm:text-xs md:text-sm">Gains totaux</p>
            {loadingStats ? (
              <Skeleton className="h-5 sm:h-6 md:h-8 w-16 sm:w-20 md:w-24 bg-white/20" />
            ) : (
              <p className="text-lg sm:text-xl md:text-2xl font-bold mt-0.5 sm:mt-1">
                {formatEuros(dashboardStats?.totalEarnings || 0)}
              </p>
            )}
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 border border-white/20 relative overflow-hidden">
            <div className="absolute -right-2 -top-2 w-12 sm:w-16 h-12 sm:h-16 bg-yellow-400/20 rounded-full blur-xl animate-pulse" />
            <p className="text-sky-100 text-[10px] sm:text-xs md:text-sm">En attente</p>
            {loadingStats ? (
              <Skeleton className="h-5 sm:h-6 md:h-8 w-16 sm:w-20 md:w-24 bg-white/20" />
            ) : (
              <p className="text-lg sm:text-xl md:text-2xl font-bold mt-0.5 sm:mt-1 flex items-center gap-1.5 sm:gap-2">
                {formatEuros(dashboardStats?.pendingEarnings || 0)}
                {(dashboardStats?.pendingEarnings || 0) > 0 && (
                  <span className="relative flex h-2 w-2 sm:h-3 sm:w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 sm:h-3 sm:w-3 bg-yellow-400" />
                  </span>
                )}
              </p>
            )}
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 border border-white/20">
            <p className="text-sky-100 text-[10px] sm:text-xs md:text-sm">Vues totales</p>
            {loadingStats ? (
              <Skeleton className="h-5 sm:h-6 md:h-8 w-16 sm:w-20 md:w-24 bg-white/20" />
            ) : (
              <p className="text-lg sm:text-xl md:text-2xl font-bold mt-0.5 sm:mt-1">
                {formatNumber(dashboardStats?.totalViews || 0)}
              </p>
            )}
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 border border-white/20">
            <p className="text-sky-100 text-[10px] sm:text-xs md:text-sm">Vidéos soumises</p>
            {loadingStats ? (
              <Skeleton className="h-5 sm:h-6 md:h-8 w-16 sm:w-20 md:w-24 bg-white/20" />
            ) : (
              <p className="text-lg sm:text-xl md:text-2xl font-bold mt-0.5 sm:mt-1">{dashboardStats?.totalSubmissions || 0}</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Chart - Full Width */}
      <Card className="overflow-hidden border-0 shadow-xl shadow-slate-200/50">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-100 p-3 sm:p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
            <div>
              <CardTitle className="text-base sm:text-lg font-semibold text-slate-800">
                Évolution mensuelle
              </CardTitle>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">Vues et gains sur les 12 derniers mois</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {dashboardStats?.viewsTrend !== 0 && (
                <div className="flex items-center gap-1 sm:gap-2">
                  <TrendingUp
                    size={14}
                    className={
                      dashboardStats?.viewsTrend && dashboardStats.viewsTrend > 0
                        ? 'text-emerald-500'
                        : 'text-red-500'
                    }
                  />
                  <span
                    className={`text-xs sm:text-sm font-medium ${
                      dashboardStats?.viewsTrend && dashboardStats.viewsTrend > 0
                        ? 'text-emerald-600'
                        : 'text-red-600'
                    }`}
                  >
                    {dashboardStats?.viewsTrend && dashboardStats.viewsTrend > 0 ? '+' : ''}
                    {dashboardStats?.viewsTrend}% vues
                  </span>
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
                <Video size={36} className="mx-auto mb-2 sm:mb-3 opacity-50 sm:w-12 sm:h-12" />
                <p className="text-sm sm:text-base">Aucune donnée disponible</p>
                <p className="text-xs sm:text-sm mt-1">Soumettez votre première vidéo pour voir vos stats</p>
                <Link to="/campaigns" className="mt-3 sm:mt-4 inline-block">
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                    Explorer les campagnes
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="h-[220px] sm:h-[280px] md:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradientEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient id="gradientPending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                  </linearGradient>
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
                  tickFormatter={(value: number) => `${value}€`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatNumber}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value, name) => {
                    if (value === undefined || typeof value !== 'number') return ['', ''];
                    if (name === 'views') return [formatNumber(value), 'Vues'];
                    return [`${value}€`, name === 'earningsPaid' ? 'Gains payés' : 'En attente'];
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '12px' }}
                  formatter={(value: string) => {
                    const labels: Record<string, string> = {
                      earningsPaid: 'Gains payés',
                      earningsPending: 'En attente',
                      views: 'Vues',
                    };
                    return <span className="text-xs sm:text-sm text-slate-600">{labels[value] || value}</span>;
                  }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="earningsPaid"
                  fill="url(#gradientEarnings)"
                  radius={[4, 4, 0, 0]}
                  name="earningsPaid"
                />
                <Bar
                  yAxisId="left"
                  dataKey="earningsPending"
                  fill="url(#gradientPending)"
                  radius={[4, 4, 0, 0]}
                  name="earningsPending"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="views"
                  stroke="#ED5D3B"
                  strokeWidth={3}
                  dot={{ fill: '#ED5D3B', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#ED5D3B', strokeWidth: 2, fill: 'white' }}
                  name="views"
                />
              </ComposedChart>
            </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPIs with Trends */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {/* Total Earnings - Highlight Card */}
        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0">
          <CardContent className="p-3 sm:p-4 md:p-6 relative">
            <div className="absolute -right-4 -top-4 w-16 sm:w-24 h-16 sm:h-24 bg-white/10 rounded-full blur-xl" />
            <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
              <p className="text-xs sm:text-sm font-medium text-emerald-100">Gains totaux</p>
              <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
                <Euro size={16} className="sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 sm:gap-2">
              {loadingStats ? (
                <Skeleton className="h-6 sm:h-8 w-16 sm:w-24 bg-white/20" />
              ) : (
                <>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold">
                    {formatEuros(dashboardStats?.totalEarnings || 0)}
                  </p>
                  {dashboardStats?.earningsTrend !== 0 && (
                    <Badge className="bg-white/20 text-white border-0 text-[10px] sm:text-xs">
                      {dashboardStats?.earningsTrend && dashboardStats.earningsTrend > 0 ? '+' : ''}
                      {dashboardStats?.earningsTrend}%
                    </Badge>
                  )}
                </>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-emerald-100 mt-1 sm:mt-2">payés à ce jour</p>
          </CardContent>
        </Card>

        {/* Pending Earnings */}
        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50">
          <CardContent className="p-3 sm:p-4 md:p-6 relative">
            <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
              <p className="text-xs sm:text-sm font-medium text-sky-700">En attente</p>
              <div className="p-1.5 sm:p-2 bg-sky-200 text-sky-700 rounded-lg group-hover:scale-110 transition-transform relative">
                <Clock size={16} className="sm:w-5 sm:h-5" />
                {(dashboardStats?.pendingEarnings || 0) > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2 sm:h-3 sm:w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 sm:h-3 sm:w-3 bg-amber-500" />
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-baseline gap-1 sm:gap-2">
              {loadingStats ? (
                <Skeleton className="h-6 sm:h-8 w-16 sm:w-24" />
              ) : (
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-800">
                  {formatEuros(dashboardStats?.pendingEarnings || 0)}
                </p>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-amber-600 mt-1 sm:mt-2">factures uploadées</p>
          </CardContent>
        </Card>

        {/* Total Views */}
        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
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
                    {formatNumber(dashboardStats?.totalViews || 0)}
                  </p>
                  {dashboardStats?.viewsTrend !== 0 && (
                    <Badge
                      variant={
                        dashboardStats?.viewsTrend && dashboardStats.viewsTrend > 0
                          ? 'success'
                          : 'destructive'
                      }
                      className="text-[10px] sm:text-xs"
                    >
                      {dashboardStats?.viewsTrend && dashboardStats.viewsTrend > 0 ? '+' : ''}
                      {dashboardStats?.viewsTrend}%
                    </Badge>
                  )}
                </>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1 sm:mt-2">sur vos vidéos</p>
          </CardContent>
        </Card>

        {/* Total Submissions */}
        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <CardContent className="p-3 sm:p-4 md:p-6 relative">
            <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
              <p className="text-xs sm:text-sm font-medium text-slate-500">Vidéos soumises</p>
              <div className="p-1.5 sm:p-2 bg-sky-100 text-sky-600 rounded-lg group-hover:scale-110 transition-transform">
                <Video size={16} className="sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 sm:gap-2">
              {loadingStats ? (
                <Skeleton className="h-6 sm:h-8 w-12 sm:w-16" />
              ) : (
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
                  {dashboardStats?.totalSubmissions || 0}
                </p>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1 sm:mt-2">vidéos au total</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Videos Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
        {/* Top by Views */}
        <Card className="overflow-hidden border-0 shadow-lg shadow-slate-200/50">
          <CardHeader className="bg-gradient-to-r from-sky-50 to-cyan-50 border-b border-sky-100 p-3 sm:p-4 md:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-sky-100 rounded-lg">
                <Trophy size={16} className="text-[#0EA5E9] sm:w-5 sm:h-5" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg text-sky-900">Top vidéos par vues</CardTitle>
                <p className="text-xs sm:text-sm text-[#0EA5E9]">Ce mois-ci</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6">
            {loadingStats ? (
              <div className="space-y-2 sm:space-y-3 md:space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 sm:h-14 md:h-16 w-full rounded-lg sm:rounded-xl" />
                ))}
              </div>
            ) : !dashboardStats?.topVideosByViews?.length ? (
              <div className="text-center py-6 sm:py-8 text-slate-400">
                <Medal size={32} className="mx-auto mb-2 sm:mb-3 opacity-50 sm:w-10 sm:h-10" />
                <p className="text-sm sm:text-base">Aucune vidéo ce mois-ci</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {dashboardStats.topVideosByViews.map((video, idx) => (
                  <div
                    key={video.submissionId}
                    className="flex items-center gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-slate-50 to-transparent hover:from-sky-50 transition-all duration-300 group"
                  >
                    <MedalIcon rank={idx + 1} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate group-hover:text-[#0EA5E9] transition-colors text-sm sm:text-base">
                        {video.campaignTitle}
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-500">
                        {video.submittedAt ? new Date(video.submittedAt).toLocaleDateString('fr-FR') : 'Date inconnue'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#0EA5E9] text-sm sm:text-base">{formatNumber(video.views)}</p>
                      <p className="text-[10px] sm:text-xs text-slate-400">vues</p>
                    </div>
                    <a
                      href={`https://www.tiktok.com/@/video/${video.tiktokVideoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 sm:p-2 hover:bg-sky-100 rounded-lg transition-colors hidden sm:block"
                    >
                      <ExternalLink size={14} className="text-slate-400 sm:w-4 sm:h-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top by Earnings */}
        <Card className="overflow-hidden border-0 shadow-lg shadow-slate-200/50">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 p-3 sm:p-4 md:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-lg">
                <Euro size={16} className="text-emerald-600 sm:w-5 sm:h-5" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg text-emerald-900">Top vidéos par gains</CardTitle>
                <p className="text-xs sm:text-sm text-emerald-600">Ce mois-ci</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6">
            {loadingStats ? (
              <div className="space-y-2 sm:space-y-3 md:space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 sm:h-14 md:h-16 w-full rounded-lg sm:rounded-xl" />
                ))}
              </div>
            ) : !dashboardStats?.topVideosByEarnings?.length ? (
              <div className="text-center py-6 sm:py-8 text-slate-400">
                <Euro size={32} className="mx-auto mb-2 sm:mb-3 opacity-50 sm:w-10 sm:h-10" />
                <p className="text-sm sm:text-base">Aucun gain ce mois-ci</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {dashboardStats.topVideosByEarnings.map((video, idx) => (
                  <div
                    key={video.submissionId}
                    className="flex items-center gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-slate-50 to-transparent hover:from-emerald-50 transition-all duration-300 group"
                  >
                    <MedalIcon rank={idx + 1} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate group-hover:text-emerald-600 transition-colors text-sm sm:text-base">
                        {video.campaignTitle}
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-500">{formatNumber(video.views)} vues</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600 text-sm sm:text-base">{formatEuros(video.earnings)}</p>
                      <p className="text-[10px] sm:text-xs text-slate-400">gagnés</p>
                    </div>
                    <a
                      href={`https://www.tiktok.com/@/video/${video.tiktokVideoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 sm:p-2 hover:bg-emerald-100 rounded-lg transition-colors hidden sm:block"
                    >
                      <ExternalLink size={14} className="text-slate-400 sm:w-4 sm:h-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* TikTok Accounts */}
      <Card className="border-0 shadow-lg shadow-slate-200/50">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-slate-50 to-transparent border-b border-slate-100 p-3 sm:p-4 md:p-6">
          <CardTitle className="text-base sm:text-lg">Mes comptes TikTok</CardTitle>
          <Link
            to="/profile"
            className="text-xs sm:text-sm text-[#0EA5E9] hover:text-sky-600 flex items-center gap-1 hover:gap-2 transition-all"
          >
            Gérer <ArrowRight size={12} className="sm:w-3.5 sm:h-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6">
          {loadingAccounts ? (
            <div className="space-y-2 sm:space-y-4">
              <Skeleton className="h-10 sm:h-12 w-full rounded-lg sm:rounded-xl" />
            </div>
          ) : !tiktokAccounts?.length ? (
            <div className="text-center py-6 sm:py-8 text-slate-400 bg-slate-50 rounded-lg sm:rounded-xl border border-dashed border-slate-200">
              <Video size={32} className="mx-auto mb-2 sm:mb-3 opacity-50 sm:w-10 sm:h-10" />
              <p className="text-sm sm:text-base">Aucun compte TikTok connecté</p>
              <Link to="/profile" className="mt-3 sm:mt-4 inline-block">
                <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                  Connecter un compte
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
              {tiktokAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-slate-50 to-transparent hover:from-sky-50 transition-all duration-300"
                >
                  <Avatar fallback="TK" size="sm" className="bg-black text-white w-7 h-7 sm:w-8 sm:h-8" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs sm:text-sm truncate">@{account.username}</p>
                    <p className="text-[10px] sm:text-xs text-slate-500">
                      {account.isValid ? 'Connecté' : 'Session expirée'}
                    </p>
                  </div>
                  <div
                    className={`h-2 w-2 sm:h-3 sm:w-3 rounded-full ${
                      account.isValid ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
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
