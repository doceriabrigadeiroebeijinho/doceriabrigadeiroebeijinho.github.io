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
const COUPONS = {
  DOCE5: 5,
  DOCE10: 10,
} as const;
type CouponCode = keyof typeof COUPONS;
type PlanPaymentMode = "Mensal" | "À vista";
type BalancePaymentMethod = "Pix" | "Cartão" | "Dinheiro";

const sweetQuantityOptions = [25, 50, 75, 100, 125, 150, 175, 200];

const cakeDecorationOptions = [
  { id: "topo", label: "Topo de bolo simples", price: 0 },
  { id: "flores", label: "Flores naturais", price: 10 },
  { id: "papel-arroz", label: "Papel de arroz", price: 20 },
  { id: "avaliar", label: "Outra decoração — sob avaliação", price: 0 },
];

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

type CartType = "cake" | "sweet" | "bonbon" | "gift" | "plan";

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
    prices: { mini: 110, p: 155, m: 190, g: 295, gg: 390 },
  },
  {
    id: "bolo-especial",
    name: "Bolo Especial",
    eyebrow: "Combinações marcantes",
    description:
      "Recheios com frutas, Nutella, nozes e mousses para deixar a comemoração ainda mais especial.",
    fillings: specialFillings,
    prices: { mini: 130, p: 185, m: 220, g: 340, gg: 455 },
  },
  {
    id: "bolo-gourmet",
    name: "Bolo Gourmet",
    eyebrow: "Ingredientes selecionados",
    description:
      "Sabores sofisticados com pistache, castanhas, amêndoas e frutas frescas.",
    fillings: gourmetFillings,
    prices: { mini: 150, p: 200, m: 250, g: 390, gg: 480 },
  },
  {
    id: "corte-classico",
    name: "Bolo de Corte Clássico",
    eyebrow: "Para servir",
    description:
      "Bolo retangular de aproximadamente 5 kg, chantilly branco e sem decoração personalizada.",
    fillings: classicFillings,
    prices: { corte: 350 },
  },
  {
    id: "corte-especial",
    name: "Bolo de Corte Especial",
    eyebrow: "Para servir",
    description:
      "Ideal para acompanhar bolo cenográfico e servir cerca de 50 pessoas com praticidade.",
    fillings: specialFillings,
    prices: { corte: 420 },
  },
  {
    id: "corte-gourmet",
    name: "Bolo de Corte Gourmet",
    eyebrow: "Para servir",
    description:
      "Versão gourmet para eventos maiores, sem decoração personalizada e pronta para o corte.",
    fillings: gourmetFillings,
    prices: { corte: 470 },
  },
];

const monthlyPlanTiers = cakeTiers.slice(0, 3).map((tier) => {
  const fullPrice = tier.prices.mini * 11;
  const planPrice = fullPrice * 0.85;
  return {
    id: `plano-${tier.id}`,
    tierId: tier.id,
    name: tier.name.replace("Bolo ", ""),
    fillings: tier.fillings,
    fullPrice,
    planPrice,
    monthlyPrice: planPrice / 11,
  };
});

const sweetGroups: SweetGroup[] = [
  {
    id: "doces-classicos",
    name: "Doces Clássicos",
    type: "sweet",
    hundredPrice: 155,
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
    hundredPrice: 175,
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
    hundredPrice: 200,
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
    hundredPrice: 270,
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
    hundredPrice: 195,
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
    hundredPrice: 255,
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
    hundredPrice: 450,
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
    id: "bento",
    name: "Bentô individual",
    description:
      "Bolo individual com frase personalizada, colher, vela, caixinha e sacolinha pronta para presentear.",
    price: 55.9,
    minQty: 1,
    image: "/assets/bento-personalized.webp",
  },
  {
    id: "bento-combo",
    name: "Combo Bentô",
    description:
      "Bentô personalizado acompanhado de uma caixa com 6 docinhos à sua escolha.",
    price: 67.8,
    minQty: 1,
    image: "/assets/gift-combo-bento.webp",
  },
  {
    id: "caixa-encanto",
    name: "Caixa Doce Encanto",
    description:
      "25 doces: Ninho com Nutella, Moranguinho com Nutella, Pistache, Ferrero e Prestígio.",
    price: 75.9,
    minQty: 1,
    image: "/assets/gift-doce-encanto.webp",
  },
  {
    id: "caixa-bombom",
    name: "Caixa Bombom Gourmet",
    description:
      "25 bombons: Coco, Nozes, Pistache, Taça de Morango e Quadradinho do Pará.",
    price: 95.9,
    minQty: 1,
    image: "/assets/gift-bombom-gourmet.webp",
  },
];

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

