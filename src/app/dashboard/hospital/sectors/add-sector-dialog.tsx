
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
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addHospitalSector, updateHospitalSector } from '@/lib/actions';
import type { HospitalSector } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';

type AddSectorDialogProps = {
  trigger: React.ReactNode;
  sectorToEdit?: HospitalSector;
  onSectorSaved: () => void;
};

export function AddSectorDialog({ trigger, sectorToEdit, onSectorSaved }: AddSectorDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = !!sectorToEdit;

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const resetForm = () => {
    setName('');
    setDescription('');
  }

  useEffect(() => {
    if (sectorToEdit && isOpen) {
        setName(sectorToEdit.name || '');
        setDescription(sectorToEdit.description || '');
    } else if (!isEditing && isOpen) {
        resetForm();
    }
  }, [sectorToEdit, isOpen, isEditing]);

  const handleSave = async () => {
    if (!name) {
      toast({
        variant: 'destructive',
        title: 'Campo Obrigatório',
        description: 'O nome do setor é obrigatório.',
      });
      return;
    }
    setIsSaving(true);

    const sectorData = {
      name,
      description,
    };

    try {
        if (isEditing && sectorToEdit) {
            await updateHospitalSector(sectorToEdit.id, sectorData);
            toast({
              title: 'Setor Atualizado!',
              description: `O setor ${name} foi atualizado com sucesso.`,
            });
        } else {
            await addHospitalSector(sectorData);
            toast({
              title: 'Setor Adicionado!',
              description: `O setor ${name} foi adicionado com sucesso.`,
            });
        }

        onSectorSaved();
        setIsOpen(false);
        resetForm();

    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Erro ao salvar',
            description: 'Ocorreu um erro ao salvar o setor.',
        });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Setor' : 'Adicionar Novo Setor'}</DialogTitle>
          <DialogDescription>
            Cadastre os setores internos do hospital (ex: Enfermaria, UTI, Centro Cirúrgico).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Setor</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (Opcional)</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Breve descrição sobre o setor..." />
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

    