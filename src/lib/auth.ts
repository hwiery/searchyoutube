import GoogleProvider from 'next-auth/providers/google';
import { AuthOptions } from 'next-auth';
import { DefaultSession } from 'next-auth';

// 세션 타입 확장
declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
      isPremium?: boolean;
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
        // 개발 환경에서는 모든 사용자에게 프리미엄 권한 부여
        session.user.isPremium = process.env.NODE_ENV === 'development' ? true : (token.isPremium as boolean);
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      // 개발 환경에서는 모든 사용자에게 프리미엄 권한 부여
      token.isPremium = process.env.NODE_ENV === 'development' ? true : (token.isPremium || false);
      return token;
    },
  },
  debug: process.env.NODE_ENV === 'development',
}; 