import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Home from "../../page";
import { cakeSizeCatalog } from "../../catalogo/dados";

export function generateStaticParams() { return cakeSizeCatalog.map(bolo => ({ produto: bolo.id })); }

export async function generateMetadata({params}:{params:Promise<{produto:string}>}):Promise<Metadata>{
 const {produto}=await params;
 const bolo=cakeSizeCatalog.find(item=>item.id===produto);
 return {
   title:`${bolo?.name??"Bolo"} | Doceria Brigadeiro & Beijinho`,
   description:bolo?`${bolo.subtitle}. Escolha massa, recheio e decoração para encomendar ${bolo.name.toLowerCase()}.`:"Encontre bolos para sua comemoração."
 };
}
export default async function PaginaDeBolo({params}:{params:Promise<{produto:string}>}){
 const {produto}=await params;
 if(!cakeSizeCatalog.some(item=>item.id===produto)) notFound();
 return <Home category="bolos" selectedProduct={produto}/>;
}
