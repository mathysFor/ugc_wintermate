import { useState, useRef } from 'react';
import { useGetReferralDashboard, useGetReferees, useGetReferralCommissions, useGetReferralInvoices, useUploadReferralInvoice } from '@/api/referral';
import { queryClient } from '@/api/query-config';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Users,
  Copy,
  Check,
  Wallet,
  TrendingUp,
  FileText,
  ExternalLink,
  Clock,
  CheckCircle2,
  Upload,
  CreditCard,
} from 'lucide-react';

export const ReferralPage = () => {
  const [copied, setCopied] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadAmount, setUploadAmount] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isGiftCard, setIsGiftCard] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: dashboard, isLoading: dashboardLoading } = useGetReferralDashboard();
  const { data: referees, isLoading: refereesLoading } = useGetReferees();
  const { data: commissions, isLoading: commissionsLoading } = useGetReferralCommissions();
  const { data: invoices, isLoading: invoicesLoading } = useGetReferralInvoices();

  const { mutateAsync: uploadInvoice, isPending: isUploading } = useUploadReferralInvoice({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral'] });
      setShowUploadModal(false);
      setUploadAmount('');
      setUploadFile(null);
      setIsGiftCard(false);
    },
  });

  const referralLink = dashboard?.referralCode 
    ? `${window.location.origin}/register/${dashboard.referralCode}`
    : '';

  const handleCopyLink = async () => {
    if (referralLink) {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setUploadFile(file);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Si pas carte cadeau, le fichier est obligatoire
    if (!isGiftCard && !uploadFile) return;
    if (!uploadAmount) return;

    const amountCents = Math.round(parseFloat(uploadAmount) * 100);
    if (isNaN(amountCents) || amountCents <= 0) return;

    try {
      await uploadInvoice({ 
        file: uploadFile ?? undefined, 
        amountEur: amountCents,
        paymentMethod: isGiftCard ? 'gift_card' : 'invoice',
      });
    } catch (error) {
      console.error('Erreur upload facture:', error);
    }
  };

  if (dashboardLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Parrainage</h1>
        <p className="text-slate-500 mt-1">
          Parrainez des créateurs et gagnez des commissions sur leurs récompenses.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-green-700">Disponible</p>
                <p className="text-xl font-bold text-green-600">
                  {((dashboard?.availableAmount ?? 0) / 100).toFixed(0)}€
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-amber-700">En attente</p>
                <p className="text-xl font-bold text-amber-600">
                  {((dashboard?.pendingAmount ?? 0) / 100).toFixed(0)}€
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-blue-700">Déjà retiré</p>
                <p className="text-xl font-bold text-blue-600">
                  {((dashboard?.withdrawnAmount ?? 0) / 100).toFixed(0)}€
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-purple-700">Filleuls</p>
                <p className="text-xl font-bold text-purple-600">
                  {dashboard?.refereeCount ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lien de parrainage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Votre lien de parrainage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input 
                value={referralLink} 
                readOnly 
                className="font-mono text-sm bg-slate-50"
              />
            </div>
            <Button onClick={handleCopyLink} variant="outline" className="shrink-0">
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copier le lien
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-slate-500 mt-3">
            Votre commission : <span className="font-semibold text-[#ED5D3B]">{dashboard?.referralPercentage ?? 10}%</span> sur les récompenses de vos filleuls.
          </p>
        </CardContent>
      </Card>

      {/* Retirer les commissions */}
      {(dashboard?.availableAmount ?? 0) > 0 && (
        <Card className="border-[#0EA5E9] bg-sky-50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-900">Retirer vos commissions</h3>
                <p className="text-sm text-slate-600">
                  Vous avez {((dashboard?.availableAmount ?? 0) / 100).toFixed(2)}€ disponibles. Uploadez une facture pour retirer vos gains.
                </p>
              </div>
              <Button 
                onClick={() => setShowUploadModal(true)}
                className="bg-[#ED5D3B] hover:bg-[#d94f30] shrink-0"
              >
                <Upload className="w-4 h-4 mr-2" />
                Retirer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal d'upload */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Retirer vos commissions</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Montant à retirer (€)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max={((dashboard?.availableAmount ?? 0) / 100)}
                    value={uploadAmount}
                    onChange={(e) => setUploadAmount(e.target.value)}
                    placeholder={`Max: ${((dashboard?.availableAmount ?? 0) / 100).toFixed(2)}€`}
                    required
                  />
                </div>

                {/* Option carte cadeau */}
                <div 
                  onClick={() => setIsGiftCard(!isGiftCard)}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    isGiftCard 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isGiftCard ? 'bg-purple-100' : 'bg-slate-100'
                  }`}>
                    <CreditCard className={`w-5 h-5 ${isGiftCard ? 'text-purple-600' : 'text-slate-400'}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isGiftCard ? 'text-purple-700' : 'text-slate-700'}`}>
                      Être payé en carte cadeau
                    </p>
                    <p className="text-xs text-slate-500">
                      Si vous n'avez pas de société ou auto-entreprise
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    isGiftCard ? 'border-purple-500 bg-purple-500' : 'border-slate-300'
                  }`}>
                    {isGiftCard && <Check size={12} className="text-white" />}
                  </div>
                </div>

                {/* Zone upload PDF (masquée si carte cadeau) */}
                {!isGiftCard && (
                  <div>
                    <label className="text-sm font-medium text-slate-700">Facture (PDF)</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full mt-1"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploadFile ? uploadFile.name : 'Sélectionner un fichier PDF'}
                    </Button>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowUploadModal(false);
                      setUploadAmount('');
                      setUploadFile(null);
                      setIsGiftCard(false);
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-[#ED5D3B] hover:bg-[#d94f30]"
                    disabled={(!isGiftCard && !uploadFile) || !uploadAmount || isUploading}
                  >
                    {isUploading ? 'Envoi...' : 'Envoyer'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Liste des filleuls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Vos filleuls ({dashboard?.refereeCount ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {refereesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : !referees?.items?.length ? (
            <div className="text-center py-8 text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>Aucun filleul pour le moment.</p>
              <p className="text-sm mt-1">Partagez votre lien pour commencer à parrainer !</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referees.items.map((referee) => (
                <div key={referee.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">
                      {referee.firstName} {referee.lastName}
                    </p>
                    <p className="text-sm text-slate-500">
                      Inscrit le {new Date(referee.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#ED5D3B]">
                      {((referee.totalCommissions ?? 0) / 100).toFixed(2)}€
                    </p>
                    <p className="text-xs text-slate-500">commissions</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liste des commissions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Historique des commissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {commissionsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : !commissions?.items?.length ? (
            <div className="text-center py-8 text-slate-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>Aucune commission pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {commissions.items.map((commission) => (
                <div key={commission.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">
                      {commission.referee.firstName} {commission.referee.lastName}
                    </p>
                    <p className="text-sm text-slate-500">
                      {commission.campaignTitle} - Palier {(commission.rewardViewsTarget ?? 0).toLocaleString()} vues
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(commission.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      +{(commission.amountEur / 100).toFixed(2)}€
                    </p>
                    <Badge variant={commission.status === 'available' ? 'success' : commission.status === 'withdrawn' ? 'secondary' : 'warning'}>
                      {commission.status === 'available' ? 'Disponible' : commission.status === 'withdrawn' ? 'Retiré' : 'En attente'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liste des factures de parrainage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Mes factures de parrainage
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : !invoices?.items?.length ? (
            <div className="text-center py-8 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>Aucune facture de parrainage.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.items.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      invoice.status === 'paid' ? 'bg-green-100' : 'bg-amber-100'
                    }`}>
                      {invoice.status === 'paid' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">
                          {(invoice.amountEur / 100).toFixed(2)}€
                        </p>
                        {invoice.paymentMethod === 'gift_card' && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            <CreditCard size={10} className="mr-1" />
                            Carte cadeau
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">
                        {new Date(invoice.uploadedAt).toLocaleDateString('fr-FR')}
                        {invoice.paidAt && ` • Payée le ${new Date(invoice.paidAt).toLocaleDateString('fr-FR')}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={invoice.status === 'paid' ? 'success' : 'warning'}>
                      {invoice.status === 'paid' ? 'Payée' : 'En attente'}
                    </Badge>
                    {invoice.pdfUrl && (
                      <a
                        href={invoice.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-slate-600" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

