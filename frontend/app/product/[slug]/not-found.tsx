import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div className="rounded-xl border border-dashed p-10 text-center">
      <h1 className="text-2xl font-semibold">Produto nao encontrado</h1>
      <p className="mt-2 text-muted-foreground">
        O item pode ter sido removido ou ainda nao sincronizado no catalogo.
      </p>
      <Link
        href="/catalog"
        className="mt-5 inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        Voltar para o catalogo
      </Link>
    </div>
  );
}
