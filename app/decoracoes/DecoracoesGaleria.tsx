"use client";
import { useState } from "react";
import "./decoracoes.css";

type Tag = "infantil" | "adulto" | "feminino" | "masculino";
type Photo = {image:string; title:string; tags:Tag[]};
const photo = (n:number,title:string,tags:Tag[]):Photo => ({image:`/assets/decoracoes/bolo-${String(n).padStart(2,"0")}.webp`,title,tags});
const fotos:Photo[] = [
  photo(1,"Bolo corporativo rosa",["adulto","feminino"]),
  photo(2,"Bolo floral",["adulto","feminino"]),
  photo(3,"Bolo arco-íris e balões",["infantil"]),
  photo(4,"Bolo temático rosa",["infantil","feminino"]),
  photo(5,"Bolo branco e vermelho",["adulto","feminino"]),
  photo(6,"Bolo preto e branco",["adulto","masculino"]),
  photo(7,"Bolo com morangos e flores",["adulto","feminino"]),
  photo(8,"Bolo de princesa",["infantil","feminino"]),
  photo(9,"Bolo com leãozinho",["infantil","masculino"]),
  photo(10,"Bolo de morangos",["adulto","feminino"]),
  photo(11,"Bolo de chá de bebê",["infantil"]),
  photo(12,"Bolo verde temático",["adulto","masculino"]),
  photo(13,"Bolo de personagens e corrida",["infantil","masculino"]),
  photo(14,"Bolo branco com folhagens",["adulto"]),
  photo(15,"Bolo branco e prata",["adulto","masculino"]),
  photo(16,"Bolo chocolate com frutas",["adulto"]),
  photo(17,"Bolo fundo do mar",["infantil","masculino"]),
  photo(18,"Bolo infantil ilustrado",["infantil","feminino"]),
  photo(19,"Bolo rosa com brilho",["adulto","feminino"]),
  photo(20,"Bolo rosa de aniversário",["adulto","feminino"]),
  photo(21,"Bolo floral de aniversário",["adulto","feminino"]),
  photo(22,"Bolo de princesas",["infantil","feminino"])
];
const filters:{id:"todos"|Tag;label:string}[]=[
 {id:"todos",label:"Todos"}, {id:"infantil",label:"Infantil"}, {id:"adulto",label:"Adulto"}, {id:"feminino",label:"Feminino"},{id:"masculino",label:"Masculino"}
];
export default function DecoracoesGaleria(){
 const [filter,setFilter]=useState<"todos"|Tag>("todos");
 const [opened,setOpened]=useState<Photo|null>(null);
 const visible=fotos.filter(p=>filter==="todos"||p.tags.includes(filter));
 return <main className="decor-page">
   <header className="decor-header">
     <a href="/" className="decor-logo"><img src="/assets/logo-complete.webp" alt="Doceria Brigadeiro & Beijinho"/></a>
     <nav aria-label="Navegação"><a href="/#como-pedir">Como pedir</a><a href="/bolos">Bolos</a><a href="/docinhos">Doces e Bombons</a><a href="/presentes">Presentes</a><a href="/decoracoes" aria-current="page">Decorações</a></nav>
     <a className="decor-order" href="/bolos">Encomendar bolo →</a>
   </header>
   <section className="decor-hero"><span>INSPIRAÇÕES DA DOCERIA</span><h1>Decorações de bolos</h1>
     <p>Confira alguns dos bolos que já produzimos e encontre ideias para sua comemoração.</p>
   </section>
   <section className="decor-content" aria-label="Galeria de decorações">
     <div className="decor-tabs" aria-label="Filtrar decorações">
      {filters.map(f=><button type="button" key={f.id} className={filter===f.id?"active":""} onClick={()=>setFilter(f.id)} aria-pressed={filter===f.id}>{f.label}</button>)}
     </div>
     <div className="decor-gallery">
       {visible.map(p=><button className="decor-photo" type="button" key={p.image} onClick={()=>setOpened(p)} aria-label={`Ampliar foto de ${p.title}`}>
         <img src={p.image} alt={p.title} loading="lazy"/><span>{p.title}</span>
       </button>)}
     </div>
     <p className="decor-small">As imagens mostram trabalhos anteriores. Decorações são personalizadas de acordo com a referência e os materiais disponíveis; valores de adicionais são informados durante a escolha do bolo.</p>
   </section>
   <section className="decor-footer-cta"><div><h2>Gostou de alguma decoração?</h2><p>Escolha o tamanho e o recheio do bolo. Os detalhes da decoração são definidos na encomenda.</p></div><a href="/bolos">Ver bolos e preços →</a></section>
   <footer className="decor-footer"><img src="/assets/logo-complete.webp" alt="Doceria Brigadeiro & Beijinho"/><a href="/">Voltar ao início ↑</a></footer>
   {opened && <div className="decor-lightbox" role="dialog" aria-modal="true" aria-label={opened.title} onClick={()=>setOpened(null)}>
      <div className="decor-lightbox-inner" onClick={e=>e.stopPropagation()}>
        <button type="button" className="decor-lightbox-close" onClick={()=>setOpened(null)} aria-label="Fechar imagem">×</button>
        <img src={opened.image} alt={opened.title}/>
        <div><strong>{opened.title}</strong><a href="/bolos">Escolher meu bolo →</a></div>
      </div>
   </div>}
 </main>
}
