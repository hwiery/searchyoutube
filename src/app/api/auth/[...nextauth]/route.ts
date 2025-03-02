import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GithubProvider from 'next-auth/providers/github';
import { AuthOptions } from 'next-auth';

// 환경 변수 로깅
console.log('Google Client ID:', process.env.GOOGLE_CLIENT_ID ? '설정됨' : '설정되지 않음');
console.log('Google Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? '설정됨' : '설정되지 않음');
console.log('GitHub ID:', process.env.GITHUB_ID ? '설정됨' : '설정되지 않음');
console.log('GitHub Secret:', process.env.GITHUB_SECRET ? '설정됨' : '설정되지 않음');

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
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

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 