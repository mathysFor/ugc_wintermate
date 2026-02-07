import { useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { 
  useGetAcademyContent, 
  useGetAcademyCategories, 
  useCreateAcademyContent,
  useUpdateAcademyContent,
  useDeleteAcademyContent,
  useCreateAcademyCategory,
  useUpdateAcademyCategory,
  useDeleteAcademyCategory,
  useIncrementAcademyView,
} from '@/api/academy';
import { queryClient } from '@/api/query-config';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { 
  AcademyContentWithRelations, 
  AcademyContentType, 
  AcademyDifficulty,
  AcademyCategory,
  CreateAcademyContentInput,
} from '@shared/types/academy';
import { 
  Video,
  FileText,
  ExternalLink,
  Eye,
  GraduationCap,
  Plus,
  Pencil,
  Trash2,
  Play,
  Clock,
  BookOpen,
  Settings,
  ChevronRight,
} from 'lucide-react';

/** Génère un slug à partir d'un nom (pour les catégories academy) */
const slugify = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

// Badge de type de contenu
const ContentTypeBadge = ({ type }: { type: AcademyContentType }) => {
  const config = {
    video: { label: 'Vidéo', icon: Video, color: 'bg-red-500' },
    article: { label: 'Article', icon: FileText, color: 'bg-blue-500' },
    resource: { label: 'Ressource', icon: ExternalLink, color: 'bg-green-500' },
  };
  const { label, icon: Icon, color } = config[type];
  return (
    <Badge className={`${color} text-white text-xs`}>
      <Icon size={12} className="mr-1" />
      {label}
    </Badge>
  );
};

// Badge de difficulté
const DifficultyBadge = ({ difficulty }: { difficulty: AcademyDifficulty }) => {
  const config = {
    beginner: { label: 'Débutant', color: 'bg-green-100 text-green-700' },
    intermediate: { label: 'Intermédiaire', color: 'bg-yellow-100 text-yellow-700' },
    advanced: { label: 'Avancé', color: 'bg-red-100 text-red-700' },
  };
  const { label, color } = config[difficulty];
  return <Badge className={`${color} text-xs`}>{label}</Badge>;
};

// Carte de contenu
const ContentCard = ({ 
  content, 
  onClick,
  onEdit,
  onDelete,
  isBrand,
}: { 
  content: AcademyContentWithRelations;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isBrand: boolean;
}) => {
  const Icon = content.contentType === 'video' ? Play : 
               content.contentType === 'article' ? BookOpen : ExternalLink;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <button
        onClick={onClick}
        className="w-full text-left"
      >
        <div className="relative aspect-video bg-slate-100">
          {content.thumbnailUrl ? (
            <img
              src={content.thumbnailUrl}
              alt={content.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
              <Icon className="w-12 h-12 text-slate-400" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <ContentTypeBadge type={content.contentType} />
          </div>
          {content.contentType === 'video' && content.duration && (
            <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
              <Clock size={10} />
              {Math.floor(content.duration / 60)}:{(content.duration % 60).toString().padStart(2, '0')}
            </div>
          )}
        </div>
      </button>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-slate-900 line-clamp-2 mb-2">
          {content.title}
        </h3>
        <p className="text-sm text-slate-500 line-clamp-2 mb-3">
          {content.description}
        </p>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <DifficultyBadge difficulty={content.difficulty} />
          </div>
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <Eye size={12} />
            {content.viewCount.toLocaleString()}
          </div>
        </div>
        
        {isBrand && (
          <div className="flex gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); onEdit?.(); }}>
              <Pencil size={14} className="mr-1" />
              Modifier
            </Button>
            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); onDelete?.(); }}>
              <Trash2 size={14} />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Modal de détail du contenu
const ContentDetailModal = ({ 
  content, 
  open, 
  onOpenChange 
}: { 
  content: AcademyContentWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  if (!content) return null;

  const getYouTubeEmbedUrl = (url: string | null) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ContentTypeBadge type={content.contentType} />
            <span>{content.title}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {content.contentType === 'video' && content.videoUrl && (
            <div className="aspect-video rounded-lg overflow-hidden bg-black">
              <iframe
                src={getYouTubeEmbedUrl(content.videoUrl) || content.videoUrl}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          )}
          
          {content.contentType === 'article' && content.articleContent && (
            <div className="prose prose-slate max-w-none">
              <div className="whitespace-pre-wrap">{content.articleContent}</div>
            </div>
          )}
          
          {content.contentType === 'resource' && content.resourceUrl && (
            <a
              href={content.resourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-[#0EA5E9] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0EA5E9]/10 flex items-center justify-center">
                  <ExternalLink className="w-5 h-5 text-[#0EA5E9]" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Accéder à la ressource</p>
                  <p className="text-sm text-slate-500 truncate max-w-md">{content.resourceUrl}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </a>
          )}
          
          <div>
            <h4 className="font-medium text-slate-900 mb-2">Description</h4>
            <p className="text-slate-600">{content.description}</p>
          </div>
          
          <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
            <DifficultyBadge difficulty={content.difficulty} />
            <Badge variant="outline">{content.category.name}</Badge>
            <div className="flex items-center gap-1 text-slate-500 text-sm">
              <Eye size={14} />
              {content.viewCount.toLocaleString()} vues
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Modal de création/édition de contenu
const ContentFormModal = ({
  open,
  onOpenChange,
  editContent,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editContent: AcademyContentWithRelations | null;
  categories: AcademyCategory[];
}) => {
  const isEditing = !!editContent;
  const [title, setTitle] = useState(editContent?.title || '');
  const [description, setDescription] = useState(editContent?.description || '');
  const [categoryId, setCategoryId] = useState(editContent?.categoryId?.toString() || '');
  const [contentType, setContentType] = useState<AcademyContentType>(editContent?.contentType || 'video');
  const [videoUrl, setVideoUrl] = useState(editContent?.videoUrl || '');
  const [articleContent, setArticleContent] = useState(editContent?.articleContent || '');
  const [resourceUrl, setResourceUrl] = useState(editContent?.resourceUrl || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(editContent?.thumbnailUrl || '');
  const [duration, setDuration] = useState(editContent?.duration?.toString() || '');
  const [difficulty, setDifficulty] = useState<AcademyDifficulty>(editContent?.difficulty || 'beginner');

  const { mutateAsync: createContent, isPending: isCreating } = useCreateAcademyContent({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academy'] });
      onOpenChange(false);
      resetForm();
    },
  });

  const { mutateAsync: updateContent, isPending: isUpdating } = useUpdateAcademyContent(editContent?.id || 0, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academy'] });
      onOpenChange(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setTitle(''); setDescription(''); setCategoryId(''); setContentType('video');
    setVideoUrl(''); setArticleContent(''); setResourceUrl(''); setThumbnailUrl('');
    setDuration(''); setDifficulty('beginner');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: CreateAcademyContentInput = {
      categoryId: parseInt(categoryId),
      title,
      description,
      contentType,
      difficulty,
      videoUrl: contentType === 'video' ? videoUrl : undefined,
      articleContent: contentType === 'article' ? articleContent : undefined,
      resourceUrl: contentType === 'resource' ? resourceUrl : undefined,
      thumbnailUrl: thumbnailUrl || undefined,
      duration: duration ? parseInt(duration) : undefined,
    };
    if (isEditing) await updateContent(data);
    else await createContent(data);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100">
          <DialogHeader className="p-0">
            <DialogTitle className="text-lg font-semibold text-slate-900">
              {isEditing ? 'Modifier le contenu' : 'Nouveau contenu'}
            </DialogTitle>
            <p className="text-sm text-slate-500 mt-0.5">
              {isEditing ? 'Modifiez les informations ci-dessous' : 'Ajoutez une ressource pour vos créateurs'}
            </p>
          </DialogHeader>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5">
            {/* Titre */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Titre *</label>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Ex: Comment créer des vidéos engageantes" 
                className="h-11"
                required 
              />
            </div>
            
            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Description *</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Décrivez ce que les créateurs vont apprendre..." 
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20 focus:border-[#0EA5E9] transition-all resize-none"
                required 
              />
            </div>
            
            {/* Type de contenu */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Type de contenu</label>
              <div className="flex gap-2">
                {[
                  { type: 'video' as const, label: 'Vidéo', icon: Video },
                  { type: 'article' as const, label: 'Article', icon: FileText },
                  { type: 'resource' as const, label: 'Ressource', icon: ExternalLink },
                ].map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setContentType(type)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      contentType === type
                        ? 'border-[#0EA5E9] bg-[#0EA5E9]/5 text-[#0EA5E9]'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Champs selon type */}
            {contentType === 'video' && (
              <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">URL de la vidéo</label>
                  <Input 
                    value={videoUrl} 
                    onChange={(e) => setVideoUrl(e.target.value)} 
                    placeholder="https://youtube.com/watch?v=..." 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Durée (secondes)</label>
                  <Input 
                    type="number" 
                    value={duration} 
                    onChange={(e) => setDuration(e.target.value)} 
                    placeholder="180" 
                  />
                </div>
              </div>
            )}
            
            {contentType === 'article' && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Contenu</label>
                <textarea 
                  value={articleContent} 
                  onChange={(e) => setArticleContent(e.target.value)} 
                  placeholder="Rédigez votre article..." 
                  rows={8}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20 focus:border-[#0EA5E9] transition-all resize-none"
                />
              </div>
            )}
            
            {contentType === 'resource' && (
              <div className="space-y-1.5 p-4 bg-slate-50 rounded-lg">
                <label className="text-sm font-medium text-slate-700">URL de la ressource</label>
                <Input 
                  value={resourceUrl} 
                  onChange={(e) => setResourceUrl(e.target.value)} 
                  placeholder="https://..." 
                />
                <p className="text-xs text-slate-500 mt-1">Lien vers un document, template, outil...</p>
              </div>
            )}

            {/* Catégorie + Difficulté */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Catégorie *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20 focus:border-[#0EA5E9] transition-all"
                  required
                >
                  <option value="">Sélectionner...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Niveau</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as AcademyDifficulty)}
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20 focus:border-[#0EA5E9] transition-all"
                >
                  <option value="beginner">Débutant</option>
                  <option value="intermediate">Intermédiaire</option>
                  <option value="advanced">Avancé</option>
                </select>
              </div>
            </div>

            {/* Miniature */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Miniature <span className="text-slate-400 font-normal">(optionnel)</span>
              </label>
              <Input 
                value={thumbnailUrl} 
                onChange={(e) => setThumbnailUrl(e.target.value)} 
                placeholder="https://exemple.com/image.jpg" 
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isCreating || isUpdating || !title || !description || !categoryId}
              className="bg-[#0EA5E9] hover:bg-[#0284C7] min-w-[120px]"
            >
              {isCreating || isUpdating ? 'Enregistrement...' : isEditing ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Modal de gestion des catégories
const CategoryManageModal = ({
  open,
  onOpenChange,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: AcademyCategory[];
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<AcademyCategory | null>(null);
  const [editName, setEditName] = useState('');

  const { mutateAsync: createCategory, isPending: isCreating } = useCreateAcademyCategory({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academy-categories'] });
      setNewCategoryName('');
    },
  });

  const { mutateAsync: updateCategory, isPending: isUpdating } = useUpdateAcademyCategory(editingCategory?.id || 0, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academy-categories'] });
      setEditingCategory(null);
    },
  });

  const { mutateAsync: deleteCategory, isPending: isDeleting } = useDeleteAcademyCategory(editingCategory?.id || 0, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academy-categories'] });
      queryClient.invalidateQueries({ queryKey: ['academy'] });
      setEditingCategory(null);
    },
  });

  const handleCreate = async () => {
    if (!newCategoryName.trim()) return;
    const name = newCategoryName.trim();
    await createCategory({ name, slug: slugify(name) });
  };

  const handleUpdate = async () => {
    if (!editName.trim() || !editingCategory) return;
    await updateCategory({ name: editName.trim() });
  };

  const handleDelete = async (cat: AcademyCategory) => {
    if (confirm(`Supprimer la catégorie "${cat.name}" et tout son contenu ?`)) {
      setEditingCategory(cat);
      await deleteCategory(undefined);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100">
          <DialogHeader className="p-0">
            <DialogTitle className="text-lg font-semibold text-slate-900">
              Catégories
            </DialogTitle>
            <p className="text-sm text-slate-500 mt-0.5">
              Organisez votre contenu par thèmes
            </p>
          </DialogHeader>
        </div>
        
        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          {/* Ajouter une catégorie */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Nouvelle catégorie</label>
            <div className="flex gap-3">
              <input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ex: Conseils vidéo..."
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="flex-1 h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20 focus:border-[#0EA5E9] transition-all"
              />
              <Button 
                onClick={handleCreate} 
                disabled={isCreating || !newCategoryName.trim()}
                className="bg-[#0EA5E9] hover:bg-[#0284C7] h-10 px-4"
              >
                <Plus size={16} className="mr-1.5" />
                Ajouter
              </Button>
            </div>
          </div>

          {/* Liste des catégories */}
          {categories.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Vos catégories ({categories.length})
              </label>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {categories.map((cat) => (
                  <div 
                    key={cat.id} 
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                  >
                    {editingCategory?.id === cat.id ? (
                      <>
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20 focus:border-[#0EA5E9]"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                        />
                        <Button 
                          size="sm" 
                          onClick={handleUpdate} 
                          disabled={isUpdating}
                          className="bg-[#0EA5E9] hover:bg-[#0284C7] h-9 px-3"
                        >
                          OK
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => setEditingCategory(null)}
                          className="h-9 px-3"
                        >
                          Annuler
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-medium text-slate-900">{cat.name}</span>
                        <button
                          onClick={() => { setEditingCategory(cat); setEditName(cat.name); }}
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          disabled={isDeleting}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* État vide */}
          {categories.length === 0 && (
            <div className="text-center py-8 bg-slate-50 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-600 font-medium">Aucune catégorie</p>
              <p className="text-xs text-slate-500 mt-1">Créez votre première catégorie ci-dessus</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Page principale
export const AcademyPage = () => {
  const user = useAuthStore((state) => state.user);
  const isBrand = user?.isBrand;

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cursor, setCursor] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<AcademyContentWithRelations | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editContent, setEditContent] = useState<AcademyContentWithRelations | null>(null);
  const [deleteContentId, setDeleteContentId] = useState<number | null>(null);

  const { data: categories, isLoading: categoriesLoading } = useGetAcademyCategories();
  const { data: contentData, isLoading: contentLoading } = useGetAcademyContent({
    cursor: cursor || undefined,
    limit: 12,
    categoryId: selectedCategory !== 'all' ? parseInt(selectedCategory) : undefined,
  });

  const { mutate: incrementView } = useIncrementAcademyView(selectedContent?.id || 0);
  const { mutateAsync: deleteContent } = useDeleteAcademyContent(deleteContentId || 0, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academy'] });
      setDeleteContentId(null);
    },
  });

  const handleContentClick = (content: AcademyContentWithRelations) => {
    setSelectedContent(content);
    setViewModalOpen(true);
    incrementView(undefined);
  };

  const handleEditClick = (content: AcademyContentWithRelations) => {
    setEditContent(content);
    setFormModalOpen(true);
  };

  const handleDeleteClick = async (content: AcademyContentWithRelations) => {
    if (confirm(`Supprimer "${content.title}" ?`)) {
      setDeleteContentId(content.id);
      await deleteContent(undefined);
    }
  };

  const handleCreateClick = () => {
    setEditContent(null);
    setFormModalOpen(true);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setCursor(null);
  };

  const isLoading = categoriesLoading || contentLoading;
  const isEmpty = !contentLoading && (!contentData?.items || contentData.items.length === 0);
  const noCategories = !categoriesLoading && (!categories || categories.length === 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#0284C7] flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Académie</h1>
            <p className="text-slate-500 text-sm">
              {isBrand ? 'Créez et gérez votre contenu éducatif' : 'Apprenez pour percer sur tous les tiktoks'}
            </p>
          </div>
        </div>
        {isBrand && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCategoryModalOpen(true)}>
              <Settings size={16} className="mr-2" />
              Catégories
            </Button>
            <Button onClick={handleCreateClick} disabled={noCategories} className="bg-[#0EA5E9] hover:bg-[#0284C7]">
              <Plus size={16} className="mr-2" />
              Créer du contenu
            </Button>
          </div>
        )}
      </div>

      {/* No categories warning for brands */}
      {isBrand && noCategories && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4">
            <p className="text-amber-800 text-sm">
              Vous devez d'abord créer des catégories avant d'ajouter du contenu.{' '}
              <button onClick={() => setCategoryModalOpen(true)} className="underline font-medium">
                Créer une catégorie
              </button>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Category tabs */}
      {categories && categories.length > 0 && (
        <Tabs value={selectedCategory} onValueChange={handleCategoryChange} className="w-full">
          <TabsList className="flex-wrap h-auto gap-1 bg-slate-100 p-1">
            <TabsTrigger value="all" className="text-sm">Tout</TabsTrigger>
            {categories.map((cat) => (
              <TabsTrigger key={cat.id} value={String(cat.id)} className="text-sm">
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {/* Content grid */}
      {isLoading && !contentData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-video rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : isEmpty ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-medium text-slate-900 mb-1">Aucun contenu disponible</h3>
              <p className="text-sm text-slate-500 mb-4">
                {isBrand 
                  ? 'Commencez à créer du contenu éducatif pour vos créateurs'
                  : 'La marque n\'a pas encore partagé de contenu'}
              </p>
              {isBrand && !noCategories && (
                <Button onClick={handleCreateClick} className="bg-[#0EA5E9] hover:bg-[#0284C7]">
                  <Plus size={16} className="mr-2" />
                  Créer mon premier contenu
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contentData?.items.map((content) => (
              <ContentCard
                key={content.id}
                content={content}
                onClick={() => handleContentClick(content)}
                onEdit={() => handleEditClick(content)}
                onDelete={() => handleDeleteClick(content)}
                isBrand={!!isBrand}
              />
            ))}
          </div>

          {contentData?.hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => setCursor(String(contentData.nextCursor))}
                disabled={contentLoading}
              >
                {contentLoading ? 'Chargement...' : 'Charger plus'}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <ContentDetailModal content={selectedContent} open={viewModalOpen} onOpenChange={setViewModalOpen} />
      {isBrand && (
        <>
          <ContentFormModal
            open={formModalOpen}
            onOpenChange={(v) => { setFormModalOpen(v); if (!v) setEditContent(null); }}
            editContent={editContent}
            categories={categories || []}
          />
          <CategoryManageModal
            open={categoryModalOpen}
            onOpenChange={setCategoryModalOpen}
            categories={categories || []}
          />
        </>
      )}
    </div>
  );
};

export default AcademyPage;
