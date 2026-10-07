// @ts-nocheck

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const WHATSAPP_NUMBER = "5531973416110";
const WHATSAPP_CATALOG = "https://wa.me/c/553173416110";
const INSTAGRAM = "https://www.instagram.com/doceria_brigadeiro_beijinho/";
const PIX_KEY = "31973416110";
const CARD_PAYMENT_URL = "https://linknabio.gg/nutribacelar";
const ORIGIN =
  "Rua Antônio Eustáquio Pinheiro, 50, Solar do Barreiro, Belo Horizonte - MG, 30628-180";
const WHATSAPP_PRE_MESSAGE =
  "Olá! Vim pelo site da Doceria Brigadeiro & Beijinho e gostaria de informações para fazer uma encomenda.";
const WHATSAPP_INFO_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  WHATSAPP_PRE_MESSAGE,
)}`;
const GOOGLE_REVIEWS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `Doceria Brigadeiro & Beijinho, ${ORIGIN}`,
)}`;
const GOOGLE_REVIEW_FORM_URL = "https://g.page/r/CXtaVH-2ywyGEAE/review";
const COUPONS = {
  DOCE5: 5,
  DOCE10: 10,
  PIMENTA5: 5,
} as const;
type CouponCode = keyof typeof COUPONS;
type BalancePaymentMethod = "Pix" | "Cartão" | "Dinheiro";

const sweetQuantityOptions = [25, 50, 75, 100, 125, 150, 175, 200];
const cupcakeQuantityOptions = Array.from({ length: 10 }, (_, index) => (index + 1) * 12);

type CakeDecorationOption = {
  id: string;
  label: string;
  prices: Record<string, number>;
  requires48h?: boolean;
};

const cakeDecorationOptions: CakeDecorationOption[] = [
  {
    id: "topo",
    label: "Topo de bolo",
    prices: { mini: 0, p: 0, m: 0, g: 0, gg: 0 },
  },
  {
    id: "flores",
    label: "Flores naturais",
    prices: { mini: 10, p: 12, m: 15, g: 20, gg: 25 },
    requires48h: true,
  },
  {
    id: "papel-topo",
    label: "Papel de arroz no topo do bolo",
    prices: { mini: 10, p: 10, m: 10, g: 10, gg: 10 },
    requires48h: true,
  },
  {
    id: "papel-lateral",
    label: "Papel de arroz na lateral do bolo",
    prices: { mini: 15, p: 20, m: 30, g: 38, gg: 45 },
    requires48h: true,
  },
  {
    id: "frutas-topo",
    label: "Frutas no topo do bolo",
    prices: { mini: 10, p: 12, m: 18, g: 25, gg: 30 },
    requires48h: true,
  },
  {
    id: "avaliar",
    label: "Outra decoração — sob avaliação",
    prices: { mini: 0, p: 0, m: 0, g: 0, gg: 0 },
    requires48h: true,
  },
];

const complexSweetGroupIds = new Set([
  "doces-mais-especiais",
  "doces-finos",
  "bombons-especiais",
  "bombons-finos",
]);

const cakeDecorationPrice = (optionId: string, size: string) => {
  const option = cakeDecorationOptions.find((item) => item.id === optionId);
  return option?.prices[size] ?? 0;
};

const wrapperOptions = [
  { label: "Branca — sem adicional", value: "Branca", fee: 0 },
  { label: "Kraft + R$ 1,00", value: "Kraft", fee: 1 },
  { label: "Chocolate + R$ 1,00", value: "Chocolate", fee: 1 },
  { label: "Preto + R$ 1,00", value: "Preto", fee: 1 },
  { label: "Azul Marinho + R$ 1,00", value: "Azul Marinho", fee: 1 },
  { label: "Azul Royal + R$ 1,00", value: "Azul Royal", fee: 1 },
  { label: "Azul Tiffany + R$ 1,00", value: "Azul Tiffany", fee: 1 },
  { label: "Azul Bebê + R$ 1,00", value: "Azul Bebê", fee: 1 },
  { label: "Verde Claro + R$ 1,00", value: "Verde Claro", fee: 1 },
  { label: "Verde Escuro + R$ 1,00", value: "Verde Escuro", fee: 1 },
  { label: "Marsala + R$ 1,00", value: "Marsala", fee: 1 },
  { label: "Vermelho + R$ 1,00", value: "Vermelho", fee: 1 },
  { label: "Pink + R$ 1,00", value: "Pink", fee: 1 },
  { label: "Rosa Goiaba + R$ 1,00", value: "Rosa Goiaba", fee: 1 },
  { label: "Rosa Bebê + R$ 1,00", value: "Rosa Bebê", fee: 1 },
  { label: "Lilás + R$ 1,00", value: "Lilás", fee: 1 },
  { label: "Roxo + R$ 1,00", value: "Roxo", fee: 1 },
  { label: "Creme + R$ 1,00", value: "Creme", fee: 1 },
  { label: "Pêssego + R$ 1,00", value: "Pêssego", fee: 1 },
  { label: "Laranja + R$ 1,00", value: "Laranja", fee: 1 },
  { label: "Amarelo + R$ 1,00", value: "Amarelo", fee: 1 },
  { label: "Acetato + R$ 2,00", value: "Acetato", fee: 2 },
];

type CartType = "cake" | "sweet" | "bonbon" | "gift";

type CartItem = {
  key: string;
  id: string;
  name: string;
  variant: string;
  type: CartType;
  qty: number;
  step: number;
  unitPrice: number;
  wrapperColor?: string;
  requires48h?: boolean;
};

type CakeTier = {
  id: string;
  name: string;
  eyebrow: string;
  description: string;
  fillings: string[];
  prices: Record<string, number>;
};

type SweetGroup = {
  id: string;
  name: string;
  type: "sweet" | "bonbon";
  hundredPrice: number;
  items: { id: string; name: string; description: string }[];
};

const sizes: Record<string, string> = {
  mini: "Mini (12 cm) · 6 a 8 fatias",
  p: "P (15 cm) · 12 a 15 fatias",
  m: "M (20 cm) · 20 a 28 fatias",
  g: "G (25 cm) · 35 a 40 fatias",
  gg: "GG (30 cm) · 55 a 60 fatias",
  corte: "Bolo de corte · cerca de 50 pessoas",
};

const classicFillings = [
  "Brigadeiro com Ninho",
  "Brigadeiro Tradicional",
  "Ninho",
  "Oreo com Ninho",
  "Prestígio",
  "Abacaxi com Coco",
];

const specialFillings = [
  "Doce de Leite com Nozes",
  "Doce de Leite com Coco",
  "Ninho com Nutella",
  "Ninho com Morango in natura",
  "Brigadeiro com Morango in natura",
  "Brigadeiro, Ninho e Morango in natura",
  "Brigadeiro com Mousse de Maracujá",
  "Ninho com Mousse de Limão",
];

const gourmetFillings = [
  "Pistache com Morango in natura",
  "Ninho com Frutas Vermelhas",
  "Ninho com Amêndoas",
  "Doce de Leite com Ameixa e Coco",
  "Brigadeiro Branco com Castanha-do-Pará e Coco",
];

