import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';

/* ── Simple file-based user store (dev-friendly, no DB needed) ── */
const USERS_FILE = path.join(process.cwd(), '.users.json');

interface StoredUser { id: string; name: string; email: string; passwordHash: string; }

function loadUsers(): StoredUser[] {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  } catch { return []; }
}

function saveUsers(users: StoredUser[]) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function hashPassword(password: string) {
  return createHash('sha256').update(password + process.env.NEXTAUTH_SECRET).digest('hex');
}

export function registerUser(name: string, email: string, password: string): StoredUser | null {
  const users = loadUsers();
  if (users.find(u => u.email === email)) return null;
  const user: StoredUser = {
    id: `u_${Date.now()}`,
    name,
    email,
    passwordHash: hashPassword(password),
  };
  saveUsers([...users, user]);
  return user;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email    = credentials?.email    as string;
        const password = credentials?.password as string;
        if (!email || !password) return null;
        const users = loadUsers();
        const user = users.find(u => u.email === email && u.passwordHash === hashPassword(password));
        if (!user) return null;
        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.id = user.id; token.name = user.name; }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name  = token.name as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
};
