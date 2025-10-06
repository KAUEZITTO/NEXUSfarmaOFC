

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, Trash2, Loader2 } from 'lucide-react';
import { addPatient, updatePatient } from '@/lib/actions';
import { getUnits } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import type { Patient, Dosage, Unit, PatientDemandItem } from '@/lib/types';
import { Separator } from '../ui/separator';

const dosagePeriods: Dosage['period'][] = ['Manhã', 'Tarde', 'Noite', 'Ao deitar', 'Após Café', 'Jejum'];

const allDemandItems: PatientDemandItem[] = ['Fraldas', 'Insulinas Análogas', 'Tiras de Glicemia', 'Itens Judiciais', 'Imunoglobulina'];

const DosageInput = ({ dosages, setDosages, unitLabel }: { dosages: Dosage[], setDosages: (dosages: Dosage[]) => void, unitLabel: string }) => {
    
    const addDosage = () => {
        setDosages([...dosages, { id: `d-${Date.now()}`, period: 'Manhã', quantity: 1 }]);
    }

    const updateDosage = (id: string, field: 'period' | 'quantity', value: any) => {
        setDosages(dosages.map(d => d.id === id ? { ...d, [field]: value } : d));
    }

    const removeDosage = (id: string) => {
        setDosages(dosages.filter(d => d.id !== id));
    }

    return (
        <div className="space-y-2">
            {dosages.map(dosage => (
                <div key={dosage.id} className="flex items-center gap-2">
                    <Select value={dosage.period} onValueChange={(v) => updateDosage(dosage.id, 'period', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {dosagePeriods.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Input 
                        type="number"
                        min="1"
                        value={dosage.quantity}
                        onChange={(e) => updateDosage(dosage.id, 'quantity', parseInt(e.target.value, 10) || 1)}
                        className="w-24"
                    />
                    <Label>{unitLabel}</Label>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeDosage(dosage.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addDosage}>
                Adicionar Período
            </Button>
        </div>
    )
};

type AddPatientDialogProps = {
    patientToEdit?: Patient;
    trigger: React.ReactNode;
    onPatientSaved?: () => void;
}

export function AddPatientDialog({ patientToEdit, trigger, onPatientSaved }: AddPatientDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = !!patientToEdit;

  // Form state
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [cns, setCns] = useState('');
  const [rg, setRg] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [unitId, setUnitId] = useState('');
  const [isBedridden, setIsBedridden] = useState(false);
  
  const [demandItems, setDemandItems] = useState<PatientDemandItem[]>([]);
  const [insulinDosages, setInsulinDosages] = useState<Dosage[]>([]);
  const [stripDosages, setStripDosages] = useState<Dosage[]>([]);
  const [hasInsulinReport, setHasInsulinReport] = useState(false);
  const [insulinType, setInsulinType] = useState<'Lantus (Glargina)' | 'Apidra (Glulisina)'>('Lantus (Glargina)');
  const [insulinPresentation, setInsulinPresentation] = useState<'Caneta' | 'Frasco'>('Caneta');

  const [units, setUnits] = useState<Unit[]>([]);


  useEffect(() => {
    async function loadUnits() {
        if (isOpen) {
            const fetchedUnits = await getUnits();
            setUnits(fetchedUnits);
        }
    }
    loadUnits();
  }, [isOpen]);

  const resetForm = () => {
    setName('');
    setCpf('');
    setCns('');
    setRg('');
    setAddress('');
    setPhone('');
    setUnitId('');
    setIsBedridden(false);
    setDemandItems([]);
    setInsulinDosages([]);
    setStripDosages([]);
    setHasInsulinReport(false);
  }
  
  const handleDemandItemChange = (item: PatientDemandItem, checked: boolean) => {
    setDemandItems(prev => {
        const newItems = checked ? [...prev, item] : prev.filter(i => i !== item);
        // Clear related data if item is unchecked
        if (!checked) {
            if (item === 'Insulinas Análogas') setInsulinDosages([]);
            if (item === 'Tiras de Glicemia') setStripDosages([]);
        }
        return newItems;
    });
  };


  useEffect(() => {
    if (patientToEdit && isOpen) {
        setName(patientToEdit.name || '');
        setCpf(patientToEdit.cpf || '');
        setCns(patientToEdit.cns || '');
        setRg(patientToEdit.rg || '');
        setAddress(patientToEdit.address || '');
        setPhone(patientToEdit.phone || '');
        setUnitId(patientToEdit.unitId || '');
        setIsBedridden(patientToEdit.isBedridden || false);
        setDemandItems(patientToEdit.demandItems || []);
        setHasInsulinReport(patientToEdit.hasInsulinReport || false);
        setInsulinType(patientToEdit.analogInsulinType || 'Lantus (Glargina)');
        setInsulinPresentation(patientToEdit.insulinPresentation || 'Caneta');
        setInsulinDosages(patientToEdit.insulinDosages || []);
        setStripDosages(patientToEdit.stripDosages || []);
    } else if (!isEditing && isOpen) {
        resetForm();
    }
  }, [patientToEdit, isOpen, isEditing])

  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    if (!name || !cpf || !cns) {
        toast({
            variant: 'destructive',
            title: 'Campos Obrigatórios',
            description: 'Nome, CPF e Cartão do SUS são obrigatórios.'
        });
        setIsSaving(false);
        return;
    }
    
    try {
        const patientData: Omit<Patient, 'id' | 'status'> = {
            name,
            cpf,
            cns,
            rg,
            address,
            phone,
            unitId,
            unitName: units.find(u => u.id === unitId)?.name,
            isBedridden,
            demandItems,
            analogInsulinType: demandItems.includes('Insulinas Análogas') ? insulinType : undefined,
            hasInsulinReport: demandItems.includes('Insulinas Análogas') ? hasInsulinReport : undefined,
            insulinDosages: demandItems.includes('Insulinas Análogas') ? insulinDosages : [],
            insulinPresentation: demandItems.includes('Insulinas Análogas') ? insulinPresentation : undefined,
            stripDosages: demandItems.includes('Tiras de Glicemia') ? stripDosages : [],
        }

        if (isEditing && patientToEdit) {
            await updatePatient(patientToEdit.id, patientData);
        } else {
            await addPatient(patientData);
        }
        
        toast({
            title: `Paciente ${isEditing ? 'Atualizado' : 'Adicionado'}!`,
            description: `${patientData.name} foi ${isEditing ? 'atualizado' : 'cadastrado'} com sucesso.`
        });
        
        if (onPatientSaved) {
            onPatientSaved();
        }

        setIsOpen(false);
        resetForm();

    } catch (error) {
        console.error("Error saving patient:", error);
        toast({
            variant: 'destructive',
            title: 'Erro ao Salvar',
            description: 'Ocorreu um erro ao salvar o paciente. Verifique o console para mais detalhes.'
        });
    } finally {
        setIsSaving(false);
    }
  };
  
  const isInsulinUser = demandItems.includes('Insulinas Análogas');
  const usesStrips = demandItems.includes('Tiras de Glicemia');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Paciente' : 'Adicionar Novo Paciente'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSavePatient}>
          <ScrollArea className="h-[70vh] p-4">
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo <span className="text-red-500">*</span></Label>
                  <Input id="name" name="name" required value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF <span className="text-red-500">*</span></Label>
                  <Input id="cpf" name="cpf" required value={cpf} onChange={e => setCpf(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rg">RG (Opcional)</Label>
                  <Input id="rg" name="rg" value={rg} onChange={e => setRg(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cns">Cartão do SUS <span className="text-red-500">*</span></Label>
                  <Input id="cns" name="cns" required value={cns} onChange={e => setCns(e.target.value)} />
                </div>
                 <div className="space-y-2 col-span-1 md:col-span-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input id="address" name="address" value={address} onChange={e => setAddress(e.target.value)} />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="phone">Telefones (Opcional)</Label>
                  <Input id="phone" name="phone" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="unitId">Unidade de Referência</Label>
                    <Select name="unitId" value={unitId} onValueChange={setUnitId}>
                        <SelectTrigger><SelectValue placeholder="Selecione a unidade" /></SelectTrigger>
                        <SelectContent>
                            {units.map(unit => (
                                <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
              </div>

              {/* Special Conditions */}
              <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Switch id="is-bedridden" checked={isBedridden} onCheckedChange={setIsBedridden} />
                    <Label htmlFor="is-bedridden">Paciente Acamado?</Label>
                  </div>
              </div>
              
              <div className="space-y-4 pt-4 border-t">
                 <Label>Itens de Demanda Contínua</Label>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-md border p-4">
                    {allDemandItems.map(item => (
                        <div key={item} className="flex items-center space-x-2">
                            <Checkbox 
                                id={`demand-${item}`} 
                                checked={demandItems.includes(item)}
                                onCheckedChange={(checked) => handleDemandItemChange(item, !!checked)}
                            />
                            <Label htmlFor={`demand-${item}`}>{item}</Label>
                        </div>
                    ))}
                 </div>
              </div>

                {isInsulinUser && (
                    <div className="ml-0 p-4 border rounded-md space-y-4 bg-muted/20">
                        <h4 className="font-semibold text-md">Detalhes da Insulina Análoga</h4>
                        <div className="flex items-center space-x-2">
                            <Switch id="has-insulin-report" checked={hasInsulinReport} onCheckedChange={setHasInsulinReport} />
                            <Label htmlFor="has-insulin-report">Apresentou Laudo?</Label>
                        </div>
                        
                        <div>
                            <Label>Especificar Tipo de Insulina:</Label>
                            <RadioGroup value={insulinType} onValueChange={(v) => setInsulinType(v as any)} className="mt-2 flex gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Lantus (Glargina)" id="lantus" />
                                    <Label htmlFor="lantus">Lantus (Glargina)</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Apidra (Glulisina)" id="apidra" />
                                    <Label htmlFor="apidra">Apidra (Glulisina)</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div>
                            <Label>Apresentação:</Label>
                            <RadioGroup value={insulinPresentation} onValueChange={(v) => setInsulinPresentation(v as any)} className="mt-2 flex gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Caneta" id="pen" />
                                    <Label htmlFor="pen">Caneta</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Frasco" id="vial" />
                                    <Label htmlFor="vial">Frasco</Label>
                                </div>
                            </RadioGroup>
                        </div>
                        
                        <div className='space-y-2'>
                           <Label>Posologia</Label>
                           <DosageInput dosages={insulinDosages} setDosages={setInsulinDosages} unitLabel="UI" />
                        </div>
                    </div>
                )}
              

                {usesStrips && (
                    <div className="ml-0 p-4 border rounded-md space-y-4 bg-muted/20">
                        <h4 className="font-semibold text-md">Detalhes das Tiras de Glicemia</h4>
                        <Label>Orientações de Medição</Label>
                        <DosageInput dosages={stripDosages} setDosages={setStripDosages} unitLabel="vez(es)" />
                    </div>
                )}
               
              <Separator />
            </div>
          </ScrollArea>
          <DialogFooter className="pt-4">
             <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSaving}>Cancelar</Button>
             </DialogClose>
            <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSaving ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Salvar Paciente')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
