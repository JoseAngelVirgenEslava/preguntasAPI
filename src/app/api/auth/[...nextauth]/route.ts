import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "@/app/lib/mongodb";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
        const client = await clientPromise;
        const users = client.db().collection("users");
        const user = await users.findOne({ email: credentials!.email });
      
        if (user && user.password) {
          const valid = await bcrypt.compare(credentials!.password, user.password);
          if (valid) {
            return {
              id: user._id.toString(), // <- Esto es lo que NextAuth necesita
              email: user.email,
              name: user.name,
            };
          }
        }
      
        return null;
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const client = await clientPromise;
        const users = client.db().collection("users");

        const existing = await users.findOne({ email: user.email });
        if (!existing) {
          await users.insertOne({
            email: user.email,
            name: user.name,
            password: null,
            age: null,
            provider: "google",
            createdAt: new Date(),
          });
        }
      }
      return true;
    },
    async session({ session, token }) {
      return session;
    },
    async jwt({ token, user }) {
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
