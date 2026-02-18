import { connectDB } from "@/lib/db/connection";
import User from "@/lib/db/models/User";
import { getMongoClient } from "@/lib/db/mongodb-client";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

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
          const adminEmails = getAdminEmails();
          const isAdmin = adminEmails.includes(
            (user.email || "").toLowerCase()
          );

          const existingUser = await User.findOne({ email: user.email });
          if (!existingUser) {
            await User.create({
              name: user.name ?? "",
              email: user.email ?? "",
              image: user.image ?? "",
              role: isAdmin ? "admin" : "user",
              xp: 0,
              currentStreak: 0,
              longestStreak: 0,
              totalAttendanceDays: 0,
              totalScheduledDays: 0,
            });
          } else if (isAdmin && existingUser.role !== "admin") {
            // Promote to admin if email is in admin list
            existingUser.role = "admin";
            await existingUser.save();
          }
        } catch (error) {
          console.error("Error during sign in callback:", error);
        }
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user || trigger === "signIn") {
        try {
          await connectDB();
          const email = user?.email || token.email;
          const dbUser = await User.findOne({ email });
          if (dbUser) {
            token.userId = dbUser._id.toString();
            token.role = dbUser.role || "user";
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
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },
});

// Helper for admin-only API routes
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized", status: 401, session: null };
  }
  if ((session.user as any).role !== "admin") {
    return { error: "Forbidden: Admin access required", status: 403, session: null };
  }
  return { error: null, status: 200, session };
}
