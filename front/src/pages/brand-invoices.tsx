import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetBrandInvoices, useMarkInvoicePaid } from '@/api/invoices';
import { useGetAllReferralInvoices, useMarkReferralInvoicePaid } from '@/api/referral';
import { queryClient } from '@/api/query-config';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { InvoiceWithRelations } from '@shared/types/invoices';
import type { ReferralInvoiceWithCreator } from '@shared/types/referral';
import { 
  Video,
  ExternalLink,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileText,
  CreditCard,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Users
} from 'lucide-react';

// Composant pour l'action "Marquer comme payée"
const MarkPaidButton = ({ invoice, onSuccess }: { 
  invoice: InvoiceWithRelations; 
  onSuccess: () => void;
}) => {
  const { mutateAsync, isPending } = useMarkInvoicePaid(invoice.id, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-invoices'] });
      onSuccess();
    },
  });

  const handleMarkPaid = async () => {
    if (window.confirm('Confirmer le paiement de cette facture ?')) {
      await mutateAsync(undefined);
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
      onClick={handleMarkPaid}
      disabled={isPending}
    >
      <CreditCard size={16} className="mr-1" />
      {isPending ? 'Paiement...' : 'Marquer payée'}
    </Button>
  );
};

// Composant pour l'action "Marquer comme payée" (factures parrainage)
const MarkReferralPaidButton = ({ invoice, onSuccess }: { 
  invoice: ReferralInvoiceWithCreator; 
  onSuccess: () => void;
}) => {
  const { mutateAsync, isPending } = useMarkReferralInvoicePaid(invoice.id, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral', 'invoices', 'all'] });
      onSuccess();
    },
  });

  const handleMarkPaid = async () => {
    if (window.confirm('Confirmer le paiement de cette facture de parrainage ?')) {
      await mutateAsync(undefined);
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
      onClick={handleMarkPaid}
      disabled={isPending}
    >
      <CreditCard size={16} className="mr-1" />
      {isPending ? 'Paiement...' : 'Marquer payée'}
    </Button>
  );
};

