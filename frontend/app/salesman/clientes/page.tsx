"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getMyClients, type ClientCompany, TIER_COLOR, TIER_LABEL } from "@/lib/salesman-api";
import { useDraftStore } from "@/lib/draft-store";
import { useRouter } from "next/navigation";

export default function ClientesPage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const setClient = useDraftStore((s) => s.setClient);
  const [clients, setClients] = useState<ClientCompany[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    getMyClients(accessToken)
      .then(setClients)
      .finally(() => setLoading(false));
  }, [accessToken]);

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.razao_social.toLowerCase().includes(q) ||
      c.nome_fantasia.toLowerCase().includes(q) ||
      c.cnpj.includes(q) ||
      c.city.toLowerCase().includes(q)
    );
  });

  function startOrder(client: ClientCompany) {
    setClient(client);
    router.push("/salesman/novo-pedido");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-gray-900">Minha Carteira</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {clients.length} {clients.length === 1 ? "cliente" : "clientes"} atribuídos
          </p>
        </div>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nome, CNPJ ou cidade..."
        className="h-10 w-full max-w-sm rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
      />

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-muted-foreground">
            {search ? "Nenhum cliente encontrado para esta busca." : "Nenhum cliente atribuído."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:border-primary/30 hover:bg-primary/5 transition"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white font-bold text-sm">
                  {c.display_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{c.display_name}</p>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${TIER_COLOR[c.tier]}`}>
                      {TIER_LABEL[c.tier]}
                    </span>
                    {!c.is_active && (
                      <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium bg-red-100 text-red-700">
                        Inativo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    CNPJ: {c.cnpj} · {c.city} / {c.state}
                    {c.email ? ` · ${c.email}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/salesman/clientes/${c.id}`}
                  className="inline-flex h-8 items-center rounded-lg border bg-background px-3 text-xs font-medium hover:bg-muted"
                >
                  Ver detalhes
                </Link>
                {c.is_active && (
                  <button
                    onClick={() => startOrder(c)}
                    className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90"
                  >
                    Novo pedido
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
