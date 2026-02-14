import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGetCampaign, useUpdateCampaign, useCreateReward } from '@/api/campaigns';
import { axiosPost } from '@/api/axios';
import { queryClient } from '@/api/query-config';
import type { CampaignReward, UpdateRewardInput, RewardResponse } from '@shared/types/rewards';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Trash2, Plus, Calendar, Image as ImageIcon, Youtube, Save } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RewardInput {
  id?: number;
  viewsTarget: string;
  amountEur: string;
  allowMultipleVideos: boolean;
  isNew?: boolean;
}

export const EditCampaignPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const campaignId = parseInt(id || '0', 10);

  const { data: campaign, isLoading: loadingCampaign } = useGetCampaign(campaignId);

  const { mutateAsync: updateCampaign, isPending: isUpdating, isError, error } = useUpdateCampaign(campaignId, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', campaignId] });
    },
  });

  const { mutateAsync: createReward } = useCreateReward(campaignId);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverImageUrl: '',
    youtubeUrl: '',
    startDate: '',
    endDate: '',
  });

  const [rewards, setRewards] = useState<RewardInput[]>([]);
  const [rewardsToDelete, setRewardsToDelete] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (campaign) {
      setFormData({
        title: campaign.title,
        description: campaign.description,
        coverImageUrl: campaign.coverImageUrl || '',
        youtubeUrl: campaign.youtubeUrl || '',
        startDate: campaign.startDate ? (campaign.startDate as any).toString().split('T')[0] : '',
        endDate: campaign.endDate ? (campaign.endDate as any).toString().split('T')[0] : '',
      });

      setRewards(
        campaign.rewards.map((r: CampaignReward) => ({
          id: r.id,
          viewsTarget: r.viewsTarget.toString(),
          amountEur: (r.amountEur / 100).toString(),
          allowMultipleVideos: r.allowMultipleVideos,
          isNew: false,
        }))
      );
    }
  }, [campaign]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRewardChange = (index: number, field: keyof RewardInput, value: string | boolean) => {
    setRewards((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const addReward = () => {
    setRewards((prev) => [...prev, { viewsTarget: '', amountEur: '', allowMultipleVideos: false, isNew: true }]);
  };

  const removeReward = (index: number) => {
    const reward = rewards[index];
    if (reward.id && !reward.isNew) {
      setRewardsToDelete((prev) => [...prev, reward.id!]);
    }
    setRewards((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // 1. Mettre à jour la campagne
      await updateCampaign({
        ...formData,
        coverImageUrl: formData.coverImageUrl || undefined,
        youtubeUrl: formData.youtubeUrl || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
      });

      // 2. Supprimer les rewards marqués pour suppression
      for (const rewardId of rewardsToDelete) {
        await axiosPost<undefined, { message: string }>(`/api/rewards/${rewardId}/delete`, undefined);
      }

      // 3. Créer les nouveaux rewards
      for (const reward of rewards) {
        if (reward.isNew && reward.viewsTarget && reward.amountEur) {
          await createReward({
            viewsTarget: parseInt(reward.viewsTarget, 10),
            amountEur: Math.round(parseFloat(reward.amountEur) * 100),
            allowMultipleVideos: reward.allowMultipleVideos,
          });
        }
      }

      // 4. Mettre à jour les rewards existants
      for (const reward of rewards) {
        if (reward.id && !reward.isNew) {
          await axiosPost<UpdateRewardInput, RewardResponse>(`/api/rewards/${reward.id}/update`, {
            viewsTarget: parseInt(reward.viewsTarget, 10),
            amountEur: Math.round(parseFloat(reward.amountEur) * 100),
            allowMultipleVideos: reward.allowMultipleVideos,
          });
        }
      }

      // Attendre le refetch pour que les récompenses soient à jour avant navigation
      await queryClient.refetchQueries({ queryKey: ['campaigns', campaignId] });
      await queryClient.refetchQueries({ queryKey: ['campaigns'] });
      navigate(`/campaign/${campaignId}`);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingCampaign) {
    return (
      <div className="pb-12 sm:pb-16 md:pb-20">
        <Skeleton className="h-8 sm:h-10 w-24 sm:w-32 mb-4 sm:mb-6" />
        <Skeleton className="h-6 sm:h-8 w-48 sm:w-64 mb-2" />
        <Skeleton className="h-4 w-72 sm:w-96 mb-6 sm:mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <Skeleton className="h-48 sm:h-64 w-full rounded-lg sm:rounded-xl" />
            <Skeleton className="h-36 sm:h-48 w-full rounded-lg sm:rounded-xl" />
          </div>
          <Skeleton className="h-72 sm:h-96 w-full rounded-lg sm:rounded-xl" />
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="pb-12 sm:pb-16 md:pb-20 text-center py-16 sm:py-20">
        <p className="text-slate-500 text-sm sm:text-base">Campagne non trouvée</p>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4 text-sm sm:text-base">
          <ArrowLeft size={14} className="mr-1.5 sm:mr-2 sm:w-4 sm:h-4" /> Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-12 sm:pb-16 md:pb-20">
      {/* Header avec bouton retour */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="pl-0 hover:bg-transparent text-sm sm:text-base">
          <ArrowLeft size={14} className="mr-1.5 sm:mr-2 sm:w-4 sm:h-4" /> Retour
        </Button>
      </div>

      <div className="mb-6 sm:mb-8">
        <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">Modifier la campagne</p>
        <p className="text-slate-500 text-sm sm:text-base mt-0.5 sm:mt-1">Mettez à jour les détails de votre campagne.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 md:space-y-8 animate-fade-in">
        {isError && (
          <Alert variant="destructive">
            <AlertDescription className="text-sm">{(error as Error)?.message || 'Erreur lors de la mise à jour'}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* Left Column: General Info */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className="text-base sm:text-lg">Informations principales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6 pt-0">
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-slate-700">Titre</label>
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Ex: Challenge Summer Vibes 2025"
                    required
                    className="h-10 sm:h-12 text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-slate-700">Description / Brief</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full rounded-lg sm:rounded-xl border border-slate-200 p-3 sm:p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#ED5D3B]/20 focus:border-[#ED5D3B] transition-all resize-none"
                    placeholder="Décrivez précisément ce que vous attendez des créateurs..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className="text-base sm:text-lg">Médias & Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-slate-700 flex items-center gap-1.5 sm:gap-2">
                      <ImageIcon size={14} className="sm:w-4 sm:h-4" /> Image de couverture
                    </label>
                    <Input
                      name="coverImageUrl"
                      value={formData.coverImageUrl}
                      onChange={handleChange}
                      placeholder="URL de l'image..."
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-slate-700 flex items-center gap-1.5 sm:gap-2">
                      <Youtube size={14} className="sm:w-4 sm:h-4" /> Vidéo explicative
                    </label>
                    <Input
                      name="youtubeUrl"
                      value={formData.youtubeUrl}
                      onChange={handleChange}
                      placeholder="URL YouTube..."
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-slate-700 flex items-center gap-1.5 sm:gap-2">
                      <Calendar size={14} className="sm:w-4 sm:h-4" /> Début
                    </label>
                    <Input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-slate-700 flex items-center gap-1.5 sm:gap-2">
                      <Calendar size={14} className="sm:w-4 sm:h-4" /> Fin
                    </label>
                    <Input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      className="text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Rewards */}
          <div className="space-y-4 sm:space-y-6">
            <Card className="bg-slate-900 text-white border-none overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#0EA5E9]/20 to-sky-600/20" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10 p-3 sm:p-4 md:p-6">
                <CardTitle className="text-base sm:text-lg text-white">Récompenses</CardTitle>
                <Button type="button" size="sm" variant="ghost" onClick={addReward} className="text-white hover:bg-white/10 h-8 w-8 p-0">
                  <Plus size={14} className="sm:w-4 sm:h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 relative z-10 p-3 sm:p-4 md:p-6 pt-0">
                {rewards.map((reward, index) => (
                  <div key={reward.id || `new-${index}`} className="bg-white/10 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-white/10 animate-slide-up">
                    <div className="flex justify-between items-start mb-2 sm:mb-3">
                      <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-300">
                        Palier {index + 1} {reward.isNew && <span className="text-[#ED5D3B]">(nouveau)</span>}
                      </span>
                      {rewards.length > 1 && (
                        <button type="button" onClick={() => removeReward(index)} className="text-red-400 hover:text-red-300">
                          <Trash2 size={12} className="sm:w-3.5 sm:h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div>
                        <label className="text-[10px] sm:text-xs text-slate-400">Vues min.</label>
                        <Input
                          type="number"
                          value={reward.viewsTarget}
                          onChange={(e) => handleRewardChange(index, 'viewsTarget', e.target.value)}
                          placeholder="10k"
                          className="h-8 sm:h-9 bg-white/5 border-white/20 text-white placeholder:text-slate-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] sm:text-xs text-slate-400">Montant (€)</label>
                        <Input
                          type="number"
                          value={reward.amountEur}
                          onChange={(e) => handleRewardChange(index, 'amountEur', e.target.value)}
                          placeholder="50"
                          className="h-8 sm:h-9 bg-white/5 border-white/20 text-white placeholder:text-slate-500 text-sm"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reward.allowMultipleVideos}
                        onChange={(e) => handleRewardChange(index, 'allowMultipleVideos', e.target.checked)}
                        className="rounded border-white/30 text-[#ED5D3B] accent-[#ED5D3B] focus:ring-[#ED5D3B] bg-white/10 w-3.5 h-3.5 sm:w-4 sm:h-4"
                      />
                      <span className="text-[10px] sm:text-xs text-slate-300">Cumulable</span>
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full h-11 sm:h-12 md:h-14 rounded-lg sm:rounded-xl text-sm sm:text-base md:text-lg bg-[#0EA5E9] hover:bg-[#0284C7] shadow-lg shadow-sky-500/20"
              disabled={isUpdating || isSaving}
            >
              <Save size={16} className="mr-1.5 sm:mr-2 sm:w-5 sm:h-5" />
              {isUpdating || isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

