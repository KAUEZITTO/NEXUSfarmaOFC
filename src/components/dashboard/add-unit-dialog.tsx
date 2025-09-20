
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
import { Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addUnit, updateUnit } from '@/lib/actions';
import type { Unit } from '@/lib/types';
import { useRouter } from 'next/navigation';

type AddUnitDialogProps = {
  trigger: React.ReactNode;
  unitToEdit?: Unit;
};

export function AddUnitDialog({ trigger, unitToEdit }: AddUnitDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = !!unitToEdit;

  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [coordinatorName, setCoordinatorName] = useState('');
  const [hasDentalOffice, setHasDentalOffice] = useState(false);
  const [hasPharmacy, setHasPharmacy] = useState(false);

  const resetForm = () => {
    setName('');
    setAddress('');
    setCoordinatorName('');
    setHasDentalOffice(false);
    setHasPharmacy(false);
  }

  useEffect(() => {
    if (unitToEdit && isOpen) {
        setName(unitToEdit.name || '');
        setAddress(unitToEdit.address || '');
        setCoordinatorName(unitToEdit.coordinatorName || '');
        setHasDentalOffice(unitToEdit.hasDentalOffice || false);
        setHasPharmacy(unitToEdit.hasPharmacy || false);
    } else {
        resetForm();
    }
  }, [unitToEdit, isOpen]);

  const handleSave = async () => {
    if (!name || !address) {
      toast({
        variant: 'destructive',
        title: 'Campos Obrigatórios',
        description: 'Nome e Endereço da unidade são obrigatórios.',
      });
      return;
    }
    setIsSaving(true);

    try {
        if (isEditing && unitToEdit) {
            await updateUnit(unitToEdit.id, {
                name,
                address,
                coordinatorName,
                hasDentalOffice,
                hasPharmacy,
            });
            toast({
              title: 'Unidade Atualizada!',
              description: `A unidade ${name} foi atualizada com sucesso.`,
            });
        } else {
            await addUnit({
                name,
                address,
                coordinatorName,
                hasDentalOffice,
                hasPharmacy,
                type: 'UBS' // default type for new units
            });
            toast({
              title: 'Unidade Adicionada!',
              description: `A unidade ${name} foi adicionada com sucesso.`,
            });
        }

        router.refresh();
        setIsOpen(false);
        resetForm();

    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Erro ao salvar',
            description: 'Ocorreu um erro ao salvar a unidade. Tente novamente.',
        });
        console.error("Failed to save unit:", error);
    } finally {
        setIsSaving(false);
    }
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
            <Button type="button" variant="outline" disabled={isSaving}>
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
