
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from "next-auth/providers/google";
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase/client';
import { readData, writeData } from '@/lib/data';
import { User } from '@/lib/types';

// Helper function to find or create a user in the local database
async function findOrCreateUser(
  userId: string,
  userEmail: string | null | undefined,
  provider: 'credentials' | 'google'
): Promise<User | null> {
    if (!userEmail) return null;

    const users = await readData<User>('users');
    let appUser = users.find(u => u.email === userEmail);

    // If it's a Google sign-in and the user doesn't exist, create them.
    if (provider === 'google' && !appUser) {
        const isFirstUser = users.length === 0;
        const newUser: User = {
            id: userId,
            email: userEmail,
            password: '', // Not applicable for OAuth
            role: 'Coordenador', // Default role for new Google users
            accessLevel: isFirstUser ? 'Admin' : 'User',
        };
        await writeData('users', [...users, newUser]);
        console.log("New Google user created in DB:", newUser.email);
        appUser = newUser;
    }

    if (!appUser) {
        console.log(`User ${userEmail} authenticated via ${provider} but not found in app DB.`);
        return null;
    }
    
    // Ensure the ID in our DB matches the Firebase UID, especially for existing users logging in with Google for the first time.
    if (appUser.id !== userId) {
        console.log(`Updating user ID for ${userEmail} to match Firebase UID.`);
        appUser.id = userId;
        const userIndex = users.findIndex(u => u.email === userEmail);
        if(userIndex > -1) {
            users[userIndex] = appUser;
            await writeData('users', users);
        }
    }

    return appUser;
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
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials');
          return null;
        }

        try {
          const auth = getAuth(firebaseApp);
          const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
          const firebaseUser = userCredential.user;

          if (!firebaseUser) return null;

          // Find the user in our database to get roles/permissions
          const appUser = await findOrCreateUser(firebaseUser.uid, firebaseUser.email, 'credentials');
          
          if (!appUser) return null;
          
          console.log('User authenticated via credentials successfully:', appUser.email);
          
          // Return the full user object for the JWT callback
          return {
            id: appUser.id,
            email: appUser.email,
            name: appUser.role, // Using role as name for display
            role: appUser.role,
            accessLevel: appUser.accessLevel,
          };

        } catch (error) {
          console.error("Firebase credentials sign-in error:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    // This callback is triggered when a user signs in (either via credentials or Google).
    // We use it to ensure the user exists in our DB and to get their roles.
    async signIn({ user, account }) {
      if (!user.email) return false;

      // For Google provider, we find or create the user here.
      if (account?.provider === 'google') {
          const appUser = await findOrCreateUser(user.id, user.email, 'google');
          // If appUser is null, it means something went wrong during creation. Deny sign-in.
          return !!appUser;
      }
      
      // For credentials, the 'authorize' function already handled user verification.
      return true;
    },
    // This is called after signIn. We add our custom data to the JWT token.
    async jwt({ token, user }) {
       // On the initial sign-in, the `user` object is available from the `authorize` or OAuth profile.
       if (user && user.email) {
          // The 'user' object might come directly from authorize (credentials) or from the OAuth provider.
          // If role is already on it (from authorize), use it. Otherwise, fetch from DB.
           if (user.role && user.accessLevel) {
              token.role = user.role;
              token.accessLevel = user.accessLevel;
              token.id = user.id;
           } else {
              // This path is for providers like Google where we need to fetch details from our DB.
              const users = await readData<User>('users');
              const appUser = users.find(u => u.email === user.email);
              if (appUser) {
                  token.id = appUser.id;
                  token.role = appUser.role;
                  token.accessLevel = appUser.accessLevel;
              }
           }
       }
       return token;
    },
    // This is called to create the session object that's exposed to the client.
    async session({ session, token }) {
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
    error: '/login', // Redirects to /login on error, with a query string like ?error=
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
