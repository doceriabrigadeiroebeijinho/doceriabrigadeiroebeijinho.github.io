import StorefrontIcon from "./StorefrontIcon";
export default function BoutiquePageHeader() {
  return <header className="site-header boutique-header">
    <div className="boutique-header-main">
      <span className="boutique-header-balance" aria-hidden="true"/>
      <a className="brand boutique-logo" href="/" aria-label="Página inicial da Doceria Brigadeiro & Beijinho">
        <img src="/assets/logo-complete.webp" alt="Doceria Brigadeiro & Beijinho" width="900" height="673"/>
      </a>
      <div className="boutique-tools">
        <form action="/buscar" method="get" role="search" className="boutique-search">
          <input name="q" type="search" aria-label="Pesquisar no cardápio" placeholder="O que você procura?"/>
          <button type="submit" aria-label="Pesquisar"><StorefrontIcon name="search" size={21}/></button>
        </form>
        <a href="/?abrir=cliente" className="boutique-tool" aria-label="Já sou cliente" title="Já sou cliente"><StorefrontIcon name="user" size={22}/></a>
        <a href="/?abrir=pedido" className="boutique-tool boutique-cart" aria-label="Meu pedido" title="Meu pedido"><StorefrontIcon name="bag" size={23}/></a>
      </div>
    </div>
    <nav className="boutique-nav" aria-label="Navegação principal">
      <a href="/#como-pedir"><StorefrontIcon name="clipboard"/><span>Como pedir</span></a>
      <a href="/#cardapio"><StorefrontIcon name="grid"/><span>Cardápio</span></a>
      <a href="/bolos"><StorefrontIcon name="cake"/><span>Bolos</span></a>
      <a href="/docinhos"><StorefrontIcon name="sweet"/><span>Doces e Bombons</span></a>
      <a href="/presentes"><StorefrontIcon name="gift"/><span>Presentes</span></a>
      <a href="/decoracoes"><StorefrontIcon name="sparkles"/><span>Decorações</span></a>
    </nav>
  </header>;
}
