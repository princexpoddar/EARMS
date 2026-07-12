"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard");
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#09090b]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-100 border-t-transparent" />
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 animate-pulse">
          Redirecting to AssetFlow...
        </span>
      </div>
    </div>
  );
}
