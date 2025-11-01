import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const prisma = new PrismaClient();

export const authOptions = {
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        if (credentials?.email === 'demo@example.com' && credentials?.password === 'demo') {
          return { id: '1', name: 'Demo User', email: 'demo@example.com' };
        }
        return null;
      },
    }),
  ],
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
