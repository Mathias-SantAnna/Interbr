import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre Nós — Interbrasil Distribuidora",
  description: "Conheça a história e os valores da Interbrasil Distribuidora.",
};

export default function SobrePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-12 py-12 px-4">
      <div>
        <h1 className="text-4xl font-semibold tracking-[-0.03em] text-gray-900">Sobre a Interbrasil</h1>
        <p className="mt-2 text-base text-gray-500">Distribuindo qualidade e confiança para todo o Brasil.</p>
      </div>

      <div className="space-y-4 text-base leading-relaxed text-gray-600">
        <p>A <strong className="text-gray-900">Interbrasil Distribuidora</strong> atua há mais de 20 anos no segmento de distribuição, conectando fabricantes e empresas de todo o país com agilidade, transparência e excelência no atendimento.</p>
        <p>Nosso catálogo reúne milhares de produtos cuidadosamente selecionados, com foco em qualidade e custo-benefício. Atendemos empresas de diferentes segmentos, oferecendo condições especiais por volume, tabelas de preço personalizadas e suporte comercial dedicado.</p>
        <p>Com uma equipe de vendedores especializados e uma plataforma digital moderna, tornamos o processo de compra mais simples, seguro e eficiente — de onde você estiver.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { value: "20+", label: "Anos de mercado" },
          { value: "5.000+", label: "Produtos no catálogo" },
          { value: "2.000+", label: "Empresas atendidas" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
            <p className="text-3xl font-bold tracking-[-0.03em] text-primary" style={{ fontFamily: "var(--font-dm-mono), monospace" }}>{s.value}</p>
            <p className="mt-1 text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Values */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-[-0.02em] text-gray-900">Nossos valores</h2>
        <div className="space-y-3">
          {[
            { title: "Transparência", desc: "Preços claros, sem surpresas." },
            { title: "Agilidade", desc: "Entregas rápidas e processo de compra descomplicado." },
            { title: "Parceria", desc: "Relacionamento de longo prazo com cada cliente." },
            { title: "Qualidade", desc: "Produtos selecionados com critério e rigor." },
          ].map((v) => (
            <div key={v.title} className="flex items-start gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6.5l2.5 2.5 5.5-5.5" stroke="#1e3a8a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-sm text-gray-700"><strong className="text-gray-900">{v.title}:</strong> {v.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
