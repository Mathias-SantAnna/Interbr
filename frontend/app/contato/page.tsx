import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contato — Interbrasil Distribuidora",
  description: "Entre em contato com nossa equipe comercial.",
};

export default function ContatoPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10 py-12 px-4">
      <div>
        <h1 className="text-4xl font-semibold tracking-[-0.03em] text-gray-900">Fale conosco</h1>
        <p className="mt-2 text-base text-gray-500">Nossa equipe comercial responde em até 1 dia útil.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Contact info */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-6">
          {[
            { label: "E-mail comercial", value: "comercial@interbrasil.com.br", href: "mailto:comercial@interbrasil.com.br" },
            { label: "WhatsApp", value: "(11) 9 9999-9999", href: "https://wa.me/5511999999999" },
          ].map((c) => (
            <div key={c.label}>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{c.label}</p>
              <a href={c.href} target="_blank" rel="noopener noreferrer"
                className="mt-1 inline-block text-base font-medium text-primary hover:underline">
                {c.value}
              </a>
            </div>
          ))}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Horário</p>
            <p className="mt-1 text-base text-gray-700">Segunda a sexta, das 8h às 18h</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Endereço</p>
            <p className="mt-1 text-base text-gray-700 leading-relaxed">
              SIA Trecho 17 — Brasília, DF<br />CEP: 71200-175
            </p>
          </div>
        </div>

        {/* Contact form */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-900">Envie uma mensagem</h3>
          <div className="space-y-3">
            <input type="text" placeholder="Seu nome"
              className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
            <input type="email" placeholder="Seu e-mail"
              className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
            <textarea rows={4} placeholder="Como podemos ajudar?"
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none" />
            <button className="h-10 w-full rounded-xl bg-primary text-sm font-semibold text-white hover:bg-primary/90 transition">
              Enviar mensagem
            </button>
          </div>
          <p className="text-xs text-center text-gray-400">Respondemos em até 1 dia útil.</p>
        </div>
      </div>
    </div>
  );
}
