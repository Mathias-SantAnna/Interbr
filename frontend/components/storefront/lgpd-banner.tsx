"use client";

import { useState, useEffect } from "react";

const COOKIE_KEY = "interbr-lgpd-consent";

export function LgpdBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    // use a timeout so the state update is deferred (avoids synchronous setState in effect)
    const id = setTimeout(() => setVisible(!consent), 0);
    return () => clearTimeout(id);
  }, []);

  function accept() {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(COOKIE_KEY, "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Usamos cookies para melhorar sua experiência e analisar o tráfego do site, conforme a{" "}
          <strong className="font-medium text-foreground">LGPD</strong>. Ao continuar, você
          concorda com nossa{" "}
          <a href="/privacidade" className="underline hover:text-foreground">
            Política de Privacidade
          </a>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={decline}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
          >
            Recusar
          </button>
          <button
            onClick={accept}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
