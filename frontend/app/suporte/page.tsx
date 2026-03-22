"use client";

import { useState } from "react";
import Link from "next/link";

const FAQS = [
  { q: "Como criar uma conta e começar a comprar?", a: "Clique em 'Cadastrar', preencha os dados da sua empresa (CNPJ, razão social, endereço) e crie suas credenciais. Após o cadastro, nossa equipe valida seu perfil em até 1 dia útil." },
  { q: "Quais formas de pagamento são aceitas?", a: "Aceitamos PIX (instantâneo), Boleto Bancário, Cartão de Crédito e Transferência Bancária. O link de pagamento é gerado automaticamente após a confirmação do pedido." },
  { q: "Como funciona a emissão da NF-e?", a: "A NF-e é emitida automaticamente após o pagamento confirmado. Você recebe o DANFE em PDF por e-mail e pode baixar na página do pedido." },
  { q: "Qual é o prazo de entrega?", a: "3 a 7 dias úteis para o Centro-Oeste e 5 a 12 dias para as demais regiões. O prazo exato aparece no checkout com base no seu CEP." },
  { q: "Como acompanhar meu pedido?", a: "Acesse 'Meus Pedidos' no menu. Cada pedido exibe o status atual e o código de rastreio quando disponível." },
  { q: "Posso cancelar ou alterar um pedido?", a: "Pedidos em 'Aguardando pagamento' podem ser cancelados na página do pedido. Para alterações, entre em contato antes do faturamento." },
  { q: "Como funciona a tabela de preços por segmento?", a: "Trabalhamos com três perfis: Consumidor Final, Revendedor e Distribuidor, cada um com preços diferenciados. Seu perfil é definido na aprovação do cadastro." },
  { q: "Como solicitar um desconto especial?", a: "Clientes com volume elevado podem negociar com o vendedor responsável. No portal, o vendedor pode aplicar descontos dentro do limite autorizado para seu perfil." },
  { q: "Tem frete grátis?", a: "Sim! Pedidos acima de R$ 500 têm frete grátis para todo o Brasil. Abaixo desse valor, o custo é calculado no checkout com base no seu endereço." },
  { q: "Produto chegou com defeito. O que fazer?", a: "Entre em contato pelo WhatsApp ou e-mail em até 7 dias após o recebimento, com fotos e número do pedido. Nossa equipe coordena a troca/devolução sem custo." },
];

function FAQItem({ faq, idx }: { faq: typeof FAQS[0]; idx: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-xl border transition-all duration-150 ${open ? "border-primary/30 bg-primary/5 shadow-sm" : "border-gray-100 bg-white hover:border-gray-200"}`}>
      <button className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left" onClick={() => setOpen(!open)}>
        <span className="flex items-start gap-3">
          <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{idx + 1}</span>
          <span className="text-sm font-semibold text-gray-900">{faq.q}</span>
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={`flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-primary" : "text-gray-400"}`}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && <div className="px-5 pb-4 pl-14"><p className="text-sm leading-relaxed text-gray-600">{faq.a}</p></div>}
    </div>
  );
}

export default function SuportePage() {
  const [form, setForm] = useState({ name: "", email: "", order: "", message: "" });
  const [sent, setSent] = useState(false);
  const inp = "h-10 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10";

  return (
    <div className="mx-auto max-w-4xl space-y-12 py-10 px-4">
      <div className="text-center space-y-2">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />Central de Ajuda
        </p>
        <h1 className="text-4xl font-semibold tracking-[-0.03em] text-gray-900">Como podemos ajudar?</h1>
        <p className="text-base text-gray-500">Encontre respostas rápidas ou fale diretamente com nossa equipe.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: "💬", title: "WhatsApp", desc: "(61) 9 9999-9999", href: "https://wa.me/5561999999999", cta: "Abrir chat" },
          { icon: "✉️", title: "E-mail", desc: "suporte@interbrasil.com.br", href: "mailto:suporte@interbrasil.com.br", cta: "Enviar e-mail" },
          { icon: "📦", title: "Meus pedidos", desc: "Rastreie e acompanhe", href: "/pedidos", cta: "Ver pedidos" },
        ].map((c) => (
          <Link key={c.title} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm text-center hover:border-primary/30 hover:bg-primary/5 transition">
            <span className="text-3xl">{c.icon}</span>
            <p className="font-semibold text-gray-900">{c.title}</p>
            <p className="text-xs text-gray-500">{c.desc}</p>
            <span className="mt-1 inline-flex items-center rounded-xl bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{c.cta}</span>
          </Link>
        ))}
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.02em] text-gray-900">Perguntas frequentes</h2>
          <p className="text-sm text-gray-500 mt-1">As 10 duvidas mais comuns dos nossos clientes.</p>
        </div>
        <div className="space-y-2">{FAQS.map((faq, i) => <FAQItem key={i} faq={faq} idx={i} />)}</div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-gray-900">Nao encontrou o que precisava?</h2>
          <p className="mt-1 text-sm text-gray-500">Preencha o formulario e nossa equipe responde em ate 1 dia util.</p>
        </div>
        {sent ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <p className="font-semibold text-green-800">Mensagem enviada com sucesso!</p>
            <p className="text-sm text-green-700">Retornaremos para {form.email} em breve.</p>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-gray-700">Seu nome *</label>
              <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nome completo" className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-gray-700">E-mail *</label>
              <input required type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="seu@email.com" className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-gray-700">Numero do pedido (opcional)</label>
              <input value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))} placeholder="Ex: 2026030001" className={inp} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[13px] font-medium text-gray-700">Mensagem *</label>
              <textarea required rows={4} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} placeholder="Descreva sua duvida ou problema..."
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none" />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="h-11 rounded-xl bg-primary px-8 text-sm font-semibold text-white hover:bg-primary/90 transition shadow-sm">Enviar mensagem</button>
            </div>
          </form>
        )}
      </section>
      <p className="text-center text-xs text-gray-400">Horario de atendimento: Segunda a sexta, das 8h as 18h (Horario de Brasilia)</p>
    </div>
  );
}