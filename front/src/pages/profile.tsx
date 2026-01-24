import { useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useGetTiktokAccounts, useGetTiktokAuthUrl, useDisconnectTiktokAccount } from '@/api/tiktok';
import { useGetMyBrand, useUpdateBrand, useUploadBrandLogo, useCreateBrand } from '@/api/brands';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Lock, Share2, Building2, LogOut, Pencil, Upload, X, Loader2, Camera } from 'lucide-react';
import { queryClient } from '@/api/query-config';
import type { BrandSector } from '@shared/types/brands';

// Secteurs disponibles pour les marques
const BRAND_SECTORS: BrandSector[] = [
  'immobilier',
  'fashion',
  'beauty',
  'tech',
  'food',
  'travel',
  'lifestyle',
  'gaming',
  'sports',
  'music',
  'other',
];

// Labels français pour les secteurs
const SECTOR_LABELS: Record<BrandSector, string> = {
  fashion: 'Mode',
  beauty: 'Beauté',
  tech: 'Tech',
  food: 'Alimentation',
  travel: 'Voyage',
  lifestyle: 'Lifestyle',
  gaming: 'Gaming',
  sports: 'Sports',
  music: 'Musique',
  other: 'Autre',
  immobilier: 'Immobilier'
};

export const ProfilePage = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { data: tiktokAccounts } = useGetTiktokAccounts({ enabled: !!user?.isCreator });
  const { data: brand } = useGetMyBrand();
  
  const { refetch: getAuthUrl } = useGetTiktokAuthUrl();
  const { mutateAsync: disconnect } = useDisconnectTiktokAccount({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok', 'accounts'] });
    }
  });

  // État du modal d'édition de marque
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    sector: '' as BrandSector,
    website: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [appsflyerCopied, setAppsflyerCopied] = useState(false);

  // Mutations pour la marque
  const { mutateAsync: updateBrand, isPending: isUpdating } = useUpdateBrand(brand?.id ?? 0, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands', 'me'] });
    },
  });

  const { mutateAsync: uploadLogo, isPending: isUploadingLogo } = useUploadBrandLogo({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands', 'me'] });
    },
  });

  const { mutateAsync: createBrand, isPending: isCreating } = useCreateBrand({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands', 'me'] });
      closeEditModal();
    },
  });

  const handleConnectTiktok = async () => {
    try {
      const { data } = await getAuthUrl();
      
      if (data) {
        sessionStorage.setItem('tiktok_oauth_state', data.state);
        sessionStorage.setItem('tiktok_code_verifier', data.codeVerifier);
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error("Failed to get TikTok auth URL", error);
    }
  };

  // Ouvrir le modal avec les données actuelles
  const openEditModal = () => {
    if (brand) {
      setEditForm({
        name: brand.name,
        sector: brand.sector as BrandSector,
        website: brand.website || '',
      });
      setLogoPreview(brand.logoUrl);
      setLogoFile(null);
    } else {
      // Initialiser le formulaire vide pour la création
      setEditForm({ name: '', sector: '' as BrandSector, website: '' });
      setLogoPreview(null);
      setLogoFile(null);
    }
    setShowEditModal(true);
  };

  // Fermer le modal et réinitialiser
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditForm({ name: '', sector: '' as BrandSector, website: '' });
    setLogoFile(null);
    setLogoPreview(null);
  };

  // Gestion du drag & drop pour le logo
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleLogoSelect(files[0]);
    }
  };

  const handleLogoSelect = (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Seuls les fichiers JPEG, PNG, WebP et GIF sont acceptés');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Le fichier est trop volumineux (max 5 MB)');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleCopyAppsflyerLink = () => {
    if (user?.appsflyerLink) {
      navigator.clipboard.writeText(user.appsflyerLink);
      setAppsflyerCopied(true);
      setTimeout(() => setAppsflyerCopied(false), 2000);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleLogoSelect(files[0]);
    }
  };

  // Soumettre les modifications
  const handleSubmit = async () => {
    try {
      if (brand) {
        // Mise à jour d'une marque existante
        if (logoFile) {
          await uploadLogo({ brandId: brand.id, file: logoFile });
        }

        await updateBrand({
          name: editForm.name,
          sector: editForm.sector,
          website: editForm.website || undefined,
        });

        closeEditModal();
      } else {
        // Création d'une nouvelle marque
        const brandData = {
          name: editForm.name,
          sector: editForm.sector,
          website: editForm.website || undefined,
        };

        const newBrand = await createBrand(brandData);

        // Si un logo a été sélectionné, l'uploader après la création
        if (logoFile && newBrand) {
          await uploadLogo({ brandId: newBrand.id, file: logoFile });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const isSaving = isUpdating || isUploadingLogo || isCreating;

  return (
    <div className="space-y-8 pb-20 animate-fade-in">
      <div>
        <p className="text-xl font-bold text-slate-900">Mon Profil</p>
        <p className="text-slate-500">Gérez vos informations personnelles et vos connexions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Col: Identity Card */}
        <div className="md:col-span-1 space-y-6">
          <Card className="text-center overflow-hidden border-slate-200">
            <div className="h-24 bg-gradient-to-br from-[#0EA5E9] to-sky-500" />
            <div className="-mt-12 mb-4 flex justify-center">
              <Avatar 
                className="w-24 h-24 border-4 border-white shadow-lg text-2xl" 
                fallback={user?.firstName?.[0]} 
              />
          </div>
            <CardContent>
              <p className="text-xl font-bold text-slate-900">{user?.firstName} {user?.lastName}</p>
              <p className="text-slate-500 text-sm mb-4">{user?.email}</p>
              <Badge variant="secondary" className="mb-6 capitalize">
                {user?.isBrand ? 'Marque' : 'Créateur'}
              </Badge>
              
              <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100" onClick={logout}>
                <LogOut size={16} className="mr-2" /> Se déconnecter
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Settings */}
        <div className="md:col-span-2 space-y-6">
          
          {/* TikTok Connection (Creators Only) */}
          {user?.isCreator && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="text-[#ED5D3B]" size={20} />
                  Comptes TikTok
                </CardTitle>
                <CardDescription>
                  Connectez vos comptes pour participer aux campagnes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tiktokAccounts?.map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-bold">T</div>
                      <div>
                        <p className="font-semibold text-slate-900">@{account.username}</p>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${account.isValid ? 'bg-green-500' : 'bg-red-500'}`} />
                          <p className="text-xs text-slate-500">{account.isValid ? 'Connecté' : 'Expiré'}</p>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => disconnect(account.id)}
                      className="text-slate-400 hover:text-red-600"
                    >
                      Dissocier
                    </Button>
                  </div>
                ))}

                <Button 
                  onClick={handleConnectTiktok}
                  className="w-full h-12 bg-[#000000] hover:bg-[#1a1a1a] text-white rounded-xl shadow-lg shadow-black/10"
                >
                  <span className="font-bold mr-2">TikTok</span> Connecter un compte
                </Button>
              </CardContent>
            </Card>
          )}

          {/* AppsFlyer Link (Creators Only) */}
          {user?.isCreator && user?.appsflyerLink && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="text-[#ED5D3B]" size={20} />
                  Lien d'affiliation App
                </CardTitle>
                <CardDescription>
                  Partagez ce lien pour inviter d'autres créateurs via l'application.
                </CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <code className="flex-1 text-sm text-slate-600 truncate font-mono">
                      {user.appsflyerLink}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={appsflyerCopied ? "text-green-600" : "text-slate-500 hover:text-slate-900"}
                      onClick={handleCopyAppsflyerLink}
                    >
                      {appsflyerCopied ? (
                        <span className="flex items-center gap-1">
                          Copié !
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          Copier
                        </span>
                      )}
                    </Button>
                  </div>
              </CardContent>
            </Card>
          )}

          {/* Brand Info (Brands Only) */}
          {user?.isBrand && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="text-[#ED5D3B]" size={20} />
                  <CardTitle>Informations de l'entreprise</CardTitle>
                </div>
                {brand && (
                  <Button variant="outline" size="sm" onClick={openEditModal}>
                    <Pencil size={14} className="mr-2" />
                    Modifier
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {brand ? (
                  <div className="p-4 bg-sky-50 rounded-xl border border-sky-100 flex items-start gap-4">
                    <Avatar 
                      src={brand.logoUrl} 
                      fallback={brand.name[0]} 
                      size="lg"
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sky-900 text-lg">{brand.name}</p>
                      {brand.website && (
                        <a 
                          href={brand.website.startsWith('http') ? brand.website : `https://${brand.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#ED5D3B] hover:underline"
                        >
                          {brand.website}
                        </a>
                      )}
                      <Badge variant="outline" className="mt-2 bg-white">
                        {SECTOR_LABELS[brand.sector as BrandSector] || brand.sector}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-slate-500 mb-4">Vous n'avez pas encore configuré votre profil de marque.</p>
                    <Button variant="outline" onClick={openEditModal}>Configurer maintenant</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Account Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="text-slate-400" size={20} />
                Sécurité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <Input value={user?.email} disabled className="bg-slate-50 text-slate-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Mot de passe</label>
                  <Button variant="outline" className="w-full justify-start text-slate-500" disabled>
                    ••••••••
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal d'édition de marque */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl transform transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#0EA5E9]" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  {brand ? 'Modifier la marque' : 'Créer votre profil de marque'}
                </h2>
              </div>
              <button
                onClick={closeEditModal}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Upload Logo */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Logo de la marque
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-xl p-4 transition-all cursor-pointer ${
                    isDragging
                      ? 'border-[#0EA5E9] bg-sky-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileInputChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  <div className="flex items-center gap-4">
                    {logoPreview ? (
                      <div className="relative">
                        <img
                          src={logoPreview}
                          alt="Aperçu du logo"
                          className="w-16 h-16 rounded-xl object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Camera className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center">
                        <Upload className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm text-slate-600">
                        <span className="font-medium text-[#ED5D3B]">Cliquez pour sélectionner</span>
                        {' '}ou glissez-déposez
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        JPEG, PNG, WebP ou GIF (max. 5 MB)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nom */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Nom de l'entreprise</label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Ma marque"
                />
              </div>

              {/* Secteur */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Secteur d'activité</label>
                <select
                  value={editForm.sector}
                  onChange={(e) => setEditForm({ ...editForm, sector: e.target.value as BrandSector })}
                  className="w-full h-10 px-3 py-2 text-sm rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#ED5D3B] focus:border-transparent"
                >
                  <option value="">Sélectionner un secteur</option>
                  {BRAND_SECTORS.map((sector) => (
                    <option key={sector} value={sector}>
                      {SECTOR_LABELS[sector]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Site web */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Site web</label>
                <Input
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  placeholder="https://exemple.com"
                />
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="ghost" 
                  onClick={closeEditModal}
                  className="flex-1 h-12"
                  disabled={isSaving}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSaving || !editForm.name || !editForm.sector}
                  className="flex-1 h-12 bg-[#ED5D3B] hover:bg-[#d94f30]"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    'Enregistrer'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
