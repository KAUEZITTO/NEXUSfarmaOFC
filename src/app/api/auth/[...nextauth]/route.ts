
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from "next-auth/providers/google";
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase/client';
import { readData, writeData } from '@/lib/data';
import { User } from '@/lib/types';

// This function finds a user in our DB. It does NOT create one.
async function getUserFromDb(email: string | null | undefined): Promise<User | null> {
    if (!email) return null;
    const users = await readData<User>('users');
    return users.find(u => u.email === email) || null;
}


export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // This is where the credential login is handled.
        const auth = getAuth(firebaseApp);
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
          if (userCredential.user) {
            // We successfully authenticated with Firebase.
            // Now, get the user's data from our own database.
            const appUser = await getUserFromDb(credentials.email);

            if (appUser) {
              // Return the user object that NextAuth will use to create the session.
              return {
                id: appUser.id,
                email: appUser.email,
                role: appUser.role,
                accessLevel: appUser.accessLevel,
              };
            }
          }
          return null; // User not found in our DB or Firebase auth failed.
        } catch (error) {
          console.error("Firebase credentials sign-in error:", error);
          return null; // Firebase auth failed.
        }
      }
    })
  ],
  callbacks: {
    // The JWT callback is called when a token is created or updated.
    async jwt({ token, user, account }) {
      // On initial sign-in (user object is present)
      if (user) {
        // This is the user object from the `authorize` function or Google profile.
        
        // If it's a Google sign-in, we need to find or create the user in our DB.
        if (account?.provider === 'google' && user.email) {
            let appUser = await getUserFromDb(user.email);
            
            // If the user doesn't exist in our DB, create them now.
            if (!appUser) {
                const users = await readData<User>('users');
                const isFirstUser = users.length === 0;
                const newUser: User = {
                    id: user.id, // Use Google's ID
                    email: user.email,
                    role: 'Coordenador',
                    accessLevel: isFirstUser ? 'Admin' : 'User',
                };
                await writeData('users', [...users, newUser]);
                console.log("New Google user created in DB:", newUser.email);
                appUser = newUser;
            }
            
            // Add our DB info to the token
            if (appUser) {
                token.id = appUser.id;
                token.role = appUser.role;
                token.accessLevel = appUser.accessLevel;
            }
        } else {
           // For credentials, the user object comes from our `authorize` function.
           token.id = user.id;
           token.role = user.role;
           token.accessLevel = user.accessLevel;
        }
      }
      return token;
    },
    // The session callback is called when a session is checked.
    async session({ session, token }) {
      // We pass the data from the token to the session object.
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role;
        session.user.accessLevel = token.accessLevel;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login', // On error, redirect to login page with an error query param.
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
