"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { flattenApiErrors } from "@/lib/auth-api";

const STATES = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const inp = "h-10 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10";
const lbl = "text-[13px] font-medium text-gray-700";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cnpjLoading, setCnpjLoading] = useState(false);

  const [form, setForm] = useState({
    cnpj: "", razao_social: "", nome_fantasia: "", company_email: "", company_phone: "",
    cep: "", city: "", state: "", full_name: "", email: "", password: "", password_confirm: "",
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function fetchCnpj(cnpj: string) {
    const digits = cnpj.replace(/\D/g, "");
    if (digits.length !== 14) return;
    setCnpjLoading(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
      if (!res.ok) return;
      const data = await res.json();
      setForm((prev) => ({
        ...prev,
        razao_social: data.razao_social || prev.razao_social,
        nome_fantasia: data.nome_fantasia || prev.nome_fantasia,
        company_email: data.email || prev.company_email,
        company_phone: data.ddd_telefone_1 ? data.ddd_telefone_1.replace(/\D/g, "") : prev.company_phone,
        cep: data.cep ? data.cep.replace(/\D/g, "") : prev.cep,
        city: data.municipio || prev.city,
        state: data.uf || prev.state,
      }));
    } catch { /* ignore */ } finally { setCnpjLoading(false); }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.password_confirm) { setError("As senhas não coincidem."); return; }
    setLoading(true);
    try {
      await register(form);
      router.push("/");
    } catch (err: unknown) {
      const apiErr = err as { data?: Record<string, unknown> };
      setError(apiErr?.data ? flattenApiErrors(apiErr.data) : "Erro ao criar conta. Verifique os dados.");
    } finally { setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-12 px-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-gray-900">Criar conta</h1>
        <p className="text-sm text-gray-500">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">Entrar</Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Company */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M3 21h18M3 7v1m0 4v1m0 4v1M21 7v1m0 4v1m0 4v1M6 3h12v18H6V3z" stroke="#1e3a8a" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <h2 className="text-sm font-semibold text-gray-900">Dados da empresa</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className={lbl}>CNPJ *</label>
                {cnpjLoading && <span className="text-xs text-gray-400">Buscando...</span>}
              </div>
              <input className={inp} placeholder="00.000.000/0001-00" required value={form.cnpj}
                onChange={(e) => set("cnpj", e.target.value)} onBlur={(e) => fetchCnpj(e.target.value)} />
              <p className="text-xs text-gray-400">Cole o CNPJ e pressione Tab — preenchemos automaticamente.</p>
            </div>
            <div className="space-y-1.5">
              <label className={lbl}>Razão Social *</label>
              <input className={inp} required value={form.razao_social} onChange={(e) => set("razao_social", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className={lbl}>Nome Fantasia</label>
              <input className={inp} value={form.nome_fantasia} onChange={(e) => set("nome_fantasia", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className={lbl}>E-mail da empresa *</label>
              <input className={inp} type="email" required value={form.company_email} onChange={(e) => set("company_email", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className={lbl}>Telefone</label>
              <input className={inp} type="tel" value={form.company_phone} onChange={(e) => set("company_phone", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className={lbl}>CEP</label>
              <input className={inp} placeholder="00000-000" value={form.cep} onChange={(e) => set("cep", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className={lbl}>Cidade</label>
              <input className={inp} value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className={lbl}>Estado</label>
              <select className={inp} value={form.state} onChange={(e) => set("state", e.target.value)}>
                <option value="">Selecionar...</option>
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* User */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="#1e3a8a" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <h2 className="text-sm font-semibold text-gray-900">Seus dados de acesso</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className={lbl}>Nome completo *</label>
              <input className={inp} required value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className={lbl}>E-mail de acesso *</label>
              <input className={inp} type="email" required autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className={lbl}>Senha *</label>
              <input className={inp} type="password" required autoComplete="new-password" minLength={8} value={form.password} onChange={(e) => set("password", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className={lbl}>Confirmar senha *</label>
              <input className={inp} type="password" required autoComplete="new-password" value={form.password_confirm} onChange={(e) => set("password_confirm", e.target.value)} />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-white hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
          {loading ? "Criando conta..." : "Criar conta"}
        </button>
        <p className="text-center text-xs text-gray-400">
          Ao criar conta você concorda com os termos de uso da Interbrasil Distribuidora.
        </p>
      </form>
    </div>
  );
}
