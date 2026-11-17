"use client";
import { useEffect, useMemo, useState } from "react";
import { cakeSizeCatalog, classicFillings, specialFillings, gourmetFillings, sweetGroups, gifts } from "../catalogo/dados";
import "./catalogo.css";

type Result={type:string;name:string;detail:string;url:string;image?:string};
const money=(n:number)=>n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const normalize=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const isolatedPhotos:Record<string,string>={
 brigadeiro:"/assets/docinho-brigadeiro.webp",
 coco:"/assets/docinho-coco.webp",
 ninho:"/assets/docinho-ninho.webp",
 casadinho:"/assets/docinho-casadinho.webp",
 cajuzinho:"/assets/docinho-cajuzinho.webp",
 "olho-sogra":"/assets/docinho-olho-sogra.webp"
};
const entries:Result[]=[
 ...cakeSizeCatalog.map(c=>({type:"Bolos e tamanhos",name:c.name,detail:`${c.subtitle} · A partir de ${money(c.prices.Classico)}`,url:`/bolos/${c.id}`,image:"/assets/cake-classic.webp"})),
 ...([["Clássico",classicFillings],["Especial",specialFillings],["Gourmet",gourmetFillings]] as const).flatMap(([group,names])=>names.map(name=>({type:`Recheio ${group}`,name,detail:"Escolha o recheio e personalize seu bolo",url:`/bolos?recheio=${encodeURIComponent(name)}#cardapio`,image:"/assets/cake-floral.webp"}))),
 ...sweetGroups.flatMap(g=>g.items.map(s=>({type:g.name,name:s.name,detail:`${money(g.hundredPrice)} / 100 unidades · Mínimo 25 por sabor`,url:`/docinhos?produto=${s.id}#produto-${s.id}`,image:isolatedPhotos[s.id]??(g.type==="bonbon"?"/assets/gift-bombons.webp":"/assets/sweets-chocolate.webp")}))),
 ...gifts.map(g=>({type:"Presentes e kits",name:g.name,detail:`${money(g.price)} · ${g.description}`,url:`${g.id==="bento-combo"||g.id.startsWith("caixa")?"/combos":"/presentes"}?produto=${g.id}#produto-${g.id}`,image:g.image.startsWith("/")?g.image:undefined}))
];
export default function CatalogoExplorar({categoria}:{categoria:string}){
 const [query,setQuery]=useState("");
 useEffect(()=>{const q=new URLSearchParams(window.location.search).get("q");if(q)setQuery(q)},[]);
 const results=useMemo(()=>{const q=normalize(query.trim());return q?entries.filter(e=>normalize(e.name+" "+e.type+" "+e.detail).includes(q)).slice(0,80):[]},[query]);
 return <main className="new-catalog">
   <header className="new-header"><a href="/" className="new-brand"><img src="/assets/logo-complete.webp" alt="Doceria Brigadeiro e Beijinho"/></a>
    <nav aria-label="Navegação"><a href="/#como-pedir">Como pedir</a><a href="/#cardapio">Cardápio</a><a href="/bolos">Bolos</a><a href="/docinhos">Doces e Bombons</a><a href="/presentes">Presentes</a><a href="/decoracoes">Decorações</a></nav>
    <a className="new-home" href="/">Meu pedido ↗</a>
   </header>
   <div className="new-wrap">
     <div className="new-search-band" role="search">
       <label htmlFor="catalog-search">O que você está procurando?</label>
       <div className="new-search-field"><span aria-hidden="true">⌕</span>
       <input autoFocus id="catalog-search" type="search" placeholder="Digite um doce, sabor ou tamanho..." value={query} onChange={e=>setQuery(e.target.value)} autoComplete="off"/>
       {query&&<button type="button" onClick={()=>setQuery("")}>Limpar</button>}
       </div>
       
     </div>
     <section className="new-section" aria-live="polite">
       <span className="new-kicker">VITRINE DA DOCERIA</span>
       <h1>{query.trim()?`Encontramos para “${query}”`:"Encontre o que deseja"}</h1>
       <p>{!query.trim()?"Busque pelo nome do produto, sabor, ingrediente ou tamanho. Você pode adicionar os produtos ao pedido diretamente na categoria.":results.length?`${results.length} opção(ões) encontrada(s). Clique em um resultado para escolher os detalhes e adicionar ao pedido.`:"Não encontrei esse nome no catálogo. Tente outra palavra ou consulte as categorias abaixo."}</p>
       {query.trim()&&<div className="new-result-list">{results.map((x,i)=><a key={x.type+x.name+i} className="new-result" href={x.url}>{x.image&&<img className="new-result-photo" src={x.image} alt="" />}<div><small>{x.type}</small><strong>{x.name}</strong><span>{x.detail}</span></div><b aria-hidden="true">Ver e pedir ↗</b></a>)}</div>}
       
     </section>
     <div className="new-help"><div><strong>Ainda tem alguma dúvida?</strong><p>Para informações específicas sobre sua encomenda, nossa equipe pode ajudar.</p></div><a href="https://wa.me/5531973416110" target="_blank" rel="noreferrer">Falar no WhatsApp ↗</a></div>
   </div>
   <footer className="new-footer"><img src="/assets/logo-complete.webp" alt="Doceria Brigadeiro e Beijinho"/><span>Feito com carinho em Belo Horizonte.</span><a href="/">Voltar ao início ↑</a></footer>
 </main>;
}
