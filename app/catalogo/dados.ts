// Catálogo oficial compartilhado entre a página inicial, busca e páginas de produtos.
// Ao atualizar preços, sabores ou composições, altere este arquivo.
export type CakeTier = { id: string; name: string; eyebrow: string; description: string; fillings: string[]; prices: Record<string,number> };
export type SweetGroup = {id:string;name:string;type:"sweet"|"bonbon";hundredPrice:number;items:{id:string;name:string;description:string}[]};

export const classicFillings = [
  "Brigadeiro com Ninho",
  "Brigadeiro Tradicional",
  "Ninho",
  "Oreo com Ninho",
  "Prestígio",
  "Abacaxi com Coco",
];

export const specialFillings = [
  "Doce de Leite com Nozes",
  "Doce de Leite com Coco",
  "Ninho com Nutella",
  "Ninho com Morango in natura",
  "Brigadeiro com Morango in natura",
  "Brigadeiro, Ninho e Morango in natura",
  "Brigadeiro com Mousse de Maracujá",
  "Ninho com Mousse de Limão",
];

export const gourmetFillings = [
  "Pistache com Morango in natura",
  "Ninho com Frutas Vermelhas",
  "Ninho com Amêndoas",
  "Doce de Leite com Ameixa e Coco",
  "Brigadeiro Branco com Castanha-do-Pará e Coco",
];

export const cakeTiers: CakeTier[] = [
  {
    id: "bolo-classico",
    name: "Bolo Clássico",
    eyebrow: "Sabores afetivos",
    description:
      "Receitas que agradam toda a família, com três camadas de massa e duas de recheio.",
    fillings: classicFillings,
    prices: { mini: 115, p: 160, m: 195, g: 305, gg: 405 },
  },
  {
    id: "bolo-especial",
    name: "Bolo Especial",
    eyebrow: "Combinações marcantes",
    description:
      "Recheios com frutas, Nutella, nozes e mousses para deixar a comemoração ainda mais especial.",
    fillings: specialFillings,
    prices: { mini: 135.90, p: 190, m: 230, g: 350, gg: 470 },
  },
  {
    id: "bolo-gourmet",
    name: "Bolo Gourmet",
    eyebrow: "Ingredientes selecionados",
    description:
      "Sabores sofisticados com pistache, castanhas, amêndoas e frutas frescas.",
    fillings: gourmetFillings,
    prices: { mini: 155, p: 210, m: 260, g: 405, gg: 495 },
  },
  {
    id: "corte-classico",
    name: "Bolo de Corte Clássico",
    eyebrow: "Para servir",
    description:
      "Bolo retangular de aproximadamente 5 kg, chantilly branco e sem decoração personalizada.",
    fillings: classicFillings,
    prices: { corte: 360 },
  },
  {
    id: "corte-especial",
    name: "Bolo de Corte Especial",
    eyebrow: "Para servir",
    description:
      "Ideal para acompanhar bolo cenográfico e servir cerca de 50 pessoas com praticidade.",
    fillings: specialFillings,
    prices: { corte: 435 },
  },
  {
    id: "corte-gourmet",
    name: "Bolo de Corte Gourmet",
    eyebrow: "Para servir",
    description:
      "Versão gourmet para eventos maiores, sem decoração personalizada e pronta para o corte.",
    fillings: gourmetFillings,
    prices: { corte: 485 },
  },
];

export const blackCocoaPrice: Record<string, number> = {
  mini: 3,
  p: 5,
  m: 8,
  g: 10,
  gg: 12,
  corte: 12,
};

export const cakeMassPrice = (cakeId: string, mass: string) =>
  mass === "Cacau Black" ? blackCocoaPrice[cakeId] ?? 0 : 0;

