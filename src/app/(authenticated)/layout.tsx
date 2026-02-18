import BottomNav from "@/components/ui/BottomNav";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const role = (session.user as any).role as string | undefined;

  return (
    <div className="relative flex flex-col min-h-screen max-w-md md:max-w-2xl lg:max-w-4xl mx-auto bg-[#0d0d0f] border-x border-[#222] overflow-hidden">
      {/* Scanline overlay */}
      <div className="fixed inset-0 scanlines pointer-events-none z-40 opacity-20" />

      {/* Background ambient glow */}
      <div className="fixed inset-0 bg-[#08080a] pointer-events-none z-0" />
      <div className="fixed top-[-10%] left-[-10%] w-[120%] h-[120%] opacity-10 pointer-events-none z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800 via-[#0a0a0c] to-[#0a0a0c]" />

      {/* Page content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {children}
      </div>

      {/* Bottom Navigation */}
      <BottomNav role={role} />
    </div>
  );
}
