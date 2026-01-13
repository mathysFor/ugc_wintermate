import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useGetInvoices } from '@/api/invoices';
import { useGetReferralInvoices } from '@/api/referral';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import type { InvoiceWithRelations } from '@shared/types/invoices';
import type { ReferralInvoice } from '@shared/types/referral';
import { 
  Video,
  Receipt,
  ExternalLink,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileText,
  Users,
  CreditCard
} from 'lucide-react';

type GroupedInvoices = Record<number, {
  campaign: InvoiceWithRelations['campaign'];
  invoices: InvoiceWithRelations[];
}>;

const InvoiceCard = ({ invoice }: { invoice: InvoiceWithRelations }) => {
  const isPaid = invoice.status === 'paid';
  const isGiftCard = invoice.paymentMethod === 'gift_card';

  return (
    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 p-2.5 sm:p-3 md:p-4 bg-slate-50 rounded-lg sm:rounded-xl">
      {/* Icône statut */}
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${
        isPaid ? 'bg-green-100' : 'bg-amber-100'
      }`}>
        {isPaid ? (
          <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
        ) : (
          <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1 flex-wrap">
          <Badge variant={isPaid ? 'success' : 'warning'} className="text-[10px] sm:text-xs">
            {isPaid ? 'Payée' : 'En attente'}
          </Badge>
          {isGiftCard && (
            <Badge variant="secondary" className="text-[10px] sm:text-xs flex items-center gap-0.5">
              <CreditCard size={10} className="sm:w-3 sm:h-3" />
              Carte cadeau
            </Badge>
          )}
          <span className="text-[10px] sm:text-xs text-slate-500 flex items-center gap-0.5 sm:gap-1">
            <TrendingUp size={10} className="sm:w-3 sm:h-3" />
            Palier {invoice.reward.viewsTarget.toLocaleString()} vues
          </span>
        </div>
        
        <p className="text-base sm:text-lg font-bold text-slate-900">
          {(invoice.reward.amountEur / 100).toFixed(0)}€
        </p>

        <p className="text-[10px] sm:text-xs text-slate-500">
          Envoyée le {new Date(invoice.uploadedAt).toLocaleDateString('fr-FR')}
          {invoice.paidAt && (
            <> · Payée le {new Date(invoice.paidAt).toLocaleDateString('fr-FR')}</>
          )}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {invoice.pdfUrl && (
          <a
            href={invoice.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 sm:p-2 rounded-md sm:rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm text-slate-600"
          >
            <FileText size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden md:inline">Voir PDF</span>
            <ExternalLink size={12} className="sm:w-3.5 sm:h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
};

const ReferralInvoiceCard = ({ invoice }: { invoice: ReferralInvoice }) => {
  const isPaid = invoice.status === 'paid';
  const isGiftCard = invoice.paymentMethod === 'gift_card';

  return (
    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 p-2.5 sm:p-3 md:p-4 bg-slate-50 rounded-lg sm:rounded-xl">
      {/* Icône statut */}
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${
        isPaid ? 'bg-green-100' : 'bg-amber-100'
      }`}>
        {isPaid ? (
          <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
        ) : (
          <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1 flex-wrap">
          <Badge variant={isPaid ? 'success' : 'warning'} className="text-[10px] sm:text-xs">
            {isPaid ? 'Payée' : 'En attente'}
          </Badge>
          {isGiftCard && (
            <Badge variant="secondary" className="text-[10px] sm:text-xs flex items-center gap-0.5">
              <CreditCard size={10} className="sm:w-3 sm:h-3" />
              Carte cadeau
            </Badge>
          )}
          <span className="text-[10px] sm:text-xs text-slate-500 flex items-center gap-0.5 sm:gap-1">
            <Users size={10} className="sm:w-3 sm:h-3" />
            Commission parrainage
          </span>
        </div>
        
        <p className="text-base sm:text-lg font-bold text-slate-900">
          {(invoice.amountEur / 100).toFixed(0)}€
        </p>

        <p className="text-[10px] sm:text-xs text-slate-500">
          Envoyée le {new Date(invoice.uploadedAt).toLocaleDateString('fr-FR')}
          {invoice.paidAt && (
            <> · Payée le {new Date(invoice.paidAt).toLocaleDateString('fr-FR')}</>
          )}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {invoice.pdfUrl && (
          <a
            href={invoice.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 sm:p-2 rounded-md sm:rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm text-slate-600"
          >
            <FileText size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden md:inline">Voir PDF</span>
            <ExternalLink size={12} className="sm:w-3.5 sm:h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
};

export const InvoicesPage = () => {
  const { data: invoicesData, isLoading } = useGetInvoices();
  const { data: referralInvoicesData, isLoading: referralLoading } = useGetReferralInvoices();

  // Grouper les factures par campagne
  const groupedInvoices = useMemo<GroupedInvoices>(() => {
    if (!invoicesData?.items) return {};

    return invoicesData.items.reduce<GroupedInvoices>((acc, invoice) => {
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
  }, [invoicesData?.items]);

  const campaignIds = Object.keys(groupedInvoices);

  // Calcul des totaux (campagnes)
  const totalEarned = invoicesData?.items
    ?.filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.reward.amountEur, 0) ?? 0;

  const totalPending = invoicesData?.items
    ?.filter(inv => inv.status === 'uploaded')
    .reduce((sum, inv) => sum + inv.reward.amountEur, 0) ?? 0;

  // Calcul des totaux (parrainage)
  const referralEarned = referralInvoicesData?.items
    ?.filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amountEur, 0) ?? 0;

  const referralPending = referralInvoicesData?.items
    ?.filter(inv => inv.status === 'uploaded')
    .reduce((sum, inv) => sum + inv.amountEur, 0) ?? 0;

  // Totaux combinés
  const grandTotalEarned = totalEarned + referralEarned;
  const grandTotalPending = totalPending + referralPending;

  if (isLoading || referralLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <Skeleton className="h-6 sm:h-8 w-36 sm:w-48" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
          <Skeleton className="h-20 sm:h-24 w-full rounded-lg sm:rounded-xl" />
          <Skeleton className="h-20 sm:h-24 w-full rounded-lg sm:rounded-xl" />
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
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">Mes factures</h1>
          <p className="text-slate-500 text-sm sm:text-base mt-0.5 sm:mt-1">
            Retrouvez toutes vos factures et leur statut de paiement.
          </p>
        </div>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-2.5 sm:p-3 md:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs md:text-sm text-green-700">Gains encaissés</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">
                  {(grandTotalEarned / 100).toFixed(0)}€
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-2.5 sm:p-3 md:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs md:text-sm text-amber-700">En attente</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-amber-600">
                  {(grandTotalPending / 100).toFixed(0)}€
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Factures de parrainage */}
      {referralInvoicesData?.items && referralInvoicesData.items.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Factures de parrainage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3">
            {referralInvoicesData.items.map((invoice) => (
              <ReferralInvoiceCard key={invoice.id} invoice={invoice} />
            ))}
            <Link to="/referral">
              <Button variant="outline" size="sm" className="w-full mt-1.5 sm:mt-2 text-xs sm:text-sm">
                Voir mon parrainage
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Factures de campagnes */}
      {campaignIds.length === 0 && (!referralInvoicesData?.items || referralInvoicesData.items.length === 0) ? (
        <Card>
          <CardContent className="py-8 sm:py-10 md:py-12 text-center">
            <Receipt className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-slate-300" />
            <p className="text-slate-500 mb-3 sm:mb-4 text-sm sm:text-base">Aucune facture pour le moment.</p>
            <p className="text-xs sm:text-sm text-slate-400 mb-4 sm:mb-6 px-4">
              Participez à des campagnes et atteignez des paliers pour débloquer des récompenses.
            </p>
            <Link to="/campaigns">
              <Button className="text-sm sm:text-base">Trouver une campagne</Button>
            </Link>
          </CardContent>
        </Card>
      ) : campaignIds.length > 0 ? (
        <Accordion type="multiple" defaultValue={campaignIds}>
          {campaignIds.map((campaignIdStr) => {
            const campaignId = parseInt(campaignIdStr, 10);
            const group = groupedInvoices[campaignId];
            const paidCount = group.invoices.filter(i => i.status === 'paid').length;
            const pendingCount = group.invoices.filter(i => i.status === 'uploaded').length;
            const totalAmount = group.invoices.reduce((sum, i) => sum + i.reward.amountEur, 0);

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
                      <p className="text-[10px] sm:text-xs text-slate-500">{group.campaign.brandName}</p>
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
                        <span className="text-[10px] sm:text-xs text-slate-500">
                          {group.invoices.length} facture{group.invoices.length > 1 ? 's' : ''}
                        </span>
                        <span className="text-[10px] sm:text-xs font-medium text-slate-700">
                          {(totalAmount / 100).toFixed(0)}€
                        </span>
                        {paidCount > 0 && (
                          <Badge variant="success" className="text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0">
                            {paidCount} payée{paidCount > 1 ? 's' : ''}
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
                    {group.invoices.map((invoice) => (
                      <InvoiceCard key={invoice.id} invoice={invoice} />
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
      ) : null}
    </div>
  );
};

