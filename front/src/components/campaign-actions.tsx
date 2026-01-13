import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUpdateCampaign, useDeleteCampaign } from '@/api/campaigns';
import { queryClient } from '@/api/query-config';
import type { CampaignStatus } from '@shared/types/campaigns';
import { Button } from '@/components/ui/button';
import { 
  Edit, 
  Rocket, 
  Pause, 
  Trash2, 
  MoreVertical,
  Play,
  X
} from 'lucide-react';

interface CampaignActionsProps {
  campaignId: number;
  currentStatus: CampaignStatus;
  onActionComplete?: () => void;
  variant?: 'buttons' | 'dropdown';
}

export const CampaignActions = ({ 
  campaignId, 
  currentStatus, 
  onActionComplete,
  variant = 'buttons' 
}: CampaignActionsProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const { mutateAsync: updateCampaign, isPending: isUpdating } = useUpdateCampaign(campaignId, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', campaignId] });
      onActionComplete?.();
    },
  });

  const { mutateAsync: deleteCampaign, isPending: isDeleting } = useDeleteCampaign(campaignId, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      onActionComplete?.();
    },
  });

  const handlePublish = async () => {
    await updateCampaign({ status: 'active' });
    setShowDropdown(false);
  };

  const handlePause = async () => {
    await updateCampaign({ status: 'paused' });
    setShowDropdown(false);
  };

  const handleResume = async () => {
    await updateCampaign({ status: 'active' });
    setShowDropdown(false);
  };

  const handleDelete = async () => {
    await deleteCampaign(undefined);
    setShowDeleteConfirm(false);
    setShowDropdown(false);
  };

  const isPending = isUpdating || isDeleting;

  // Variant: Boutons inline
  if (variant === 'buttons') {
    return (
      <>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Modifier */}
          <Link to={`/campaign/${campaignId}/edit`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Edit size={14} />
              Modifier
            </Button>
          </Link>

          {/* Publier (si draft) */}
          {currentStatus === 'draft' && (
            <Button 
              onClick={handlePublish} 
              disabled={isPending}
              size="sm"
              className="gap-1.5 bg-green-600 hover:bg-green-500"
            >
              <Rocket size={14} />
              {isUpdating ? 'Publication...' : 'Publier'}
            </Button>
          )}

          {/* Mettre en pause (si active) */}
          {currentStatus === 'active' && (
            <Button 
              onClick={handlePause} 
              disabled={isPending}
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <Pause size={14} />
              {isUpdating ? 'En cours...' : 'Pause'}
            </Button>
          )}

          {/* Reprendre (si paused) */}
          {currentStatus === 'paused' && (
            <Button 
              onClick={handleResume} 
              disabled={isPending}
              size="sm"
              className="gap-1.5 bg-green-600 hover:bg-green-500"
            >
              <Play size={14} />
              {isUpdating ? 'En cours...' : 'Reprendre'}
            </Button>
          )}

          {/* Supprimer */}
          <Button 
            onClick={() => setShowDeleteConfirm(true)} 
            disabled={isPending}
            variant="ghost"
            size="sm"
            className="gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} />
            Supprimer
          </Button>
        </div>

        {/* Modal de confirmation suppression */}
        {showDeleteConfirm && (
          <DeleteConfirmModal 
            onConfirm={handleDelete}
            onCancel={() => setShowDeleteConfirm(false)}
            isDeleting={isDeleting}
          />
        )}
      </>
    );
  }

  // Variant: Dropdown menu
  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => setShowDropdown(!showDropdown)}
        className="h-8 w-8"
      >
        <MoreVertical size={16} />
      </Button>

      {showDropdown && (
        <>
          {/* Backdrop pour fermer le menu */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)} 
          />
          
          {/* Menu dropdown */}
          <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-xl bg-white border border-slate-200 shadow-lg py-1 animate-fade-in">
            {/* Modifier */}
            <Link 
              to={`/campaign/${campaignId}/edit`}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              onClick={() => setShowDropdown(false)}
            >
              <Edit size={14} />
              Modifier
            </Link>

            {/* Publier (si draft) */}
            {currentStatus === 'draft' && (
              <button 
                onClick={handlePublish}
                disabled={isPending}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
              >
                <Rocket size={14} />
                {isUpdating ? 'Publication...' : 'Publier'}
              </button>
            )}

            {/* Mettre en pause (si active) */}
            {currentStatus === 'active' && (
              <button 
                onClick={handlePause}
                disabled={isPending}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <Pause size={14} />
                {isUpdating ? 'En cours...' : 'Mettre en pause'}
              </button>
            )}

            {/* Reprendre (si paused) */}
            {currentStatus === 'paused' && (
              <button 
                onClick={handleResume}
                disabled={isPending}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
              >
                <Play size={14} />
                {isUpdating ? 'En cours...' : 'Reprendre'}
              </button>
            )}

            {/* Séparateur */}
            <div className="my-1 border-t border-slate-100" />

            {/* Supprimer */}
            <button 
              onClick={() => {
                setShowDropdown(false);
                setShowDeleteConfirm(true);
              }}
              disabled={isPending}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} />
              Supprimer
            </button>
          </div>
        </>
      )}

      {/* Modal de confirmation suppression */}
      {showDeleteConfirm && (
        <DeleteConfirmModal 
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
};

// Composant modal de confirmation
const DeleteConfirmModal = ({ 
  onConfirm, 
  onCancel, 
  isDeleting 
}: { 
  onConfirm: () => void; 
  onCancel: () => void; 
  isDeleting: boolean;
}) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
          <Trash2 className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <p className="font-semibold text-slate-900">Supprimer la campagne</p>
          <p className="text-sm text-slate-500">Cette action est irréversible</p>
        </div>
      </div>
      
      <p className="text-slate-600 text-sm mb-6">
        Êtes-vous sûr de vouloir supprimer cette campagne ? Toutes les données associées seront perdues.
      </p>
      
      <div className="flex gap-3">
        <Button 
          variant="ghost" 
          onClick={onCancel}
          disabled={isDeleting}
          className="flex-1"
        >
          <X size={16} className="mr-1" />
          Annuler
        </Button>
        <Button 
          onClick={onConfirm}
          disabled={isDeleting}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white"
        >
          <Trash2 size={16} className="mr-1" />
          {isDeleting ? 'Suppression...' : 'Supprimer'}
        </Button>
      </div>
    </div>
  </div>
);