export const cakeSizeCatalog = [
  {
    id: "mini",
    name: "Bolo Mini",
    subtitle: "12 cm · 6 a 8 fatias",
    description: "Ideal para mesversários, comemorações íntimas e presentes.",
    prices: {
      Classico: cakeTiers[0].prices.mini,
      Especial: cakeTiers[1].prices.mini,
      Gourmet: cakeTiers[2].prices.mini,
    },
    fillings: { Classico: classicFillings, Especial: specialFillings, Gourmet: gourmetFillings },
  },
  {
    id: "p",
    name: "Bolo P",
    subtitle: "15 cm · 12 a 15 fatias",
    description: "Um tamanho versátil para pequenas comemorações.",
    prices: {
      Classico: cakeTiers[0].prices.p,
      Especial: cakeTiers[1].prices.p,
      Gourmet: cakeTiers[2].prices.p,
    },
    fillings: { Classico: classicFillings, Especial: specialFillings, Gourmet: gourmetFillings },
  },
  {
    id: "m",
    name: "Bolo M",
    subtitle: "20 cm · 20 a 28 fatias",
    description: "Uma opção confortável para comemorações em família.",
    prices: {
      Classico: cakeTiers[0].prices.m,
      Especial: cakeTiers[1].prices.m,
      Gourmet: cakeTiers[2].prices.m,
    },
    fillings: { Classico: classicFillings, Especial: specialFillings, Gourmet: gourmetFillings },
  },
  {
    id: "g",
    name: "Bolo G",
    subtitle: "25 cm · 35 a 40 fatias",
    description: "Para festas maiores e comemorações com mais convidados.",
    prices: {
      Classico: cakeTiers[0].prices.g,
      Especial: cakeTiers[1].prices.g,
      Gourmet: cakeTiers[2].prices.g,
    },
    fillings: { Classico: classicFillings, Especial: specialFillings, Gourmet: gourmetFillings },
  },
  {
    id: "gg",
    name: "Bolo GG",
    subtitle: "30 cm · 55 a 60 fatias",
    description: "O maior tamanho para festas e eventos.",
    prices: {
      Classico: cakeTiers[0].prices.gg,
      Especial: cakeTiers[1].prices.gg,
      Gourmet: cakeTiers[2].prices.gg,
    },
    fillings: { Classico: classicFillings, Especial: specialFillings, Gourmet: gourmetFillings },
  },
  {
    id: "corte",
    name: "Bolo de Corte",
    subtitle: "Aproximadamente 5 kg · cerca de 50 pessoas",
    description: "Bolo retangular para servir, sem decoração personalizada.",
    prices: {
      Classico: cakeTiers[3].prices.corte,
      Especial: cakeTiers[4].prices.corte,
      Gourmet: cakeTiers[5].prices.corte,
    },
    fillings: { Classico: classicFillings, Especial: specialFillings, Gourmet: gourmetFillings },
  },
] as const;

export type CakeSizeId = (typeof cakeSizeCatalog)[number]["id"];
export type CakeFillingType = "Classico" | "Especial" | "Gourmet";