export default function Home() {
  const [catalogTab, setCatalogTab] = useState<
    "cakes" | "monthly" | "sweets" | "gifts"
  >(
    "cakes",
  );
  const [monthlySlide, setMonthlySlide] = useState(0);
  const [monthlyPaused, setMonthlyPaused] = useState(false);
  const [sweetGroupId, setSweetGroupId] = useState(sweetGroups[0].id);
  const [sweetQuantities, setSweetQuantities] = useState<Record<string, number>>(
    {},
  );
  const [sweetWrappers, setSweetWrappers] = useState<Record<string, string>>(
    {},
  );
  const [cakeChoices, setCakeChoices] = useState<
    Record<
      string,
      {
        size: string;
        mass: string;
        model: string;
        filling: string;
        decoration: string;
      }
    >
  >(() =>
    Object.fromEntries(
      cakeTiers.map((tier) => [
        tier.id,
        {
          size: Object.keys(tier.prices)[0],
          mass: "Branca",
          model: "Chantilly",
          filling: tier.fillings[0],
          decoration: "topo",
        },
      ]),
    ),
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
  const [cepStatus, setCepStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [shippingError, setShippingError] = useState("");
  const [paymentNoticeOpen, setPaymentNoticeOpen] = useState(false);
  const [pendingWhatsAppUrl, setPendingWhatsAppUrl] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponCode | "">("");
  const [shippingStatus, setShippingStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [monthlyTermsAccepted, setMonthlyTermsAccepted] = useState(false);
  const [planPaymentMode, setPlanPaymentMode] =
    useState<PlanPaymentMode>("Mensal");
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [inspirationFile, setInspirationFile] = useState<File | null>(null);
  const [inspirationPreview, setInspirationPreview] = useState("");
  const [dateOptions, setDateOptions] = useState<DateOption[]>([]);
  const [minimumOrderTime, setMinimumOrderTime] = useState(0);
  const [busyWindows, setBusyWindows] = useState<BusyWindow[]>([]);
  const [availabilityStatus, setAvailabilityStatus] = useState<
    "idle" | "loading" | "connected" | "unavailable"
  >("idle");
  const [giftChoices, setGiftChoices] = useState({
    bentoMass: "Branca",
    bentoFilling: "Brigadeiro com Ninho",
    comboMass: "Branca",
    comboFilling: "Brigadeiro com Ninho",
    comboSweets: "3 Brigadeiros + 3 Ninhos",
  });
  const [monthlyFillings, setMonthlyFillings] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        monthlyPlanTiers.map((plan) => [plan.id, plan.fillings[0]]),
      ),
  );
  const [selectedMonthlyPlanId, setSelectedMonthlyPlanId] = useState(
    monthlyPlanTiers[0].id,
  );

  const [customer, setCustomer] = useState({
    name: "",
    birth: "",
    phone: "",
    dataConsent: false,
    remember: true,
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
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDateOptions(createDateOptions());
      setMinimumOrderTime(Date.now() + 24 * 60 * 60 * 1000);
      try {
        const saved = window.localStorage.getItem("doceria-client");
        if (saved) {
          const savedCustomer = JSON.parse(saved) as {
            name?: string;
            birth?: string;
            phone?: string;
            remember?: boolean;
          };
          setCustomer((current) => ({
            ...current,
            name: savedCustomer.name ?? "",
            birth: savedCustomer.birth ?? "",
            phone: savedCustomer.phone ?? "",
            remember: savedCustomer.remember ?? true,
          }));
        }
      } catch {
        // O pedido continua funcionando mesmo sem armazenamento local.
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (catalogTab !== "monthly" || monthlyPaused) return;

    const timer = window.setInterval(() => {
      setMonthlySlide(
        (current) => (current + 1) % monthlyCakeGallery.length,
      );
    }, 4800);

    return () => window.clearInterval(timer);
  }, [catalogTab, monthlyPaused]);

  useEffect(
    () => () => {
      if (inspirationPreview) URL.revokeObjectURL(inspirationPreview);
    },
    [inspirationPreview],
  );

  useEffect(() => {
    if (!details.eventDate) {
      const timer = window.setTimeout(() => {
        setBusyWindows([]);
        setAvailabilityStatus("idle");
      }, 0);
      return () => window.clearTimeout(timer);
    }

    const controller = new AbortController();
    const loadingTimer = window.setTimeout(
      () => setAvailabilityStatus("loading"),
      0,
    );
    fetch(`/api/availability?date=${encodeURIComponent(details.eventDate)}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const payload = (await response.json()) as {
          busy?: BusyWindow[];
          connected?: boolean;
        };
        setBusyWindows(payload.busy ?? []);
        setAvailabilityStatus(payload.connected ? "connected" : "unavailable");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setBusyWindows([]);
        setAvailabilityStatus("unavailable");
      });

    return () => {
      window.clearTimeout(loadingTimer);
      controller.abort();
    };
  }, [details.eventDate]);

  const activeSweetGroup =
    sweetGroups.find((group) => group.id === sweetGroupId) ?? sweetGroups[0];
  const hasCakeInCart = cart.some(
    (item) => item.type === "cake" || item.type === "plan",
  );
  const availableTimeOptions = useMemo(() => {
    if (!details.eventDate) return [];

    const selectedDate = new Date(`${details.eventDate}T12:00:00`);
    const options =
      selectedDate.getDay() === 0 ? sundayTimeOptions : weekdayTimeOptions;
    return options.filter((time) => {
      const slotStart = new Date(
        `${details.eventDate}T${time}:00`,
      ).getTime();
      const slotEnd = slotStart + 30 * 60 * 1000;
      const overlapsAgenda = busyWindows.some((window) => {
        const busyStart = new Date(window.start).getTime();
        const busyEnd = new Date(window.end).getTime();
        return slotStart < busyEnd && slotEnd > busyStart;
      });

      return slotStart >= minimumOrderTime && !overlapsAgenda;
    });
  }, [busyWindows, details.eventDate, minimumOrderTime]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.qty * item.unitPrice, 0),
    [cart],
  );
  const planSubtotal = useMemo(
    () =>
      cart
        .filter((item) => item.type === "plan")
        .reduce((sum, item) => sum + item.qty * item.unitPrice, 0),
    [cart],
  );
  const regularSubtotal = Math.max(0, subtotal - planSubtotal);
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
  const total = Math.max(0, regularOrderTotal + planSubtotal);
  const firstPlanInstallment = planSubtotal > 0 ? planSubtotal / 11 : 0;
  const planDueNow =
    planSubtotal === 0
      ? 0
      : planPaymentMode === "À vista"
        ? planSubtotal
        : firstPlanInstallment;
  const deposit = regularOrderTotal * 0.6 + planDueNow;
  const balance = regularOrderTotal * 0.4;
  const futurePlanBalance =
    planPaymentMode === "Mensal"
      ? Math.max(0, planSubtotal - firstPlanInstallment)
      : 0;

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

  const addCake = (tier: CakeTier) => {
    const choice = cakeChoices[tier.id];
    const decoration =
      choice.size === "corte"
        ? { id: "sem-decoracao", label: "Sem decoração personalizada", price: 0 }
        : cakeDecorationOptions.find(
            (option) => option.id === choice.decoration,
          ) ?? cakeDecorationOptions[0];
    const unitPrice = tier.prices[choice.size] + decoration.price;
    addItem({
      id: tier.id,
      name: tier.name,
      variant: `${sizes[choice.size]} · massa ${choice.mass.toLowerCase()} · modelo ${choice.model.toLowerCase()} · ${choice.filling} · ${decoration.label}`,
      type: "cake",
      qty: 1,
      step: 1,
      unitPrice,
    });
  };

  const addMonthlyPlan = (plan: (typeof monthlyPlanTiers)[number]) => {
    const item: CartItem = {
      key: `${plan.id}::plano-11-mesversarios`,
      id: plan.id,
      name: `Pacote 11 Mesversários — ${plan.name}`,
      variant: `11 bolos Mini · 15% de desconto · referência de sabor: ${
        monthlyFillings[plan.id]
      } · temas e datas definidos mês a mês`,
      type: "plan",
      qty: 1,
      step: 1,
      unitPrice: plan.planPrice,
    };
    setSelectedMonthlyPlanId(plan.id);
    setCart((current) => [
      ...current.filter((cartItem) => cartItem.type !== "plan"),
      item,
    ]);
    setMonthlyTermsAccepted(false);
    setPlanPaymentMode("Mensal");
    setCheckoutStep(0);
    setOrderOpen(true);
    setToast(`${item.name} adicionado ao pedido`);
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

  const selectInspiration = (file?: File) => {
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type) || file.size > 8 * 1024 * 1024) {
      setToast("Envie uma imagem JPG, PNG ou WEBP de até 8 MB");
      return;
    }
    if (inspirationPreview) URL.revokeObjectURL(inspirationPreview);
    setInspirationFile(file);
    setInspirationPreview(URL.createObjectURL(file));
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
    tierId: string,
    field: "size" | "mass" | "model" | "filling" | "decoration",
    value: string,
  ) => {
    setCakeChoices((current) => ({
      ...current,
      [tierId]: { ...current[tierId], [field]: value },
    }));
  };

  const saveCustomer = () => {
    try {
      if (customer.remember) {
        window.localStorage.setItem(
          "doceria-client",
          JSON.stringify({
            name: customer.name,
            birth: customer.birth,
            phone: customer.phone,
            remember: true,
          }),
        );
      } else {
        window.localStorage.removeItem("doceria-client");
      }
    } catch {
      // O envio pelo WhatsApp permanece disponível.
    }
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

  const formattedAddress = [
    delivery.street,
    delivery.number,
    delivery.complement,
    delivery.neighborhood,
    `${delivery.city}${delivery.state ? `/${delivery.state}` : ""}`,
    delivery.cep,
  ]
    .filter(Boolean)
    .join(", ");

  const lookupCep = async (rawCep: string) => {
    const cep = cleanCep(rawCep);
    if (cep.length !== 8) {
      setCepStatus("error");
      setShippingError("Digite um CEP com 8 números.");
      return;
    }

    setCepStatus("loading");
    setShippingError("");
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const address = (await response.json()) as {
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };

      if (!response.ok || address.erro) {
        throw new Error("CEP não encontrado");
      }

      setDelivery((current) => ({
        ...current,
        cep,
        street: address.logradouro ?? "",
        neighborhood: address.bairro ?? "",
        city: address.localidade ?? "",
        state: address.uf ?? "",
      }));
      setCepStatus("success");
    } catch {
      setCepStatus("error");
      setShippingError("CEP não encontrado. Confira os números e tente novamente.");
    }
  };

  const calculateShipping = useCallback(async () => {
    if (
      delivery.service !== "Entrega" ||
      !delivery.street ||
      !delivery.number.trim()
    ) {
      return;
    }

    setShippingStatus("loading");
    setShippingError("");
    try {
      const response = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          street: delivery.street,
          number: delivery.number,
          neighborhood: delivery.neighborhood,
          city: delivery.city,
          state: delivery.state,
          cep: delivery.cep,
        }),
      });
      const result = (await response.json()) as {
        fee?: number;
        error?: string;
      };
      if (!response.ok || typeof result.fee !== "number") {
        throw new Error(result.error || "Não foi possível calcular a entrega");
      }
      setDeliveryFee(result.fee);
      setShippingStatus("success");
    } catch {
      setDeliveryFee(0);
      setShippingStatus("error");
      setShippingError(
        "Não conseguimos calcular a entrega neste momento. Confira o endereço e tente novamente.",
      );
    }
  }, [delivery]);

  useEffect(() => {
    if (delivery.service !== "Entrega") {
      const resetTimer = window.setTimeout(() => {
        setDeliveryFee(0);
        setShippingStatus("idle");
      }, 0);
      return () => window.clearTimeout(resetTimer);
    }
    if (
      cepStatus !== "success" ||
      !delivery.street ||
      !delivery.number.trim()
    ) {
      const resetTimer = window.setTimeout(() => {
        setDeliveryFee(0);
        setShippingStatus("idle");
      }, 0);
      return () => window.clearTimeout(resetTimer);
    }

    const timer = window.setTimeout(() => {
      setShippingStatus("loading");
      void calculateShipping();
    }, 700);
    return () => window.clearTimeout(timer);
  }, [
    delivery.service,
    delivery.street,
    delivery.number,
    delivery.neighborhood,
    delivery.city,
    delivery.state,
    delivery.cep,
    cepStatus,
    calculateShipping,
  ]);

  const mapsUrl =
    !formattedAddress
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          ORIGIN,
        )}`
      : `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
          ORIGIN,
        )}&destination=${encodeURIComponent(formattedAddress)}`;

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
    if (!customer.dataConsent) {
      setCheckoutStep(2);
      setToast("Autorize o uso dos dados para concluir o cadastro");
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
    if (hoursUntilOrder < 24) {
      setCheckoutStep(1);
      setToast("Pedidos precisam ter no mínimo 24h de antecedência");
      return;
    }
    const hasColoredWrappers = cart.some(
      (item) =>
        (item.type === "sweet" || item.type === "bonbon") &&
        item.wrapperColor &&
        item.wrapperColor !== "Branca",
    );
    if (hasColoredWrappers && hoursUntilOrder < 48) {
      setCheckoutStep(0);
      setToast(
        "Forminhas coloridas ou de acetato precisam de 48h de antecedência",
      );
      return;
    }
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
      (!delivery.street || !delivery.number.trim())
    ) {
      setCheckoutStep(2);
      setToast("Preencha o CEP e o número da entrega");
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
    if (planSubtotal > 0 && !monthlyTermsAccepted) {
      setCheckoutStep(3);
      setToast("Leia e aceite as condições do pacote para continuar");
      return;
    }

    saveCustomer();
    const orderCode = `BB-${Date.now().toString().slice(-6)}`;
    const items = cart
      .map(
        (item) => {
          const publicVariant = item.variant.replace(
            / · Forminha [^·]+$/,
            "",
          );

          return `• ${item.qty}x ${item.name} — ${publicVariant} — ${formatMoney(
            item.qty * item.unitPrice,
          )}`;
        },
      )
      .join("\n");
    const wrapperColors = Array.from(
      new Set(
        cart
          .filter(
            (item) =>
              (item.type === "sweet" || item.type === "bonbon") &&
              item.wrapperColor,
          )
          .map((item) => item.wrapperColor as string),
      ),
    );
    const personalization = [
      wrapperColors.length > 0 && `forminhas: ${wrapperColors.join(", ")}`,
      details.phrase && `frase: ${details.phrase}`,
      details.age && `idade: ${details.age}`,
      details.colors && `cores: ${details.colors}`,
      details.decoration && `decoração: ${details.decoration}`,
    ]
      .filter(Boolean)
      .join(" · ");
    const serviceLine =
      delivery.service === "Entrega"
        ? `Entrega: ${formattedAddress} · ${formatMoney(deliveryFee)}`
        : `Retirada: ${ORIGIN}`;
    const formattedEventDate = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      weekday: "long",
    }).format(selectedDateTime);
    const paymentLine =
      paymentMethod === "Pix"
        ? `Chave: ${PIX_KEY} · Déborah Bacelar Braga · Banco Inter`
        : `Link seguro: ${CARD_PAYMENT_URL}`;

    const message = [
      `*PEDIDO PELO SITE · ${orderCode}*`,
      `*Cliente:* ${customer.name} · ${customer.phone}`,
      "",
      "*ITENS DO PEDIDO*",
      items,
      `*Data:* ${formattedEventDate} às ${details.eventTime}`,
      personalization ? `Personalização: ${personalization}` : "",
      hasCakeInCart && inspirationFile
        ? "*Foto de inspiração:* anexada ao cadastro deste pedido"
        : "",
      `*Serviço:* ${serviceLine}`,
      "",
      `Produtos: ${formatMoney(regularSubtotal)}`,
      couponDiscount
        ? `Cupom ${appliedCoupon} (${couponPercent}%): -${formatMoney(
            couponDiscount,
          )}`
        : "",
      pixDiscount
        ? `Desconto Pix (3%): -${formatMoney(pixDiscount)}`
        : "",
      planSubtotal ? `Pacote de mesversário: ${formatMoney(planSubtotal)}` : "",
      deliveryFee ? `Entrega: ${formatMoney(deliveryFee)}` : "",
      `*Valor total: ${formatMoney(total)}*`,
      regularOrderTotal
        ? `*Entrada do pedido (60%):* ${formatMoney(regularOrderTotal * 0.6)}`
        : "",
      regularOrderTotal
        ? `*Restante do pedido (40%):* ${formatMoney(balance)}`
        : "",
      regularOrderTotal
        ? `Forma de pagamento do restante: ${balancePaymentMethod}${
            balancePaymentMethod === "Dinheiro" ? " · valor exato, sem troco" : ""
          }`
        : "",
      planSubtotal
        ? planPaymentMode === "Mensal"
          ? `*Pacote de mesversário:* 1ª mensalidade de ${formatMoney(
              firstPlanInstallment,
            )} + 10 mensalidades do mesmo valor`
          : `*Pacote de mesversário:* pagamento integral de ${formatMoney(
              planSubtotal,
            )}`
        : "",
      planSubtotal && planPaymentMode === "Mensal"
        ? `Saldo futuro do pacote: ${formatMoney(futurePlanBalance)}`
        : "",
      paymentLine,
      "Peço a conferência das informações e da disponibilidade para confirmação.",
    ]
      .filter((line, index) => line !== "" || index === 2)
      .join("\n");

    setOrderSubmitting(true);
    try {
      let inspirationKey: string | null = null;

      if (hasCakeInCart && inspirationFile) {
        const formData = new FormData();
        formData.append("file", inspirationFile);
        formData.append("orderCode", orderCode);
        const uploadResponse = await fetch("/api/inspiration", {
          method: "POST",
          body: formData,
        });
        const uploadResult = (await uploadResponse.json()) as {
          key?: string;
          error?: string;
        };
        if (!uploadResponse.ok || !uploadResult.key) {
          throw new Error(
            uploadResult.error || "Não foi possível salvar a foto de inspiração",
          );
        }
        inspirationKey = uploadResult.key;
      }

      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderCode,
          name: customer.name,
          phone: customer.phone,
          birthDate: customer.birth || null,
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
          inspirationKey,
          planPaymentMode: planSubtotal > 0 ? planPaymentMode : null,
          planTermsAccepted:
            planSubtotal > 0 ? monthlyTermsAccepted : false,
          summary: {
            productsCents: Math.round(regularSubtotal * 100),
            couponCode: appliedCoupon || "",
            couponDiscountCents: Math.round(couponDiscount * 100),
            pixDiscountCents: Math.round(pixDiscount * 100),
            deliveryCents: Math.round(deliveryFee * 100),
            totalCents: Math.round(total * 100),
            depositCents: Math.round(deposit * 100),
            balanceCents: Math.round(balance * 100),
            planCents: Math.round(planSubtotal * 100),
            balancePaymentMethod,
          },
        }),
      });
      if (!response.ok) {
        throw new Error("Não foi possível salvar o cadastro");
      }
    } catch {
      setToast(
        "Não foi possível salvar o cadastro agora. Tente enviar novamente.",
      );
      setOrderSubmitting(false);
      return;
    }
    setOrderSubmitting(false);
    setPendingWhatsAppUrl(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
    );
    setPaymentNoticeOpen(true);
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
          <a href="#cardapio" onClick={() => setMobileMenu(false)}>Cardápio</a>
          <a href="#galeria" onClick={() => setMobileMenu(false)}>Galeria</a>
          <a href="#como-pedir" onClick={() => setMobileMenu(false)}>Como pedir</a>
          <a href="#quem-somos" onClick={() => setMobileMenu(false)}>Quem somos</a>
          <a href="#entrega" onClick={() => setMobileMenu(false)}>Entrega</a>
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
          <h1>Doces que transformam momentos em lembranças</h1>
          <p>
            Bolos personalizados e doces artesanais feitos sob encomenda em
            Belo Horizonte, com cuidado em cada detalhe.
          </p>
          <div className="hero-buttons">
            <a className="button button-primary" href="#cardapio">
              Faça seu pedido aqui
            </a>
            <a
              className="button button-secondary"
              href={WHATSAPP_CATALOG}
              target="_blank"
              rel="noreferrer"
            >
              Ver catálogo no WhatsApp
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
          <span className="section-kicker">Escolha, personalize e simule</span>
          <h2>Monte sua encomenda com tranquilidade</h2>
          <p>
            Escolha os produtos, personalize os detalhes e acompanhe o valor da
            sua encomenda antes de finalizar.
          </p>
        </div>

        <div className="catalog-tabs" role="tablist" aria-label="Categorias">
          <button
            className={catalogTab === "cakes" ? "active" : ""}
            onClick={() => setCatalogTab("cakes")}
            type="button"
          >
            Bolos
          </button>
          <button
            className={catalogTab === "monthly" ? "active" : ""}
            onClick={() => setCatalogTab("monthly")}
            type="button"
          >
            Mesversário
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
            Presentes
          </button>
        </div>

        {catalogTab === "cakes" && (
          <>
            <div className="cake-guide">
              <div>
                <span className="section-kicker">Sobre nossos bolos</span>
                <h3>Decoração artesanal em chantilly</h3>
              </div>
              <div className="cake-guide-copy">
                <p>
                  <strong>♥ Decoração e topper simples já estão inclusos.</strong>{" "}
                  Frutas, papel de arroz, flores naturais e outros detalhes
                  especiais podem ter adicional, informado antes da confirmação.
                </p>
                <p>
                  Trabalhamos exclusivamente com chantilly. Todo bolo decorado
                  acompanha caixa para transporte e duas velinhas simples.
                </p>
              </div>
            </div>
            <div className="cake-grid">
            {cakeTiers.map((tier) => {
              const choice = cakeChoices[tier.id];
              const decoration =
                choice.size === "corte"
                  ? { price: 0 }
                  : cakeDecorationOptions.find(
                      (option) => option.id === choice.decoration,
                    ) ?? cakeDecorationOptions[0];
              const price = tier.prices[choice.size] + decoration.price;
              return (
                <article className="product-card cake-card" key={tier.id}>
                  <div className="product-card-head">
                    <span>{tier.eyebrow}</span>
                    <strong>A partir de {formatMoney(Math.min(...Object.values(tier.prices)))}</strong>
                  </div>
                  <h3>{tier.name}</h3>
                  <p>{tier.description}</p>
                  <label>
                    Tamanho
                    <select
                      value={choice.size}
                      onChange={(event) =>
                        updateCakeChoice(tier.id, "size", event.target.value)
                      }
                    >
                      {Object.keys(tier.prices).map((size) => (
                        <option value={size} key={size}>
                          {sizes[size]} · {formatMoney(tier.prices[size])}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="two-fields">
                    <label>
                      Massa
                      <select
                        value={choice.mass}
                        onChange={(event) =>
                          updateCakeChoice(tier.id, "mass", event.target.value)
                        }
                      >
                        <option value="Branca">
                          Branca — feita com leite em pó
                        </option>
                        <option value="Chocolate">
                          Chocolate — feita com cacau 50%
                        </option>
                      </select>
                    </label>
                    <div className="cake-static-field">
                      <span>Cobertura</span>
                      <strong>Chantilly</strong>
                    </div>
                  </div>
                  <label>
                    Recheio
                    <select
                      value={choice.filling}
                      onChange={(event) =>
                        updateCakeChoice(tier.id, "filling", event.target.value)
                      }
                    >
                      {tier.fillings.map((filling) => (
                        <option key={filling}>{filling}</option>
                      ))}
                    </select>
                  </label>
                  {choice.size !== "corte" && (
                    <label>
                      Estilo da decoração
                      <select
                        value={choice.decoration}
                        onChange={(event) =>
                          updateCakeChoice(
                            tier.id,
                            "decoration",
                            event.target.value,
                          )
                        }
                      >
                        {cakeDecorationOptions.map((option) => (
                          <option value={option.id} key={option.id}>
                            {option.label}
                            {option.price > 0
                              ? ` + ${formatMoney(option.price)}`
                              : option.id === "topo"
                                ? " · sem adicional"
                                : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <div className="product-card-footer">
                    <strong>{formatMoney(price)}</strong>
                    <button type="button" onClick={() => addCake(tier)}>
                      Adicionar
                    </button>
                  </div>
                </article>
              );
            })}
            </div>
            <p className="catalog-note cake-catalog-note">
              O tamanho Mini é uma ótima escolha para mesversários,
              comemorações íntimas e presentes. Flores naturais, papel de arroz
              e outros detalhes dependem do tema e da disponibilidade.
            </p>
          </>
        )}

        {catalogTab === "monthly" && (
          <div className="monthly-section">
            <div className="monthly-hero">
              <div
                className="monthly-carousel"
                aria-label="Inspirações de Bolos Mini para mesversário"
                aria-roledescription="carrossel"
              >
                {monthlyCakeGallery.map((photo, index) => (
                  <div
                    className={`monthly-slide ${
                      index === monthlySlide ? "active" : ""
                    }`}
                    key={photo.src}
                    aria-hidden={index !== monthlySlide}
                  >
                    <img
                      className="monthly-slide-backdrop"
                      src={photo.src}
                      alt=""
                      aria-hidden="true"
                    />
                    <img
                      className="monthly-slide-photo"
                      src={photo.src}
                      alt={index === monthlySlide ? photo.alt : ""}
                    />
                  </div>
                ))}

                <span className="monthly-carousel-counter">
                  {monthlySlide + 1} / {monthlyCakeGallery.length}
                </span>

                <div className="monthly-carousel-controls">
                  <button
                    type="button"
                    className="monthly-carousel-arrow"
                    aria-label="Ver foto anterior"
                    onClick={() => {
                      setMonthlySlide(
                        (current) =>
                          (current - 1 + monthlyCakeGallery.length) %
                          monthlyCakeGallery.length,
                      );
                    }}
                  >
                    ←
                  </button>
                  <div
                    className="monthly-carousel-dots"
                    aria-label="Escolher foto"
                  >
                    {monthlyCakeGallery.map((photo, index) => (
                      <button
                        type="button"
                        className={index === monthlySlide ? "active" : ""}
                        key={photo.src}
                        aria-label={`Ver foto ${index + 1}`}
                        aria-current={index === monthlySlide ? "true" : undefined}
                        onClick={() => setMonthlySlide(index)}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    className="monthly-carousel-arrow"
                    aria-label="Ver próxima foto"
                    onClick={() => {
                      setMonthlySlide(
                        (current) =>
                          (current + 1) % monthlyCakeGallery.length,
                      );
                    }}
                  >
                    →
                  </button>
                  <button
                    type="button"
                    className="monthly-carousel-pause"
                    aria-pressed={monthlyPaused}
                    onClick={() => setMonthlyPaused((current) => !current)}
                  >
                    {monthlyPaused ? "Continuar" : "Pausar"}
                  </button>
                </div>
              </div>
              <div className="monthly-hero-copy">
                <span className="section-kicker">Um bolo para cada mês</span>
                <h3>Mesversários com sabor e memória</h3>
                <p>
                  O Bolo Mini serve de 6 a 8 fatias e é ideal para registrar cada
                  fase do bebê com uma decoração diferente.
                </p>
                <div className="monthly-hero-actions">
                  <button
                    type="button"
                    onClick={() => setCatalogTab("cakes")}
                  >
                    Quero apenas um Bolo Mini
                  </button>
                  <button
                    type="button"
                    className="primary"
                    onClick={() =>
                      document
                        .getElementById("pacotes-mesversario")
                        ?.scrollIntoView({ behavior: "smooth", block: "start" })
                    }
                  >
                    Quero 11 mini bolos
                  </button>
                </div>
              </div>
            </div>

            <div className="monthly-plan-heading" id="pacotes-mesversario">
              <div>
                <span>Pacote especial</span>
                <h3>11 meses, 11 Bolos Mini</h3>
              </div>
              <strong>15% de desconto</strong>
            </div>

            <div className="monthly-how-grid">
              <article>
                <span>1</span>
                <strong>Escolha a categoria</strong>
                <p>Clássico, Especial ou Gourmet define os sabores disponíveis.</p>
              </article>
              <article>
                <span>2</span>
                <strong>Um bolo por mês</strong>
                <p>São 11 Bolos Mini, do 1º ao 11º mesversário.</p>
              </article>
              <article>
                <span>3</span>
                <strong>Pague mensalmente</strong>
                <p>A primeira mensalidade é paga ao fechar; as demais, mês a mês.</p>
              </article>
              <article>
                <span>4</span>
                <strong>Defina cada tema</strong>
                <p>Sabor, data e decoração são confirmados antes de cada produção.</p>
              </article>
            </div>

            <p className="monthly-birthday-note">
              O pacote acompanha os 11 primeiros mesversários. O bolo de
              aniversário de 1 ano não está incluído.
            </p>

            <div className="monthly-plan-grid">
              {monthlyPlanTiers.map((plan) => (
                <article
                  className={`monthly-plan-card ${
                    selectedMonthlyPlanId === plan.id ? "selected" : ""
                  }`}
                  key={plan.id}
                >
                  <span>Pacote {plan.name}</span>
                  <h4>11 Bolos Mini</h4>
                  <p>
                    Um bolo por mês, com sabores da categoria {plan.name} e
                    decoração simples personalizada para cada mesversário.
                  </p>
                  <label>
                    Sabor de referência para o primeiro mês
                    <select
                      value={monthlyFillings[plan.id]}
                      onChange={(event) =>
                        setMonthlyFillings((current) => ({
                          ...current,
                          [plan.id]: event.target.value,
                        }))
                      }
                    >
                      {plan.fillings.map((filling) => (
                        <option key={filling}>{filling}</option>
                      ))}
                    </select>
                  </label>
                  <div className="monthly-price">
                    <small>
                      Sem o pacote: {formatMoney(plan.fullPrice / 11)} por bolo
                    </small>
                    <strong>
                      Com o pacote: {formatMoney(plan.monthlyPrice)} por bolo
                    </strong>
                    <span>
                      Pacote completo: {formatMoney(plan.planPrice)}
                    </span>
                    <em>
                      Economia de {formatMoney(plan.fullPrice - plan.planPrice)}
                    </em>
                  </div>
                  <button
                    type="button"
                    onClick={() => addMonthlyPlan(plan)}
                  >
                    Adicionar este pacote ao pedido
                  </button>
                </article>
              ))}
            </div>
          </div>
        )}

        {catalogTab === "sweets" && (
          <>
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
            <p className="catalog-note">
              Pedido mínimo de 25 unidades por sabor. Você pode combinar até
              quatro sabores em cada cento. Forminhas coloridas custam R$ 1,00
              a cada 25 unidades e acetato custa R$ 2,00 a cada 25 unidades.
              Cores sujeitas à disponibilidade e a pedidos com 48h de antecedência.
            </p>
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
                        <option>Brigadeiro com Ninho</option>
                        <option>Brigadeiro</option>
                        <option>Ninho</option>
                        <option>Oreo</option>
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
                        <option>Brigadeiro com Ninho</option>
                        <option>Brigadeiro</option>
                        <option>Ninho</option>
                        <option>Oreo</option>
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
                  <strong>{formatMoney(gift.price)}</strong>
                  <button
                    type="button"
                    onClick={() =>
                      addItem({
                        id: gift.id,
                        name: gift.name,
                        variant:
                          gift.id === "bento"
                            ? `Massa ${giftChoices.bentoMass.toLowerCase()} · recheio ${giftChoices.bentoFilling} · frase personalizada`
                            : gift.id === "bento-combo"
                              ? `Massa ${giftChoices.comboMass.toLowerCase()} · recheio ${giftChoices.comboFilling} · Bentô + 6 docinhos: ${giftChoices.comboSweets}`
                              : "presenteável",
                        type: "gift",
                        qty: gift.minQty,
                        step: gift.minQty,
                        unitPrice: gift.price,
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

      <section className="steps-section" id="como-pedir">
        <div className="section-heading left">
          <span className="section-kicker">Do pedido à comemoração</span>
          <h2>Seu pedido em quatro etapas simples</h2>
        </div>
        <div className="steps-grid">
          {[
            ["1", "Escolha", "Adicione bolo, doces, bombons ou presentes ao pedido."],
            ["2", "Personalize", "Informe frase, idade, cores e detalhes da decoração."],
            ["3", "Receba", "Escolha retirada ou informe o CEP para calcular a entrega."],
            ["4", "Confirme", "Revise os dados e envie a solicitação para conferirmos a disponibilidade."],
          ].map(([number, title, text]) => (
            <article key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
        <button
          className="steps-cta"
          type="button"
          onClick={() => {
            setOrderOpen(true);
            setCheckoutStep(0);
          }}
        >
          Clique aqui e faça seu pedido
        </button>
      </section>

      <section className="delivery-section" id="entrega">
        <div className="delivery-card location-card">
          <span className="section-kicker">Retirada no Solar do Barreiro</span>
          <h2>Veja o endereço antes de escolher</h2>
          <p>
            Rua Antônio Eustáquio Pinheiro, 50 - Solar do Barreiro,
            Belo Horizonte - MG, 30628-180.
          </p>
          <div className="location-actions">
            <a href={mapsUrl} target="_blank" rel="noreferrer">
              Abrir localização no mapa
            </a>
            <button
              type="button"
              onClick={() => {
                setOrderOpen(true);
                setCheckoutStep(cart.length > 0 ? 2 : 0);
              }}
            >
              Faça seu pedido aqui
            </button>
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
          <h2>Informe o CEP e veja a taxa</h2>
          <p>
            O endereço é preenchido automaticamente. Depois de adicionar número
            e complemento, a taxa aparece no resumo e entra no valor total.
          </p>
          <div className="delivery-flow">
            <span><b>1</b> Digite o CEP</span>
            <span><b>2</b> Complete número e complemento</span>
            <span><b>3</b> Confira o total com a entrega</span>
          </div>
          <button
            type="button"
            className="preview-order-button"
            onClick={() => {
              setOrderOpen(true);
              setCheckoutStep(cart.length > 0 ? 3 : 0);
            }}
          >
            {cart.length > 0 ? "Calcular no meu pedido" : "Faça seu pedido aqui"}
          </button>
          <div className="payment-inline-note">
            <strong>Pix ou cartão?</strong>
            <span>
              Você escolhe somente no fechamento, depois de revisar todos os
              valores.
            </span>
          </div>
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
          <a href={mapsUrl}>Abrir no mapa</a>
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
                  "Na finalização, escolha entrega e informe o CEP. O endereço será preenchido e o valor aparecerá no resumo do pedido.",
                )
              }
            >
              Como funciona o frete?
            </button>
            <button
              type="button"
              onClick={() =>
                setAssistantAnswer(
                  "O pedido é confirmado com 60% de entrada por Pix ou cartão via link. O restante fica para a entrega ou retirada.",
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
                      {availabilityStatus === "loading" && (
                        <small className="availability-note">
                          Verificando os horários disponíveis…
                        </small>
                      )}
                      {availabilityStatus === "connected" && (
                        <small className="availability-note success">
                          Horários já ocupados são removidos automaticamente.
                        </small>
                      )}
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
                    {hasCakeInCart && (
                      <div className="inspiration-upload full-field">
                        <div>
                          <strong>Foto de inspiração</strong>
                          <span>
                            Opcional · envie uma referência em JPG, PNG ou WEBP
                            de até 8 MB.
                          </span>
                        </div>
                        <label>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(event) =>
                              selectInspiration(event.target.files?.[0])
                            }
                          />
                          <span>
                            {inspirationFile
                              ? "Trocar imagem"
                              : "Selecionar uma imagem"}
                          </span>
                        </label>
                        {inspirationPreview && (
                          <div className="inspiration-preview">
                            <img
                              src={inspirationPreview}
                              alt="Prévia da foto de inspiração selecionada"
                            />
                            <div>
                              <strong>{inspirationFile?.name}</strong>
                              <button
                                type="button"
                                onClick={() => {
                                  URL.revokeObjectURL(inspirationPreview);
                                  setInspirationFile(null);
                                  setInspirationPreview("");
                                }}
                              >
                                Remover
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <p className="form-hint full-field order-deadline-hint">
                      Pedidos com 24 a 48 horas de antecedência ficam sujeitos à
                      aprovação. Para mais tranquilidade e opções de
                      personalização, recomendamos no mínimo 48 horas.
                      <br />
                      <strong>Segunda a sábado:</strong> 08:00 às 18:00 ·{" "}
                      <strong>Domingo:</strong> 07:00 às 08:30 e 12:30 às 16:00.
                      <br />
                      Retire ou receba a encomenda no horário confirmado. De
                      segunda a sexta, após as 18h, o pedido ficará disponível
                      no dia seguinte, a partir das 8h, ou conforme nossa
                      disponibilidade. Aos domingos, valem somente os horários
                      oferecidos no agendamento.
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
                    <label>
                      Data de nascimento
                      <input
                        type="date"
                        value={customer.birth}
                        onChange={(event) =>
                          setCustomer((current) => ({ ...current, birth: event.target.value }))
                        }
                      />
                    </label>
                    <label>
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
                    <label className="check-field full-field">
                      <input
                        type="checkbox"
                        checked={customer.remember}
                        onChange={(event) =>
                          setCustomer((current) => ({ ...current, remember: event.target.checked }))
                        }
                      />
                      <span>
                        Salvar meus dados neste aparelho para facilitar o próximo pedido.
                        Nenhum dado é exibido publicamente.
                      </span>
                    </label>
                    <label className="check-field consent-field full-field">
                      <input
                        type="checkbox"
                        checked={customer.dataConsent}
                        onChange={(event) =>
                          setCustomer((current) => ({
                            ...current,
                            dataConsent: event.target.checked,
                          }))
                        }
                      />
                      <span>
                        Autorizo o uso destes dados para cadastro, atendimento e
                        acompanhamento deste pedido. *
                      </span>
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
                      <span>Informe o CEP e veja a taxa antes de finalizar</span>
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
                      <label>
                        CEP *
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={9}
                          value={delivery.cep}
                          onChange={(event) => {
                            const cep = cleanCep(event.target.value);
                            const formatted =
                              cep.length > 5
                                ? `${cep.slice(0, 5)}-${cep.slice(5)}`
                                : cep;
                            setDelivery((current) => ({
                              ...current,
                              cep: formatted,
                              street: "",
                              neighborhood: "",
                              city: "",
                              state: "",
                            }));
                            setCepStatus("idle");
                            setShippingStatus("idle");
                            setDeliveryFee(0);
                            setShippingError("");
                          }}
                          onBlur={(event) => lookupCep(event.target.value)}
                          placeholder="00000-000"
                        />
                      </label>
                      <button
                        type="button"
                        className="cep-button"
                        onClick={() => lookupCep(delivery.cep)}
                        disabled={cepStatus === "loading"}
                      >
                        {cepStatus === "loading" ? "Buscando..." : "Buscar CEP"}
                      </button>
                      <label className="full-field">
                        Endereço
                        <input
                          type="text"
                          value={
                            delivery.street
                              ? `${delivery.street} · ${delivery.neighborhood} · ${delivery.city}/${delivery.state}`
                              : ""
                          }
                          readOnly
                          placeholder="Preenchido automaticamente pelo CEP"
                        />
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
                              number: event.target.value,
                            }));
                          }}
                          placeholder="Ex.: 120"
                        />
                      </label>
                      <label>
                        Complemento
                        <input
                          type="text"
                          value={delivery.complement}
                          onChange={(event) =>
                            setDelivery((current) => ({
                              ...current,
                              complement: event.target.value,
                            }))
                          }
                          placeholder="Apto., bloco, casa..."
                        />
                      </label>
                      {shippingError && (
                        <p className="shipping-error full-field">{shippingError}</p>
                      )}
                      {shippingStatus === "loading" && (
                        <div className="shipping-loading full-field" aria-live="polite">
                          Calculando a taxa de entrega…
                        </div>
                      )}
                      {cepStatus === "success" &&
                        delivery.street &&
                        delivery.number.trim() &&
                        shippingStatus === "success" && (
                        <div className="checkout-freight-result full-field" aria-live="polite">
                          <div>
                            <span>Endereço da entrega</span>
                            <small>{formattedAddress}</small>
                          </div>
                          <div className="freight-price">
                            <span>Taxa de entrega</span>
                            <strong>{formatMoney(deliveryFee)}</strong>
                          </div>
                          <div className="freight-price freight-total">
                            <span>Total com entrega</span>
                            <strong>{formatMoney(total)}</strong>
                          </div>
                          <a href={mapsUrl} target="_blank" rel="noreferrer">
                            Conferir endereço no mapa
                          </a>
                          <button type="button" onClick={calculateShipping}>
                            Recalcular entrega
                          </button>
                        </div>
                      )}
                      <p className="delivery-contact-note full-field">
                        Mantenha o telefone informado no cadastro disponível. Se
                        houver dificuldade para localizar a rua, o número ou o
                        complemento, o entregador poderá entrar em contato por
                        ligação ou WhatsApp.
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
                  {planSubtotal > 0 && (
                    <div className="plan-checkout-card">
                      <div className="plan-checkout-heading">
                        <span>Pacote de mesversário</span>
                        <strong>Escolha como pagar o pacote</strong>
                        <p>
                          Com o pacote, cada bolo sai por{" "}
                          <b>{formatMoney(firstPlanInstallment)}</b>. Sem o pacote,
                          o mesmo bolo sairia por{" "}
                          <b>{formatMoney(firstPlanInstallment / 0.85)}</b>.
                        </p>
                      </div>
                      <div className="plan-payment-options">
                        <button
                          type="button"
                          className={
                            planPaymentMode === "Mensal" ? "active" : ""
                          }
                          onClick={() => setPlanPaymentMode("Mensal")}
                        >
                          <span>Pagamento mensal</span>
                          <strong>{formatMoney(firstPlanInstallment)}</strong>
                          <small>
                            1ª parcela agora + 10 parcelas do mesmo valor
                          </small>
                        </button>
                        <button
                          type="button"
                          className={
                            planPaymentMode === "À vista" ? "active" : ""
                          }
                          onClick={() => setPlanPaymentMode("À vista")}
                        >
                          <span>Pagamento integral</span>
                          <strong>{formatMoney(planSubtotal)}</strong>
                          <small>Todo o pacote de 11 bolos agora</small>
                        </button>
                      </div>
                      <div className="checkout-plan-terms">
                        <strong>Condições do pacote</strong>
                        <ul>
                          <li>
                            Inclui 11 Bolos Mini, do 1º ao 11º mesversário. O
                            bolo de aniversário de 1 ano não está incluído.
                          </li>
                          <li>
                            Datas, sabores e temas são confirmados mês a mês,
                            preferencialmente com 48 horas de antecedência.
                          </li>
                          <li>
                            Decoração e topper simples estão incluídos. Detalhes
                            especiais podem ter valor adicional.
                          </li>
                          <li>
                            Em caso de interrupção, os bolos já produzidos serão
                            recalculados pelo valor avulso vigente.
                          </li>
                        </ul>
                        <label>
                          <input
                            type="checkbox"
                            checked={monthlyTermsAccepted}
                            onChange={(event) =>
                              setMonthlyTermsAccepted(event.target.checked)
                            }
                          />
                          <span>
                            Li e aceito as condições do pacote de 11
                            mesversários. *
                          </span>
                        </label>
                      </div>
                      <p className="plan-discount-rule">
                        O pacote já possui 15% de desconto. Por isso, não recebe
                        cupom nem o desconto adicional de 3% no Pix.
                      </p>
                    </div>
                  )}
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
                    {planSubtotal > 0 && (
                      <div><span>Pacote de mesversário</span><strong>{formatMoney(planSubtotal)}</strong></div>
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
                    {planSubtotal > 0 && (
                      <div className="plan-payment-split">
                        <div>
                          <span>
                            {planPaymentMode === "Mensal"
                              ? "1ª mensalidade do pacote"
                              : "Pacote pago integralmente"}
                          </span>
                          <strong>{formatMoney(planDueNow)}</strong>
                        </div>
                        {planPaymentMode === "Mensal" ? (
                          <p>
                            Depois, mais 10 mensalidades de{" "}
                            <strong>{formatMoney(firstPlanInstallment)}</strong>,
                            pagas mês a mês por Pix ou cartão.
                          </p>
                        ) : (
                          <p>
                            O valor completo dos 11 bolos será incluído no
                            pagamento inicial.
                          </p>
                        )}
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
                      <small>Escolher cartão</small>
                    </button>
                  </div>
                  {paymentMethod === "Pix" && (
                    <div className="selected-payment-details">
                      <span>
                        {regularSubtotal > 0
                          ? "O desconto de 3% no Pix foi aplicado somente aos produtos avulsos."
                          : "Este pedido contém apenas o pacote, que já possui 15% de desconto e não recebe os 3% adicionais."}{" "}
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
                        O pagamento inicial é de {formatMoney(deposit)}. Os dados do cartão
                        serão preenchidos somente na página segura de pagamento.
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
                    onClick={() => void sendWhatsApp()}
                    disabled={orderSubmitting}
                  >
                    {orderSubmitting
                      ? "Salvando cadastro..."
                      : "Enviar pedido no WhatsApp"}
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
            <h2>O pagamento confirma o seu pedido</h2>
            <p>
              Pedidos de urgência precisam do pagamento em até 2 horas. Para os
              demais pedidos, o prazo é de até 48 horas.
            </p>
            <p>
              Sem o pagamento dentro do prazo, o pedido não será confirmado.
              Depois desse período, será necessário consultar novamente se ainda
              é possível realizar a produção para a data escolhida.
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
                onClick={() => {
                  const url = pendingWhatsAppUrl;
                  setPaymentNoticeOpen(false);
                  if (url) {
                    window.open(url, "_blank", "noopener,noreferrer");
                  }
                }}
              >
                Li e quero enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}
