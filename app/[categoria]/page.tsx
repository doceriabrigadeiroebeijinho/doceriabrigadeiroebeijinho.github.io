import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Home from "../page";
import CatalogoExplorar from "./CatalogoExplorar";

type Category = "bolos" | "docinhos" | "presentes" | "combos";
const catalogPages:Record<Category,{title:string;description:string}>={
 bolos:{title:"Bolos personalizados",description:"Escolha tamanho, massa, recheio e decoração; consulte os valores e monte seu pedido."},
 docinhos:{title:"Docinhos e bombons",description:"Veja sabores, fotos, preços e quantidades; adicione seus docinhos à encomenda."},
 presentes:{title:"Presentes",description:"Bentôs, cupcakes, caixas especiais e kits; escolha e encomende no próprio catálogo."},
 combos:{title:"Combos e kits",description:"Confira exatamente os itens dos combos e monte seu pedido."}
};
export function generateStaticParams(){return [...Object.keys(catalogPages),"buscar","recheios"].map(categoria=>({categoria}));}
export async function generateMetadata({params}:{params:Promise<{categoria:string}>}):Promise<Metadata>{
 const {categoria}=await params;
 const p=catalogPages[categoria as Category];
 return {title:`${p?.title??"Pesquisa do cardápio"} | Doceria Brigadeiro & Beijinho`,description:p?.description??"Encontre doces, bolos, recheios e presentes."};
}
export default async function PaginaCategoria({params}:{params:Promise<{categoria:string}>}){
 const {categoria}=await params;
 if(categoria==="recheios") redirect("/bolos");
 if(categoria==="buscar") return <CatalogoExplorar categoria="buscar"/>;
 if(!(categoria in catalogPages)) notFound();
 return <Home category={categoria as Category}/>;
}