const cakeTiers: CakeTier[] = [
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

const blackCocoaPrice: Record<string, number> = {
  mini: 3,
  p: 5,
  m: 8,
  g: 10,
  gg: 12,
  corte: 12,
};

const cakeMassPrice = (cakeId: string, mass: string) =>
  mass === "Cacau Black" ? blackCocoaPrice[cakeId] ?? 0 : 0;

const cakeSizeCatalog = [
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

type CakeSizeId = (typeof cakeSizeCatalog)[number]["id"];
type CakeFillingType = "Classico" | "Especial" | "Gourmet";

const sweetGroups: SweetGroup[] = [
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

const whiteSweetIds = new Set([
  "coco",
  "ninho",
  "casadinho",
  "oreo",
  "ninho-nutella",
  "surpresa-uva",
]);

const sweetPhoto = (id: string, type: SweetGroup["type"]) => {
  if (type === "bonbon") return "/assets/gift-bombons.webp";
  return whiteSweetIds.has(id)
    ? "/assets/sweets-ninho.webp"
    : "/assets/sweets-chocolate.webp";
};

const gifts = [
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
    price: 69.9,
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

const bentoFillingPrice = (
  giftId: "bento" | "bento-combo",
  fillingType: "Clássico" | "Especial",
) => {
  const basePrice = gifts.find((gift) => gift.id === giftId)?.price ?? 0;
  return fillingType === "Especial" ? basePrice + 5 : basePrice;
};

const cupcakePriceWithTopper = (quantity: number, withTopper: boolean) => {
  const basePrice = gifts.find((gift) => gift.id === "cupcake")?.price ?? 0;
  return withTopper ? basePrice + 6 / 12 : basePrice;
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

type DateOption = {
  value: string;
  label: string;
};

type BusyWindow = {
  start: string;
  end: string;
};

const toLocalDateValue = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

const createDateOptions = () => {
  const today = new Date();
  const firstDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1,
    12,
  );
  const lastDate = new Date(2027, 11, 31, 12);
  const totalDays = Math.max(
    0,
    Math.floor((lastDate.getTime() - firstDate.getTime()) / 86_400_000) + 1,
  );

  return Array.from({ length: totalDays }, (_, index): DateOption => {
    const date = new Date(
      firstDate.getFullYear(),
      firstDate.getMonth(),
      firstDate.getDate() + index,
      12,
    );
    const rawLabel = new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);

    return {
      value: toLocalDateValue(date),
      label: rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1),
    };
  });
};

const createTimeRange = (startMinutes: number, endMinutes: number) => {
  const options: string[] = [];

  for (let minutes = startMinutes; minutes <= endMinutes; minutes += 30) {
    options.push(
      `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
        minutes % 60,
      ).padStart(2, "0")}`,
    );
  }

  return options;
};

const weekdayTimeOptions = createTimeRange(8 * 60, 18 * 60);
const sundayTimeOptions = [
  ...createTimeRange(7 * 60, 8 * 60 + 30),
  ...createTimeRange(12 * 60 + 30, 16 * 60),
];

const monthlyCakeGallery = [
  {
    src: "/assets/monthly-samuel-1.webp",
    alt: "Bolo Mini de 1 mês com tema Patati Patatá",
  },
  {
    src: "/assets/monthly-samuel-natal.webp",
    alt: "Bolo Mini de 2 meses com tema de Natal",
  },
  {
    src: "/assets/monthly-mariah-rock.webp",
    alt: "Bolo Mini de 7 meses com tema rock",
  },
  {
    src: "/assets/monthly-mariah-branca-neve.webp",
    alt: "Bolo Mini de 5 meses com tema Branca de Neve",
  },
  {
    src: "/assets/monthly-mariah-harry-potter.webp",
    alt: "Bolo Mini de 4 meses com tema Harry Potter",
  },
] as const;

const cakeCatalogGallery = [
  {
    src: "/assets/hero-arca-noe.webp",
    alt: "Bolo temático Arca de Noé",
  },
  {
    src: "/assets/hero-lacos-vermelhos.webp",
    alt: "Bolo branco com laços vermelhos",
  },
  {
    src: "/assets/hero-princesas.webp",
    alt: "Bolo personalizado com tema de princesas",
  },
  {
    src: "/assets/hero-baloes.webp",
    alt: "Bolo delicado com balões e arco-íris",
  },
] as const;

const sweetsCatalogGallery = [
  {
    src: "/assets/doces-uva.webp",
    alt: "Doces de Ninho com uva e doces com cobertura de chocolate",
  },
  {
    src: "/assets/doces-variados.webp",
    alt: "Seleção de doces artesanais variados",
  },
  {
    src: "/assets/doces-bombons.webp",
    alt: "Doces artesanais e bombons com acabamento em chocolate",
  },
  {
    src: "/assets/doces-coloridos.webp",
    alt: "Doces artesanais com confeitos coloridos",
  },
] as const;

export default function Home() {
  const [catalogTab, setCatalogTab] = useState<
    "choose" | "cakes" | "sweets" | "gifts"
  >("choose");
  const [sweetGroupId, setSweetGroupId] = useState(sweetGroups[0].id);
  const [sweetQuantities, setSweetQuantities] = useState<Record<string, number>>(
    {},
  );
  const [sweetWrappers, setSweetWrappers] = useState<Record<string, string>>(
    {},
  );
  const [cakeChoices, setCakeChoices] = useState<
    Record<
      CakeSizeId,
      {
        fillingType: CakeFillingType;
        filling: string;
        mass: string;
        model: string;
        decorations: string[];
      }
    >
  >(() =>
    Object.fromEntries(
      cakeSizeCatalog.map((cake) => [
        cake.id,
        {
          fillingType: "Classico",
          filling: cake.fillings.Classico[0],
          mass: "Branca",
          model: "Chantilly",
          decorations: cake.id === "corte" ? [] : ["topo"],
        },
      ]),
    ) as Record<
      CakeSizeId,
      {
        fillingType: CakeFillingType;
        filling: string;
        mass: string;
        model: string;
        decorations: string[];
      }
    >,
  );
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderOpen, setOrderOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(0);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantAnswer, setAssistantAnswer] = useState(
    "Olá! Posso ajudar com tamanho do bolo, quantidade de doces, entrega ou pagamento.",
  );
  const [guestCount, setGuestCount] = useState(20);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"Pix" | "Cartão" | "">("");
  const [balancePaymentMethod, setBalancePaymentMethod] =
    useState<BalancePaymentMethod>("Pix");
  const [shippingError, setShippingError] = useState("");
  const [cepLookupStatus, setCepLookupStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [paymentNoticeOpen, setPaymentNoticeOpen] = useState(false);
  const [pendingWhatsAppUrl, setPendingWhatsAppUrl] = useState("");
  const [pendingWhatsAppMessage, setPendingWhatsAppMessage] = useState("");
  const [orderMessageCopied, setOrderMessageCopied] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponCode | "">("");
  const [shippingStatus, setShippingStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccessOpen, setOrderSuccessOpen] = useState(false);
  const [lastSubmittedOrder, setLastSubmittedOrder] = useState<any>(null);
  const [customerPortalOpen, setCustomerPortalOpen] = useState(false);
  const [customerLookupName, setCustomerLookupName] = useState("");
  const [customerLookupPhone, setCustomerLookupPhone] = useState("");
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerError, setCustomerError] = useState("");
  const [dateOptions, setDateOptions] = useState<DateOption[]>([]);
  const [giftChoices, setGiftChoices] = useState({
    cupcakeMass: "Branca",
    cupcakeFilling: "Brigadeiro Tradicional",
    cupcakeQty: 12,
    cupcakeTopper: false,
    bentoMass: "Branca",
    bentoFillingType: "Clássico",
    bentoFilling: "Brigadeiro com Ninho",
    comboMass: "Branca",
    comboFillingType: "Clássico",
    comboFilling: "Brigadeiro com Ninho",
    comboSweets: "3 Brigadeiros + 3 Ninhos",
  });
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
  });
  const [details, setDetails] = useState({
    eventDate: "",
    eventTime: "",
    phrase: "",
    age: "",
    decoration: "",
    colors: "",
  });
  const [delivery, setDelivery] = useState({
    service: "Retirada",
    cep: "",
    street: "",
    neighborhood: "",
    city: "",
    state: "",
    number: "",
    complement: "",
    latitude: null as number | null,
    longitude: null as number | null,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDateOptions(createDateOptions());
      setMinimumOrderTime(Date.now());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);



  const activeSweetGroup =
    sweetGroups.find((group) => group.id === sweetGroupId) ?? sweetGroups[0];

  const requiredLeadHours = useMemo(() => {
    if (!details.eventDate) return 72;
    const selectedDate = new Date(`${details.eventDate}T12:00:00`);
    const dayOfWeek = selectedDate.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6 ? 120 : 72;
  }, [details.eventDate]);

  const requiredLeadLabel =
    requiredLeadHours === 120 ? "5 dias de antecedência" : "72 horas de antecedência";

  const availableTimeOptions = useMemo(() => {
    if (!details.eventDate) return [];

    const selectedDate = new Date(`${details.eventDate}T12:00:00`);
    return selectedDate.getDay() === 0
      ? sundayTimeOptions
      : weekdayTimeOptions;
  }, [details.eventDate]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.qty * item.unitPrice, 0),
    [cart],
  );
  const deliveryPreviewTotal =
    subtotal + (shippingStatus === "success" ? deliveryFee : 0);
  const regularSubtotal = subtotal;
  const couponPercent = appliedCoupon ? COUPONS[appliedCoupon] : 0;
  const couponDiscount = regularSubtotal * (couponPercent / 100);
  const pixDiscount =
    paymentMethod === "Pix"
      ? Math.max(0, regularSubtotal - couponDiscount) * 0.03
      : 0;
  const discountedRegularSubtotal = Math.max(
    0,
    regularSubtotal - couponDiscount - pixDiscount,
  );
  const regularOrderTotal = discountedRegularSubtotal + deliveryFee;
  const total = regularOrderTotal;
  const deposit = regularOrderTotal * 0.6;
  const balance = regularOrderTotal * 0.4;

  const addItem = (item: Omit<CartItem, "key">) => {
    const key = `${item.id}::${item.variant}`;
    setCart((current) => {
      const existing = current.find((cartItem) => cartItem.key === key);
      if (existing) {
        return current.map((cartItem) =>
          cartItem.key === key
            ? { ...cartItem, qty: cartItem.qty + item.qty }
            : cartItem,
        );
      }
      return [...current, { ...item, key }];
    });
    setToast(`${item.name} adicionado ao pedido`);
  };

  const addCake = (cake: (typeof cakeSizeCatalog)[number]) => {
    const choice = cakeChoices[cake.id];
    const selectedDecorations = cake.id === "corte" ? [] : choice.decorations;
    const decorationTotal = selectedDecorations.reduce(
      (sum, optionId) => sum + cakeDecorationPrice(optionId, cake.id),
      0,
    );
    const decorationLabels = selectedDecorations
      .map(
        (optionId) =>
          cakeDecorationOptions.find((option) => option.id === optionId)?.label,
      )
      .filter(Boolean)
      .join(" + ");
    const requires48h = selectedDecorations.some((optionId) =>
      Boolean(
        cakeDecorationOptions.find((option) => option.id === optionId)
          ?.requires48h,
      ),
    );
    const massAdditional = cakeMassPrice(cake.id, choice.mass);
    const unitPrice =
      cake.prices[choice.fillingType] + decorationTotal + massAdditional;
    const fillingTypeLabel =
      choice.fillingType === "Classico"
        ? "Clássico"
        : choice.fillingType === "Especial"
          ? "Especial"
          : "Gourmet";

    addItem({
      id: cake.id,
      name: cake.name,
      variant: `${cake.subtitle} · recheio ${fillingTypeLabel} · massa ${choice.mass.toLowerCase()} · modelo ${choice.model.toLowerCase()} · ${choice.filling} · ${
        cake.id === "corte"
          ? "sem decoração personalizada"
          : decorationLabels || "sem decoração adicional"
      }`,
      type: "cake",
      qty: 1,
      step: 1,
      unitPrice,
      requires48h,
    });
  };

  const addSweet = (
    group: SweetGroup,
    sweet: SweetGroup["items"][number],
  ) => {
    const quantity = sweetQuantities[sweet.id] ?? 25;
    const wrapperColor = sweetWrappers[sweet.id] ?? "Branca";
    const wrapper =
      wrapperOptions.find((option) => option.value === wrapperColor) ??
      wrapperOptions[0];
    addItem({
      id: sweet.id,
      name: sweet.name,
      variant: `${group.name} · Forminha ${wrapper.value}`,
      type: group.type,
      qty: quantity,
      step: 25,
      unitPrice: group.hundredPrice / 100 + wrapper.fee / 25,
      wrapperColor: wrapper.value,
      requires48h:
        complexSweetGroupIds.has(group.id) || wrapper.value !== "Branca",
    });
  };

  const changeQuantity = (key: string, direction: number) => {
    setCart((current) =>
      current
        .map((item) =>
          item.key === key
            ? { ...item, qty: item.qty + item.step * direction }
            : item,
        )
        .filter((item) => item.qty > 0),
    );
  };

  const removeItem = (key: string) => {
    setCart((current) => current.filter((item) => item.key !== key));
  };

  const applyCoupon = () => {
    if (regularSubtotal <= 0) {
      setAppliedCoupon("");
      setToast(
        "O pacote já possui 15% de desconto e não recebe cupons adicionais",
      );
      return;
    }
    const normalized = couponInput.trim().toUpperCase();
    if (!normalized) {
      setAppliedCoupon("");
      setToast("Digite um cupom para aplicar");
      return;
    }
    if (!(normalized in COUPONS)) {
      setAppliedCoupon("");
      setToast("Cupom inválido ou indisponível");
      return;
    }
    const code = normalized as CouponCode;
    setCouponInput(code);
    setAppliedCoupon(code);
    setToast(`Cupom ${code} aplicado: ${COUPONS[code]}% de desconto`);
  };

  const removeCoupon = () => {
    setAppliedCoupon("");
    setCouponInput("");
    setToast("Cupom removido");
  };

  const updateCakeChoice = (
    cakeId: CakeSizeId,
    field: "mass" | "model" | "fillingType" | "filling",
    value: string,
  ) => {
    setCakeChoices((current) => {
      const choice = current[cakeId];
      const cake = cakeSizeCatalog.find((item) => item.id === cakeId);
      if (!cake) return current;

      if (field === "fillingType") {
        const fillingType = value as CakeFillingType;
        return {
          ...current,
          [cakeId]: {
            ...choice,
            fillingType,
            filling: cake.fillings[fillingType][0],
          },
        };
      }

      if (field === "mass") {
        return { ...current, [cakeId]: { ...choice, mass: value } };
      }
      if (field === "model") {
        return { ...current, [cakeId]: { ...choice, model: value } };
      }
      return { ...current, [cakeId]: { ...choice, filling: value } };
    });
  };

  const toggleCakeDecoration = (tierId: string, optionId: string) => {
    setCakeChoices((current) => {
      const currentDecorations = current[tierId].decorations;
      const decorations = currentDecorations.includes(optionId)
        ? currentDecorations.filter((id) => id !== optionId)
        : [...currentDecorations, optionId];

      return {
        ...current,
        [tierId]: { ...current[tierId], decorations },
      };
    });
  };

  const copyPix = async () => {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setToast(`Chave Pix: ${PIX_KEY}`);
    }
  };

  const cleanCep = (value: string) => value.replace(/\D/g, "").slice(0, 8);

  const lookupCep = async (value: string) => {
    const cep = cleanCep(value);
    if (cep.length !== 8) return;

    setCepLookupStatus("loading");
    setShippingStatus("idle");
    setDeliveryFee(0);
    setShippingError("");

    try {
      const response = await fetch(`/api/cep?cep=${cep}`, {
        cache: "no-store",
      });
      const result = (await response.json()) as {
        street?: string;
        neighborhood?: string;
        city?: string;
        state?: string;
        cep?: string;
        latitude?: number;
        longitude?: number;
        error?: string;
      };

      if (!response.ok || !result.street || !result.city || !result.state) {
        throw new Error(result.error || "Não foi possível localizar este CEP.");
      }

      setDelivery((current) => ({
        ...current,
        service: "Entrega",
        cep: result.cep || cep,
        street: result.street || "",
        neighborhood: result.neighborhood || "",
        city: result.city || "",
        state: result.state || "",
        latitude:
          typeof result.latitude === "number" && Number.isFinite(result.latitude)
            ? result.latitude
            : null,
        longitude:
          typeof result.longitude === "number" && Number.isFinite(result.longitude)
            ? result.longitude
            : null,
      }));
      setCepLookupStatus("success");
    } catch (error) {
      setCepLookupStatus("error");
      setShippingError(
        error instanceof Error
          ? error.message
          : "Não foi possível localizar este CEP.",
      );
    }
  };

  const formattedAddress = [
    delivery.street && delivery.number
      ? `${delivery.street}, ${delivery.number}`
      : delivery.street,
    delivery.neighborhood,
    delivery.city && delivery.state
      ? `${delivery.city} - ${delivery.state}`
      : delivery.city || delivery.state,
    delivery.cep ? `CEP ${delivery.cep}` : "",
    delivery.complement,
  ]
    .filter(Boolean)
    .join(", ");

  const calculateShipping = useCallback(async () => {
    if (
      delivery.service !== "Entrega" ||
      !delivery.cep ||
      cleanCep(delivery.cep).length !== 8 ||
      !delivery.street.trim() ||
      !delivery.number.trim() ||
      !delivery.city.trim() ||
      !delivery.state.trim()
    ) {
      setShippingError("Informe o CEP e o número para calcular a entrega.");
      return;
    }

    setShippingStatus("loading");
    setShippingError("");
    try {
      const response = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: formattedAddress,
          cep: cleanCep(delivery.cep),
          street: delivery.street,
          number: delivery.number,
          neighborhood: delivery.neighborhood,
          city: delivery.city,
          state: delivery.state,
          latitude: delivery.latitude,
          longitude: delivery.longitude,
        }),
      });
      const result = (await response.json()) as {
        fee?: number;
        oneWayKm?: number;
        roundTripKm?: number;
        locatedAddress?: string;
        error?: string;
      };

      if (!response.ok || typeof result.fee !== "number") {
        throw new Error(result.error || "Não foi possível calcular a entrega");
      }

      setDeliveryFee(result.fee);
      setShippingStatus("success");
    } catch (error) {
      setDeliveryFee(0);
      setShippingStatus("error");
      setShippingError(
        error instanceof Error
          ? error.message
          : "Não conseguimos calcular a entrega neste momento. Confira o endereço e tente novamente.",
      );
    }
  }, [
    formattedAddress,
    delivery.service,
    delivery.cep,
    delivery.street,
    delivery.number,
    delivery.city,
    delivery.state,
    delivery.latitude,
    delivery.longitude,
  ]);

  useEffect(() => {
    if (delivery.service !== "Entrega") {
      const resetTimer = window.setTimeout(() => {
        setDeliveryFee(0);
        setShippingStatus("idle");
      }, 0);
      return () => window.clearTimeout(resetTimer);
    }
  }, [delivery.service]);

  const originMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    ORIGIN,
  )}`;
  const openCustomerPortal = () => {
    setCustomerPortalOpen(true);
    setCustomerError("");
    setCustomerOrders([]);
  };

  const lookupCustomerOrders = async () => {
    const name = customerLookupName.trim();
    const phone = customerLookupPhone.trim();
    if (!name || !phone) {
      setCustomerError("Informe seu nome e WhatsApp.");
      return;
    }
    setCustomerLoading(true);
    setCustomerError("");
    try {
      const response = await fetch(`/api/orders?name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Não encontramos pedidos para esses dados.");
      setCustomerOrders(Array.isArray(result.orders) ? result.orders : []);
      if (!result.orders?.length) setCustomerError("Não encontramos pedidos com esses dados.");
    } catch (error) {
      setCustomerOrders([]);
      setCustomerError(error instanceof Error ? error.message : "Não foi possível consultar seus pedidos agora.");
    } finally {
      setCustomerLoading(false);
    }
  };

  const submitOrderDirectly = async () => {
    if (cart.length === 0) { setCheckoutStep(0); setToast("Adicione pelo menos um item ao pedido"); return; }
    if (!customer.name.trim() || !customer.phone.trim()) { setCheckoutStep(2); setToast("Preencha nome e WhatsApp para continuar"); return; }
    if (!details.eventDate || !details.eventTime) { setCheckoutStep(1); setToast("Informe a data e o horário da encomenda"); return; }
    if (delivery.service === "Entrega" && (cleanCep(delivery.cep).length !== 8 || !delivery.street.trim() || !delivery.number.trim() || !delivery.city.trim() || !delivery.state.trim())) { setCheckoutStep(2); setToast("Informe o CEP e o número para preencher o endereço da entrega"); return; }
    if (delivery.service === "Entrega" && (shippingStatus !== "success" || deliveryFee <= 0)) { setCheckoutStep(2); setToast("Aguarde o cálculo da entrega antes de continuar"); return; }
    if (!paymentMethod) { setCheckoutStep(3); setToast("Escolha Pix ou cartão para continuar"); return; }
    const selectedDateTime = new Date(`${details.eventDate}T${details.eventTime}:00`);
    const eventMinutes = selectedDateTime.getHours() * 60 + selectedDateTime.getMinutes();
    const isSunday = selectedDateTime.getDay() === 0;
    const sundayHours = (eventMinutes >= 420 && eventMinutes <= 510) || (eventMinutes >= 750 && eventMinutes <= 960);
    const weekdayHours = eventMinutes >= 480 && eventMinutes <= 1080;
    if ((isSunday && !sundayHours) || (!isSunday && !weekdayHours)) { setCheckoutStep(1); setToast(isSunday ? "Aos domingos: 07:00–08:30 ou 12:30–16:00" : "De segunda a sábado: 08:00–18:00"); return; }
    setOrderSubmitting(true);
    const orderCode = `BB-${Date.now().toString().slice(-6)}`;
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderCode, name: customer.name.trim(), phone: customer.phone.trim(),
          eventDate: details.eventDate, eventTime: details.eventTime, service: delivery.service,
          address: delivery.service === "Entrega" ? formattedAddress : ORIGIN,
          items: cart.map((item) => ({ name: item.name, variant: item.variant, type: item.type, quantity: item.qty, totalCents: Math.round(item.qty * item.unitPrice * 100) })),
          totalCents: Math.round(total * 100),
          paymentMethod: `${paymentMethod} · restante: ${balancePaymentMethod}`,
          personalization: { phrase: details.phrase, age: details.age, decoration: details.decoration, colors: details.colors },
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Não foi possível registrar o pedido.");
      setLastSubmittedOrder({ orderCode: result.orderCode || orderCode, name: customer.name.trim(), eventDate: details.eventDate, eventTime: details.eventTime, service: delivery.service, total, deposit, balance, paymentMethod });
      setOrderSuccessOpen(true);
      setOrderOpen(false);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Não foi possível registrar o pedido. Tente novamente.");
    } finally {
      setOrderSubmitting(false);
    }
  };

  const sendWhatsApp = async () => {
    if (cart.length === 0) {
      setCheckoutStep(0);
      setToast("Adicione pelo menos um item ao pedido");
      return;
    }
if (
  !customer.name.trim() ||
  !customer.phone.trim()
) {
  setCheckoutStep(2);
  setToast("Preencha nome e WhatsApp para continuar");
  return;
}
    if (!details.eventDate || !details.eventTime) {
      setCheckoutStep(1);
      setToast("Informe a data e o horário da encomenda");
      return;
    }
    const selectedDateTime = new Date(
      `${details.eventDate}T${details.eventTime}:00`,
    );
    const hoursUntilOrder =
      (selectedDateTime.getTime() - Date.now()) / (60 * 60 * 1000);
    const leadTimeRuleRespected = hoursUntilOrder >= requiredLeadHours;
    const eventMinutes =
      selectedDateTime.getHours() * 60 + selectedDateTime.getMinutes();
    const isSunday = selectedDateTime.getDay() === 0;
    const sundayHours =
      (eventMinutes >= 7 * 60 && eventMinutes <= 8 * 60 + 30) ||
      (eventMinutes >= 12 * 60 + 30 && eventMinutes <= 16 * 60);
    const weekdayHours = eventMinutes >= 8 * 60 && eventMinutes <= 18 * 60;
    if ((isSunday && !sundayHours) || (!isSunday && !weekdayHours)) {
      setCheckoutStep(1);
      setToast(
        isSunday
          ? "Aos domingos: 07:00–08:30 ou 12:30–16:00"
          : "De segunda a sábado: 08:00–18:00",
      );
      return;
    }
    if (
      delivery.service === "Entrega" &&
      (
        cleanCep(delivery.cep).length !== 8 ||
        !delivery.street.trim() ||
        !delivery.number.trim() ||
        !delivery.city.trim() ||
        !delivery.state.trim()
      )
    ) {
      setCheckoutStep(2);
      setToast("Informe o CEP e o número para preencher o endereço da entrega");
      return;
    }
    if (
      delivery.service === "Entrega" &&
      (shippingStatus !== "success" || deliveryFee <= 0)
    ) {
      setCheckoutStep(2);
      setToast("Aguarde o cálculo da entrega antes de continuar");
      return;
    }
    if (!paymentMethod) {
      setCheckoutStep(3);
      setToast("Escolha Pix ou cartão para continuar");
      return;
    }
    const orderCode = `BB-${Date.now().toString().slice(-6)}`;

    const formatCakeItemForWhatsApp = (item: CartItem) => {
      const parts = item.variant.split(" · ");
      const sizeLabel = parts[0] ?? "";

      const detailParts = parts.slice(1).filter(
        (part) =>
          !/fatias/i.test(part) &&
          !/pessoas/i.test(part) &&
          !/^cerca de/i.test(part),
      );

      const massPart =
        detailParts.find((part) => /^massa /i.test(part)) ?? "";
      const modelPart =
        detailParts.find((part) => /^modelo /i.test(part)) ?? "";

      const remaining = detailParts.filter(
        (part) => part !== massPart && part !== modelPart,
      );

      const filling = remaining[0] ?? "";
      const decoration = remaining.slice(1).join(" · ");

      return [
        `*${item.qty}x ${item.name}${sizeLabel ? ` — ${sizeLabel}` : ""}*`,
        massPart ? `• Massa: ${massPart.replace(/^massa /i, "")}` : "",
        modelPart ? `• Modelo: ${modelPart.replace(/^modelo /i, "")}` : "",
        filling ? `• Recheio: ${filling}` : "",
        decoration ? `• Decoração: ${decoration}` : "",
        `• Valor: *${formatMoney(item.qty * item.unitPrice)}*`,
      ]
        .filter(Boolean)
        .join("\n");
    };

    const formatGiftOrPlanItemForWhatsApp = (item: CartItem) => {
      const publicVariant = item.variant.replace(/ · Forminha [^·]+$/, "");

      return [
        `*${item.qty}x ${item.name}*`,
        publicVariant ? `• ${publicVariant}` : "",
        `• Valor: *${formatMoney(item.qty * item.unitPrice)}*`,
      ]
        .filter(Boolean)
        .join("\n");
    };

    const regularProductBlocks = cart
      .filter(
        (item) =>
          item.type === "cake" ||
          item.type === "gift",
      )
      .map((item) =>
        item.type === "cake"
          ? formatCakeItemForWhatsApp(item)
          : formatGiftOrPlanItemForWhatsApp(item),
      );

    const sweetGroups = new Map<string, CartItem[]>();

    cart
      .filter((item) => item.type === "sweet" || item.type === "bonbon")
      .forEach((item) => {
        const groupName = item.variant.split(" · ")[0] || "Doces & bombons";
        const current = sweetGroups.get(groupName) ?? [];
        current.push(item);
        sweetGroups.set(groupName, current);
      });

    const sweetProductBlocks = Array.from(sweetGroups.entries()).map(
      ([groupName, groupItems]) => {
        const itemLines = groupItems.flatMap((item) => {
          const lines = [
            `• ${item.name} — ${item.qty} un. — *${formatMoney(
              item.qty * item.unitPrice,
            )}*`,
          ];

          if (item.wrapperColor && item.wrapperColor !== "Branca") {
            lines.push(`  Forminha: ${item.wrapperColor}`);
          }

          return lines;
        });

        return [`*${groupName.toUpperCase()}*`, ...itemLines].join("\n");
      },
    );

    const itemsBlock = [...regularProductBlocks, ...sweetProductBlocks].join(
      "\n\n",
    );

    const wrapperColors = Array.from(
      new Set(
        cart
          .filter(
            (item) =>
              (item.type === "sweet" || item.type === "bonbon") &&
              item.wrapperColor &&
              item.wrapperColor !== "Branca",
          )
          .map((item) => item.wrapperColor as string),
      ),
    );

    const personalizationLines = [
      details.phrase && `• Frase: ${details.phrase}`,
      details.age && `• Idade: ${details.age}`,
      details.colors && `• Cores: ${details.colors}`,
      details.decoration && `• Observações da decoração: ${details.decoration}`,
      wrapperColors.length > 0 &&
        `• Forminhas especiais: ${wrapperColors.join(", ")}`,
    ].filter(Boolean);

    const formattedEventDate = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      weekday: "long",
    }).format(selectedDateTime);

    const serviceBlock =
      delivery.service === "Entrega"
        ? [
            "*DATA E ENTREGA*",
            `Data: ${formattedEventDate}`,
            `Horário: ${details.eventTime}`,
            `Endereço: ${formattedAddress}`,
            `Taxa de entrega: ${formatMoney(deliveryFee)}`,
          ].join("\n")
        : [
            "*DATA E RETIRADA*",
            `Data: ${formattedEventDate}`,
            `Horário: ${details.eventTime}`,
            `Retirada: ${ORIGIN}`,
          ].join("\n");

    const paymentSummaryLines = [
      "*PAGAMENTO*",
      `Produtos: ${formatMoney(regularSubtotal)}`,
      couponDiscount
        ? `Cupom ${appliedCoupon} (${couponPercent}%): -${formatMoney(
            couponDiscount,
          )}`
        : "",
      pixDiscount
        ? `Desconto Pix (3%): -${formatMoney(pixDiscount)}`
        : "",
    ].filter(Boolean);

    const paymentDataBlock =
      paymentMethod === "Pix"
        ? [
            "*DADOS PARA PIX*",
            `Chave: ${PIX_KEY}`,
            "Titular: Déborah Bacelar Braga",
            "Banco: Inter",
          ].join("\n")
        : ["*PAGAMENTO POR CARTÃO*", `Link seguro: ${CARD_PAYMENT_URL}`].join(
            "\n",
          );

    const messageBlocks = [
      [`*PEDIDO PELO SITE*`, `Código: *${orderCode}*`].join("\n"),
      ["*CLIENTE*", customer.name, `WhatsApp: ${customer.phone}`].join("\n"),
      ["*ITENS DO PEDIDO*", itemsBlock].join("\n\n"),
      personalizationLines.length > 0
        ? ["*PERSONALIZAÇÃO*", ...personalizationLines].join("\n")
        : "",
      serviceBlock,
      paymentSummaryLines.join("\n"),
      paymentDataBlock,
      [
        "*CONFIRMAÇÃO*",
        "Peço a conferência das informações e da disponibilidade para confirmação do pedido.",
      ].join("\n"),
    ].filter(Boolean);

    const message = messageBlocks.join("\n\n");

    setPendingWhatsAppMessage(message);
    setPendingWhatsAppUrl(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
    );
    setOrderMessageCopied(false);
    setPaymentNoticeOpen(true);
    setOrderSubmitting(false);

    void fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        orderCode,
        name: customer.name,
        phone: customer.phone,
        eventDate: details.eventDate,
        eventTime: details.eventTime,
        service: delivery.service,
        address:
          delivery.service === "Entrega" ? formattedAddress : ORIGIN,
        items: cart.map((item) => ({
          name: item.name,
          variant: item.variant,
          type: item.type,
          quantity: item.qty,
          totalCents: Math.round(item.qty * item.unitPrice * 100),
        })),
        totalCents: Math.round(total * 100),
        paymentMethod: `${paymentMethod} · restante: ${balancePaymentMethod}`,
        summary: {
          productsCents: Math.round(regularSubtotal * 100),
          couponCode: appliedCoupon || "",
          couponDiscountCents: Math.round(couponDiscount * 100),
          pixDiscountCents: Math.round(pixDiscount * 100),
          deliveryCents: Math.round(deliveryFee * 100),
          totalCents: Math.round(total * 100),
          depositCents: Math.round(deposit * 100),
          balanceCents: Math.round(balance * 100),
          balancePaymentMethod,
        },
      }),
    }).catch(() => {
      setToast(
        "A solicitação foi preparada, mas não conseguimos salvar o cadastro agora.",
      );
    });
  };

  const copyWhatsAppMessage = async () => {
    if (!pendingWhatsAppMessage) return;

    try {
      await navigator.clipboard.writeText(pendingWhatsAppMessage);
      setOrderMessageCopied(true);
      setToast("Mensagem do pedido copiada.");
    } catch {
      setToast("Não foi possível copiar a mensagem. Abra o WhatsApp pelo botão ao lado.");
    }
  };

  const cakeSuggestion = () => {
    if (guestCount <= 8) return "O tamanho Mini costuma atender bem até 8 pessoas.";
    if (guestCount <= 15) return "O tamanho P costuma atender de 12 a 15 pessoas.";
    if (guestCount <= 28) return "O tamanho M rende aproximadamente 20 a 28 fatias.";
    if (guestCount <= 40) return "O tamanho G rende aproximadamente 35 a 40 fatias.";
    if (guestCount <= 60) return "O tamanho GG rende aproximadamente 55 a 60 fatias.";
    return "Para mais de 60 pessoas, vale combinar um bolo decorado com bolo de corte.";
  };

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Brigadeiro e Beijinho - início">
          <img
            src="/assets/logo-complete.webp"
            alt="Doceria Brigadeiro & Beijinho"
            width="900"
            height="673"
          />
        </a>
        <nav className={mobileMenu ? "nav-open" : ""} aria-label="Navegação principal">
          <a href="#cardapio" onClick={() => setMobileMenu(false)}>Como pedir</a>
          <a href="#cardapio" onClick={() => setMobileMenu(false)}>Cardápio</a>
          <a href="#galeria" onClick={() => setMobileMenu(false)}>Galeria</a>
          <a href="#avaliacoes" onClick={() => setMobileMenu(false)}>Avaliações</a>
          <a href="#entrega" onClick={() => setMobileMenu(false)}>Entrega</a>
          <a href="#quem-somos" onClick={() => setMobileMenu(false)}>Quem somos</a>
        </nav>
        <div className="header-actions">
          <button
            className="menu-toggle"
            type="button"
            aria-label="Abrir menu"
            aria-expanded={mobileMenu}
            onClick={() => setMobileMenu((open) => !open)}
          >
            <span />
            <span />
          </button>
          <button className="header-cta" type="button" onClick={openCustomerPortal}>
            Já sou cliente
          </button>
          <button
            className="header-cta"
            type="button"
            onClick={() => {
              setOrderOpen(true);
              setCheckoutStep(0);
            }}
          >
            Meu pedido
            {cart.length > 0 && <b>{cart.length}</b>}
          </button>
        </div>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-copy">
          <span className="eyebrow">Bolos e doces artesanais em Belo Horizonte</span>
          <h1>Bolos personalizados para a sua comemoração</h1>
          <p>
            Sim, fazemos bolos personalizados. Você escolhe o tamanho, sabor,
            cores e detalhes da decoração. Também temos doces, bombons, bentôs
            e cupcakes para completar a mesa.
          </p>

          <div className="hero-categories" aria-label="O que você encontra aqui">
            <a href="#cardapio" onClick={() => setCatalogTab("cakes")}>
              <strong>Bolos</strong>
              <span>Personalizados</span>
            </a>
            <a href="#cardapio" onClick={() => setCatalogTab("sweets")}>
              <strong>Doces & bombons</strong>
              <span>Para festas e eventos</span>
            </a>
            <a href="#cardapio" onClick={() => setCatalogTab("gifts")}>
              <strong>Bentôs & cupcakes</strong>
              <span>Presentes e lembranças</span>
            </a>
          </div>

          <div className="hero-buttons">
            <a className="button button-primary" href="#cardapio" onClick={() => setCatalogTab("choose")}>
              Ver cardápio e fazer pedido
            </a>
          </div>
        </div>

        <div className="hero-visual">
          <img
            className="hero-image"
            src="/assets/hero-pimenta-rosa.webp"
            alt="Bolo personalizado Pimenta Rosa da Doceria Brigadeiro & Beijinho"
            width="1560"
            height="1600"
          />
        </div>
      </section>

      <section className="catalog-section" id="cardapio">
        <div className="section-heading">
          <span className="section-kicker">Faça seu pedido aqui</span>
          <h2>O que você precisa?</h2>
          <p>
            Escolha uma opção para começar seu pedido.
          </p>
        </div>

        {catalogTab === "choose" ? (
          <div className="catalog-choice-grid" aria-label="Escolha uma categoria">
            <button type="button" onClick={() => setCatalogTab("cakes")}>
              <span className="catalog-choice-icon">🎂</span>
              <strong>Quero um bolo</strong>
              <small>Bolos personalizados e bolos de corte</small>
            </button>
            <button type="button" onClick={() => setCatalogTab("sweets")}>
              <span className="catalog-choice-icon">🍬</span>
              <strong>Quero doces</strong>
              <small>Doces e bombons para festas e eventos</small>
            </button>
            <button type="button" onClick={() => setCatalogTab("gifts")}>
              <span className="catalog-choice-icon">🎁</span>
              <strong>Quero um presente</strong>
              <small>Bentôs, cupcakes e opções para presentear</small>
            </button>
          </div>
        ) : (
          <>
            <div className="catalog-category-bar">
              <button type="button" onClick={() => setCatalogTab("choose")}>
                ← Escolher outra categoria
              </button>
              <div className="catalog-tabs" role="tablist" aria-label="Categorias">
                <button
                  className={catalogTab === "cakes" ? "active" : ""}
                  onClick={() => setCatalogTab("cakes")}
                  type="button"
                >
                  Bolos
                </button>
                <button
                  className={catalogTab === "sweets" ? "active" : ""}
                  onClick={() => setCatalogTab("sweets")}
                  type="button"
                >
                  Doces & bombons
                </button>
                <button
                  className={catalogTab === "gifts" ? "active" : ""}
                  onClick={() => setCatalogTab("gifts")}
                  type="button"
                >
                  Bentô, Cupcakes & Presentes
                </button>
              </div>
            </div>
          </>
        )}

        {catalogTab === "cakes" && (
          <>
            <div className="cake-guide">
              <div>
                <span className="section-kicker">Sobre nossos bolos</span>
                <h3>Decoração artesanal em chantilly</h3>
              </div>
              <div className="cake-guide-copy">
                <p>
                  <strong>♥ Topo de bolo simples não possui adicional.</strong>{" "}
                  Flores naturais, frutas e aplicações de papel de arroz têm
                  valores conforme o tamanho escolhido e podem ser combinadas.
                </p>
                <p>
                  Trabalhamos exclusivamente com chantilly. Todo bolo decorado
                  acompanha caixa para transporte e duas velinhas simples.
                </p>
              </div>
            </div>
            <div className="cake-category-explanation">
              <div>
                <span className="section-kicker">Entenda os tipos de recheio</span>
                <h3>O que muda entre Clássico, Especial e Gourmet?</h3>
              </div>
              <div className="cake-category-grid">
                <div>
                  <strong>Clássico</strong>
                  <p>Recheios tradicionais e sabores afetivos, como brigadeiro, Ninho e Prestígio.</p>
                </div>
                <div>
                  <strong>Especial</strong>
                  <p>Recheios com combinações mais elaboradas, como Nutella, frutas, nozes e mousses.</p>
                </div>
                <div>
                  <strong>Gourmet</strong>
                  <p>Recheios com ingredientes mais sofisticados, como pistache, amêndoas e castanhas.</p>
                </div>
              </div>
              <p className="cake-category-note">
                A diferença entre as três categorias está no tipo de recheio escolhido. A massa e a cobertura continuam sendo escolhidas separadamente, e os adicionais de decoração são somados ao valor do bolo.
              </p>
            </div>
            <div
              className="static-photo-strip"
              aria-label="Fotos de bolos produzidos pela Doceria Brigadeiro & Beijinho"
            >
              {cakeCatalogGallery.map((photo) => (
                <figure key={photo.src}>
                  <img src={photo.src} alt={photo.alt} />
                </figure>
              ))}
            </div>
            <div className="cake-grid">
              {cakeSizeCatalog.map((cake) => {
                const choice = cakeChoices[cake.id];
                const fillingOptions = cake.fillings[choice.fillingType];
                const decorationTotal =
                  cake.id === "corte"
                    ? 0
                    : choice.decorations.reduce(
                        (sum, optionId) =>
                          sum + cakeDecorationPrice(optionId, cake.id),
                        0,
                      );
                const massAdditional = cakeMassPrice(cake.id, choice.mass);
                const price =
                  cake.prices[choice.fillingType] +
                  decorationTotal +
                  massAdditional;
                const fillingTypeLabel =
                  choice.fillingType === "Classico"
                    ? "Clássico"
                    : choice.fillingType === "Especial"
                      ? "Especial"
                      : "Gourmet";

                return (
                  <article className="product-card cake-card" key={cake.id}>
                    <div className="product-card-head cake-size-head">
                      <div>
                        <span>Escolha pelo tamanho</span>
                        <strong>{cake.subtitle}</strong>
                      </div>
                      <strong>
                        A partir de {formatMoney(Math.min(...Object.values(cake.prices)))}
                      </strong>
                    </div>

                    <h3>{cake.name}</h3>
                    <p>{cake.description}</p>

                    <div className="cake-choice-step">
                      <span>1</span>
                      <label>
                        <small className="cake-choice-title">Tipo de recheio</small>
                        <select
                          value={choice.fillingType}
                          onChange={(event) =>
                            updateCakeChoice(
                              cake.id,
                              "fillingType",
                              event.target.value,
                            )
                          }
                        >
                          <option value="Classico">
                            Clássico · {formatMoney(cake.prices.Classico)}
                          </option>
                          <option value="Especial">
                            Especial · {formatMoney(cake.prices.Especial)}
                          </option>
                          <option value="Gourmet">
                            Gourmet · {formatMoney(cake.prices.Gourmet)}
                          </option>
                        </select>
                      </label>
                    </div>

                    <div className="cake-choice-step">
                      <span>2</span>
                      <label>
                        <small className="cake-choice-title">Sabor do recheio</small>
                        <select
                          value={choice.filling}
                          onChange={(event) =>
                            updateCakeChoice(cake.id, "filling", event.target.value)
                          }
                        >
                          {fillingOptions.map((filling) => (
                            <option key={filling}>{filling}</option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="cake-choice-step">
                      <span>3</span>
                      <label>
                        <small className="cake-choice-title">Massa</small>
                        <select
                          value={choice.mass}
                          onChange={(event) =>
                            updateCakeChoice(cake.id, "mass", event.target.value)
                          }
                        >
                          <option value="Branca">
                            Branca — feita com leite em pó
                          </option>
                          <option value="Chocolate">
                            Chocolate — feita com cacau 50%
                          </option>
                          <option value="Cacau Black">
                            Cacau Black · + {formatMoney(cakeMassPrice(cake.id, "Cacau Black"))}
                          </option>
                        </select>
                      </label>
                    </div>

                    <div className="cake-choice-step">
                      <span>4</span>
                      <div className="cake-static-field">
                        <span>Cobertura</span>
                        <strong>Chantilly</strong>
                      </div>
                    </div>

                    {cake.id !== "corte" &&
                      (() => {
                        const selectedDecorationNames = cakeDecorationOptions
                          .filter((option) =>
                            choice.decorations.includes(option.id),
                          )
                          .map((option) =>
                            option.label.replace(" — sob avaliação", ""),
                          );
                        const decorationSummary =
                          selectedDecorationNames.length === 0
                            ? "Escolher decoração"
                            : selectedDecorationNames.length <= 2
                              ? selectedDecorationNames.join(" + ")
                              : `${selectedDecorationNames[0]} + ${selectedDecorationNames.length - 1} adicionais`;

                        return (
                          <div className="cake-choice-step decoration-step">
                            <span>5</span>
                            <div>
                              <small className="cake-choice-title">Decoração</small>
                              <details className="decoration-picker">
                                <summary>
                                  <span className="decoration-summary-copy">
                                    <strong>{decorationSummary}</strong>
                                  </span>
                                  <span className="decoration-summary-meta">
                                    <em>
                                      {decorationTotal > 0
                                        ? `+ ${formatMoney(decorationTotal)}`
                                        : "sem adicional"}
                                    </em>
                                    <b aria-hidden="true">+</b>
                                  </span>
                                </summary>
                                <div className="decoration-picker-panel">
                                  <p>
                                    Escolha uma ou mais opções. O valor é calculado
                                    conforme o tamanho do bolo.
                                  </p>
                                  <div className="decoration-picker-list">
                                    {cakeDecorationOptions.map((option) => {
                                      const optionPrice = cakeDecorationPrice(
                                        option.id,
                                        cake.id,
                                      );
                                      const selected = choice.decorations.includes(
                                        option.id,
                                      );

                                      return (
                                        <label
                                          className={`decoration-picker-row ${
                                            selected ? "selected" : ""
                                          }`}
                                          key={option.id}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={selected}
                                            onChange={() =>
                                              toggleCakeDecoration(
                                                cake.id,
                                                option.id,
                                              )
                                            }
                                          />
                                          <span>{option.label}</span>
                                          <small>
                                            {optionPrice > 0
                                              ? `+ ${formatMoney(optionPrice)}`
                                              : option.id === "avaliar"
                                                ? "sob avaliação"
                                                : "sem adicional"}
                                          </small>
                                        </label>
                                      );
                                    })}
                                  </div>
                                  <small className="decoration-picker-help">
                                    Todos os pedidos precisam de no mínimo 72 horas
                                    de antecedência. Para sábado ou domingo, são
                                    necessários 5 dias.
                                  </small>
                                </div>
                              </details>
                            </div>
                          </div>
                        );
                      })()}

                    <div className="product-card-footer">
                      <div>
                        <strong>{formatMoney(price)}</strong>
                        <small>
                          {fillingTypeLabel} · {choice.mass}
                          {massAdditional > 0
                            ? ` (+${formatMoney(massAdditional)})`
                            : ""}
                        </small>
                      </div>
                      <button type="button" onClick={() => addCake(cake)}>
                        Adicionar
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
            <p className="catalog-note cake-catalog-note">
              O tamanho Mini é uma ótima escolha para mesversários,
              comemorações íntimas e presentes. Todos os pedidos precisam de
              72 horas de antecedência. Para pedidos com data no sábado ou domingo,
              a antecedência mínima é de 5 dias.
            </p>
          </>
        )}

        {catalogTab === "sweets" && (
          <>
            <div className="sweet-order-rules" aria-label="Regras para pedidos de doces e bombons">
              <div className="sweet-order-rules-head">
                <span className="section-kicker">Antes de escolher seus doces</span>
                <strong>Informações importantes do pedido</strong>
              </div>
              <div className="sweet-order-rules-grid">
                <p><b>Pedido mínimo:</b> 25 unidades por sabor.</p>
                <p><b>Combinação:</b> até 4 sabores em cada cento.</p>
                <p><b>Forminhas:</b> coloridas + R$ 1,00 a cada 25 unidades; acetato + R$ 2,00 a cada 25 unidades.</p>
                <p><b>Disponibilidade:</b> as cores estão sujeitas à disponibilidade e pedidos especiais precisam de antecedência mínima de 72 horas.</p>
              </div>
            </div>
            <div className="flavor-filters" aria-label="Tipos de doces">
              {sweetGroups.map((group) => (
                <button
                  className={sweetGroupId === group.id ? "active" : ""}
                  type="button"
                  key={group.id}
                  onClick={() => setSweetGroupId(group.id)}
                >
                  {group.name}
                </button>
              ))}
            </div>
            <div
              className="static-photo-strip"
              aria-label="Fotos de doces e bombons da Doceria Brigadeiro & Beijinho"
            >
              {sweetsCatalogGallery.map((photo) => (
                <figure key={photo.src}>
                  <img src={photo.src} alt={photo.alt} />
                </figure>
              ))}
            </div>
            <div className="sweet-group-title">
              <div>
                <span>Pedido mínimo: 25 por sabor</span>
                <h3>{activeSweetGroup.name}</h3>
              </div>
              <strong>
                {formatMoney(activeSweetGroup.hundredPrice)} / 100 unidades
              </strong>
            </div>
            <div className="sweet-grid">
              {activeSweetGroup.items.map((sweet) => {
                const quantity = sweetQuantities[sweet.id] ?? 25;
                const wrapperColor = sweetWrappers[sweet.id] ?? "Branca";
                const wrapper =
                  wrapperOptions.find(
                    (option) => option.value === wrapperColor,
                  ) ?? wrapperOptions[0];
                const itemTotal =
                  (activeSweetGroup.hundredPrice / 100) * quantity +
                  (quantity / 25) * wrapper.fee;
                return (
                  <article className="sweet-card" key={sweet.id}>
                    <img
                      className="sweet-photo"
                      src={sweetPhoto(sweet.id, activeSweetGroup.type)}
                      alt={`Foto de ${sweet.name}`}
                    />
                    <div>
                      <h4>{sweet.name}</h4>
                      <p>{sweet.description}</p>
                      <span>
                        {formatMoney(itemTotal)} para {quantity} unidades
                      </span>
                    </div>
                    <div className="sweet-quantity-control">
                      <label>
                        Quantidade
                        <select
                          value={quantity}
                          onChange={(event) =>
                            setSweetQuantities((current) => ({
                              ...current,
                              [sweet.id]: Number(event.target.value),
                            }))
                          }
                        >
                          {sweetQuantityOptions.map((option) => (
                            <option value={option} key={option}>
                              {option} unidades
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Cor da forminha
                        <select
                          value={wrapperColor}
                          onChange={(event) =>
                            setSweetWrappers((current) => ({
                              ...current,
                              [sweet.id]: event.target.value,
                            }))
                          }
                        >
                          {wrapperOptions.map((option) => (
                            <option value={option.value} key={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        onClick={() => addSweet(activeSweetGroup, sweet)}
                      >
                        Adicionar
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

          </>
        )}

        {catalogTab === "gifts" && (
          <div className="gift-grid">
            {gifts.map((gift, index) => (
              <article
                className="gift-card gift-card-with-image"
                key={gift.id}
              >
                <img src={gift.image} alt={gift.name} />
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{gift.name}</h3>
                <p>{gift.description}</p>
                {gift.id === "cupcake" && (
                  <div className="gift-options">
                    <label>
                      Massa
                      <select
                        value={giftChoices.cupcakeMass}
                        onChange={(event) =>
                          setGiftChoices((current) => ({
                            ...current,
                            cupcakeMass: event.target.value,
                          }))
                        }
                      >
                        <option>Branca</option>
                        <option>Chocolate</option>
                      </select>
                    </label>
                    <label>
                      Recheio
                      <select
                        value={giftChoices.cupcakeFilling}
                        onChange={(event) =>
                          setGiftChoices((current) => ({
                            ...current,
                            cupcakeFilling: event.target.value,
                          }))
                        }
                      >
                        <option>Brigadeiro Tradicional</option>
                        <option>Ninho</option>
                      </select>
                    </label>
                    <label>
                      Quantidade
                      <select
                        value={giftChoices.cupcakeQty}
                        onChange={(event) =>
                          setGiftChoices((current) => ({
                            ...current,
                            cupcakeQty: Number(event.target.value),
                          }))
                        }
                      >
                        {cupcakeQuantityOptions.map((quantity) => (
                          <option value={quantity} key={quantity}>
                            {quantity} unidades
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Topper
                      <select
                        value={giftChoices.cupcakeTopper ? "Sim" : "Não"}
                        onChange={(event) =>
                          setGiftChoices((current) => ({
                            ...current,
                            cupcakeTopper: event.target.value === "Sim",
                          }))
                        }
                      >
                        <option value="Não">Sem topper</option>
                        <option value="Sim">Com topper + R$ 6,00 a cada 12 unidades</option>
                      </select>
                    </label>
                  </div>
                )}
                {gift.id === "bento" && (
                  <div className="gift-options">
                    <label>
                      Massa
                      <select
                        value={giftChoices.bentoMass}
                        onChange={(event) =>
                          setGiftChoices((current) => ({
                            ...current,
                            bentoMass: event.target.value,
                          }))
                        }
                      >
                        <option>Branca</option>
                        <option>Chocolate</option>
                      </select>
                    </label>
                    <label>
                      Categoria do recheio
                      <select
                        value={giftChoices.bentoFillingType}
                        onChange={(event) =>
                          setGiftChoices((current) => {
                            const fillingType = event.target.value as "Clássico" | "Especial";
                            return {
                              ...current,
                              bentoFillingType: fillingType,
                              bentoFilling:
                                fillingType === "Especial"
                                  ? specialFillings[0]
                                  : classicFillings[0],
                            };
                          })
                        }
                      >
                        <option value="Clássico">Clássico</option>
                        <option value="Especial">Especial + R$ 5,00</option>
                      </select>
                    </label>
                    <label>
                      Recheio
                      <select
                        value={giftChoices.bentoFilling}
                        onChange={(event) =>
                          setGiftChoices((current) => ({
                            ...current,
                            bentoFilling: event.target.value,
                          }))
                        }
                      >
                        {(giftChoices.bentoFillingType === "Especial"
                          ? specialFillings
                          : classicFillings
                        ).map((filling) => (
                          <option key={filling}>{filling}</option>
                        ))}
                      </select>
                    </label>

                  </div>
                )}
                {gift.id === "bento-combo" && (
                  <div className="gift-options">
                    <label>
                      Massa
                      <select
                        value={giftChoices.comboMass}
                        onChange={(event) =>
                          setGiftChoices((current) => ({
                            ...current,
                            comboMass: event.target.value,
                          }))
                        }
                      >
                        <option>Branca</option>
                        <option>Chocolate</option>
                      </select>
                    </label>
                    <label>
                      Categoria do recheio
                      <select
                        value={giftChoices.comboFillingType}
                        onChange={(event) =>
                          setGiftChoices((current) => {
                            const fillingType = event.target.value as "Clássico" | "Especial";
                            return {
                              ...current,
                              comboFillingType: fillingType,
                              comboFilling:
                                fillingType === "Especial"
                                  ? specialFillings[0]
                                  : classicFillings[0],
                            };
                          })
                        }
                      >
                        <option value="Clássico">Clássico</option>
                        <option value="Especial">Especial + R$ 5,00</option>
                      </select>
                    </label>
                    <label>
                      Recheio
                      <select
                        value={giftChoices.comboFilling}
                        onChange={(event) =>
                          setGiftChoices((current) => ({
                            ...current,
                            comboFilling: event.target.value,
                          }))
                        }
                      >
                        {(giftChoices.comboFillingType === "Especial"
                          ? specialFillings
                          : classicFillings
                        ).map((filling) => (
                          <option key={filling}>{filling}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Sabores dos 6 docinhos
                      <select
                        value={giftChoices.comboSweets}
                        onChange={(event) =>
                          setGiftChoices((current) => ({
                            ...current,
                            comboSweets: event.target.value,
                          }))
                        }
                      >
                        <option>3 Brigadeiros + 3 Ninhos</option>
                        <option>6 Brigadeiros</option>
                        <option>6 Ninhos</option>
                      </select>
                    </label>
                  </div>
                )}
                <div className="gift-card-footer">
                  <strong>
                    {gift.id === "cupcake"
                      ? `${formatMoney(cupcakePriceWithTopper(giftChoices.cupcakeQty, giftChoices.cupcakeTopper))} cada`
                      : gift.id === "bento"
                        ? formatMoney(bentoFillingPrice("bento", giftChoices.bentoFillingType))
                        : gift.id === "bento-combo"
                          ? formatMoney(bentoFillingPrice("bento-combo", giftChoices.comboFillingType))
                          : formatMoney(gift.price)}
                  </strong>
                  <button
                    type="button"
                    onClick={() =>
                      addItem({
                        id: gift.id,
                        name: gift.name,
                        variant:
                          gift.id === "cupcake"
                            ? `Massa ${giftChoices.cupcakeMass.toLowerCase()} · recheio ${giftChoices.cupcakeFilling} · cobertura de chantilly`
                            : gift.id === "bento"
                              ? `Massa ${giftChoices.bentoMass.toLowerCase()} · recheio ${giftChoices.bentoFillingType.toLowerCase()} — ${giftChoices.bentoFilling} · frase personalizada`
                              : gift.id === "bento-combo"
                                ? `Massa ${giftChoices.comboMass.toLowerCase()} · recheio ${giftChoices.comboFillingType.toLowerCase()} — ${giftChoices.comboFilling} · Bentô + 6 docinhos: ${giftChoices.comboSweets}`
                                : "presenteável",
                        type: "gift",
                        qty:
                          gift.id === "cupcake"
                            ? giftChoices.cupcakeQty
                            : gift.minQty,
                        step: gift.id === "cupcake" ? 12 : gift.minQty,
                        unitPrice:
                          gift.id === "cupcake"
                            ? cupcakePriceWithTopper(giftChoices.cupcakeQty, giftChoices.cupcakeTopper)
                            : gift.id === "bento"
                              ? bentoFillingPrice("bento", giftChoices.bentoFillingType)
                              : gift.id === "bento-combo"
                                ? bentoFillingPrice("bento-combo", giftChoices.comboFillingType)
                                : gift.price,
                      })
                    }
                  >
                    Adicionar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="gallery-section" id="galeria">
        <div className="gallery-copy">
          <span className="section-kicker">Feito de verdade</span>
          <h2>Um bolo para cada história</h2>
          <p>
            Cada decoração parte da sua referência e ganha o cuidado artesanal
            da nossa produção. As fotos abaixo são encomendas reais da doceria.
          </p>
          <a href={INSTAGRAM} target="_blank" rel="noreferrer">
            Veja nossos produtos no Instagram <span>→</span>
          </a>
        </div>
        <div className="gallery-grid">
          <figure className="gallery-tall">
            <img src="/assets/cake-theme.webp" alt="Bolo temático personalizado em rosa" />
          </figure>
          <figure>
            <img src="/assets/cake-ribbons.webp" alt="Bolo branco com laços pretos" />
          </figure>
          <figure>
            <img src="/assets/cake-pink.webp" alt="Bolo rosa personalizado para aniversário" />
          </figure>
          <figure className="gallery-wide">
            <img src="/assets/sweets-chocolate.webp" alt="Seleção de doces de chocolate" />
          </figure>
        </div>
      </section>

      <section className="google-reviews-section" id="avaliacoes">
        <div className="google-reviews-heading">
          <div>
            <span className="section-kicker">Avaliações no Google</span>
            <h2>Quem encomenda também conta a experiência</h2>
          </div>
          <div className="google-rating-badge" aria-label="Nota 5,0 de 5 no Google">
            <strong>5,0</strong>
            <span className="google-stars" aria-hidden="true">★★★★★</span>
          </div>
        </div>

        <div className="google-review-cards">
          <article className="google-review-card">
            <div className="google-review-card-head">
              <span className="review-initials" aria-label="Avaliação de cliente">R.</span>
              <span className="google-stars" aria-label="5 de 5 estrelas">★★★★★</span>
            </div>
            <p>
              “O bolo estava simplesmente maravilhoso! Muito gostoso, saboroso e feito com muito
              capricho. A massa estava fofinha, o recheio delicioso e tudo estava na medida certa.
              Além de lindo, estava realmente uma delícia! Todo mundo adorou. Dá para perceber o
              carinho e o cuidado em cada detalhe. Com certeza, recomendo e vou pedir novamente! 💕🎂”
            </p>
          </article>

          <article className="google-review-card">
            <div className="google-review-card-head">
              <span className="review-initials" aria-label="Avaliação de cliente">K.C.L.</span>
              <span className="google-stars" aria-label="5 de 5 estrelas">★★★★★</span>
            </div>
            <p>
              “Adoro tudo que a Débora faz!! Excelente profissional!! Faz tudo com muito carinho e
              capricho!!”
            </p>
          </article>

          <article className="google-review-card">
            <div className="google-review-card-head">
              <span className="review-initials" aria-label="Avaliação de cliente">M.J.</span>
              <span className="google-stars" aria-label="5 de 5 estrelas">★★★★★</span>
            </div>
            <p>
              “Quero agradecer o capricho da Deborah em todos os detalhes do bolo, desde a decoração
              do topo até o cuidado da embalagem, bem embalado e ainda veio duas velinhas. O sabor do
              bolo então nem se fala, muito saboroso, vem bastante recheio na medida certa e uma
              delícia, massa fofinha e leve. Eu amei todos os detalhes. Super indico, muito impecável
              o trabalho da Débora!”
            </p>
          </article>
        </div>

        <div className="google-review-actions">
          <a href={GOOGLE_REVIEWS_URL} target="_blank" rel="noreferrer">
            Ver mais avaliações no Google
          </a>
          <a href={GOOGLE_REVIEW_FORM_URL} target="_blank" rel="noreferrer">
            Avaliar no Google
          </a>
        </div>
      </section>

      <section className="faq-section" id="faq">
        <div className="section-heading">
          <span className="section-kicker">Antes de chamar no WhatsApp</span>
          <h2>Dúvidas frequentes</h2>
          <p>As respostas essenciais estão aqui. Para valores e opções, consulte diretamente o cardápio.</p>
        </div>
        <div className="faq-grid">
          <details className="faq-item">
            <summary>Vocês fazem bolos personalizados?</summary>
            <p>Sim. Você pode escolher tema, cores, frase, idade e detalhes da decoração. O topo simples está incluído; outras decorações são avaliadas conforme a referência.</p>
          </details>
          <details className="faq-item">
            <summary>Quais tamanhos e sabores de bolo vocês têm?</summary>
            <p>Temos Mini, P, M, G e GG, além de bolo de corte. Os sabores ficam organizados por Clássico, Especial e Gourmet na seção de bolos.</p>
          </details>
          <details className="faq-item">
            <summary>Vocês fazem doces e bombons?</summary>
            <p>Sim. Temos brigadeiros, beijinhos, doces especiais, doces finos, bombons, bentôs e cupcakes. Veja as opções e preços no cardápio.</p>
          </details>
          <details className="faq-item">
            <summary>Vocês entregam?</summary>
            <p>Sim. Informe o CEP e o número do endereço no pedido. O endereço é localizado e a taxa de entrega é calculada pela rota.</p>
          </details>
          <details className="faq-item">
            <summary>Como funciona o pagamento e a confirmação?</summary>
            <p>Nos pedidos avulsos, são 60% de entrada e 40% na entrega ou retirada. Aceitamos Pix e cartão. O envio do pedido pelo site é uma solicitação: a data só fica confirmada após conferirmos a disponibilidade e o pagamento.</p>
          </details>
        </div>
        <div className="faq-footer">
          <strong>Não encontrou sua dúvida?</strong>
          <span>Depois de consultar o cardápio, fale conosco pelo WhatsApp para assuntos específicos do seu pedido.</span>
          <a href={WHATSAPP_INFO_URL} target="_blank" rel="noreferrer">Falar sobre meu pedido →</a>
        </div>
      </section>

      <section className="delivery-section" id="entrega">
        <div className="delivery-card location-card">
          <span className="section-kicker">Retirada no Solar do Barreiro</span>
          <div className="location-actions single-action">
            <a href={originMapsUrl} target="_blank" rel="noreferrer">
              Abrir localização no mapa
            </a>
          </div>
          <small>
            Retiradas e entregas devem seguir o horário confirmado no pedido.
            De segunda a sexta, atendemos até as 18h. Após esse horário, a
            encomenda ficará disponível no dia seguinte, a partir das 8h, ou
            conforme nossa disponibilidade. Aos domingos, valem os horários
            exibidos no agendamento.
          </small>
        </div>

        <div className="payment-card delivery-flow-card">
          <span className="section-kicker">Entrega calculada no pedido</span>
          <h2>Digite seu endereço e simule a entrega</h2>
          <p>
            Digite o CEP e o número. O endereço será preenchido automaticamente e
            a taxa será calculada pela distância da rota.
          </p>
          <div className="delivery-simulator">
            <label className="full-field">
              CEP
              <input
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                value={delivery.cep}
                onChange={(event) => {
                  const cep = cleanCep(event.target.value);
                  setDelivery((current) => ({
                    ...current,
                    service: "Entrega",
                    cep,
                    ...(cep.length < 8
                      ? {
                          street: "",
                          neighborhood: "",
                          city: "",
                          state: "",
                          latitude: null,
                          longitude: null,
                        }
                      : {}),
                  }));
                  setCepLookupStatus(cep.length === 8 ? "loading" : "idle");
                  setShippingStatus("idle");
                  setDeliveryFee(0);
                  setShippingError("");

                  if (cep.length === 8) {
                    void lookupCep(cep);
                  }
                }}
                onBlur={() => {
                  if (cleanCep(delivery.cep).length === 8) {
                    void lookupCep(delivery.cep);
                  }
                }}
                placeholder="Digite o CEP"
                maxLength={9}
              />
            </label>
            {cepLookupStatus === "loading" && (
              <small className="delivery-preview-address">Buscando endereço pelo CEP…</small>
            )}
            {cepLookupStatus === "error" && (
              <small className="shipping-error">Confira o CEP informado e tente novamente.</small>
            )}
            {delivery.street && (
              <>
                <label className="full-field">
                  Rua
                  <input type="text" value={delivery.street} readOnly />
                </label>
                <label>
                  Número
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="address-line2"
                    value={delivery.number}
                    onChange={(event) => {
                      setDelivery((current) => ({
                        ...current,
                        number: event.target.value.replace(/\D/g, "").slice(0, 8),
                      }));
                      setShippingStatus("idle");
                      setDeliveryFee(0);
                      setShippingError("");
                    }}
                    placeholder="Número"
                  />
                </label>
                <label className="full-field">
                  Bairro
                  <input type="text" value={delivery.neighborhood} readOnly />
                </label>
                <label>
                  Cidade
                  <input type="text" value={delivery.city} readOnly />
                </label>
                <label>
                  UF
                  <input type="text" value={delivery.state} readOnly />
                </label>
                <label className="full-field">
                  Complemento <span className="optional-label">(opcional)</span>
                  <input
                    type="text"
                    value={delivery.complement}
                    onChange={(event) => {
                      setDelivery((current) => ({
                        ...current,
                        service: "Entrega",
                        complement: event.target.value,
                      }));
                      setShippingStatus("idle");
                      setDeliveryFee(0);
                      setShippingError("");
                    }}
                    placeholder="Apto., bloco, casa..."
                  />
                </label>
              </>
            )}
            <button
              type="button"
              className="cep-button delivery-simulator-button"
              onClick={() => void calculateShipping()}
              disabled={
                shippingStatus === "loading" ||
                cepLookupStatus === "loading" ||
                cleanCep(delivery.cep).length !== 8 ||
                !delivery.street.trim() ||
                !delivery.number.trim()
              }
            >
              {shippingStatus === "loading" ? "Calculando..." : "Calcular entrega"}
            </button>
          </div>
          {shippingError && <p className="shipping-error">{shippingError}</p>}
          {shippingStatus === "loading" && (
            <div className="shipping-loading" aria-live="polite">
              Calculando a taxa de entrega…
            </div>
          )}
          {shippingStatus === "success" && (
            <small className="delivery-preview-address">
              Endereço: {formattedAddress}
            </small>
          )}
          <div className="delivery-preview-summary" aria-live="polite">
            <div>
              <span>Itens selecionados</span>
              <strong>{formatMoney(subtotal)}</strong>
            </div>
            <div>
              <span>Entrega</span>
              <strong>
                {shippingStatus === "success"
                  ? formatMoney(deliveryFee)
                  : "A calcular"}
              </strong>
            </div>
            <div className="delivery-preview-total">
              <span>Total estimado com entrega</span>
              <strong>{formatMoney(deliveryPreviewTotal)}</strong>
            </div>
          </div>
          {cart.length === 0 && (
            <small className="delivery-preview-note">
              Adicione itens no cardápio para visualizar a soma completa.
            </small>
          )}
        </div>
      </section>

      <section className="about-section" id="quem-somos">
        <div className="about-image">
          <img
            src="/assets/about-deborah.webp"
            alt="Deborah Bacelar, responsável pela Doceria Brigadeiro & Beijinho"
          />
          <span>Confeitaria artística em Belo Horizonte</span>
        </div>
        <div className="about-copy">
          <span className="section-kicker">Quem somos</span>
          <h2>Do carinho pelo feito à mão nasceu uma doceria cheia de significado</h2>
          <p>
            À frente da Doceria Brigadeiro & Beijinho está Deborah Bacelar,
            apaixonada por transformar ideias, temas e celebrações em bolos e
            doces que fazem parte das melhores lembranças.
          </p>
          <p>
            Cada encomenda é produzida com olhar artístico, atenção aos
            detalhes e cuidado na escolha das combinações. Aqui, o pedido não é
            apenas uma sobremesa: é uma parte importante da sua comemoração.
          </p>
          <div className="about-signature">
            <img src="/assets/brand-mark.webp" alt="" aria-hidden="true" />
            <div>
              <strong>Deborah Bacelar</strong>
              <span>Doceria Brigadeiro & Beijinho</span>
            </div>
          </div>
        </div>
      </section>

      <section className="instagram-section">
        <div>
          <span className="section-kicker">Inspire-se</span>
          <h2>Veja nossos produtos no Instagram</h2>
          <p>
            Acompanhe os bolos mais recentes, detalhes das decorações e ideias
            para a sua próxima comemoração.
          </p>
          <a href={INSTAGRAM} target="_blank" rel="noreferrer">
            @doceria_brigadeiro_beijinho
          </a>
        </div>
        <img src="/assets/cake-floral.webp" alt="Bolo decorado com flores naturais" />
        <img src="/assets/cake-lilac.webp" alt="Bolo personalizado em tons de lilás" />
      </section>

      <footer>
        <div className="footer-brand">
          <img src="/assets/logo-complete.webp" alt="Brigadeiro & Beijinho" />
          <p>Doces feitos sob encomenda para momentos especiais.</p>
        </div>
        <div>
          <strong>Atendimento</strong>
          <a href={WHATSAPP_INFO_URL}>WhatsApp</a>
          <a href={WHATSAPP_CATALOG}>Catálogo</a>
          <a href={INSTAGRAM}>Instagram</a>
        </div>
        <div>
          <strong>Retirada</strong>
          <p>Rua Antônio Eustáquio Pinheiro, 50</p>
          <p>Solar do Barreiro · Belo Horizonte/MG</p>
          <a href={originMapsUrl}>Abrir no mapa</a>
        </div>
        <div className="footer-note">
          <strong>Importante</strong>
          <p>Atendimento no local somente para retirada de encomendas.</p>
          <p>Decorações são produzidas a partir de referências e podem apresentar variações artesanais.</p>
        </div>
      </footer>

      {cart.length > 0 && !orderOpen && (
        <button
          className="cart-bar"
          type="button"
          onClick={() => {
            setOrderOpen(true);
            setCheckoutStep(0);
          }}
        >
          <span>
            <b>{cart.length}</b> {cart.length === 1 ? "item" : "itens"}
          </span>
          <strong>{formatMoney(total)}</strong>
          <em>Revisar pedido →</em>
        </button>
      )}

      <div className="floating-actions">
        <button
          className="assistant-teaser"
          type="button"
          onClick={() => setAssistantOpen((open) => !open)}
          aria-expanded={assistantOpen}
        >
          <span>Como posso te ajudar?</span>
          <b aria-hidden="true">✦</b>
        </button>
        <a
          className="whatsapp-float"
          href={WHATSAPP_INFO_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Falar pelo WhatsApp"
        >
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="M16 3a12.5 12.5 0 0 0-10.9 18.6L3.5 28l6.6-1.6A12.5 12.5 0 1 0 16 3Zm0 22.8c-2 0-3.9-.6-5.5-1.6l-.4-.2-3.9 1 1-3.8-.2-.4A10.2 10.2 0 1 1 16 25.8Zm5.6-7.6c-.3-.1-1.8-.9-2.1-1-.3-.1-.5-.1-.7.2l-1 1.2c-.2.2-.4.2-.7.1-1.9-.9-3.2-1.8-4.5-4-.3-.5.3-.5.9-1.7.1-.2.1-.4 0-.6l-.9-2.1c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.9 0 1.7 1.2 3.3 1.4 3.5.2.2 2.4 3.7 5.9 5.2.8.4 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 1.8-.7 2.1-1.5.3-.7.3-1.4.2-1.5-.2-.2-.5-.3-.8-.4Z" />
          </svg>
        </a>
      </div>

      {assistantOpen && (
        <aside className="assistant-panel" aria-label="Assistente virtual">
          <div className="assistant-head">
            <div>
              <span>Assistente virtual</span>
              <strong>Doce Ajuda</strong>
            </div>
            <button type="button" onClick={() => setAssistantOpen(false)} aria-label="Fechar">
              ×
            </button>
          </div>
          <div className="assistant-message">{assistantAnswer}</div>
          <div className="assistant-guest">
            <label htmlFor="guest-count">Quantidade de convidados</label>
            <input
              id="guest-count"
              type="number"
              min="1"
              value={guestCount}
              onChange={(event) => setGuestCount(Number(event.target.value) || 1)}
            />
          </div>
          <div className="assistant-options">
            <button type="button" onClick={() => setAssistantAnswer(cakeSuggestion())}>
              Qual tamanho de bolo?
            </button>
            <button
              type="button"
              onClick={() =>
                setAssistantAnswer(
                  `Como referência, considere de ${guestCount * 4} a ${
                    guestCount * 6
                  } docinhos para ${guestCount} convidados, ajustando conforme o restante do cardápio.`,
                )
              }
            >
              Quantos docinhos?
            </button>
            <button
              type="button"
              onClick={() =>
                setAssistantAnswer(
                  "Na finalização, escolha entrega, informe o endereço completo e calcule a taxa. Atendemos em um raio de até 50 km e a taxa é arredondada para cima até o próximo valor par.",
                )
              }
            >
              Como funciona o frete?
            </button>
            <button
              type="button"
              onClick={() =>
                setAssistantAnswer(
                  "O pedido é confirmado com 60% de entrada por Pix ou cartão via link. O desconto de 3% é exclusivo para Pix. O restante fica para a entrega ou retirada.",
                )
              }
            >
              Pagamento e prazo
            </button>
          </div>
          <a href={WHATSAPP_INFO_URL} target="_blank" rel="noreferrer">
            Ainda precisa de ajuda? Fale conosco
          </a>
        </aside>
      )}

      {orderOpen && (
        <div className="order-overlay" role="dialog" aria-modal="true" aria-label="Finalizar pedido">
          <div className="order-drawer">
            <div className="order-head">
              <div>
                <span>Pedido on-line</span>
                <h2>Finalize em poucos passos</h2>
              </div>
              <button type="button" onClick={() => setOrderOpen(false)} aria-label="Fechar pedido">
                ×
              </button>
            </div>
            <div className="order-progress">
              {["Itens", "Detalhes", "Cadastro", "Revisão"].map((label, index) => (
                <button
                  type="button"
                  key={label}
                  className={checkoutStep === index ? "active" : checkoutStep > index ? "done" : ""}
                  onClick={() => setCheckoutStep(index)}
                >
                  <span>{checkoutStep > index ? "✓" : index + 1}</span>
                  {label}
                </button>
              ))}
            </div>

            <div className="order-content">
              {checkoutStep === 0 && (
                <section className="order-step">
                  <div className="step-title">
                    <span>Etapa 1</span>
                    <h3>Revise os itens</h3>
                  </div>
                  {cart.length === 0 ? (
                    <div className="empty-cart">
                      <img src="/assets/brand-mark.webp" alt="" aria-hidden="true" />
                      <h4>Seu pedido ainda está vazio</h4>
                      <p>Feche esta janela e escolha seus produtos no cardápio.</p>
                    </div>
                  ) : (
                    <div className="cart-items">
                      {cart.map((item) => (
                        <article key={item.key}>
                          <div>
                            <span>
                              {item.type === "cake"
                                ? "Bolo"
                                : item.type === "gift"
                                  ? "Presente"
                                  : item.type === "plan"
                                    ? "Pacote"
                                    : "Doces"}
                            </span>
                            <h4>{item.name}</h4>
                            <p>{item.variant}</p>
                            <button type="button" onClick={() => removeItem(item.key)}>
                              Remover
                            </button>
                          </div>
                          <div className="quantity-control">
                            <button type="button" onClick={() => changeQuantity(item.key, -1)} aria-label={`Diminuir ${item.name}`}>
                              −
                            </button>
                            <b>{item.qty}</b>
                            <button type="button" onClick={() => changeQuantity(item.key, 1)} aria-label={`Aumentar ${item.name}`}>
                              +
                            </button>
                            <strong>{formatMoney(item.qty * item.unitPrice)}</strong>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {checkoutStep === 1 && (
                <section className="order-step">
                  <div className="step-title">
                    <span>Etapa 2</span>
                    <h3>Conte como será a comemoração</h3>
                  </div>
                  <div className="form-grid">
                    <label>
                      Escolha a data *
                      <select
                        value={details.eventDate}
                        onChange={(event) => {
                          setDetails((current) => ({
                            ...current,
                            eventDate: event.target.value,
                            eventTime: "",
                          }));
                        }}
                      >
                        <option value="">Selecione uma data</option>
                        {dateOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Escolha o horário *
                      <select
                        value={details.eventTime}
                        disabled={!details.eventDate}
                        onChange={(event) =>
                          setDetails((current) => ({ ...current, eventTime: event.target.value }))
                        }
                      >
                        <option value="">
                          {details.eventDate
                            ? availableTimeOptions.length > 0
                              ? "Selecione um horário"
                              : "Sem horários disponíveis nesta data"
                            : "Escolha a data primeiro"}
                        </option>
                        {availableTimeOptions.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                      <small className="availability-note">
                        A data e o horário escolhidos são uma preferência para o seu
                        pedido. Vamos conferir a disponibilidade da agenda e a
                        antecedência necessária antes de confirmar a encomenda.
                      </small>
                    </label>
                    <label>
                      Escrita ou frase no bolo
                      <input
                        type="text"
                        value={details.phrase}
                        onChange={(event) =>
                          setDetails((current) => ({ ...current, phrase: event.target.value }))
                        }
                        placeholder="Ex.: Feliz aniversário, Maria!"
                      />
                    </label>
                    <label>
                      Nome ou idade
                      <input
                        type="text"
                        value={details.age}
                        onChange={(event) =>
                          setDetails((current) => ({ ...current, age: event.target.value }))
                        }
                        placeholder="Ex.: 28 anos"
                      />
                    </label>
                    <label className="full-field">
                      Cores principais
                      <input
                        type="text"
                        value={details.colors}
                        onChange={(event) =>
                          setDetails((current) => ({ ...current, colors: event.target.value }))
                        }
                        placeholder="Ex.: rosa claro, branco e dourado"
                      />
                    </label>
                    <label className="full-field">
                      Descreva a decoração desejada
                      <textarea
                        rows={4}
                        value={details.decoration}
                        onChange={(event) =>
                          setDetails((current) => ({ ...current, decoration: event.target.value }))
                        }
                        placeholder="Tema, estilo, detalhes importantes e referência..."
                      />
                    </label>
                    <p className="form-hint full-field order-deadline-hint">
                      <strong>Atenção ao agendamento:</strong> você pode selecionar qualquer
                      data disponível no calendário e finalizar a solicitação do pedido.
                      A data e o horário não ficam reservados automaticamente.
                      <br />
                      <strong>Antecedência mínima recomendada:</strong> 72 horas nos dias úteis
                      e 5 dias para pedidos com data no sábado ou domingo.
                      <br />
                      <strong>Segunda a sábado:</strong> 08:00 às 18:00 ·{" "}
                      <strong>Domingo:</strong> 07:00 às 08:30 e 12:30 às 16:00.
                      <br />
                      Mesmo que o prazo de antecedência ou a disponibilidade não sejam atendidos,
                      o pedido poderá ser enviado. A confirmação será feita após
                      a conferência da agenda e das regras de produção.
                    </p>
                  </div>
                </section>
              )}

              {checkoutStep === 2 && (
                <section className="order-step">
                  <div className="step-title">
                    <span>Etapa 3</span>
                    <h3>Cadastro e recebimento</h3>
                  </div>
                  <div className="form-grid">
                    <label className="full-field">
                      Nome completo *
                      <input
                        type="text"
                        value={customer.name}
                        onChange={(event) =>
                          setCustomer((current) => ({ ...current, name: event.target.value }))
                        }
                        placeholder="Como podemos chamar você?"
                      />
                    </label>
                    <label className="full-field">
                      WhatsApp *
                      <input
                        type="tel"
                        value={customer.phone}
                        onChange={(event) =>
                          setCustomer((current) => ({ ...current, phone: event.target.value }))
                        }
                        placeholder="(31) 99999-9999"
                      />
                    </label>
                  </div>
                  <div className="service-selector">
                    <button
                      type="button"
                      className={delivery.service === "Retirada" ? "active" : ""}
                      onClick={() =>
                        setDelivery((current) => ({
                          ...current,
                          service: "Retirada",
                        }))
                      }
                    >
                      <strong>Retirada</strong>
                      <span>{ORIGIN}</span>
                    </button>
                    <button
                      type="button"
                      className={delivery.service === "Entrega" ? "active" : ""}
                      onClick={() =>
                        setDelivery((current) => ({
                          ...current,
                          service: "Entrega",
                        }))
                      }
                    >
                      <strong>Entrega</strong>
                      <span>Digite o CEP, informe o número e veja a taxa antes de finalizar</span>
                    </button>
                  </div>
                  <p className="service-schedule-note">
                    <strong>Importante:</strong> a retirada ou entrega deve
                    acontecer no horário confirmado. De segunda a sexta, após
                    as 18h, a encomenda ficará disponível no dia seguinte, a
                    partir das 8h, ou conforme nossa disponibilidade. Aos
                    domingos, siga o horário selecionado no pedido.
                  </p>
                  {delivery.service === "Retirada" && (
                    <div className="pickup-notice">
                      <strong>Retirada no Solar do Barreiro</strong>
                      <span>{ORIGIN}</span>
                      <p>
                        Se a retirada for feita por Uber, motorista de aplicativo
                        ou terceiro, o transporte é de responsabilidade do cliente.
                        Não nos responsabilizamos por atrasos, manuseio ou danos
                        durante o trajeto.
                      </p>
                    </div>
                  )}
                  {delivery.service === "Entrega" && (
                    <div className="form-grid delivery-checkout">
                      <label className="full-field">
                        CEP *
                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="postal-code"
                          value={delivery.cep}
                          onChange={(event) => {
                            const cep = cleanCep(event.target.value);
                            setDelivery((current) => ({
                              ...current,
                              cep,
                              ...(cep.length < 8
                                ? {
                                    street: "",
                                    neighborhood: "",
                                    city: "",
                                    state: "",
                                  }
                                : {}),
                            }));
                            setCepLookupStatus(cep.length === 8 ? "loading" : "idle");
                            setShippingStatus("idle");
                            setDeliveryFee(0);
                            setShippingError("");

                            if (cep.length === 8) {
                              void lookupCep(cep);
                            }
                          }}
                          onBlur={() => {
                            if (cleanCep(delivery.cep).length === 8) {
                              void lookupCep(delivery.cep);
                            }
                          }}
                          placeholder="Digite o CEP"
                          maxLength={9}
                        />
                      </label>
                      {cepLookupStatus === "loading" && (
                        <div className="shipping-loading full-field" aria-live="polite">
                          Buscando endereço pelo CEP…
                        </div>
                      )}
                      {cepLookupStatus === "error" && (
                        <p className="shipping-error full-field">
                          Confira o CEP informado e tente novamente.
                        </p>
                      )}
                      {delivery.street && (
                        <>
                          <label className="full-field">
                            Rua
                            <input type="text" value={delivery.street} readOnly />
                          </label>
                          <label>
                            Número *
                            <input
                              type="text"
                              inputMode="numeric"
                              value={delivery.number}
                              onChange={(event) => {
                                setDelivery((current) => ({
                                  ...current,
                                  number: event.target.value.replace(/\D/g, "").slice(0, 8),
                                }));
                                setShippingStatus("idle");
                                setDeliveryFee(0);
                                setShippingError("");
                              }}
                              placeholder="Número"
                            />
                          </label>
                          <label className="full-field">
                            Bairro
                            <input type="text" value={delivery.neighborhood} readOnly />
                          </label>
                          <label>
                            Cidade
                            <input type="text" value={delivery.city} readOnly />
                          </label>
                          <label>
                            UF
                            <input type="text" value={delivery.state} readOnly />
                          </label>
                          <label className="full-field">
                            Complemento <span className="optional-label">(opcional)</span>
                            <input
                              type="text"
                              value={delivery.complement}
                              onChange={(event) => {
                                setDelivery((current) => ({
                                  ...current,
                                  complement: event.target.value,
                                }));
                                setShippingStatus("idle");
                                setDeliveryFee(0);
                                setShippingError("");
                              }}
                              placeholder="Apto., bloco, casa..."
                            />
                          </label>
                        </>
                      )}
                      <button
                        type="button"
                        className="cep-button"
                        onClick={() => void calculateShipping()}
                        disabled={
                          shippingStatus === "loading" ||
                          cepLookupStatus === "loading" ||
                          cleanCep(delivery.cep).length !== 8 ||
                          !delivery.street.trim() ||
                          !delivery.number.trim()
                        }
                      >
                        {shippingStatus === "loading"
                          ? "Calculando..."
                          : "Calcular entrega"}
                      </button>
                      {shippingError && (
                        <p className="shipping-error full-field">{shippingError}</p>
                      )}
                      {shippingStatus === "loading" && (
                        <div className="shipping-loading full-field" aria-live="polite">
                          Calculando a taxa de entrega…
                        </div>
                      )}
                      {shippingStatus === "success" && (
                        <div className="checkout-freight-result full-field" aria-live="polite">
                          <div className="freight-price freight-total">
                            <span>Taxa de entrega</span>
                            <strong>{formatMoney(deliveryFee)}</strong>
                          </div>
                          <button type="button" onClick={() => void calculateShipping()}>
                            Recalcular entrega
                          </button>
                        </div>
                      )}
                      <p className="delivery-contact-note full-field">
                        Mantenha o telefone informado no cadastro disponível. Se
                        houver dificuldade para localizar o endereço ou complemento,
                        o entregador poderá entrar em contato por ligação ou WhatsApp.
                      </p>
                    </div>
                  )}
                </section>
              )}

              {checkoutStep === 3 && (
                <section className="order-step">
                  <div className="step-title">
                    <span>Etapa 4</span>
                    <h3>Confira os valores</h3>
                  </div>
                  <div className="coupon-card">
                    <div>
                      <span>Cupom de desconto</span>
                      <strong>Tem um cupom?</strong>
                      <p>Digite o código para conferir o desconto antes de pagar.</p>
                    </div>
                    <div className="coupon-entry">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(event) =>
                          setCouponInput(event.target.value.toUpperCase())
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            applyCoupon();
                          }
                        }}
                        placeholder="Digite seu cupom"
                        aria-label="Cupom de desconto"
                      />
                      <button type="button" onClick={applyCoupon}>
                        Aplicar
                      </button>
                    </div>
                    {appliedCoupon && (
                      <div className="coupon-applied">
                        <span>
                          Cupom <strong>{appliedCoupon}</strong> aplicado:{" "}
                          {couponPercent}% de desconto
                        </span>
                        <button type="button" onClick={removeCoupon}>
                          Remover
                        </button>
                      </div>
                    )}
                    <small>
                      Cupom e desconto no Pix podem ser combinados nos produtos
                      avulsos. O pacote de mesversário já possui 15% de desconto
                      e não recebe desconto adicional.
                    </small>
                  </div>
                  <div className="review-summary">
                    {regularSubtotal > 0 && (
                      <div><span>Produtos</span><strong>{formatMoney(regularSubtotal)}</strong></div>
                    )}
                    {couponDiscount > 0 && (
                      <div className="discount-line">
                        <span>Cupom {appliedCoupon} · {couponPercent}%</span>
                        <strong>-{formatMoney(couponDiscount)}</strong>
                      </div>
                    )}
                    {pixDiscount > 0 && (
                      <div className="discount-line">
                        <span>Desconto no Pix · 3%</span>
                        <strong>-{formatMoney(pixDiscount)}</strong>
                      </div>
                    )}
                    {deliveryFee > 0 && (
                      <div><span>Taxa de entrega</span><strong>{formatMoney(deliveryFee)}</strong></div>
                    )}
                    <div className="total-line"><span>Valor total</span><strong>{formatMoney(total)}</strong></div>
                    {regularOrderTotal > 0 && (
                      <div className="payment-split">
                        <div>
                          <span>Entrada do pedido · 60%</span>
                          <strong>{formatMoney(regularOrderTotal * 0.6)}</strong>
                        </div>
                        <div>
                          <span>Restante do pedido · 40%</span>
                          <strong>{formatMoney(balance)}</strong>
                        </div>
                      </div>
                    )}
                    <div className="payment-due-now">
                      <span>Pagamento inicial</span>
                      <strong>{formatMoney(deposit)}</strong>
                    </div>
                  </div>
                  <div className="payment-choice-heading">
                    <span>Forma de pagamento *</span>
                    <p>As informações aparecem somente após a sua escolha.</p>
                  </div>
                  <div className="review-payment">
                    <button
                      type="button"
                      className={paymentMethod === "Pix" ? "active" : ""}
                      onClick={() => setPaymentMethod("Pix")}
                    >
                      <span>Pagamento</span>
                      <strong>Pix</strong>
                      <small>3% nos produtos avulsos</small>
                    </button>
                    <button
                      type="button"
                      className={paymentMethod === "Cartão" ? "active" : ""}
                      onClick={() => setPaymentMethod("Cartão")}
                    >
                      <span>Pagamento</span>
                      <strong>Cartão de crédito</strong>
                      <small>Sem desconto adicional de 3%</small>
                    </button>
                  </div>
                  {paymentMethod === "Pix" && (
                    <div className="selected-payment-details">
                      <span>
                        {regularSubtotal > 0
                          ? "O desconto de 3% no Pix foi aplicado aos produtos avulsos." : ""}{" "}
                        Pagamento inicial de {formatMoney(deposit)}.
                      </span>
                      <strong>{PIX_KEY}</strong>
                      <small>Déborah Bacelar Braga · Banco Inter</small>
                      <button type="button" onClick={copyPix}>
                        {copied ? "Chave copiada!" : "Copiar chave Pix"}
                      </button>
                    </div>
                  )}
                  {paymentMethod === "Cartão" && (
                    <div className="selected-payment-details card-selected">
                      <span>Cartão de crédito</span>
                      <strong>Pagamento por link seguro</strong>
                      <small>
                        O pagamento inicial é de {formatMoney(deposit)}. O desconto
                        adicional de 3% é exclusivo para Pix e não é aplicado ao
                        cartão de crédito. Os dados do cartão são preenchidos somente
                        na página segura de pagamento.
                      </small>
                      <a
                        href={CARD_PAYMENT_URL}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Abrir link seguro do cartão
                      </a>
                    </div>
                  )}
                  {regularOrderTotal > 0 && (
                    <div className="balance-payment-block">
                      <div className="payment-choice-heading">
                        <span>Como pretende pagar o restante de 40%?</span>
                        <p>
                          Esta escolha ficará registrada no resumo do pedido.
                        </p>
                      </div>
                      <div className="review-payment balance-payment-options">
                        {(["Pix", "Cartão", "Dinheiro"] as const).map(
                          (method) => (
                            <button
                              type="button"
                              key={method}
                              className={
                                balancePaymentMethod === method ? "active" : ""
                              }
                              onClick={() => setBalancePaymentMethod(method)}
                            >
                              <span>Restante</span>
                              <strong>{method}</strong>
                              <small>
                                {method === "Dinheiro"
                                  ? "Valor exato"
                                  : method === "Cartão"
                                    ? "Link seguro"
                                    : "Chave Pix"}
                              </small>
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                  <div className="deposit-policy-notice">
                    <strong>Importante sobre a entrada</strong>
                    <p>
                      O valor pago como entrada não é reembolsável em caso de
                      cancelamento pelo cliente. O valor poderá ser utilizado em
                      uma nova data por meio de reagendamento, conforme
                      disponibilidade da agenda.
                    </p>
                  </div>
                  <p className="review-note">
                    O envio abaixo não confirma automaticamente a data. Aguarde a
                    conferência da disponibilidade e dos detalhes antes de efetuar o
                    pagamento.
                  </p>
                  {balancePaymentMethod === "Dinheiro" && (
                  <p className="cash-payment-note">
                    <strong>Pagamento em dinheiro:</strong> caso o restante seja
                    pago na entrega ou retirada, separe o valor exato. Não
                    disponibilizamos troco.
                  </p>
                  )}
                </section>
              )}
            </div>

            <div className="order-footer">
              <div>
                <span>Total estimado</span>
                <strong>{formatMoney(total)}</strong>
              </div>
              <div>
                {checkoutStep > 0 && (
                  <button type="button" className="back-button" onClick={() => setCheckoutStep((step) => step - 1)}>
                    Voltar
                  </button>
                )}
                {checkoutStep < 3 ? (
                  <button
                    type="button"
                    className="next-button"
                    disabled={checkoutStep === 0 && cart.length === 0}
                    onClick={() => setCheckoutStep((step) => Math.min(3, step + 1))}
                  >
                    Continuar
                  </button>
                ) : (
                  <button
                    type="button"
                    className="whatsapp-button"
                    onClick={() => void submitOrderDirectly()}
                    disabled={orderSubmitting}
                  >
                    {orderSubmitting
                      ? "Salvando cadastro..."
                      : "Enviar pedido"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {paymentNoticeOpen && (
        <div
          className="payment-notice-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Prazo para confirmação do pedido"
        >
          <div className="payment-notice-modal">
            <span>Antes de enviar</span>
            <h2>Seu pedido está pronto para o WhatsApp</h2>
            <p>
              Sua solicitação está pronta para o WhatsApp. A mensagem completa será
              preenchida automaticamente para você conferir e enviar.
            </p>
            <p>
              <strong>ATENÇÃO: a disponibilidade da data e do horário escolhidos ainda
              NÃO foi confirmada.</strong>
            </p>
            <p>
              Você está solicitando um pedido para uma data que pode já estar ocupada
              ou que pode não seguir as regras de agendamento. A antecedência mínima é
              de 72 horas nos dias úteis e de 5 dias para pedidos com data no sábado
              ou domingo.
            </p>
            <p>
              <strong>Você pode finalizar o pedido mesmo assim.</strong> Envie a solicitação
              pelo WhatsApp para que possamos verificar a agenda e confirmar se será
              possível realizar o seu pedido na data e horário escolhidos.
            </p>
            <p>
              Após a conferência, o pedido precisa ter o pagamento realizado em até 48 horas
              para que a reserva seja confirmada.
            </p>
            <p>
              Sem o pagamento dentro do prazo, o pedido não será confirmado.
              Depois desse período, será necessário consultar novamente se ainda
              é possível realizar a produção para a data escolhida.
            </p>
            <p>
              A entrada paga não é reembolsável em caso de cancelamento pelo
              cliente, mas poderá ser transferida para uma nova data por
              reagendamento, conforme disponibilidade.
            </p>
            <div>
              <button
                type="button"
                onClick={() => setPaymentNoticeOpen(false)}
              >
                Voltar e revisar
              </button>
              <button
                type="button"
                onClick={() => void copyWhatsAppMessage()}
              >
                {orderMessageCopied ? "Mensagem copiada!" : "Copiar pedido"}
              </button>
              <button
                type="button"
                onClick={() => {
                  const url = pendingWhatsAppUrl;
                  setPaymentNoticeOpen(false);
                  if (url) {
                    window.open(url, "_blank", "noopener,noreferrer");
                  }
                }}
              >
                Abrir WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {orderSuccessOpen && lastSubmittedOrder && (
        <div className="payment-notice-overlay" role="dialog" aria-modal="true" aria-label="Pedido recebido">
          <div className="payment-notice-modal customer-portal-modal">
            <span>Pedido recebido</span>
            <h2>Seu pedido foi registrado</h2>
            <p>Obrigada, {lastSubmittedOrder.name}! O pedido <strong>{lastSubmittedOrder.orderCode}</strong> foi enviado para nossa organização de pedidos.</p>
            <div className="order-success-summary">
              <div><span>Data solicitada</span><strong>{lastSubmittedOrder.eventDate} às {lastSubmittedOrder.eventTime}</strong></div>
              <div><span>Atendimento</span><strong>{lastSubmittedOrder.service}</strong></div>
              <div><span>Valor total</span><strong>{formatMoney(lastSubmittedOrder.total)}</strong></div>
              <div><span>Pagamento inicial</span><strong>{formatMoney(lastSubmittedOrder.deposit)}</strong></div>
              {lastSubmittedOrder.balance > 0 && <div><span>Restante</span><strong>{formatMoney(lastSubmittedOrder.balance)}</strong></div>}
            </div>
            <div className="payment-notice-info">
              <strong>Próximos passos</strong>
              <p>
                Seu pedido foi recebido com sucesso! Agora vamos conferir a
                disponibilidade da data e horário escolhidos.
              </p>
              <p>
                Após essa confirmação, entraremos em contato pelo WhatsApp para
                finalizar os detalhes do pedido e orientar sobre o pagamento da entrada.
              </p>
            </div>
            <div>
              <button type="button" onClick={() => { setOrderSuccessOpen(false); setCart([]); }}>Fechar</button>
              <button type="button" onClick={() => { setOrderSuccessOpen(false); openCustomerPortal(); }}>Ver meus pedidos</button>
            </div>
          </div>
        </div>
      )}

      {customerPortalOpen && (
        <div className="payment-notice-overlay" role="dialog" aria-modal="true" aria-label="Meus pedidos">
          <div className="payment-notice-modal customer-portal-modal">
            <span>Área do cliente</span>
            <h2>Meus pedidos</h2>
            {customerOrders.length === 0 ? (
              <>
                <p>Informe o mesmo nome e WhatsApp usados nos seus pedidos.</p>
                <div className="customer-portal-fields">
                  <label>Nome<input type="text" value={customerLookupName} onChange={(e) => setCustomerLookupName(e.target.value)} placeholder="Seu nome completo" /></label>
                  <label>WhatsApp<input type="tel" value={customerLookupPhone} onChange={(e) => setCustomerLookupPhone(e.target.value)} placeholder="(31) 99999-9999" /></label>
                </div>
                {customerError && <p className="customer-portal-error">{customerError}</p>}
                <div>
                  <button type="button" onClick={() => setCustomerPortalOpen(false)}>Fechar</button>
                  <button type="button" onClick={() => void lookupCustomerOrders()} disabled={customerLoading}>{customerLoading ? "Consultando..." : "Ver meus pedidos"}</button>
                </div>
              </>
            ) : (
              <>
                <p>Encontramos {customerOrders.length} pedido(s).</p>
                <div className="customer-order-list">
                  {customerOrders.map((order) => (
                    <article key={order.orderCode} className="customer-order-card">
                      <div><strong>{order.orderCode}</strong><span>{order.eventDateLabel} · {order.eventTime}</span></div>
                      <div><span>{order.status}</span><strong>{formatMoney(order.totalCents / 100)}</strong></div>
                      <p>{order.itemsText}</p>
                      <small>{order.service}{order.address ? ` · ${order.address}` : ""}</small>
                    </article>
                  ))}
                </div>
                <div><button type="button" onClick={() => setCustomerOrders([])}>Consultar outro</button><button type="button" onClick={() => setCustomerPortalOpen(false)}>Fechar</button></div>
              </>
            )}
          </div>
        </div>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}

    </main>
  );
}