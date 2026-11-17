import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CatalogoExplorar from "./CatalogoExplorar";

const pages: Record<string, { title: string; description: string }> = {
  bolos: { title: "Bolos personalizados", description: "Tamanhos, fatias, categorias e preços dos bolos personalizados." },
  recheios: { title: "Recheios dos bolos", description: "Lista completa dos recheios clássicos, especiais e gourmet." },
  docinhos: { title: "Docinhos e bombons", description: "Sabores, categorias, preços e quantidades dos doces e bombons." },
  presentes: { title: "Presentes e kits", description: "Bentôs, cupcakes e caixas presenteáveis." },
  combos: { title: "Combos e kits", description: "Confira exatamente o que acompanha cada combo e caixa especial." },
  buscar: { title: "Pesquisar no cardápio", description: "Encontre produtos, sabores, recheios e tamanhos de bolo." },
};
export function generateStaticParams() { return Object.keys(pages).map(categoria => ({ categoria })); }
export async function generateMetadata({ params }: { params: Promise<{ categoria: string }> }): Promise<Metadata> {
  const { categoria } = await params;
  const page = pages[categoria];
  return { title: `${page?.title ?? "Catálogo"} | Doceria Brigadeiro & Beijinho`, description: page?.description };
}
export default async function PaginaCategoria({ params }: { params: Promise<{ categoria: string }> }) {
  const { categoria } = await params;
  if (!pages[categoria]) notFound();
  return <CatalogoExplorar categoria={categoria} />;
}
