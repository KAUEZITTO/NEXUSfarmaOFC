
'use server';

import Image from 'next/image';
import Link from 'next/link';
import { RegisterForm } from '@/components/auth/register-form';
import { Logo } from '@/components/logo';
import { revalidatePath } from 'next/cache';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase/admin';
import { getAllUsers, writeData } from '@/lib/data';
import type { User, Role, SubRole } from '@/lib/types';


const avatarColors = [
  'hsl(211 100% 50%)', // Blue
  'hsl(39 100% 50%)', // Orange
  'hsl(0 84.2% 60.2%)', // Red
  'hsl(142.1 76.2% 36.3%)', // Green
  'hsl(262.1 83.3% 57.8%)', // Purple
  'hsl(314.5 72.4% 57.3%)', // Pink
  'hsl(198.8 93.4% 42%)' // Teal
];

// --- A Server Action de registro agora vive aqui ---
async function register({ name, email, password, role, subRole }: { name: string, email: string; password: string; role: Role; subRole?: SubRole; }) {
    'use server';
    
    try {
        const adminAuth = getAuth(getAdminApp());
        const users = await getAllUsers();

        // Check in our KV database first
        if (users.some(u => u.email === email)) {
            return { success: false, message: 'Este email já está em uso.' };
        }
        
        // Check in Firebase Auth
        try {
            await adminAuth.getUserByEmail(email);
            return { success: false, message: 'Este email já está registrado no sistema de autenticação.' };
        } catch (error: any) {
            if (error.code !== 'auth/user-not-found') {
                throw error;
            }
        }

        const userRecord = await adminAuth.createUser({
            email: email,
            password: password,
            displayName: name,
        });
        
        const isFirstUser = users.length === 0;
        const newUser: User = {
            id: userRecord.uid,
            email,
            name,
            role,
            subRole: role === 'Farmacêutico' ? subRole : undefined,
            accessLevel: isFirstUser ? 'Admin' : 'User',
            avatarColor: avatarColors[Math.floor(Math.random() * avatarColors.length)],
        };

        await writeData<User>('users', [...users, newUser]);
        revalidatePath('/dashboard/user-management');

        return { success: true, message: 'Usuário registrado com sucesso.' };

    } catch (error: any) {
        console.error("Registration error:", error);
        if (error.code === 'auth/email-already-exists') {
            return { success: false, message: 'Este email já está em uso.' };
        }
        if (error.code === 'auth/weak-password') {
            return { success: false, message: 'A senha deve ter pelo menos 6 caracteres.' };
        }
        return { success: false, message: `Ocorreu um erro desconhecido ao criar a conta: ${error.message}` };
    }
}


export default async function RegisterPage() {
  
  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
       <div className="hidden bg-muted lg:block">
        <Image
          src="/placeholder.png"
          alt="Image"
          width="1920"
          height="1080"
          data-ai-hint="medical inventory shelf"
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
             <Link href="/" className="flex justify-center">
              <Logo />
            </Link>
            <h1 className="text-3xl font-bold mt-4">Criar Conta</h1>
            <p className="text-balance text-muted-foreground">
              Preencha o formulário para criar sua conta. A primeira conta criada será a do Administrador.
            </p>
          </div>
          <RegisterForm registerAction={register} />
          <div className="mt-4 text-center text-sm">
            Já tem uma conta?{' '}
            <Link href="/login" className="underline">
              Faça login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
