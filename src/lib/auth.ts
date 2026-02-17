import { connectDB } from "@/lib/db/connection";
import User from "@/lib/db/models/User";
import { getMongoClient } from "@/lib/db/mongodb-client";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(getMongoClient()),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          await connectDB();
          const existingUser = await User.findOne({ email: user.email });
          if (!existingUser) {
            await User.create({
              name: user.name ?? "",
              email: user.email ?? "",
              image: user.image ?? "",
              xp: 0,
              currentStreak: 0,
              longestStreak: 0,
              totalAttendanceDays: 0,
              totalScheduledDays: 0,
            });
          }
        } catch (error) {
          console.error("Error during sign in callback:", error);
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: user.email });
          if (dbUser) {
            token.userId = dbUser._id.toString();
          }
        } catch (error) {
          console.error("Error in JWT callback:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
});
