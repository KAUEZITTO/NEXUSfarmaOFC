'use client';

import { useState, useEffect } from 'react';
import type { HospitalPatient, HospitalPatientStatus, PrescribedItem, Product, HospitalSector } from '@/lib/types';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addHospitalPatient, updateHospitalPatient } from '@/lib/actions';
import { Save, Loader2, PlusCircle, Trash2, Pill } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AddHospitalPatientDialogProps {
    trigger: React.ReactNode;
    onPatientSaved: () => void;
    patientToEdit?: HospitalPatient;
    hospitalSectors: HospitalSector[];
}

export function AddHospitalPatientDialog({ trigger, onPatientSaved, patientToEdit, hospitalSectors }: AddHospitalPatientDialogProps) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const isEditing = !!patientToEdit;

    // Form state
    const [name, setName] = useState('');
    const [bedNumber, setBedNumber] = useState('');
    const [sectorId, setSectorId] = useState('');
    const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState<HospitalPatientStatus>('Internado');
    const [prescriptions, setPrescriptions] = useState<PrescribedItem[]>([]);

    useEffect(() => {
        if (isOpen) {
            if (isEditing && patientToEdit) {
                setName(patientToEdit.name);
                setBedNumber(patientToEdit.bedNumber);
                setSectorId(patientToEdit.sectorId || '');
                setAdmissionDate(new Date(patientToEdit.admissionDate).toISOString().split('T')[0]);
                setStatus(patientToEdit.status);
                setPrescriptions(patientToEdit.prescriptions || []);
            } else {
                // Reset form
                setName('');
                setBedNumber('');
                setSectorId('');
                setAdmissionDate(new Date().toISOString().split('T')[0]);
                setStatus('Internado');
                setPrescriptions([]);
            }
        }
    }, [isOpen, isEditing, patientToEdit]);

    const handleSave = async () => {
        if (!name || !sectorId) {
            toast({ variant: 'destructive', title: 'Campos Obrigatórios', description: 'Nome e Setor são obrigatórios.'});
            return;
        }
        setIsSaving(true);
        try {
            const sectorName = hospitalSectors.find(s => s.id === sectorId)?.name || 'Desconhecido';
            const patientData = { name, bedNumber, sectorId, sectorName, admissionDate, status, prescriptions };
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
    
    const handleAddPrescriptionItem = () => {
        setPrescriptions(prev => [...prev, {
            id: `presc-${Date.now()}`,
            name: '',
            dosage: '',
            frequency: ''
        }]);
    };

    const handleRemovePrescriptionItem = (id: string) => {
        setPrescriptions(prev => prev.filter(p => p.id !== id));
    };

    const handlePrescriptionChange = (id: string, field: 'name' | 'frequency' | 'dosage', value: string) => {
        setPrescriptions(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Paciente' : 'Registrar Novo Paciente Internado'}</DialogTitle>
                    <DialogDescription>Preencha os dados e a prescrição médica do paciente.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2 lg:col-span-2">
                            <Label htmlFor="name">Nome Completo</Label>
                            <Input id="name" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="bedNumber">Leito (Opcional)</Label>
                            <Input id="bedNumber" value={bedNumber} onChange={e => setBedNumber(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sector">Setor</Label>
                            <Select value={sectorId} onValueChange={setSectorId}>
                                <SelectTrigger><SelectValue placeholder="Selecione o setor..." /></SelectTrigger>
                                <SelectContent>
                                    {hospitalSectors.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="admissionDate">Data de Admissão</Label>
                            <Input id="admissionDate" type="date" value={admissionDate} onChange={e => setAdmissionDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status do Paciente</Label>
                            <Select value={status} onValueChange={(v) => setStatus(v as HospitalPatientStatus)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {(['Internado', 'Alta', 'Transferido', 'Óbito'] as HospitalPatientStatus[]).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <div className="space-y-4 pt-4 border-t">
                        <h4 className="font-medium text-lg flex items-center gap-2"><Pill className="h-5 w-5"/> Prescrição Médica</h4>
                        <ScrollArea className="h-48 w-full pr-4">
                            <div className="space-y-4">
                            {prescriptions.length > 0 ? prescriptions.map(item => (
                                <div key={item.id} className="p-3 border rounded-md grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
                                    <div className="space-y-1 md:col-span-3">
                                        <Label htmlFor={`name-${item.id}`} className='text-xs'>Medicamento/Item</Label>
                                        <Input id={`name-${item.id}`} value={item.name} onChange={e => handlePrescriptionChange(item.id, 'name', e.target.value)} placeholder="Ex: Dipirona 500mg" />
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <Label htmlFor={`dosage-${item.id}`} className='text-xs'>Posologia</Label>
                                        <Input id={`dosage-${item.id}`} value={item.dosage} onChange={e => handlePrescriptionChange(item.id, 'dosage', e.target.value)} placeholder="Ex: 1 comp." />
                                    </div>
                                     <div className="space-y-1 md:col-span-1">
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
                        
                        <Button type="button" variant="outline" onClick={handleAddPrescriptionItem}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item à Prescrição
                        </Button>
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