// Carte de facture de parrainage pour la vue marque
const BrandReferralInvoiceCard = ({ 
  invoice, 
  showActions = false,
  onActionComplete 
}: { 
  invoice: ReferralInvoiceWithCreator;
  showActions?: boolean;
  onActionComplete?: () => void;
}) => {
  const isPaid = invoice.status === 'paid';
  const isGiftCard = invoice.paymentMethod === 'gift_card';

  return (
    <div className="flex flex-col gap-3 p-4 bg-purple-50 rounded-xl border border-purple-100">
      <div className="flex items-center gap-4">
        {/* Icône statut */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isPaid ? 'bg-green-100' : 'bg-amber-100'
        }`}>
          {isPaid ? (
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          ) : (
            <Clock className="w-6 h-6 text-amber-600" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              <Users size={12} className="mr-1" />
              Parrainage
            </Badge>
            <Badge variant={isPaid ? 'success' : 'warning'}>
              {isPaid ? 'Payée' : 'En attente'}
            </Badge>
            {isGiftCard && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                <CreditCard size={12} className="mr-1" />
                Carte cadeau
              </Badge>
            )}
          </div>
          
          <p className="text-lg font-bold text-slate-900">
            {(invoice.amountEur / 100).toFixed(0)}€
          </p>

          <p className="text-xs text-slate-500">
            Créateur : <span className="font-medium">{invoice.creator.firstName} {invoice.creator.lastName}</span>
          </p>
          <p className="text-xs text-slate-400">
            {invoice.creator.email}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            Envoyée le {new Date(invoice.uploadedAt).toLocaleDateString('fr-FR')}
            {invoice.paidAt && (
              <> · Payée le {new Date(invoice.paidAt).toLocaleDateString('fr-FR')}</>
            )}
          </p>
        </div>

        {/* Lien PDF ou indicateur carte cadeau */}
        {invoice.pdfUrl ? (
          <a
            href={invoice.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-1 text-sm text-slate-600 flex-shrink-0"
          >
            <FileText size={16} />
            <span className="hidden sm:inline">PDF</span>
            <ExternalLink size={14} />
          </a>
        ) : (
          <div className="p-2 rounded-lg bg-amber-100 flex items-center gap-1 text-sm text-amber-700 flex-shrink-0">
            <CreditCard size={16} />
            <span className="hidden sm:inline">Carte cadeau</span>
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && onActionComplete && (
        <div className="flex justify-end">
          <MarkReferralPaidButton invoice={invoice} onSuccess={onActionComplete} />
        </div>
      )}
    </div>
  );
};

// Carte de facture pour la vue marque
const BrandInvoiceCard = ({ 
  invoice, 
  showActions = false,
  onActionComplete 
}: { 
  invoice: InvoiceWithRelations;
  showActions?: boolean;
  onActionComplete?: () => void;
}) => {
  const isPaid = invoice.status === 'paid';
  const isGiftCard = invoice.paymentMethod === 'gift_card';
  const [showAdsDetails, setShowAdsDetails] = useState(false);

  // Vérifier si tous les codes d'ads sont renseignés
  const adsStatus = invoice.adsCodesStatus;
  const allAdsCodesProvided = adsStatus 
    ? adsStatus.videosWithAdsCode === adsStatus.totalVideos 
    : true;

  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl">
      <div className="flex items-center gap-4">
        {/* Icône statut */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isPaid ? 'bg-green-100' : 'bg-amber-100'
        }`}>
          {isPaid ? (
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          ) : (
            <Clock className="w-6 h-6 text-amber-600" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link 
              to={`/campaign/${invoice.campaign.id}`}
              className="text-sm font-medium text-[#0EA5E9] hover:text-sky-600 hover:underline"
            >
              {invoice.campaign.title}
            </Link>
          </div>

          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant={isPaid ? 'success' : 'warning'}>
              {isPaid ? 'Payée' : 'En attente'}
            </Badge>
            {isGiftCard && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                <CreditCard size={12} className="mr-1" />
                Carte cadeau
              </Badge>
            )}
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <TrendingUp size={12} />
              Palier {invoice.reward.viewsTarget.toLocaleString()} vues
            </span>
          </div>
          
          <p className="text-lg font-bold text-slate-900">
            {(invoice.reward.amountEur / 100).toFixed(0)}€
          </p>

          <p className="text-xs text-slate-500">
            Créateur : <span className="font-medium">@{invoice.creatorUsername ?? 'inconnu'}</span>
          </p>

          <p className="text-xs text-slate-500">
            Envoyée le {new Date(invoice.uploadedAt).toLocaleDateString('fr-FR')}
            {invoice.paidAt && (
              <> · Payée le {new Date(invoice.paidAt).toLocaleDateString('fr-FR')}</>
            )}
          </p>
        </div>

        {/* Lien PDF ou indicateur carte cadeau */}
        {invoice.pdfUrl ? (
          <a
            href={invoice.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1 text-sm text-slate-600 flex-shrink-0"
          >
            <FileText size={16} />
            <span className="hidden sm:inline">PDF</span>
            <ExternalLink size={14} />
          </a>
        ) : (
          <div className="p-2 rounded-lg bg-amber-100 flex items-center gap-1 text-sm text-amber-700 flex-shrink-0">
            <CreditCard size={16} />
            <span className="hidden sm:inline">Carte cadeau</span>
          </div>
        )}
      </div>

      {/* Statut des codes d'ads */}
      {adsStatus && !isPaid && (
        <div className={`rounded-lg p-3 ${
          allAdsCodesProvided 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-amber-50 border border-amber-200'
        }`}>
          <button
            onClick={() => setShowAdsDetails(!showAdsDetails)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              {allAdsCodesProvided ? (
                <CheckCircle2 size={16} className="text-green-600" />
              ) : (
                <AlertCircle size={16} className="text-amber-600" />
              )}
              <span className={`text-sm font-medium ${
                allAdsCodesProvided ? 'text-green-700' : 'text-amber-700'
              }`}>
                Codes d'ads : {adsStatus.videosWithAdsCode}/{adsStatus.totalVideos} vidéos
              </span>
            </div>
            {showAdsDetails ? (
              <ChevronUp size={16} className="text-slate-400" />
            ) : (
              <ChevronDown size={16} className="text-slate-400" />
            )}
          </button>

          {showAdsDetails && (
            <div className="mt-3 space-y-2 border-t border-slate-200/50 pt-3">
              {adsStatus.videos.map((video) => (
                <div 
                  key={video.submissionId} 
                  className="flex items-center gap-2 text-xs"
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    video.hasAdsCode ? 'bg-green-200' : 'bg-amber-200'
                  }`}>
                    {video.hasAdsCode ? (
                      <CheckCircle2 size={12} className="text-green-600" />
                    ) : (
                      <AlertCircle size={12} className="text-amber-600" />
                    )}
                  </div>
                  <span className="text-slate-600">@{video.tiktokUsername}</span>
                  {video.hasAdsCode ? (
                    <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                      {video.adsCode}
                    </span>
                  ) : (
                    <span className="text-amber-600 italic">Code manquant</span>
                  )}
                  <a
                    href={`https://www.tiktok.com/@${video.tiktokUsername}/video/${video.tiktokVideoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-slate-400 hover:text-slate-600"
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {showActions && onActionComplete && (
        <div className="flex justify-end">
          <MarkPaidButton invoice={invoice} onSuccess={onActionComplete} />
        </div>
      )}
    </div>
  );
};

// Groupement des factures par campagne
type GroupedInvoices = Record<number, {
  campaign: InvoiceWithRelations['campaign'];
  invoices: InvoiceWithRelations[];
}>;

// Contenu d'un onglet
const TabContent = ({ 
  status, 
  showActions = false 
}: { 
  status: 'uploaded' | 'paid';
  showActions?: boolean;
}) => {
  const { data, isLoading, refetch } = useGetBrandInvoices({ status });
  const { data: referralData, isLoading: referralLoading, refetch: refetchReferral } = useGetAllReferralInvoices({ status });

  // Grouper les factures par campagne
  const groupedInvoices = useMemo<GroupedInvoices>(() => {
    if (!data?.items) return {};

    return data.items.reduce<GroupedInvoices>((acc, invoice) => {
      const campaignId = invoice.campaign.id;
      
      if (!acc[campaignId]) {
        acc[campaignId] = {
          campaign: invoice.campaign,
          invoices: [],
        };
      }
      
      acc[campaignId].invoices.push(invoice);
      return acc;
    }, {});
  }, [data?.items]);

  const campaignIds = Object.keys(groupedInvoices);

  // Calcul du total (campagnes)
  const campaignTotalAmount = data?.items?.reduce((sum, inv) => sum + inv.reward.amountEur, 0) ?? 0;
  
  // Calcul du total (parrainage)
  const referralTotalAmount = referralData?.items?.reduce((sum, inv) => sum + inv.amountEur, 0) ?? 0;
  
  // Total global
  const totalAmount = campaignTotalAmount + referralTotalAmount;

  const hasReferralInvoices = (referralData?.items?.length ?? 0) > 0;
  const hasCampaignInvoices = campaignIds.length > 0;
  const hasAnyInvoices = hasCampaignInvoices || hasReferralInvoices;

  if (isLoading || referralLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!hasAnyInvoices) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          {status === 'uploaded' ? (
            <>
              <Clock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">Aucune facture en attente de paiement.</p>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">Aucune facture payée pour le moment.</p>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Résumé */}
      <Card className={status === 'uploaded' ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              status === 'uploaded' ? 'bg-amber-100' : 'bg-green-100'
            }`}>
              {status === 'uploaded' ? (
                <Clock className={`w-5 h-5 text-amber-600`} />
              ) : (
                <CheckCircle2 className={`w-5 h-5 text-green-600`} />
              )}
            </div>
            <div>
              <p className={`text-sm ${status === 'uploaded' ? 'text-amber-700' : 'text-green-700'}`}>
                {status === 'uploaded' ? 'Total à payer' : 'Total payé'}
              </p>
              <p className={`text-2xl font-bold ${status === 'uploaded' ? 'text-amber-600' : 'text-green-600'}`}>
                {(totalAmount / 100).toFixed(0)}€
              </p>
              {hasReferralInvoices && hasCampaignInvoices && (
                <p className="text-xs text-slate-500 mt-1">
                  Campagnes: {(campaignTotalAmount / 100).toFixed(0)}€ · Parrainage: {(referralTotalAmount / 100).toFixed(0)}€
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Factures de parrainage */}
      {hasReferralInvoices && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Factures de parrainage
              <Badge variant="secondary" className="ml-2">
                {referralData?.items?.length ?? 0}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {referralData?.items?.map((invoice) => (
              <BrandReferralInvoiceCard 
                key={invoice.id} 
                invoice={invoice}
                showActions={showActions}
                onActionComplete={() => refetchReferral()}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Liste groupée par campagne */}
      {campaignIds.map((campaignIdStr) => {
        const campaignId = parseInt(campaignIdStr, 10);
        const group = groupedInvoices[campaignId];
        const groupTotal = group.invoices.reduce((sum, i) => sum + i.reward.amountEur, 0);

        return (
          <div key={campaignId} className="space-y-3">
            {/* Header campagne */}
            <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                {group.campaign.coverImageUrl ? (
                  <img 
                    src={group.campaign.coverImageUrl} 
                    alt={group.campaign.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="w-4 h-4 text-slate-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <Link 
                  to={`/campaign/${campaignId}`}
                  className="font-semibold text-slate-900 hover:text-[#ED5D3B]"
                >
                  {group.campaign.title}
                </Link>
                <p className="text-xs text-slate-500">
                  {group.invoices.length} facture{group.invoices.length > 1 ? 's' : ''} · {(groupTotal / 100).toFixed(0)}€
                </p>
              </div>
            </div>

            {/* Factures de cette campagne */}
            <div className="space-y-3 pl-2">
              {group.invoices.map((invoice) => (
                <BrandInvoiceCard 
                  key={invoice.id} 
                  invoice={invoice}
                  showActions={showActions}
                  onActionComplete={() => refetch()}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const BrandInvoicesPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Factures</h1>
        <p className="text-slate-500">
          Gérez les factures des créateurs de vos campagnes.
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="uploaded">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="uploaded" className="flex-1 sm:flex-none">
            <Clock size={16} className="mr-2" />
            En attente
          </TabsTrigger>
          <TabsTrigger value="paid" className="flex-1 sm:flex-none">
            <CheckCircle2 size={16} className="mr-2" />
            Payées
          </TabsTrigger>
        </TabsList>

        <TabsContent value="uploaded">
          <TabContent status="uploaded" showActions />
        </TabsContent>

        <TabsContent value="paid">
          <TabContent status="paid" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

