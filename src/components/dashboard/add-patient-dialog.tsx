
'use client';

import { useState } from 'react';
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
import { PlusCircle, Save, Trash2 } from 'lucide-react';
import { units } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { patients } from '@/lib/data';
import type { Patient, Dosage } from '@/lib/types';

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


export function AddPatientDialog() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  
  // State for each form field
  const [isAnalogInsulinUser, setIsAnalogInsulinUser] = useState(false);
  const [usesStrips, setUsesStrips] = useState(false);
  const [insulinDosages, setInsulinDosages] = useState<Dosage[]>([]);
  const [stripDosages, setStripDosages] = useState<Dosage[]>([]);
  const [isBedridden, setIsBedridden] = useState(false);

  const [demandType, setDemandType] = useState<'judicial' | 'municipal' | 'none'>('none');
  const [judicialItems, setJudicialItems] = useState<string[]>([]);
  const [municipalItems, setMunicipalItems] = useState<string[]>([]);
  const [hasInsulinReport, setHasInsulinReport] = useState(false);

  const handleSavePatient = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newPatient: Partial<Patient> = {
        id: `PAT-${Date.now()}`,
        name: formData.get('name') as string,
        cpf: formData.get('cpf') as string,
        cns: formData.get('cns') as string,
        rg: formData.get('rg') as string,
        address: formData.get('address') as string,
        phone: formData.get('phone') as string,
        unitId: formData.get('unitId') as string,
        unitName: units.find(u => u.id === formData.get('unitId'))?.name,
        isAnalogInsulinUser,
        analogInsulinType: isAnalogInsulinUser ? formData.get('analogInsulinType') as any : undefined,
        hasInsulinReport: isAnalogInsulinUser ? hasInsulinReport : undefined,
        insulinDosages: isAnalogInsulinUser ? insulinDosages : undefined,
        insulinPresentation: isAnalogInsulinUser ? formData.get('insulinPresentation') as any : undefined,
        usesStrips,
        stripDosages: usesStrips ? stripDosages : undefined,
        isBedridden,
        mandateType: demandType === 'judicial' ? 'Legal' : demandType === 'municipal' ? 'Municipal' : 'N/A',
        judicialItems: demandType === 'judicial' ? judicialItems as any : [],
        municipalItems: demandType === 'municipal' ? municipalItems as any : [],
        status: 'Ativo'
    }

    if (!newPatient.name || !newPatient.cpf || !newPatient.cns) {
        toast({
            variant: 'destructive',
            title: 'Campos Obrigatórios',
            description: 'Nome, CPF e Cartão do SUS são obrigatórios.'
        });
        return;
    }
    
    patients.push(newPatient as Patient);

    toast({
        title: 'Paciente Adicionado!',
        description: `${newPatient.name} foi cadastrado com sucesso.`
    });

    setIsOpen(false);
    // Reset form states if needed
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Paciente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Paciente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSavePatient}>
          <ScrollArea className="h-[70vh] p-4">
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo <span className="text-red-500">*</span></Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF <span className="text-red-500">*</span></Label>
                  <Input id="cpf" name="cpf" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rg">RG (Opcional)</Label>
                  <Input id="rg" name="rg" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cns">Cartão do SUS <span className="text-red-500">*</span></Label>
                  <Input id="cns" name="cns" required />
                </div>
                 <div className="space-y-2 col-span-1 md:col-span-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input id="address" name="address" />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="phone">Telefones (Opcional)</Label>
                  <Input id="phone" name="phone" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="unitId">Unidade de Referência</Label>
                    <Select name="unitId">
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
                            <RadioGroup name="analogInsulinType" className="mt-2 flex gap-4">
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
                            <RadioGroup name="insulinPresentation" className="mt-2 flex gap-4">
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
                 <RadioGroup defaultValue="none" onValueChange={(v) => setDemandType(v as any)} className="flex gap-4">
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
                            <Checkbox id="judicial-meds" onCheckedChange={(checked) => setJudicialItems(p => checked ? [...p, 'Medicamentos'] : p.filter(i => i !== 'Medicamentos'))} />
                            <Label htmlFor="judicial-meds">Medicamentos</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Checkbox id="judicial-tech" onCheckedChange={(checked) => setJudicialItems(p => checked ? [...p, 'Material Técnico'] : p.filter(i => i !== 'Material Técnico'))}/>
                            <Label htmlFor="judicial-tech">Material Técnico</Label>
                        </div>
                    </div>
                )}

                 {demandType === 'municipal' && (
                    <div className="ml-6 p-4 border-l space-y-2">
                        <Label>Especificar Itens Municipais:</Label>
                         <div className="flex items-center space-x-2">
                            <Checkbox id="municipal-diapers" onCheckedChange={(checked) => setMunicipalItems(p => checked ? [...p, 'Fraldas'] : p.filter(i => i !== 'Fraldas'))} />
                            <Label htmlFor="municipal-diapers">Fraldas</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="municipal-meds" onCheckedChange={(checked) => setMunicipalItems(p => checked ? [...p, 'Medicamentos'] : p.filter(i => i !== 'Medicamentos'))} />
                            <Label htmlFor="municipal-meds">Medicamentos</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Checkbox id="municipal-tech" onCheckedChange={(checked) => setMunicipalItems(p => checked ? [...p, 'Material Técnico'] : p.filter(i => i !== 'Material Técnico'))} />
                            <Label htmlFor="municipal-tech">Material Técnico</Label>
                        </div>
                    </div>
                )}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="pt-4">
             <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
             </DialogClose>
            <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Salvar Paciente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
