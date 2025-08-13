
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useUpdateAta } from '@/hooks/useAtas';
import { ATA } from '@/hooks/useAtas';
import { useToast } from '@/hooks/use-toast';

interface MoveATADialogProps {
  ata: ATA | null;
  isOpen: boolean;
  onClose: () => void;
  currentCategoryName: string;
}

const MoveATADialog: React.FC<MoveATADialogProps> = ({
  ata,
  isOpen,
  onClose,
  currentCategoryName
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const updateAta = useUpdateAta();
  const { toast } = useToast();

  const categories = [
    { value: 'normal', label: 'ATAs' },
    { value: 'adesao', label: 'Adesões' },
    { value: 'aquisicao', label: 'Aquisição Global' },
    { value: 'antigo', label: 'Saldo de ATAs' }
  ];

  // Filtrar categorias para não incluir a categoria atual
  const availableCategories = categories.filter(cat => cat.value !== ata?.category);

  const handleMove = async () => {
    if (!ata || !selectedCategory) {
      console.log('ATA ou categoria não selecionada:', { ata, selectedCategory });
      return;
    }

    console.log('Iniciando movimentação da ATA:', {
      ataId: ata.id,
      currentCategory: ata.category,
      targetCategory: selectedCategory
    });

    try {
      const updatedAta = {
        ...ata,
        category: selectedCategory as 'normal' | 'adesao' | 'aquisicao' | 'antigo'
      };

      console.log('Dados da ATA para atualização:', updatedAta);

      await updateAta.mutateAsync(updatedAta);
      
      const targetCategoryName = categories.find(cat => cat.value === selectedCategory)?.label;
      
      console.log('ATA movida com sucesso!');
      
      toast({
        title: "ATA movida com sucesso!",
        description: `ATA ${ata.n_ata} foi movida de ${currentCategoryName} para ${targetCategoryName}`,
      });
      
      onClose();
      setSelectedCategory('');
    } catch (error) {
      console.error('Erro ao mover ATA:', error);
      toast({
        title: "Erro ao mover ATA",
        description: "Ocorreu um erro ao tentar mover a ATA. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedCategory('');
  };

  if (!ata) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mover ATA</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">
              ATA a ser movida:
            </Label>
            <p className="text-lg font-semibold text-blue-600">{ata.n_ata}</p>
            <p className="text-sm text-gray-600">{ata.objeto}</p>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">
              Categoria atual:
            </Label>
            <p className="text-sm font-medium text-orange-600">{currentCategoryName}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium text-gray-700">
              Mover para categoria:
            </Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria de destino" />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleMove}
              disabled={!selectedCategory || updateAta.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateAta.isPending ? 'Movendo...' : 'Mover ATA'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MoveATADialog;
