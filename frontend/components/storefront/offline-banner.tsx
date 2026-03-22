"use client";

import { useEffect, useState } from "react";
import { useDraftStore } from "@/lib/draft-store";
import { useRouter } from "next/navigation";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  // Single-draft store — check if a saved draft with items exists
  const items = useDraftStore((s) => s.items);
  const savedAt = useDraftStore((s) => s.savedAt);
  const hasDraft = items.length > 0 && savedAt !== null;
  const router = useRouter();

  useEffect(() => {
    const id = setTimeout(() => setIsOffline(!navigator.onLine), 0);
    function goOffline() { setIsOffline(true); }
    function goOnline()  { setIsOffline(false); }
    window.addEventListener("offline", goOffline);
    window.addEventListener("online",  goOnline);
    return () => {
      clearTimeout(id);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online",  goOnline);
    };
  }, []);

  if (!isOffline && !hasDraft) return null;

  return (
    <>
      {isOffline && (
        <div className="sticky top-0 z-40 flex items-center gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-white">
          <span className="inline-block h-2 w-2 rounded-full bg-white/80" />
          Você está offline. Pedidos serão salvos como rascunho.
        </div>
      )}
      {!isOffline && hasDraft && (
        <div className="sticky top-0 z-40 flex items-center justify-between gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-white">
          <span>
            <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-amber-600 text-xs font-bold">
              {items.length}
            </span>
            {items.length === 1 ? "item pendente" : "itens pendentes"} no rascunho — você está online novamente.
          </span>
          <button
            onClick={() => router.push("/salesman/novo-pedido")}
            className="rounded bg-white/20 px-3 py-1 text-xs hover:bg-white/30"
          >
            Retomar pedido
          </button>
        </div>
      )}
    </>
  );
}
