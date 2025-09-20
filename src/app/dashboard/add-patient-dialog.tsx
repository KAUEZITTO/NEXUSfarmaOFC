
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
import { PlusCircle, Save, Trash2, Loader2 } from 'lucide-react';
import { getUnits, addPatient, updatePatient } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { Patient, Dosage, Unit } from '@/lib/types';
import { Separator } from '../ui/separator';

const dosagePeriods: Dosage['period'][] = ['Manhã', 'Tarde', 'Noite', 'Ao deitar', 'Após Café', 'Jejum'];

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
                        onChange={(e) => updateDosage(dosage.id, 'quantity', parseInt(e.target.value))}
                        className="w-24"
                    />
                    <Label>{unitLabel}</Label>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeDosage(dosage.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addDosage}>
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Período
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

  // State for each form field
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [cns, setCns] = useState('');
  const [rg, setRg] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [unitId, setUnitId] = useState('');
  
  const [isAnalogInsulinUser, setIsAnalogInsulinUser] = useState(false);
  const [usesStrips, setUsesStrips] = useState(false);
  const [insulinDosages, setInsulinDosages] = useState<Dosage[]>([]);
  const [stripDosages, setStripDosages] = useState<Dosage[]>([]);
  const [isBedridden, setIsBedridden] = useState(false);

  const [demandType, setDemandType] = useState<'judicial' | 'municipal' | 'none'>('none');
  const [judicialItems, setJudicialItems] = useState<string[]>([]);
  const [municipalItems, setMunicipalItems] = useState<string[]>([]);
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
    setIsAnalogInsulinUser(false);
    setUsesStrips(false);
    setInsulinDosages([]);
    setStripDosages([]);
    setIsBedridden(false);
    setDemandType('none');
    setJudicialItems([]);
    setMunicipalItems([]);
    setHasInsulinReport(false);
  }

  useEffect(() => {
    if (patientToEdit && isOpen) {
        setName(patientToEdit.name || '');
        setCpf(patientToEdit.cpf || '');
        setCns(patientToEdit.cns || '');
        setRg(patientToEdit.rg || '');
        setAddress(patientToEdit.address || '');
        setPhone(patientToEdit.phone || '');
        setUnitId(patientToEdit.unitId || '');
        setIsAnalogInsulinUser(patientToEdit.isAnalogInsulinUser || false);
        setHasInsulinReport(patientToEdit.hasInsulinReport || false);
        setInsulinType(patientToEdit.analogInsulinType || 'Lantus (Glargina)');
        setInsulinPresentation(patientToEdit.insulinPresentation || 'Caneta');
        setInsulinDosages(patientToEdit.insulinDosages || []);
        setUsesStrips(patientToEdit.usesStrips || false);
        setStripDosages(patientToEdit.stripDosages || []);
        setIsBedridden(patientToEdit.isBedridden || false);
        setDemandType(patientToEdit.mandateType === 'Legal' ? 'judicial' : patientToEdit.mandateType === 'Municipal' ? 'municipal' : 'none');
        setJudicialItems(patientToEdit.judicialItems || []);
        setMunicipalItems(patientToEdit.municipalItems || []);
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
            isAnalogInsulinUser,
            analogInsulinType: isAnalogInsulinUser ? insulinType : undefined,
            hasInsulinReport: isAnalogInsulinUser ? hasInsulinReport : undefined,
            insulinDosages: isAnalogInsulinUser ? insulinDosages : [],
            insulinPresentation: isAnalogInsulinUser ? insulinPresentation : undefined,
            usesStrips,
            stripDosages: usesStrips ? stripDosages : [],
            isBedridden,
            mandateType: demandType === 'judicial' ? 'Legal' : demandType === 'municipal' ? 'Municipal' : 'N/A',
            judicialItems: demandType === 'judicial' ? judicialItems : [],
            municipalItems: demandType === 'municipal' ? municipalItems : [],
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
                 <div className="flex items-center space-x-2">
                    <Switch id="analog-insulin-user" checked={isAnalogInsulinUser} onCheckedChange={setIsAnalogInsulinUser} />
                    <Label htmlFor="analog-insulin-user">Usuário de Insulina Análoga?</Label>
                </div>

                {isAnalogInsulinUser && (
                    <div className="ml-6 p-4 border-l space-y-4">
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
              </div>

               <div className="space-y-4 pt-4 border-t">
                 <div className="flex items-center space-x-2">
                    <Switch id="uses-strips" checked={usesStrips} onCheckedChange={setUsesStrips} />
                    <Label htmlFor="uses-strips">Faz uso de Tiras de Glicemia?</Label>
                </div>
                {usesStrips && (
                    <div className="ml-6 p-4 border-l space-y-4">
                        <Label>Orientações de Medição</Label>
                        <DosageInput dosages={stripDosages} setDosages={setStripDosages} unitLabel="vez(es)" />
                    </div>
                )}
               </div>
              
              <div className="space-y-4 pt-4 border-t">
                <Label>Tipo de Demanda (Mandado)</Label>
                 <RadioGroup value={demandType} onValueChange={(v) => setDemandType(v as any)} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="none" id="demand-none" />
                        <Label htmlFor="demand-none">Nenhuma</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="judicial" id="demand-judicial" />
                        <Label htmlFor="demand-judicial">Demanda Judicial</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="municipal" id="demand-municipal" />
                        <Label htmlFor="demand-municipal">Demanda Municipal</Label>
                    </div>
                </RadioGroup>

                {demandType === 'judicial' && (
                    <div className="ml-6 p-4 border-l space-y-2">
                        <Label>Especificar Itens Judiciais:</Label>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="judicial-meds" checked={judicialItems.includes('Medicamentos')} onCheckedChange={(checked) => setJudicialItems(p => checked ? [...p, 'Medicamentos'] : p.filter(i => i !== 'Medicamentos'))} />
                            <Label htmlFor="judicial-meds">Medicamentos</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Checkbox id="judicial-tech" checked={judicialItems.includes('Material Técnico')} onCheckedChange={(checked) => setJudicialItems(p => checked ? [...p, 'Material Técnico'] : p.filter(i => i !== 'Material Técnico'))}/>
                            <Label htmlFor="judicial-tech">Material Técnico</Label>
                        </div>
                    </div>
                )}

                 {demandType === 'municipal' && (
                    <div className="ml-6 p-4 border-l space-y-2">
                        <Label>Especificar Itens Municipais:</Label>
                         <div className="flex items-center space-x-2">
                            <Checkbox id="municipal-diapers" checked={municipalItems.includes('Fraldas')} onCheckedChange={(checked) => setMunicipalItems(p => checked ? [...p, 'Fraldas'] : p.filter(i => i !== 'Fraldas'))} />
                            <Label htmlFor="municipal-diapers">Fraldas</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="municipal-meds" checked={municipalItems.includes('Medicamentos')} onCheckedChange={(checked) => setMunicipalItems(p => checked ? [...p, 'Medicamentos'] : p.filter(i => i !== 'Medicamentos'))} />
                            <Label htmlFor="municipal-meds">Medicamentos</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Checkbox id="municipal-tech" checked={municipalItems.includes('Material Técnico')} onCheckedChange={(checked) => setMunicipalItems(p => checked ? [...p, 'Material Técnico'] : p.filter(i => i !== 'Material Técnico'))} />
                            <Label htmlFor="municipal-tech">Material Técnico</Label>
                        </div>
                    </div>
                )}
              </div>
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
