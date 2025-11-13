
'use client';

import { useState, useEffect } from 'react';
import type { HospitalPatient, HospitalPatientStatus } from '@/lib/types';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addHospitalPatient, updateHospitalPatient } from '@/lib/actions';
import { Save, Loader2 } from 'lucide-react';

interface AddHospitalPatientDialogProps {
    trigger: React.ReactNode;
    onPatientSaved: () => void;
    patientToEdit?: HospitalPatient;
}

export function AddHospitalPatientDialog({ trigger, onPatientSaved, patientToEdit }: AddHospitalPatientDialogProps) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const isEditing = !!patientToEdit;

    // Form state
    const [name, setName] = useState('');
    const [bedNumber, setBedNumber] = useState('');
    const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState<HospitalPatientStatus>('Internado');
    const [prescriptions, setPrescriptions] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (isEditing && patientToEdit) {
                setName(patientToEdit.name);
                setBedNumber(patientToEdit.bedNumber);
                setAdmissionDate(new Date(patientToEdit.admissionDate).toISOString().split('T')[0]);
                setStatus(patientToEdit.status);
                setPrescriptions(patientToEdit.prescriptions || '');
            } else {
                setName('');
                setBedNumber('');
                setAdmissionDate(new Date().toISOString().split('T')[0]);
                setStatus('Internado');
                setPrescriptions('');
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

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Paciente' : 'Registrar Novo Paciente Internado'}</DialogTitle>
                    <DialogDescription>Preencha os dados do paciente para controle de dispensação no hospital.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nome</Label>
                        <Input id="name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="bedNumber" className="text-right">Leito</Label>
                        <Input id="bedNumber" value={bedNumber} onChange={e => setBedNumber(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="admissionDate" className="text-right">Admissão</Label>
                        <Input id="admissionDate" type="date" value={admissionDate} onChange={e => setAdmissionDate(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">Status</Label>
                        <Select value={status} onValueChange={(v) => setStatus(v as HospitalPatientStatus)}>
                            <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {(['Internado', 'Alta', 'Transferido', 'Óbito'] as HospitalPatientStatus[]).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="prescriptions" className="text-right pt-2">Prescrições</Label>
                        <Textarea id="prescriptions" value={prescriptions} onChange={e => setPrescriptions(e.target.value)} placeholder="Descreva as prescrições médicas..." className="col-span-3"/>
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
