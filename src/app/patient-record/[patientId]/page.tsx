
'use server';

import { getPatient } from "@/lib/data";
import { notFound } from "next/navigation";
import { PrintActions } from "@/app/receipt/[id]/print-actions";
import { Logo } from "@/components/logo";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const DetailItem = ({ label, value }: { label: string; value: string | undefined | null }) => {
    if (!value) return null;
    return (
        <div>
            <p className="text-xs font-semibold text-gray-500">{label}</p>
            <p className="text-sm text-black">{value}</p>
        </div>
    );
};


export default async function PatientRecordPage({ params }: { params: { patientId: string } }) {

    const patient = await getPatient(params.patientId);

    if (!patient) {
        return notFound();
    }
    
    const formattedDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC'
        });
    };

    return (
        <>
            <div className="print-container max-w-4xl mx-auto my-8 p-8 bg-white shadow-lg print:shadow-none text-black">
                <header className="mb-6">
                    <div className="grid grid-cols-3 items-center text-center border-b pb-4 border-gray-400">
                        <div className="flex flex-col items-center justify-center">
                            <Image src="/SMS-PREF.png" alt="Logo Prefeitura" width={80} height={80} data-ai-hint="city hall government" />
                            <p className="text-xs font-bold mt-1 max-w-40">PREFEITURA MUNICIPAL DE IGARAPÉ-AÇU</p>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                            <Logo />
                        </div>
                        <div className="flex flex-col items-center justify-center">
                            <Image src="/CAF.png" alt="Logo CAF" width={80} height={80} data-ai-hint="pharmacy cross" />
                            <p className="text-xs font-bold mt-1">CAF - CENTRO DE ABASTÊCIMENTO FARMACÊUTICO</p>
                        </div>
                    </div>
                     <div className="text-center mt-4">
                        <h1 className="text-xl font-bold">Ficha de Cadastro de Paciente</h1>
                        <p className="text-sm text-gray-600">
                            Data de Cadastro: {formattedDate(patient.createdAt)}
                        </p>
                    </div>
                </header>

                <main className="space-y-6">
                    <Card className="border-gray-300">
                        <CardHeader>
                            <CardTitle className="text-base">Informações Pessoais</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <DetailItem label="Nome Completo" value={patient.name} />
                            <DetailItem label="CPF" value={patient.cpf} />
                            <DetailItem label="Cartão do SUS (CNS)" value={patient.cns} />
                            <DetailItem label="RG" value={patient.rg} />
                            <DetailItem label="Telefone(s)" value={patient.phone} />
                            <div className="col-span-2"><DetailItem label="Endereço" value={patient.address} /></div>
                        </CardContent>
                    </Card>
                    
                    <Card className="border-gray-300">
                        <CardHeader>
                            <CardTitle className="text-base">Informações de Saúde e Demanda</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <DetailItem label="Unidade de Referência" value={patient.unitName} />
                                <DetailItem label="Status do Paciente" value={patient.status} />
                                <DetailItem label="Paciente Acamado" value={patient.isBedridden ? 'Sim' : 'Não'} />
                            </div>
                             {patient.isBedridden && patient.pathology && (
                                <DetailItem label="Patologia (Acamado)" value={patient.pathology} />
                            )}
                            <Separator/>
                            <div>
                               <p className="text-sm font-semibold">Demandas de Cuidado Contínuo:</p>
                               <p className="text-sm">{patient.demandItems?.join(', ') || 'Nenhuma demanda específica cadastrada.'}</p>
                            </div>
                            
                            {patient.demandItems?.includes('Insulinas Análogas') && (
                                <div className="p-3 rounded-md bg-gray-50 border">
                                    <h3 className="font-semibold text-sm mb-2">Detalhes da Insulina Análoga</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <DetailItem label="Tipo de Diabetes" value={patient.diabetesType} />
                                        <DetailItem label="Apresentou Laudo" value={patient.hasInsulinReport ? `Sim (Data: ${formattedDate(patient.insulinReportDate)})` : 'Não'} />
                                        <DetailItem label="Tipo de Insulina" value={patient.customInsulinType || patient.analogInsulinType} />
                                        <DetailItem label="Apresentação" value={patient.insulinPresentation} />
                                    </div>
                                    <div className="mt-2">
                                        <DetailItem label="Posologia" value={patient.insulinDosages?.map(d => `${d.quantity} UI na ${d.period}`).join('; ')} />
                                    </div>
                                </div>
                            )}
                            {patient.demandItems?.includes('Fraldas') && (
                                <div className="p-3 rounded-md bg-gray-50 border">
                                     <h3 className="font-semibold text-sm mb-2">Detalhes das Fraldas</h3>
                                    <DetailItem label="Tamanho" value={patient.diaperSize} />
                                </div>
                            )}
                             {patient.demandItems?.includes('Materiais Técnicos (Acamados)') && (
                                <div className="p-3 rounded-md bg-gray-50 border">
                                     <h3 className="font-semibold text-sm mb-2">Detalhes dos Materiais para Acamados</h3>
                                     <div className="grid grid-cols-2 gap-4">
                                        <DetailItem label="CID" value={patient.bedriddenCid} />
                                        <DetailItem label="Duração do Tratamento" value={patient.bedriddenTreatmentDuration} />
                                     </div>
                                      <div className="mt-2">
                                        <DetailItem label="Patologia/Descrição" value={patient.bedriddenPathology} />
                                      </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="pt-8 text-center text-xs text-gray-500">
                        <p>Ficha de cadastro gerada pelo sistema NexusFarma.</p>
                        <p>&copy; {new Date().getFullYear()} NexusFarma. Todos os direitos reservados.</p>
                    </div>
                </main>
            </div>
            <PrintActions />
        </>
    )
}
