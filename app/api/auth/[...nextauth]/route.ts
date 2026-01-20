import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Demo users for testing
const demoUsers = [
  { id: "1", email: "parent@family.com", password: "parent123", name: "Family Parent", role: "parent" },
  { id: "2", email: "child@family.com", password: "child123", name: "Family Child", role: "child" }
];

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("NextAuth: Login attempt for", credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.log("NextAuth: Missing credentials");
          return null;
        }

        const user = demoUsers.find(u => 
          u.email === credentials.email && 
          u.password === credentials.password
        );

        if (user) {
          console.log("NextAuth: User authorized:", user.email, "Role:", user.role);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          };
        }
        
        console.log("NextAuth: Invalid credentials");
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        console.log("NextAuth: JWT updated, role:", user.role);
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        console.log("NextAuth: Session updated, role:", token.role);
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log("NextAuth: Redirecting to", baseUrl);
      return baseUrl; // Go to homepage
    }
  },
  pages: {
    signIn: "/login",
    signOut: "/logout",
    error: "/login"
  },
  debug: true,
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "local-dev-secret-12345"
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };