
'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Camera, Loader2, Upload, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/lib/actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';

export function AccountForm() {
  const { data: session, update: updateSession } = useSession();
  const user = session?.user;
  const { toast } = useToast();
  const router = useRouter();

  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [image, setImage] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if(user) {
        setName(user.name || '');
        setBirthdate(user.birthdate ? user.birthdate.split('T')[0] : '');
        setImage(user.image || '');
    }
  }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    // Simulate upload by creating a data URL.
    // In a real app, this would call an upload action.
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setImage(dataUrl);
      setIsUploading(false);
      toast({ title: 'Imagem Carregada', description: 'A nova imagem está pronta para ser salva.' });
    };
    reader.readAsDataURL(file);
  };

  const openCamera = async () => {
    setIsCameraOpen(true);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing camera: ", error);
        setHasCameraPermission(false);
      }
    }
  };

  const takePicture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUrl = canvas.toDataURL('image/png');
      
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());

      setIsCameraOpen(false);
      setImage(dataUrl);
      toast({ title: 'Foto Capturada', description: 'A nova imagem está pronta para ser salva.' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      const result = await updateUserProfile(user.id, { name, birthdate, image });
      
      // The `update` function from `useSession` triggers a session update on the client.
      await updateSession(result.user);

      toast({
        title: 'Perfil Atualizado!',
        description: 'Suas informações foram salvas com sucesso.',
      });
      // Refresh the page to ensure all components have the latest user data
      router.refresh();

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar suas informações.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex items-center gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={image} alt={name} />
            <AvatarFallback>
              <User className="h-10 w-10" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2">
             <div className="flex gap-2">
                <Button type="button" onClick={() => document.getElementById('file-upload')?.click()} disabled={isUploading}>
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                    {isUploading ? 'Enviando...' : 'Enviar Foto'}
                </Button>
                <Input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

                <Button type="button" variant="outline" onClick={openCamera}>
                    <Camera className="mr-2 h-4 w-4" />
                    Tirar Foto
                </Button>
             </div>
             <p className="text-xs text-muted-foreground">PNG, JPG, GIF.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nome de Exibição</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email || ''} disabled />
            </div>
            <div className="space-y-2">
                <Label htmlFor="birthdate">Data de Nascimento</Label>
                <Input id="birthdate" type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} />
            </div>
        </div>

        <Button type="submit" disabled={isSaving || isUploading}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </form>

      <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tirar Foto</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center gap-4">
            {hasCameraPermission ? (
                <video ref={videoRef} className="w-full h-auto rounded-md" autoPlay playsInline />
            ) : (
                <Alert variant="destructive">
                    <AlertTitle>Acesso à Câmera Negado</AlertTitle>
                    <AlertDescription>
                        Para tirar uma foto, habilite a permissão de câmera nas configurações do seu navegador.
                    </AlertDescription>
                </Alert>
            )}
            <canvas ref={canvasRef} className="hidden"></canvas>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCameraOpen(false)}>Cancelar</Button>
            <Button onClick={takePicture} disabled={!hasCameraPermission}>Tirar Foto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
