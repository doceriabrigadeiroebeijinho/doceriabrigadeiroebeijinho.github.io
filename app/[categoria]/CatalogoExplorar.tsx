"use client";

import { useMemo, useState } from "react";
import { cakeSizeCatalog, classicFillings, specialFillings, gourmetFillings, sweetGroups, gifts } from "../catalogo/dados";
import "./catalogo.css";

type Result = {type:string;name:string;detail:string;url:string;image?:string};
const sections = [
  {slug:"bolos",label:"Bolos",note:"Tamanhos, fatias e valores"},
  {slug:"recheios",label:"Recheios",note:"Todos os sabores"},
  {slug:"docinhos",label:"Docinhos",note:"Doces finos e bombons"},
  {slug:"presentes",label:"Presentes",note:"Bentôs e caixas"},
  {slug:"combos",label:"Combos",note:"O que vem em cada kit"}
];
const normalize = (s:string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const money = (n:number) => n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const catalogResults:Result[] = [
  ...cakeSizeCatalog.map(x=>({type:"Bolo",name:x.name,detail:`${x.subtitle} · A partir de ${money(x.prices.Classico)}`,url:"/bolos",image:"/assets/cake-classic.webp"})),
  ...([["Clássicos",classicFillings],["Especiais",specialFillings],["Gourmet",gourmetFillings]] as const).flatMap(([g,items])=>items.map(name=>({type:`Recheio ${g}`,name,detail:"Sabor disponível para bolos",url:"/recheios"}))),
  ...sweetGroups.flatMap(g=>g.items.map(x=>({type:g.name,name:x.name,detail:`${money(g.hundredPrice)} por 100 unidades · Mínimo 25 por sabor`,url:"/docinhos",image:g.type==="bonbon"?"/assets/gift-bombons.webp":"/assets/sweets-chocolate.webp"}))),
  ...gifts.map(g=>({type:"Presentes e kits",name:g.name,detail:`${money(g.price)} · ${g.description}`,url:g.id.includes("combo")||g.id.includes("caixa")?"/combos":"/presentes",image:g.image.startsWith("/")?g.image:undefined})),
];
const giftDescription:Record<string,string> = {
  "bento-combo":"Bentô personalizado + 6 docinhos. Combinações disponíveis: 3 brigadeiros + 3 Ninhos, 6 brigadeiros ou 6 Ninhos.",
  "caixa-encanto":"25 doces: Ninho com Nutella, Moranguinho com Nutella, Pistache, Ferrero e Prestígio.",
  "caixa-bombom":"25 bombons: Coco, Nozes, Pistache, Taça de Morango e Quadradinho do Pará."
};
export default function CatalogoExplorar({categoria}:{categoria:string}) {
  const [query,setQuery]=useState("");
  const [filter,setFilter]=useState("all");
  const [copied,setCopied]=useState(false);
  const result = useMemo(()=>{
    const q=normalize(query.trim());
    if(!q) return [];
    return catalogResults.filter(x=>normalize([x.name,x.type,x.detail].join(" ")).includes(q)).slice(0,48);
  },[query]);
  const copyLink=async()=>{try{await navigator.clipboard.writeText(window.location.href);setCopied(true);window.setTimeout(()=>setCopied(false),2000)}catch{}};
  const isGifts=categoria==="presentes"||categoria==="combos";
  const shownGifts=gifts.filter(g=>categoria==="combos"?g.id==="bento-combo"||g.id.startsWith("caixa"):true);
  return <main className="new-catalog">
    <header className="new-header">
      <a href="/" className="new-brand" aria-label="Voltar à página inicial"><img src="/assets/logo-complete.webp" alt="Doceria Brigadeiro e Beijinho"/></a>
      <nav aria-label="Categorias"><a href="/bolos">Bolos</a><a href="/recheios">Recheios</a><a href="/docinhos">Docinhos</a><a href="/presentes">Presentes</a></nav>
      <a className="new-home" href="/">Fazer encomenda <span aria-hidden="true">↗</span></a>
    </header>
    <div className="new-wrap">
      <div className="new-search-band">
        <label htmlFor="catalog-search">O que você está procurando?</label>
        <div className="new-search-field">
          <span aria-hidden="true">⌕</span><input id="catalog-search" type="search" placeholder="Ex.: pistache, brigadeiro, bolo de 15 cm..." value={query} onChange={e=>setQuery(e.target.value)} autoComplete="off"/>
          {query&&<button type="button" onClick={()=>setQuery("")}>Limpar</button>}
        </div>
        <div className="new-quick-links" aria-label="Links para categorias">{sections.map(s=><a className={categoria===s.slug?"selected":""} key={s.slug} href={`/${s.slug}`}>{s.label}</a>)}</div>
      </div>
      {query.trim()?<section className="new-section" aria-live="polite">
        <span className="new-kicker">PESQUISA NO CARDÁPIO</span>
        <h1>Resultados para “{query}”</h1>
        <p>{result.length? `${result.length} resultado(s) encontrado(s). Toque para consultar a categoria.`:"Nenhum resultado encontrado. Tente outro sabor ou nome de produto."}</p>
        <div className="new-result-list">{result.map((x,i)=><a key={x.type+x.name+i} href={x.url} className="new-result"><div><small>{x.type}</small><strong>{x.name}</strong><span>{x.detail}</span></div><b aria-hidden="true">↗</b></a>)}</div>
      </section>:
      <>
        <div className="new-intro">
          <div><span className="new-kicker">DOCERIA BRIGADEIRO & BEIJINHO · BELO HORIZONTE</span>
          <h1>{categoria==="bolos"?"Bolos para momentos especiais":categoria==="recheios"?"Encontre seu recheio favorito":categoria==="docinhos"?"Docinhos, bombons e doces finos":categoria==="combos"?"Combos e caixas para presentear":categoria==="presentes"?"Presentes feitos com carinho":"O que você gostaria de encontrar?"}</h1>
          <p>{categoria==="recheios"?"Confira todos os sabores antes de escolher tamanho e decoração.":categoria==="bolos"?"Compare os tamanhos e valores sem precisar montar sua encomenda.":categoria==="docinhos"?"Veja os sabores disponíveis, a categoria e os preços por cento.":isGifts?"Consulte a composição de cada produto com clareza, antes de fazer seu pedido.":"Busque produtos e sabores pelo nome, sem percorrer todo o cardápio."}</p>
          <div className="new-intro-actions"><a href="/">Montar meu pedido <span aria-hidden="true">→</span></a><button type="button" onClick={copyLink}>{copied?"Link copiado!":"Copiar link desta página"}</button></div>
          </div>
          <img src={categoria==="docinhos"?"/assets/sweets-chocolate.webp":isGifts?"/assets/gift-combo-bento.webp":"/assets/cake-floral.webp"} alt="Fotografia de produto da Doceria Brigadeiro e Beijinho"/>
        </div>
        {categoria==="buscar"&&<div className="new-note"><strong>Dica:</strong> digite um sabor, tamanho, nome de doce ou ingrediente na barra de pesquisa acima.</div>}
        {categoria==="recheios"&&<section className="new-section">
          <span className="new-kicker">SABORES DE BOLO</span><h2>Todos os recheios em um só lugar</h2>
          <p>As categorias abaixo definem o preço do bolo. Massa e decoração são escolhidas separadamente.</p>
          <div className="new-filter">{[["all","Todos"],["classic","Clássicos"],["special","Especiais"],["gourmet","Gourmet"]].map(([id,label])=><button type="button" key={id} className={filter===id?"active":""} onClick={()=>setFilter(id)}>{label}</button>)}</div>
          <div className="new-flavor-grid">{[["classic","Clássicos",classicFillings],["special","Especiais",specialFillings],["gourmet","Gourmet",gourmetFillings]].filter(x=>filter==="all"||filter===x[0]).map(([id,title,items])=><article className="new-flavor-card" key={id as string}><h3>{title as string}</h3><ul>{(items as string[]).map(x=><li key={x}>{x}</li>)}</ul></article>)}</div>
          <a className="new-link-button" href="/bolos">Agora quero ver os tamanhos e preços →</a>
        </section>}
        {categoria==="bolos"&&<section className="new-section"><span className="new-kicker">QUAL O TAMANHO IDEAL?</span><h2>Tamanhos e preços</h2><p>Valores iniciais. A escolha do recheio, massa e decoração pode alterar o total.</p><div className="new-product-grid">{cakeSizeCatalog.map((x,i)=><article className="new-product-card" key={x.id}><img src={i===0?"/assets/monthly-cake.webp":i===1?"/assets/cake-classic.webp":i===2?"/assets/cake-floral.webp":"/assets/cake-lilac.webp"} alt={x.name}/><div className="new-product-content"><small>{x.subtitle}</small><h3>{x.name}</h3><p>{x.description}</p><div className="new-price-lines"><span>Clássico <strong>{money(x.prices.Classico)}</strong></span><span>Especial <strong>{money(x.prices.Especial)}</strong></span><span>Gourmet <strong>{money(x.prices.Gourmet)}</strong></span></div><a href="/recheios">Consultar recheios →</a><a className="new-primary-small" href="/#cardapio">Montar meu bolo</a></div></article>)}</div></section>}
        {categoria==="docinhos"&&<section className="new-section"><span className="new-kicker">ESCOLHA SEUS SABORES</span><h2>Docinhos e bombons</h2><div className="new-note">Pedido mínimo de 25 unidades por sabor. É possível combinar até 4 sabores por cento.</div><div className="new-filter">{[["all","Todos"],...sweetGroups.map(x=>[x.id,x.name])].map(([id,label])=><button key={id} type="button" className={filter===id?"active":""} onClick={()=>setFilter(id)}>{label}</button>)}</div>{sweetGroups.filter(g=>filter==="all"||g.id===filter).map(g=><article key={g.id} className="new-sweet-group"><div className="new-sweet-title"><h3>{g.name}</h3><strong>{money(g.hundredPrice)} <small>/ 100 unidades</small></strong></div><div className="new-sweet-grid">{g.items.map(s=><div key={s.id} className="new-sweet-item"><img src={g.type==="bonbon"?"/assets/gift-bombons.webp":s.id==="brigadeiro"?"/assets/brigadeiro-tradicional.webp":"/assets/sweets-chocolate.webp"} alt=""/><div><strong>{s.name}</strong><p>{s.description}</p></div></div>)}</div></article>)}<a className="new-link-button" href="/#cardapio">Selecionar meus docinhos →</a></section>}
        {isGifts&&<section className="new-section"><span className="new-kicker">DETALHES DO QUE ESTÁ INCLUSO</span><h2>{categoria==="combos"?"Composição dos combos":"Presentes e kits"}</h2><p>Consulte a composição cadastrada e escolha seus produtos no cardápio principal.</p><div className="new-product-grid">{shownGifts.map(g=><article className="new-product-card" key={g.id}><img src={g.image.startsWith("/")?g.image:"/assets/gift-combo-bento.webp"} alt={g.name}/><div className="new-product-content"><h3>{g.name}</h3><p>{giftDescription[g.id]||g.description}</p><strong className="new-gift-price">A partir de {money(g.price)}</strong><a className="new-primary-small" href="/#cardapio">Escolher no cardápio →</a></div></article>)}</div></section>}
      </>}
      <div className="new-help"><div><strong>Ainda tem alguma dúvida?</strong><p>Para informações específicas sobre sua encomenda, nossa equipe pode ajudar pelo WhatsApp.</p></div><a href="https://wa.me/5531973416110" target="_blank" rel="noreferrer">Falar com a doceria ↗</a></div>
    </div>
    <footer className="new-footer"><img src="/assets/logo-complete.webp" alt="Doceria Brigadeiro e Beijinho"/><span>Feito com carinho em Belo Horizonte · Produtos sob encomenda.</span><a href="/">Voltar para o início ↑</a></footer>
  </main>;
}
