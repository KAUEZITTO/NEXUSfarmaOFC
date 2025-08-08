
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { units } from '@/lib/data';
import type { Unit } from '@/lib/types';

type AddUnitDialogProps = {
  trigger: React.ReactNode;
  unitToEdit?: Unit;
};

export function AddUnitDialog({ trigger, unitToEdit }: AddUnitDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const isEditing = !!unitToEdit;

  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [coordinatorName, setCoordinatorName] = useState('');
  const [hasDentalOffice, setHasDentalOffice] = useState(false);
  const [hasPharmacy, setHasPharmacy] = useState(false);

  useEffect(() => {
    if (unitToEdit && isOpen) {
        setName(unitToEdit.name || '');
        setAddress(unitToEdit.address || '');
        setCoordinatorName(unitToEdit.coordinatorName || '');
        setHasDentalOffice(unitToEdit.hasDentalOffice || false);
        setHasPharmacy(unitToEdit.hasPharmacy || false);
    } else {
        // Reset form when opening to add a new one
        setName('');
        setAddress('');
        setCoordinatorName('');
        setHasDentalOffice(false);
        setHasPharmacy(false);
    }
  }, [unitToEdit, isOpen]);

  const handleSave = () => {
    if (!name || !address) {
      toast({
        variant: 'destructive',
        title: 'Campos Obrigatórios',
        description: 'Nome e Endereço da unidade são obrigatórios.',
      });
      return;
    }

    const newOrUpdatedUnit: Unit = {
      id: isEditing ? unitToEdit.id : `UNIT-${Date.now()}`,
      name,
      address,
      coordinatorName,
      hasDentalOffice,
      hasPharmacy,
    };

    if (isEditing) {
        const index = units.findIndex(u => u.id === unitToEdit.id);
        if (index !== -1) {
            units[index] = newOrUpdatedUnit;
        }
        toast({
          title: 'Unidade Atualizada!',
          description: `A unidade ${name} foi atualizada com sucesso.`,
        });
    } else {
        units.unshift(newOrUpdatedUnit);
        toast({
          title: 'Unidade Adicionada!',
          description: `A unidade ${name} foi adicionada com sucesso.`,
        });
    }

    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Unidade' : 'Adicionar Nova Unidade'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Unidade</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coordinatorName">Nome do Coordenador(a) (Opcional)</Label>
            <Input id="coordinatorName" value={coordinatorName} onChange={(e) => setCoordinatorName(e.target.value)} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="hasPharmacy" className="flex-grow">Possui Farmácia?</Label>
            <Switch id="hasPharmacy" checked={hasPharmacy} onCheckedChange={setHasPharmacy} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="hasDentalOffice" className="flex-grow">Possui Consultório Odontológico?</Label>
            <Switch id="hasDentalOffice" checked={hasDentalOffice} onCheckedChange={setHasDentalOffice} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
