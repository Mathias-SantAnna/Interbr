import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catalogos — InterBR",
  description: "Baixe os catalogos de pecas de reposicao da Interbrasil: motosserras, 4 tempos, nautica, energia solar, Karcher e diversidades.",
};

const CATALOGS = [
  {
    tag: "Destaque",
    title: "Catalogo 2 Tempos",
    subtitle: "Pecas para Motosserras e Rocadeiras",
    description: "A linha mais completa de pecas para motosserras e rocadeiras do mercado. Correntes, sabres, carburadores, virabrequins e muito mais para as principais marcas.",
    icon: "🪚",
    color: "from-green-50 to-emerald-50",
    border: "border-green-200",
    badge: "bg-green-100 text-green-700",
    href: "https://www.interbrasil.com.br/catalogos/",
    tags: ["Stihl", "Husqvarna", "Makita", "Oregon", "Carlton"],
  },
  {
    tag: "Destaque",
    title: "Catalogo 4 Tempos",
    subtitle: "Pecas para Forca e Energia",
    description: "Linha completa de pecas para motores 4 tempos Briggs & Stratton, Honda, Kawasaki e Kohler. Geradores, motobombas, sopradores e compressores.",
    icon: "⚙️",
    color: "from-blue-50 to-sky-50",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-700",
    href: "https://www.interbrasil.com.br/catalogos/",
    tags: ["Briggs & Stratton", "Honda", "Kawasaki", "Kohler"],
  },
  {
    tag: "Destaque",
    title: "Catalogo Nautica",
    subtitle: "Pecas para Motores de Popa",
    description: "Reposicoes para motores de popa das principais marcas do mercado nautico brasileiro. Pecas originais e similares de alta qualidade.",
    icon: "⚓",
    color: "from-sky-50 to-cyan-50",
    border: "border-sky-200",
    badge: "bg-sky-100 text-sky-700",
    href: "https://www.interbrasil.com.br/catalogos/",
    tags: ["Mercury", "Yamaha", "Suzuki", "Evinrude"],
  },
  {
    tag: "Linha Diversa",
    title: "Catalogo de Diversidades",
    subtitle: "EPIs, Ferramentas, Campo e Jardim",
    description: "Linha completa de EPIs, ferramentas manuais, equipamentos para campo e jardim, produtos para corte e aficao, entre outros itens de uso geral.",
    icon: "🛡️",
    color: "from-orange-50 to-amber-50",
    border: "border-orange-200",
    badge: "bg-orange-100 text-orange-700",
    href: "https://www.interbrasil.com.br/catalogos/",
    tags: ["EPI", "Ferramentas", "Jardim", "Corte"],
  },
  {
    tag: "Limpeza",
    title: "Catalogo Karcher",
    subtitle: "Lavadoras de Alta Pressao",
    description: "Produtos e pecas de reposicao originais para lavadoras de alta pressao Karcher. Bicos, mangueiras, pistolas, bombas e acessorios.",
    icon: "💧",
    color: "from-yellow-50 to-amber-50",
    border: "border-yellow-200",
    badge: "bg-yellow-100 text-yellow-700",
    href: "https://www.interbrasil.com.br/catalogos/",
    tags: ["Karcher", "HD", "HDS", "K Series"],
  },
  {
    tag: "Solar",
    title: "Catalogo Energia Solar",
    subtitle: "Geracao de Energia Solar Fotovoltaica",
    description: "Linha completa de produtos e pecas para sistemas de geracao de energia solar. Inversores, paineis, controladores de carga, cabos e acessorios.",
    icon: "☀️",
    color: "from-amber-50 to-yellow-50",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-700",
    href: "https://www.interbrasil.com.br/catalogos/",
    tags: ["Inversores", "Paineis", "Controladores", "Off-grid"],
  },
];

export default function CatalogosPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-12 py-10 px-4">

      {/* Header */}
      <div className="space-y-3">
        <nav className="flex items-center gap-2 text-sm text-gray-400">
          <Link href="/" className="hover:text-primary transition">Inicio</Link>
          <span>/</span>
          <span className="text-gray-600">Servicos</span>
          <span>/</span>
          <span className="text-gray-600">Catalogos</span>
        </nav>
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Servicos
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.03em] text-gray-900">Catalogos de Reposicao</h1>
          <p className="mt-2 text-base text-gray-500 max-w-xl">
            Baixe nossos catalogos e tenha em maos a mais ampla linha de pecas para reposicoes.
            Lider de mercado nos segmentos florestal, nautica, energia solar, forca e energia.
          </p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { n: "6", label: "Catalogos disponíveis" },
          { n: "10.000+", label: "Referencias em estoque" },
          { n: "30+", label: "Anos de mercado" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm">
            <p className="text-2xl font-bold text-primary tracking-[-0.03em]" style={{ fontFamily: "var(--font-dm-mono, monospace)" }}>{s.n}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Catalog grid */}
      <div className="grid gap-5 md:grid-cols-2">
        {CATALOGS.map((cat) => (
          <div key={cat.title}
            className={`group relative flex flex-col rounded-2xl border bg-gradient-to-br p-6 shadow-sm hover:shadow-md transition-all duration-150 ${cat.color} ${cat.border}`}>
            {/* Badge */}
            <span className={`absolute right-4 top-4 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cat.badge}`}>
              {cat.tag}
            </span>

            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm text-2xl flex-shrink-0">
                {cat.icon}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 leading-tight">{cat.title}</h2>
                <p className="text-sm text-gray-500 mt-0.5">{cat.subtitle}</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed flex-1 mb-4">{cat.description}</p>

            <div className="flex flex-wrap gap-1.5 mb-5">
              {cat.tags.map((t) => (
                <span key={t} className="rounded-full bg-white/80 border border-white px-2.5 py-0.5 text-[11px] font-medium text-gray-600">
                  {t}
                </span>
              ))}
            </div>

            <a href={cat.href} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 self-start rounded-xl bg-primary px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-primary/90 transition shadow-sm group-hover:shadow-md">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 10v6m0 0l-3-3m3 3l3-3M3 15v4a2 2 0 002 2h14a2 2 0 002-2v-4M9 7l3-3 3 3M12 4v6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Baixar Catalogo
            </a>
          </div>
        ))}
      </div>

      {/* Briggs manual CTA */}
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 flex-shrink-0 text-3xl">
          📖
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">Manual Briggs & Stratton</h3>
          <p className="text-sm text-gray-500 mt-1">
            Encontre o manual do operador ou a lista ilustrada de pecas para o seu motor ou produto Briggs & Stratton.
            Pesquise pelo numero do modelo impresso na etiqueta do produto.
          </p>
        </div>
        <a href="https://www.briggsandstratton.com/en-us/support/manuals"
          target="_blank" rel="noopener noreferrer"
          className="flex-shrink-0 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition shadow-sm whitespace-nowrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Acessar Manuais
        </a>
      </div>

      {/* Contact strip */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-900">Nao encontrou o que precisa?</p>
          <p className="text-sm text-gray-500 mt-0.5">Nossa equipe tecnica pode te ajudar a encontrar a peca certa.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <a href="tel:08007034156"
            className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-white px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 transition">
            📞 0800-703-4156
          </a>
          <Link href="/suporte"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition">
            Falar com suporte
          </Link>
        </div>
      </div>
    </div>
  );
}
