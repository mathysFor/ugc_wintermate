import { useState, useMemo, useEffect } from 'react';
import { useGetCreatorsStats, useGetAllCreators, useGetCreatorsTracking } from '@/api/creators';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { CreatorTrackingItem } from '@shared/types/creators';
import {
  Eye,
  Euro,
  Users,
  TrendingUp,
  Search,
  ArrowUp,
  ArrowDown,
  UserCheck,
  ListChecks,
} from 'lucide-react';

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const formatCurrency = (cents: number): string => {
  return `${(cents / 100).toFixed(0)}€`;
};

type SortOption = 'views' | 'paid' | 'videos' | 'createdAt';
type SortDirection = 'desc' | 'asc';

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: 'views', label: 'Vues' },
  { value: 'paid', label: 'Payé' },
  { value: 'videos', label: 'Vidéos' },
  { value: 'createdAt', label: 'Date inscription' },
];

type TrackingTiktokFilter = 'all' | 'true' | 'false';
type TrackingPublishedFilter = 'all' | 'true' | 'false';

export const BrandCreatorsPage = () => {
  const [activeTab, setActiveTab] = useState<'classement' | 'suivi'>('classement');
  const [sortBy, setSortBy] = useState<SortOption>('views');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [search, setSearch] = useState<string>('');
  const [cursor, setCursor] = useState<string | null>(null);

  // Suivi: filtres et pagination
  const [filterTiktok, setFilterTiktok] = useState<TrackingTiktokFilter>('all');
  const [filterPublished, setFilterPublished] = useState<TrackingPublishedFilter>('all');
  const [trackingCursor, setTrackingCursor] = useState<string | null>(null);
  const [accumulatedTracking, setAccumulatedTracking] = useState<CreatorTrackingItem[]>([]);
  const [trackingNextCursor, setTrackingNextCursor] = useState<number | null>(null);

  // Récupérer les stats globales
  const { data: stats, isLoading: loadingStats } = useGetCreatorsStats();

  // Récupérer la liste des créateurs
  const { data: creatorsData, isLoading: loadingCreators } = useGetAllCreators(
    {
      cursor: cursor || undefined,
      limit: 20,
      direction: sortDirection === 'desc' ? 'next' : 'prev',
      sortBy,
      search: search || undefined,
    },
    {
      enabled: true,
    }
  );

  const { data: trackingData, isLoading: loadingTracking } = useGetCreatorsTracking(
    {
      cursor: trackingCursor ?? undefined,
      limit: 20,
      direction: 'next',
      tiktokConnected: filterTiktok === 'all' ? undefined : filterTiktok,
      hasPublished: filterPublished === 'all' ? undefined : filterPublished,
    },
    { enabled: activeTab === 'suivi' }
  );

  useEffect(() => {
    if (activeTab === 'suivi') {
      setTrackingCursor(null);
      setAccumulatedTracking([]);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'suivi' || !trackingData) return;
    if (trackingCursor == null) {
      setAccumulatedTracking(trackingData.items);
    } else {
      setAccumulatedTracking((prev) => [...prev, ...trackingData.items]);
    }
    setTrackingNextCursor(trackingData.nextCursor);
  }, [activeTab, trackingData, trackingCursor]);

  const handleTrackingFilterChange = (tiktok: TrackingTiktokFilter, published: TrackingPublishedFilter) => {
    setFilterTiktok(tiktok);
    setFilterPublished(published);
    setTrackingCursor(null);
    setAccumulatedTracking([]);
  };

  const handleTrackingLoadMore = () => {
    if (trackingNextCursor != null) {
      setTrackingCursor(String(trackingNextCursor));
    }
  };

  const handleSortChange = (newSort: SortOption) => {
    if (sortBy === newSort) {
      // Si même tri, inverser la direction
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      // Nouveau tri, direction desc par défaut
      setSortBy(newSort);
      setSortDirection('desc');
    }
    setCursor(null); // Reset cursor when sorting changes
  };

  const handleLoadMore = () => {
    if (creatorsData?.nextCursor) {
      setCursor(String(creatorsData.nextCursor));
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCursor(null); // Reset cursor when search changes
  };

  // Calculer le rang de chaque créateur
  const creatorsWithRank = useMemo(() => {
    if (!creatorsData?.items) return [];
    return creatorsData.items.map((creator, index) => ({
      ...creator,
      rank: cursor ? (parseInt(cursor) || 0) + index + 1 : index + 1,
    }));
  }, [creatorsData?.items, cursor]);

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Créateurs
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-0.5 sm:mt-1">
            Hub de gestion de vos créateurs
          </p>
        </div>
      </div>

      {/* Dashboard KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {/* Vues totales */}
        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardContent className="p-3 sm:p-4 md:p-6 relative">
            <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
              <p className="text-xs sm:text-sm font-medium text-slate-500">VUES TOTALES</p>
              <div className="p-1.5 sm:p-2 bg-sky-100 text-[#0EA5E9] rounded-lg group-hover:scale-110 transition-transform">
                <Eye size={16} className="sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 sm:gap-2">
              {loadingStats ? (
                <Skeleton className="h-6 sm:h-8 w-16 sm:w-24" />
              ) : (
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
                  {formatNumber(stats?.totalViews || 0)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Total payé */}
        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardContent className="p-3 sm:p-4 md:p-6 relative">
            <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
              <p className="text-xs sm:text-sm font-medium text-slate-500">TOTAL PAYÉ</p>
              <div className="p-1.5 sm:p-2 bg-emerald-100 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform">
                <Euro size={16} className="sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 sm:gap-2">
              {loadingStats ? (
                <Skeleton className="h-6 sm:h-8 w-16 sm:w-24" />
              ) : (
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
                  {formatCurrency(stats?.totalPaid || 0)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Créateurs */}
        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardContent className="p-3 sm:p-4 md:p-6 relative">
            <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
              <p className="text-xs sm:text-sm font-medium text-slate-500">CRÉATEURS</p>
              <div className="p-1.5 sm:p-2 bg-sky-100 text-sky-600 rounded-lg group-hover:scale-110 transition-transform">
                <Users size={16} className="sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 sm:gap-2">
              {loadingStats ? (
                <Skeleton className="h-6 sm:h-8 w-12 sm:w-16" />
              ) : (
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
                  {stats?.creatorsCount || 0}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Moy. vues/créateur */}
        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden relative bg-gradient-to-br from-sky-50 to-cyan-50 border-sky-200">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardContent className="p-3 sm:p-4 md:p-6 relative">
            <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
              <p className="text-xs sm:text-sm font-medium text-amber-700">MOY. VUES/CRÉATEUR</p>
              <div className="p-1.5 sm:p-2 bg-amber-200 text-amber-700 rounded-lg group-hover:scale-110 transition-transform">
                <TrendingUp size={16} className="sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 sm:gap-2">
              {loadingStats ? (
                <Skeleton className="h-6 sm:h-8 w-16 sm:w-24" />
              ) : (
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-800">
                  {formatNumber(stats?.averageViewsPerCreator || 0)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'classement' | 'suivi')} className="w-full">
        <TabsList className="w-full sm:w-auto mb-4">
          <TabsTrigger value="classement" className="flex-1 sm:flex-none gap-2">
            <TrendingUp size={16} />
            Classement
          </TabsTrigger>
          <TabsTrigger value="suivi" className="flex-1 sm:flex-none gap-2">
            <ListChecks size={16} />
            Suivi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="classement" className="mt-0">
      {/* Tableau de classement */}
      <Card className="border-0 shadow-lg shadow-slate-200/50">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-slate-50 to-transparent border-b border-slate-100 p-3 sm:p-4 md:p-6">
          <CardTitle className="text-base sm:text-lg">Classement des créateurs</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6">
          {/* Barre de recherche et boutons de tri */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent text-sm sm:text-base"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-slate-500 mr-1">Trier par :</span>
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    sortBy === option.value
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {option.label}
                  {sortBy === option.value && (
                    sortDirection === 'desc' ? (
                      <ArrowDown size={14} className="ml-0.5" />
                    ) : (
                      <ArrowUp size={14} className="ml-0.5" />
                    )
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tableau */}
          {loadingCreators ? (
            <div className="space-y-2 sm:space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 sm:h-20 w-full rounded-lg sm:rounded-xl" />
              ))}
            </div>
          ) : creatorsWithRank.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-slate-400 bg-slate-50 rounded-lg sm:rounded-xl border border-dashed border-slate-200">
              <Users size={32} className="mx-auto mb-2 sm:mb-3 opacity-50 sm:w-10 sm:h-10" />
              <p className="text-sm sm:text-base">Aucun créateur trouvé</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-slate-600">#</th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-slate-600">CRÉATEUR</th>
                      <th className="text-right py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-slate-600">VUES</th>
                      <th className="text-right py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-slate-600">VIDÉOS</th>
                      <th className="text-right py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-slate-600">PAYÉ</th>
                      <th className="text-right py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-slate-600">CAMPAGNES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creatorsWithRank.map((creator) => {
                      // Couleurs podium pour les 3 premiers
                      const isPodium = creator.rank <= 3;
                      const podiumColors = {
                        1: 'bg-sky-500 text-white',
                        2: 'bg-sky-400 text-white',
                        3: 'bg-sky-300 text-white',
                      };
                      
                      return (
                        <tr
                          key={creator.id}
                          className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-3 px-2 sm:px-4">
                            {isPodium ? (
                              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${podiumColors[creator.rank as 1 | 2 | 3]}`}>
                                {creator.rank}
                              </div>
                            ) : (
                              <span className="text-xs sm:text-sm font-medium text-slate-500 pl-2 sm:pl-2.5">
                                {creator.rank}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-2 sm:px-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <Avatar
                                src={null}
                                fallback={`${creator.firstName[0]}${creator.lastName[0]}`}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <p className="text-sm sm:text-base font-medium text-slate-900 truncate">
                                  {creator.firstName}
                                </p>
                                {creator.username && (
                                  <p className="text-xs text-slate-500 truncate">@{creator.username}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2 sm:px-4 text-right">
                            <span className="text-sm sm:text-base font-semibold text-orange-500">
                              {formatNumber(creator.totalViews)}
                            </span>
                          </td>
                          <td className="py-3 px-2 sm:px-4 text-right text-sm sm:text-base text-slate-700">
                            {creator.videosCount}
                          </td>
                          <td className="py-3 px-2 sm:px-4 text-right">
                            <span className="text-sm sm:text-base font-semibold text-emerald-500">
                              {formatCurrency(creator.totalPaid)}
                            </span>
                          </td>
                          <td className="py-3 px-2 sm:px-4 text-right text-sm sm:text-base text-slate-700">
                            {creator.campaignsCount}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {creatorsData?.hasMore && (
                <div className="mt-4 sm:mt-6 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    className="text-sm sm:text-base"
                  >
                    Charger plus
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="suivi" className="mt-0">
          <Card className="border-0 shadow-lg shadow-slate-200/50">
            <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-slate-50 to-transparent border-b border-slate-100 p-3 sm:p-4 md:p-6">
              <CardTitle className="text-base sm:text-lg">Suivi des inscrits</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6">
              {/* Filtres */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-slate-500">TikTok :</span>
                  {(['all', 'true', 'false'] as const).map((value) => (
                    <button
                      key={value}
                      onClick={() => handleTrackingFilterChange(value, filterPublished)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        filterTiktok === value
                          ? 'bg-slate-900 text-white shadow-md'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {value === 'all' && 'Tous'}
                      {value === 'true' && <><UserCheck size={14} /> Connecté</>}
                      {value === 'false' && 'Non connecté'}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-slate-500">Publication :</span>
                  {(['all', 'true', 'false'] as const).map((value) => (
                    <button
                      key={value}
                      onClick={() => handleTrackingFilterChange(filterTiktok, value)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        filterPublished === value
                          ? 'bg-slate-900 text-white shadow-md'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {value === 'all' && 'Tous'}
                      {value === 'true' && 'A publié'}
                      {value === 'false' && 'Pas encore publié'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tableau Suivi */}
              {loadingTracking && accumulatedTracking.length === 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-14 sm:h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : accumulatedTracking.length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-slate-400 bg-slate-50 rounded-lg sm:rounded-xl border border-dashed border-slate-200">
                  <Users size={32} className="mx-auto mb-2 sm:mb-3 opacity-50 sm:w-10 sm:h-10" />
                  <p className="text-sm sm:text-base">Aucun créateur ne correspond aux filtres</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-slate-600">CRÉATEUR</th>
                          <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-slate-600 hidden sm:table-cell">EMAIL</th>
                          <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-slate-600">DATE INSCRIPTION</th>
                          <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-slate-600">TIKTOK</th>
                          <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-slate-600">PUBLIÉ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accumulatedTracking.map((creator) => (
                          <tr
                            key={creator.id}
                            className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                          >
                            <td className="py-3 px-2 sm:px-4">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <Avatar
                                  src={null}
                                  fallback={`${creator.firstName[0]}${creator.lastName[0]}`}
                                  size="sm"
                                />
                                <div className="min-w-0">
                                  <p className="text-sm sm:text-base font-medium text-slate-900 truncate">
                                    {creator.firstName} {creator.lastName}
                                  </p>
                                  {creator.username && (
                                    <p className="text-xs text-slate-500 truncate">@{creator.username}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-2 sm:px-4 text-sm text-slate-600 truncate max-w-[200px] hidden sm:table-cell">
                              {creator.email}
                            </td>
                            <td className="py-3 px-2 sm:px-4 text-sm text-slate-600">
                              {new Date(creator.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="py-3 px-2 sm:px-4">
                              {creator.tiktokConnected ? (
                                <Badge variant="success">Connecté</Badge>
                              ) : (
                                <Badge variant="secondary">Non connecté</Badge>
                              )}
                            </td>
                            <td className="py-3 px-2 sm:px-4">
                              {creator.hasPublished ? (
                                <Badge variant="success">Oui</Badge>
                              ) : (
                                <Badge variant="outline">Non</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {trackingData?.hasMore && (
                    <div className="mt-4 sm:mt-6 flex justify-center">
                      <Button
                        variant="outline"
                        onClick={handleTrackingLoadMore}
                        disabled={loadingTracking}
                        className="text-sm sm:text-base"
                      >
                        {loadingTracking ? 'Chargement...' : 'Charger plus'}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