export const sweetGroups: SweetGroup[] = [
  {
    id: "doces-classicos",
    name: "Doces Clássicos",
    type: "sweet",
    hundredPrice: 160,
    items: [
      {
        id: "brigadeiro",
        name: "Brigadeiro",
        description:
          "Cremoso, preparado com cacau 50% e finalizado com granulado de chocolate.",
      },
      {
        id: "coco",
        name: "Coco",
        description: "Beijinho macio com coco ralado e sabor delicado.",
      },
      {
        id: "ninho",
        name: "Ninho",
        description: "Brigadeiro branco com leite em pó e textura aveludada.",
      },
      {
        id: "casadinho",
        name: "Casadinho",
        description: "Encontro do brigadeiro de cacau com o brigadeiro branco.",
      },
    ],
  },
  {
    id: "doces-especiais",
    name: "Doces Especiais",
    type: "sweet",
    hundredPrice: 180,
    items: [
      {
        id: "olho-sogra",
        name: "Olho de Sogra",
        description: "Beijinho de coco com ameixa, um clássico de festas.",
      },
      {
        id: "cajuzinho",
        name: "Cajuzinho",
        description: "Doce de amendoim com toque de chocolate.",
      },
      {
        id: "oreo",
        name: "Oreo",
        description: "Brigadeiro branco com pedacinhos de biscoito Oreo.",
      },
      {
        id: "ovomaltine",
        name: "Ovomaltine",
        description: "Brigadeiro com sabor maltado e crocância.",
      },
      {
        id: "moranguinho",
        name: "Moranguinho",
        description: "Brigadeiro de morango, delicado e cremoso.",
      },
      {
        id: "pacoca",
        name: "Paçoca",
        description: "Doce de amendoim com paçoca esfarelada.",
      },
      {
        id: "prestigio",
        name: "Prestígio",
        description: "Chocolate e coco em uma combinação bem cremosa.",
      },
      {
        id: "napolitano",
        name: "Napolitano",
        description: "Chocolate, morango e leite em pó no mesmo docinho.",
      },
    ],
  },
  {
    id: "doces-mais-especiais",
    name: "Mais Especiais",
    type: "sweet",
    hundredPrice: 210,
    items: [
      {
        id: "mms",
        name: "M&M’s",
        description: "Brigadeiro cremoso finalizado com confeitos coloridos.",
      },
      {
        id: "ninho-nutella",
        name: "Ninho com Nutella",
        description: "Brigadeiro de Ninho com recheio cremoso de Nutella.",
      },
      {
        id: "ferrero",
        name: "Ferrero",
        description: "Chocolate, avelã e uma finalização crocante.",
      },
      {
        id: "morango-nutella",
        name: "Moranguinho com Nutella",
        description: "Brigadeiro de morango com recheio de Nutella.",
      },
      {
        id: "churros",
        name: "Churros",
        description: "Doce de leite, açúcar e canela em versão de festa.",
      },
    ],
  },
  {
    id: "doces-finos",
    name: "Doces Finos",
    type: "sweet",
    hundredPrice: 280,
    items: [
      {
        id: "amendoas",
        name: "Amêndoas",
        description: "Brigadeiro branco com amêndoas e acabamento delicado.",
      },
      {
        id: "brig-pistache",
        name: "Brigadeiro de Pistache",
        description: "Brigadeiro cremoso com sabor marcante de pistache.",
      },
      {
        id: "surpresa-uva",
        name: "Surpresa de Uva",
        description: "Uva fresca envolvida em brigadeiro branco cremoso.",
      },
    ],
  },
  {
    id: "bombons-classicos",
    name: "Bombons Clássicos",
    type: "bonbon",
    hundredPrice: 200,
    items: [
      {
        id: "bombom-brigadeiro",
        name: "Brigadeiro Tradicional",
        description: "Casquinha de chocolate com recheio de brigadeiro.",
      },
      {
        id: "bombom-ninho",
        name: "Ninho",
        description: "Chocolate com recheio cremoso de leite em pó.",
      },
      {
        id: "bombom-coco",
        name: "Coco",
        description: "Bombom de chocolate com recheio de coco.",
      },
      {
        id: "bombom-abacaxi",
        name: "Abacaxi com Coco",
        description: "Recheio tropical de abacaxi com coco.",
      },
      {
        id: "bombom-doce-leite",
        name: "Doce de Leite",
        description: "Casquinha de chocolate com doce de leite cremoso.",
      },
      {
        id: "bombom-pacoca",
        name: "Paçoca",
        description: "Chocolate com recheio de amendoim e paçoca.",
      },
    ],
  },
  {
    id: "bombons-especiais",
    name: "Bombons Especiais",
    type: "bonbon",
    hundredPrice: 265,
    items: [
      {
        id: "bombom-nozes",
        name: "Nozes",
        description: "Recheio cremoso com nozes e casquinha de chocolate.",
      },
      {
        id: "bombom-amendoas",
        name: "Amêndoas",
        description: "Chocolate com recheio delicado de amêndoas.",
      },
      {
        id: "bombom-avelas",
        name: "Avelãs",
        description: "Bombom cremoso com sabor de avelã.",
      },
      {
        id: "bombom-castanha",
        name: "Castanha-do-Pará",
        description: "Chocolate com castanha-do-Pará e textura crocante.",
      },
    ],
  },
  {
    id: "bombons-finos",
    name: "Bombons Finos",
    type: "bonbon",
    hundredPrice: 465,
    items: [
      {
        id: "camafeu",
        name: "Camafeu",
        description: "Doce de nozes com acabamento elegante.",
      },
      {
        id: "quadradinho-para",
        name: "Quadradinho do Pará",
        description: "Bombom fino com castanha-do-Pará.",
      },
      {
        id: "gota-maracuja",
        name: "Gota de Maracujá",
        description: "Chocolate com recheio fresco de maracujá.",
      },
      {
        id: "taca-uva",
        name: "Taça de Uva",
        description: "Uva fresca com creme e acabamento de chocolate.",
      },
      {
        id: "taca-morango",
        name: "Taça de Morango",
        description: "Morango in natura com creme e chocolate.",
      },
      {
        id: "bombom-pistache",
        name: "Pistache",
        description: "Bombom fino com recheio cremoso de pistache.",
      },
    ],
  },
];


export const gifts = [
  {
    id: "cupcake",
    name: "Cupcake",
    description:
      "Massa fofa e úmida com recheio cremoso e cobertura de chantilly. Perfeito para lembrancinhas e eventos.",
    price: 7.9,
    minQty: 12,
    image: "data:image/webp;base64,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",
  },
  {
    id: "bento",
    name: "Bentô individual",
    description:
      "Bolo individual com frase personalizada, colher, vela, caixinha e sacolinha pronta para presentear.",
    price: 59.9,
    minQty: 1,
    image: "/assets/bento-personalized.webp",
  },
  {
    id: "bento-combo",
    name: "Combo Bentô",
    description:
      "Bentô personalizado acompanhado de uma caixa com 6 docinhos à sua escolha.",
    price: 74.9,
    minQty: 1,
    image: "/assets/gift-combo-bento.webp",
  },
  {
    id: "caixa-encanto",
    name: "Caixa Doce Encanto",
    description:
      "25 doces: Ninho com Nutella, Moranguinho com Nutella, Pistache, Ferrero e Prestígio.",
    price: 79.9,
    minQty: 1,
    image: "/assets/gift-doce-encanto.webp",
  },
  {
    id: "caixa-bombom",
    name: "Caixa Bombom Gourmet",
    description:
      "25 bombons: Coco, Nozes, Pistache, Taça de Morango e Quadradinho do Pará.",
    price: 99.9,
    minQty: 1,
    image: "/assets/gift-bombom-gourmet.webp",
  },
];


