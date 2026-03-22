"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

const TIERS = [
  { value: "consumidor", label: "Consumidor Final" },
  { value: "revendedor", label: "Revendedor" },
  { value: "distribuidor", label: "Distribuidor" },
];

type FormState = {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  company_email: string;
  company_phone: string;
  tier: string;
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  notes: string;
};

const EMPTY: FormState = {
  cnpj: "", razao_social: "", nome_fantasia: "", company_email: "",
  company_phone: "", tier: "consumidor", cep: "", street: "",
  number: "", neighborhood: "", city: "", state: "", notes: "",
};

export default function NovoClientePage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ company: string; cnpj: string } | null>(null);

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function lookupCEP(cep: string) {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm((f) => ({
          ...f,
          street: data.logradouro || f.street,
          neighborhood: data.bairro || f.neighborhood,
          city: data.localidade || f.city,
          state: data.uf || f.state,
        }));
      }
    } catch {}
  }

  async function lookupCNPJ(raw: string) {
    const clean = raw.replace(/\D/g, "");
    if (clean.length !== 14) return;
    setCnpjLoading(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`);
      if (res.ok) {
        const d = await res.json();
        setForm((f) => ({
          ...f,
          razao_social: d.razao_social || f.razao_social,
          nome_fantasia: d.nome_fantasia || f.nome_fantasia,
          company_email: d.email || f.company_email,
          company_phone: d.ddd_telefone_1 || f.company_phone,
          cep: d.cep?.replace(/\D/g, "").replace(/(\d{5})(\d{3})/, "$1-$2") || f.cep,
          street: d.logradouro || f.street,
          number: d.numero || f.number,
          neighborhood: d.bairro || f.neighborhood,
          city: d.municipio || f.city,
          state: d.uf || f.state,
        }));
      }
    } catch {}
    finally { setCnpjLoading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) { setError("Sessao expirada. Faca login novamente."); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/auth/salesman/request-client/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = typeof data === "object"
          ? Object.values(data).flat().join(" ")
          : "Erro ao enviar solicitacao.";
        setError(msg as string);
      } else {
        setSuccess({ company: data.razao_social, cnpj: data.cnpj });
      }
    } catch {
      setError("Erro de conexao. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const inp = "h-10 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-50";
  const lbl = "text-[13px] font-medium text-gray-700";

  if (success) {
    return (
      <div className="mx-auto max-w-lg pt-16 text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">Solicitacao enviada!</h1>
        <p className="text-gray-500">
          O cadastro de <strong>{success.company}</strong> ({success.cnpj}) foi enviado para aprovacao.
          Um administrador sera notificado e ativara o acesso em breve.
        </p>
        <div className="flex justify-center gap-3 pt-4">
          <button onClick={() => { setSuccess(null); setForm(EMPTY); }}
            className="h-10 rounded-xl bg-primary px-6 text-sm font-semibold text-white hover:bg-primary/90 transition">
            Cadastrar outro cliente
          </button>
          <Link href="/salesman/clientes"
            className="h-10 inline-flex items-center rounded-xl border border-gray-200 px-6 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
            Ver minha carteira
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/salesman" className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-gray-900">Solicitar novo cliente</h1>
          <p className="text-sm text-gray-500">O cliente ficara pendente ate aprovacao de um administrador.</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <span className="mt-0.5 text-lg">📋</span>
        <div className="text-sm text-amber-800">
          <p className="font-semibold">Processo de aprovacao</p>
          <p className="mt-0.5 text-amber-700">Apos o envio, o cliente ficara com status <strong>Pendente</strong> ate que um gestor ou administrador aprove o cadastro. Voce sera automaticamente atribuido como vendedor responsavel.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* CNPJ */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Dados fiscais</h2>
          <div className="space-y-1.5">
            <label className={lbl}>CNPJ *</label>
            <div className="relative">
              <input required value={form.cnpj}
                onChange={(e) => { set("cnpj", e.target.value); lookupCNPJ(e.target.value); }}
                placeholder="00.000.000/0000-00"
                className={inp + " pr-10"}
                style={{ fontFamily: "var(--font-dm-mono), monospace" }} />
              {cnpjLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="h-4 w-4 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                </div>
              )}
            </div>
            <p className="text-[11px] text-gray-400">Digite o CNPJ para preenchimento automatico.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className={lbl}>Razao Social *</label>
              <input required value={form.razao_social} onChange={(e) => set("razao_social", e.target.value)} placeholder="Empresa LTDA" className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className={lbl}>Nome Fantasia</label>
              <input value={form.nome_fantasia} onChange={(e) => set("nome_fantasia", e.target.value)} placeholder="Nome comercial" className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className={lbl}>Segmento *</label>
              <select required value={form.tier} onChange={(e) => set("tier", e.target.value)}
                className={inp + " cursor-pointer"}>
                {TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Contato</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className={lbl}>E-mail da empresa</label>
              <input type="email" value={form.company_email} onChange={(e) => set("company_email", e.target.value)} placeholder="financeiro@empresa.com" className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className={lbl}>Telefone</label>
              <input value={form.company_phone} onChange={(e) => set("company_phone", e.target.value)} placeholder="(61) 9 9999-9999" className={inp} />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Endereco</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className={lbl}>CEP</label>
              <input value={form.cep} onChange={(e) => { set("cep", e.target.value); lookupCEP(e.target.value); }}
                placeholder="00000-000" className={inp} style={{ fontFamily: "var(--font-dm-mono), monospace" }} />
            </div>
            <div className="space-y-1.5">
              <label className={lbl}>Estado (UF)</label>
              <input maxLength={2} value={form.state} onChange={(e) => set("state", e.target.value.toUpperCase())} placeholder="DF" className={inp + " uppercase"} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className={lbl}>Logradouro</label>
              <input value={form.street} onChange={(e) => set("street", e.target.value)} placeholder="Rua, Avenida..." className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className={lbl}>Numero</label>
              <input value={form.number} onChange={(e) => set("number", e.target.value)} placeholder="123" className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className={lbl}>Bairro</label>
              <input value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} placeholder="Centro" className={inp} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className={lbl}>Cidade</label>
              <input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Brasilia" className={inp} />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Observacoes</h2>
          <textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)}
            placeholder="Informacoes adicionais para o administrador..."
            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none" />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="flex justify-end gap-3">
          <Link href="/salesman"
            className="h-11 inline-flex items-center rounded-xl border border-gray-200 px-6 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
            Cancelar
          </Link>
          <button type="submit" disabled={loading}
            className="h-11 rounded-xl bg-primary px-8 text-sm font-semibold text-white hover:bg-primary/90 transition shadow-sm disabled:opacity-60 flex items-center gap-2">
            {loading && (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            )}
            {loading ? "Enviando..." : "Enviar para aprovacao"}
          </button>
        </div>
      </form>
    </div>
  );
}
