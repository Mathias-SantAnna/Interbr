import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 text-center">
      <div className="space-y-2">
        <p className="text-6xl font-bold text-muted-foreground/30">404</p>
        <h2 className="text-2xl font-bold tracking-tight">Página não encontrada</h2>
        <p className="text-sm text-muted-foreground">
          A página que você está procurando não existe ou foi movida.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        Voltar para a loja
      </Link>
    </div>
  );
}
