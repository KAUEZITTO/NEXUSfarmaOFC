
'use client';

import { useState, useEffect } from 'react';
import type { HospitalPatient, HospitalPatientStatus, PrescribedItem, Product } from '@/lib/types';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addHospitalPatient, updateHospitalPatient, getProducts } from '@/lib/actions';
import { Save, Loader2, PlusCircle, Trash2, Pill, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { unstable_noStore as noStore } from 'next/cache';


interface AddHospitalPatientDialogProps {
    trigger: React.ReactNode;
    onPatientSaved: () => void;
    patientToEdit?: HospitalPatient;
    hospitalInventory: Product[];
}

export function AddHospitalPatientDialog({ trigger, onPatientSaved, patientToEdit, hospitalInventory }: AddHospitalPatientDialogProps) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const isEditing = !!patientToEdit;

    // Form state
    const [name, setName] = useState('');
    const [bedNumber, setBedNumber] = useState('');
    const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState<HospitalPatientStatus>('Internado');
    const [prescriptions, setPrescriptions] = useState<PrescribedItem[]>([]);

    // Product search state
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (isEditing && patientToEdit) {
                setName(patientToEdit.name);
                setBedNumber(patientToEdit.bedNumber);
                setAdmissionDate(new Date(patientToEdit.admissionDate).toISOString().split('T')[0]);
                setStatus(patientToEdit.status);
                setPrescriptions(patientToEdit.prescriptions || []);
            } else {
                // Reset form
                setName('');
                setBedNumber('');
                setAdmissionDate(new Date().toISOString().split('T')[0]);
                setStatus('Internado');
                setPrescriptions([]);
            }
        }
    }, [isOpen, isEditing, patientToEdit]);

    const handleSave = async () => {
        if (!name || !bedNumber) {
            toast({ variant: 'destructive', title: 'Campos Obrigatórios', description: 'Nome e Leito são obrigatórios.'});
            return;
        }
        setIsSaving(true);
        try {
            const patientData = { name, bedNumber, admissionDate, status, prescriptions };
            if (isEditing && patientToEdit) {
                await updateHospitalPatient(patientToEdit.id, patientData);
            } else {
                await addHospitalPatient(patientData);
            }
            onPatientSaved();
            setIsOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar os dados do paciente.'});
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleAddPrescriptionItem = (product: Product) => {
        setPrescriptions(prev => [...prev, {
            id: `presc-${Date.now()}`,
            productId: product.id,
            name: product.name,
            presentation: product.presentation || 'N/A',
            frequency: '',
            dosage: ''
        }]);
        setIsPopoverOpen(false);
    };

    const handleRemovePrescriptionItem = (id: string) => {
        setPrescriptions(prev => prev.filter(p => p.id !== id));
    };

    const handlePrescriptionChange = (id: string, field: 'frequency' | 'dosage', value: string) => {
        setPrescriptions(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Paciente' : 'Registrar Novo Paciente Internado'}</DialogTitle>
                    <DialogDescription>Preencha os dados e a prescrição do paciente internado.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input id="name" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="bedNumber">Leito</Label>
                            <Input id="bedNumber" value={bedNumber} onChange={e => setBedNumber(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="admissionDate">Admissão</Label>
                            <Input id="admissionDate" type="date" value={admissionDate} onChange={e => setAdmissionDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select value={status} onValueChange={(v) => setStatus(v as HospitalPatientStatus)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {(['Internado', 'Alta', 'Transferido', 'Óbito'] as HospitalPatientStatus[]).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <div className="space-y-4 pt-4 border-t">
                        <h4 className="font-medium text-lg flex items-center gap-2"><Pill className="h-5 w-5"/> Prescrições</h4>
                        <ScrollArea className="h-48 w-full pr-4">
                            <div className="space-y-4">
                            {prescriptions.length > 0 ? prescriptions.map(item => (
                                <div key={item.id} className="p-3 border rounded-md grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                                    <div className='col-span-3'>
                                        <Label className='text-sm font-semibold'>{item.name}</Label>
                                        <p className='text-xs text-muted-foreground'>{item.presentation}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor={`dosage-${item.id}`} className='text-xs'>Posologia</Label>
                                        <Input id={`dosage-${item.id}`} value={item.dosage} onChange={e => handlePrescriptionChange(item.id, 'dosage', e.target.value)} placeholder="Ex: 1 comp." />
                                    </div>
                                     <div className="space-y-1">
                                        <Label htmlFor={`frequency-${item.id}`} className='text-xs'>Frequência</Label>
                                        <Input id={`frequency-${item.id}`} value={item.frequency} onChange={e => handlePrescriptionChange(item.id, 'frequency', e.target.value)} placeholder="Ex: 8/8h" />
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemovePrescriptionItem(item.id)} className="self-end justify-self-end">
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            )) : <p className="text-sm text-center text-muted-foreground py-4">Nenhum item na prescrição.</p>}
                            </div>
                        </ScrollArea>
                        
                        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button type="button" variant="outline">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item à Prescrição
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Buscar no inventário do hospital..." />
                                    <CommandList>
                                        <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                                        <CommandGroup>
                                            {hospitalInventory.filter(p => p.quantity > 0).map((product) => (
                                                <CommandItem
                                                    key={product.id}
                                                    onSelect={() => handleAddPrescriptionItem(product)}
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", prescriptions.some(p => p.productId === product.id) ? "opacity-100" : "opacity-0")} />
                                                    <div className='flex flex-col'>
                                                        <span>{product.name} ({product.presentation})</span>
                                                        <span className='text-xs text-muted-foreground'>Estoque: {product.quantity}</span>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                        Salvar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
