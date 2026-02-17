import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function WelcomePage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen text-white font-[family-name:var(--font-display)] overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#805af2]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-[#4D79FF]/10 rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex flex-col h-screen w-full max-w-md mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="flex-1 flex flex-col justify-center items-center perspective-1000 relative">
          {/* 3D Chrome Logo */}
          <div className="relative w-48 h-48 mb-12 animate-float transform-style-3d group cursor-pointer">
            <div className="absolute inset-0 bg-white/20 blur-[60px] rounded-full scale-150 animate-pulse" />
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]" />
              <div className="absolute inset-4 rounded-full border-[6px] border-[#404040] shadow-[0_0_15px_rgba(0,0,0,0.5)] opacity-80" />
              <div className="relative z-10 font-bold text-[140px] leading-none tracking-tighter chrome-text-hero drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] select-none">
                A
              </div>
              <div className="absolute w-[120%] h-[120%] border border-white/5 rounded-full border-dashed animate-[subtle-spin_20s_linear_infinite]" />
            </div>
          </div>

          {/* Typography */}
          <div className="text-center space-y-4 relative z-20">
            <h1 className="font-semibold text-3xl md:text-4xl tracking-tight text-white drop-shadow-lg">
              Keep your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                streak alive.
              </span>
            </h1>
            <p className="font-mono text-xs text-gray-400 tracking-wider uppercase opacity-80">
              System v2.0 • Ready to Initialize
            </p>
          </div>
        </div>

        {/* Auth Actions */}
        <div className="w-full space-y-4 mb-8">
          {/* Sign Up / Sign In with Google */}
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
          >
            <button
              type="submit"
              className="group w-full relative h-16 rounded-full overflow-hidden transition-all duration-100 active:scale-95 shadow-plump cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#FF5E5E] to-[#E64545]" />
              <div className="absolute inset-0 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-4px_8px_rgba(0,0,0,0.2)] rounded-full" />
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[80%] h-[20px] bg-gradient-to-b from-white/30 to-transparent rounded-full blur-[2px]" />
              <div className="relative flex items-center justify-center gap-3">
                <span className="font-bold text-white text-lg tracking-wide uppercase">
                  Initialize
                </span>
                <span className="material-symbols-outlined text-white/90">
                  arrow_forward
                </span>
              </div>
            </button>
          </form>

          {/* Recall Profile (same Google auth) */}
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
          >
            <button
              type="submit"
              className="group w-full relative h-14 rounded-full transition-all duration-100 active:scale-95 cursor-pointer"
            >
              <div className="absolute inset-0 bg-[rgba(255,255,255,0.08)] backdrop-blur-md rounded-full border border-white/10 group-hover:bg-white/10 transition-colors" />
              <div className="relative flex items-center justify-center">
                <span className="font-medium text-white/80 text-sm tracking-widest uppercase">
                  Recall Profile
                </span>
              </div>
            </button>
          </form>

          {/* Footer Meta */}
          <div className="flex justify-center pt-4">
            <p className="text-[10px] text-gray-600 font-mono text-center max-w-[200px] leading-relaxed">
              SECURE CONNECTION • ENCRYPTED
              <br />
              GOOGLE AUTH ENABLED
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
