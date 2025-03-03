import GoogleProvider from 'next-auth/providers/google';
import { AuthOptions } from 'next-auth';
import { DefaultSession } from 'next-auth';

// 세션 타입 확장
declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
    } & DefaultSession['user']
  }
}

// 환경 변수 로깅
console.log('Google Client ID:', process.env.GOOGLE_CLIENT_ID ? '설정됨' : '설정되지 않음');
console.log('Google Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? '설정됨' : '설정되지 않음');

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  debug: process.env.NODE_ENV === 'development',
}; 