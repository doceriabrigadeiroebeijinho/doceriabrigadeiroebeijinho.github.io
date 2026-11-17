// @ts-nocheck

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cakeTiers, cakeSizeCatalog, cakeMassPrice, classicFillings, specialFillings, gourmetFillings, sweetGroups, gifts } from "./catalogo/dados";
import type { CakeTier, SweetGroup, CakeSizeId, CakeFillingType } from "./catalogo/dados";

const WHATSAPP_NUMBER = "5531973416110";
const WHATSAPP_CATALOG = "https://wa.me/c/5531973416110";
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

const sizes: Record<string, string> = {
  mini: "Mini (12 cm) · 6 a 8 fatias",
  p: "P (15 cm) · 12 a 15 fatias",
  m: "M (20 cm) · 20 a 28 fatias",
  g: "G (25 cm) · 35 a 40 fatias",
  gg: "GG (30 cm) · 55 a 60 fatias",
  corte: "Bolo de corte · cerca de 50 pessoas",
};

const whiteSweetIds = new Set([
  "coco",
  "ninho",
  "casadinho",
  "oreo",
  "ninho-nutella",
  "surpresa-uva",
]);

const sweetSpriteIds = new Set(["ninho-nutella","gota-maracuja","oreo","moranguinho","pacoca","mms","amendoas","surpresa-uva"]);
const individualSweetPhotos: Record<string,string> = {
  brigadeiro: "/assets/docinho-brigadeiro.webp",
  coco: "/assets/docinho-coco.webp",
  ninho: "/assets/docinho-ninho.webp",
  casadinho: "/assets/docinho-casadinho.webp",
  cajuzinho: "/assets/docinho-cajuzinho.webp",
  "olho-sogra": "/assets/docinho-olho-sogra.webp",
};
const sweetPhoto = (id: string, type: SweetGroup["type"]) => {
  if (individualSweetPhotos[id]) return individualSweetPhotos[id];
  if (sweetSpriteIds.has(id)) return "/assets/sweets-sprite.webp";
  if (type === "bonbon") return "/assets/gift-bombons.webp";
  return whiteSweetIds.has(id) ? "/assets/sweets-ninho.webp" : "/assets/sweets-chocolate.webp";
};
const sweetPhotoPosition = (id:string) => ({
  "ninho-nutella":"0px 0px", "gota-maracuja":"-56px 0px", oreo:"-112px 0px", moranguinho:"-168px 0px",
  pacoca:"0px -56px",mms:"-56px -56px",amendoas:"-112px -56px","surpresa-uva":"-168px -56px"
} as Record<string,string>)[id] ?? "center";

const bentoFillingPrice = (
  giftId: "bento" | "bento-combo",
  fillingType: "Clássico" | "Especial",
) => {
  const basePrice = gifts.find((gift) => gift.id === giftId)?.price ?? 0;
  return fillingType === "Especial" ? basePrice + 8 : basePrice;
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

const showcaseCakeImages:Record<string,string> = {
  mini:"/assets/monthly-cake.webp",
  p:"/assets/decoracoes/bolo-01.webp",
  m:"/assets/decoracoes/bolo-02.webp",
  g:"/assets/decoracoes/bolo-07.webp",
  gg:"/assets/decoracoes/bolo-10.webp",
  corte:"/assets/cake-classic.webp",
};

export default function Home({ category, selectedProduct }: { category?: "bolos" | "docinhos" | "presentes" | "combos"; selectedProduct?:string } = {}) {
  const focusedCake = category === "bolos" && selectedProduct ? cakeSizeCatalog.find(b=>b.id===selectedProduct) : undefined;
  const showroom = Boolean(category);
  const starterTab = category === "bolos" ? "cakes" : category === "docinhos" ? "sweets" : category ? "gifts" : "choose";
  const [catalogTab, setCatalogTab] = useState<
    "choose" | "all" | "cakes" | "sweets" | "gifts"
  >(starterTab);
  useEffect(() => {
    const section = new URLSearchParams(window.location.search).get("categoria");
    const destinations = { bolos: "cakes", docinhos: "sweets", presentes: "gifts", combos: "gifts" } as const;
    if (!category && section && section in destinations) {
      setCatalogTab(destinations[section as keyof typeof destinations]);
    }
  }, [category]);

  const [sweetGroupId, setSweetGroupId] = useState(category === "docinhos" ? "all" : sweetGroups[0].id);
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
  useEffect(() => {
    if (category !== "bolos") return;
    const wanted = new URLSearchParams(window.location.search).get("recheio");
    if (!wanted) return;
    const group = classicFillings.includes(wanted) ? "Classico" : specialFillings.includes(wanted) ? "Especial" : gourmetFillings.includes(wanted) ? "Gourmet" : null;
    if (!group) return;
    setCakeChoices(prev => Object.fromEntries(Object.entries(prev).map(([id,choice]) => [id, {...choice, fillingType:group, filling:wanted}])) as typeof prev);
  }, [category]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartReady, setCartReady] = useState(false);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("doceria-carrinho-v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setCart(parsed.filter((v) => v && typeof v.key === "string" && typeof v.unitPrice === "number" && typeof v.qty === "number"));
      }
    } catch { /* Navegação continua mesmo sem armazenamento local. */ }
    setCartReady(true);
  }, []);
  useEffect(() => {
    if (!cartReady) return;
    try { window.localStorage.setItem("doceria-carrinho-v1", JSON.stringify(cart)); } catch { /* Armazenamento opcional. */ }
  }, [cart, cartReady]);
  useEffect(() => {
    if (!category) return;
    const produto = new URLSearchParams(window.location.search).get("produto");
    if (!produto) return;
    const id = window.setTimeout(() => document.getElementById("produto-" + produto)?.scrollIntoView({block:"center",behavior:"smooth"}), 400);
    return () => window.clearTimeout(id);
  }, [category, catalogTab, sweetGroupId]);
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
  const displayedSweetGroups =
    catalogTab === "all" || (category === "docinhos" && sweetGroupId === "all") ? sweetGroups : [activeSweetGroup];

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

      if (!response.ok || !result.city || !result.state) {
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

  const formatOrderTime = (value: unknown) => {
    const raw = String(value ?? "").trim();
    if (!raw) return "A combinar";
    const match = raw.match(/\b(\d{1,2}):(\d{2})(?::\d{2})?\b/);
    if (match) return match[1].padStart(2, "0") + ":" + match[2];
    return raw;
  };

  const downloadOrderComanda = async (order: any) => {
    try {
      const width = 900;
      const workCanvas = document.createElement("canvas");
      workCanvas.width = width;
      workCanvas.height = 9000;
      const ctx = workCanvas.getContext("2d");
      if (!ctx) throw new Error("Não foi possível preparar a imagem da comanda.");

      let logo: HTMLImageElement | null = null;
      try {
        logo = new Image();
        await new Promise<void>((resolve) => {
          if (!logo) return resolve();
          logo.onload = () => resolve();
          logo.onerror = () => resolve();
          logo.src = "/assets/logo-complete.webp";
          if (logo.complete) resolve();
        });
      } catch {
        logo = null;
      }

      const colors = {
        cream: "#fff8ee",
        paper: "#fffdf8",
        cocoa: "#4b2e25",
        cocoaSoft: "#6f493d",
        muted: "#806b63",
        blush: "#f5dcda",
        blushLight: "#fbefeb",
        rose: "#c66f78",
        roseDark: "#9c4f59",
        line: "#ead7c9",
      };

      ctx.fillStyle = colors.cream;
      ctx.fillRect(0, 0, width, workCanvas.height);

      // Clean, light header: real brand logo and order code only.
      ctx.fillStyle = colors.paper;
      ctx.beginPath();
      ctx.roundRect(34, 28, width - 68, 166, 20);
      ctx.fill();
      ctx.strokeStyle = colors.line;
      ctx.lineWidth = 2;
      ctx.stroke();

      if (logo && logo.complete && logo.naturalWidth > 0) {
        const maxW = 200;
        const maxH = 140;
        const scale = Math.min(maxW / logo.naturalWidth, maxH / logo.naturalHeight);
        const logoW = logo.naturalWidth * scale;
        const logoH = logo.naturalHeight * scale;
        ctx.drawImage(logo, 52 + (200 - logoW) / 2, 41 + (140 - logoH) / 2, logoW, logoH);
      }

      ctx.fillStyle = colors.blushLight;
      ctx.beginPath();
      ctx.roundRect(590, 83, 260, 58, 18);
      ctx.fill();
      ctx.fillStyle = colors.cocoaSoft;
      ctx.font = "700 24px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(order.orderCode || "PEDIDO"), 720, 112);
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";

      let y = 238;
      const left = 52;
      const maxWidth = width - 104;

      const wrapText = (text: string, font: string, max: number) => {
        ctx.font = font;
        const words = String(text || "").split(/\s+/).filter(Boolean);
        const lines: string[] = [];
        let line = "";
        for (const word of words) {
          const trial = line ? line + " " + word : word;
          if (line && ctx.measureText(trial).width > max) {
            lines.push(line);
            line = word;
          } else {
            line = trial;
          }
        }
        if (line) lines.push(line);
        return lines.length ? lines : [""];
      };

      const drawText = (
        text: string,
        options: { size?: number; color?: string; weight?: number; x?: number; maxWidth?: number; lineHeight?: number } = {},
      ) => {
        const size = options.size ?? 20;
        const color = options.color ?? colors.cocoa;
        const weight = options.weight ?? 400;
        const x = options.x ?? left;
        const available = options.maxWidth ?? maxWidth;
        const lineHeight = options.lineHeight ?? Math.round(size * 1.55);
        const font = weight + " " + size + "px Arial, sans-serif";
        const lines = wrapText(text, font, available);
        ctx.font = font;
        ctx.fillStyle = color;
        ctx.textAlign = "left";
        for (const line of lines) {
          ctx.fillText(line, x, y);
          y += lineHeight;
        }
      };

      const drawSection = (title: string) => {
        y += 13;
        ctx.fillStyle = colors.blushLight;
        ctx.beginPath();
        ctx.roundRect(40, y - 25, width - 80, 40, 12);
        ctx.fill();
        drawText(title, { size: 18, color: colors.cocoaSoft, weight: 700, x: 58, lineHeight: 25 });
        y += 9;
      };

      const drawRule = () => {
        y += 4;
        ctx.strokeStyle = colors.line;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(width - left, y);
        ctx.stroke();
        y += 20;
      };

      const dateLabel = order.eventDateLabel ||
        (String(order.eventDate || "").match(/^\d{4}-\d{2}-\d{2}$/)
          ? String(order.eventDate).split("-").reverse().join("/")
          : String(order.eventDate || "A combinar"));
      drawSection("Dados do pedido");
      drawText("Cliente: " + (order.name || "Cliente"), { size: 22, weight: 700, lineHeight: 33 });
      if (order.phone) drawText("WhatsApp: " + order.phone, { size: 18, color: colors.cocoaSoft, lineHeight: 28 });
      drawText("Data: " + dateLabel + "   ·   Horário: " + formatOrderTime(order.eventTime), { size: 19, weight: 600, lineHeight: 31 });
      drawText("Modalidade: " + (order.service || "A combinar"), { size: 18, lineHeight: 28 });
      if (order.address) drawText((/retirada/i.test(String(order.service || "")) ? "Retirada em: " : "Endereço: ") + order.address, { size: 18, lineHeight: 28 });
      if (order.status) drawText("Status: " + order.status, { size: 17, color: colors.cocoaSoft, lineHeight: 27 });
      drawRule();

      drawSection("Itens do pedido");
      let orderItems = Array.isArray(order.items) ? order.items : [];
      if (!orderItems.length) {
        const rawItems = String(order.itemsText || "Itens não informados").split(/\r?\n/).filter(Boolean);
        orderItems = rawItems.map((line: string) => {
          const match = line.match(/^\s*(\d+(?:[.,]\d+)?)\s*[x×]\s*(.*?)\s+[—–-]\s*(R\$\s*[\d.,]+)\s*$/);
          if (!match) return { quantity: 1, name: line, variant: "", totalCents: undefined };
          const priceText = match[3].replace("R$", "").trim().replace(/\./g, "").replace(",", ".");
          const price = Number.parseFloat(priceText);
          const completeName = match[2].trim();
          const detailsSplit = completeName.split(/\s+[—–]\s+/, 2);
          return {
            quantity: Number(match[1].replace(",", ".")) || 1,
            name: detailsSplit[0] || completeName,
            variant: detailsSplit[1] || "",
            totalCents: Number.isFinite(price) ? Math.round(price * 100) : undefined,
          };
        });
      }

      for (const item of orderItems) {
        const quantity = String(item.quantity || 1) + "×";
        const title = String(item.name || item.type || "Item");
        const details = String(item.variant || "");
        const titleFont = "700 20px Arial, sans-serif";
        const detailFont = "400 17px Arial, sans-serif";
        const titleLines = wrapText(title, titleFont, 510);
        const detailLines = details ? wrapText(details, detailFont, 510) : [];
        const rowHeight = Math.max(78, 24 + titleLines.length * 28 + detailLines.length * 24);

        y += 8;
        const cardTop = y - 18;
        ctx.fillStyle = colors.paper;
        ctx.beginPath();
        ctx.roundRect(42, cardTop, width - 84, rowHeight, 14);
        ctx.fill();
        ctx.strokeStyle = colors.line;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = colors.blush;
        ctx.beginPath();
        ctx.roundRect(56, cardTop + (rowHeight - 44) / 2, 62, 44, 12);
        ctx.fill();
        ctx.fillStyle = colors.cocoaSoft;
        ctx.font = "700 19px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(quantity, 87, cardTop + rowHeight / 2);
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";

        ctx.fillStyle = colors.cocoa;
        ctx.font = titleFont;
        let itemY = cardTop + 30;
        for (const line of titleLines) {
          ctx.fillText(line, 136, itemY);
          itemY += 28;
        }
        if (detailLines.length) {
          ctx.fillStyle = colors.muted;
          ctx.font = detailFont;
          for (const line of detailLines) {
            ctx.fillText(line, 136, itemY);
            itemY += 24;
          }
        }

        if (typeof item.totalCents === "number") {
          ctx.fillStyle = colors.cocoaSoft;
          ctx.font = "700 18px Arial, sans-serif";
          ctx.textAlign = "right";
          ctx.fillText(formatMoney(item.totalCents / 100), width - 60, cardTop + 31);
          ctx.textAlign = "left";
        }
        y = cardTop + rowHeight + 10;
      }
      drawRule();

      if (order.personalization) {
        const p = order.personalization;
        const lines = [
          p.phrase ? "Frase: " + p.phrase : "",
          p.age ? "Idade: " + p.age : "",
          p.decoration ? "Decoração: " + p.decoration : "",
          p.colors ? "Cores: " + p.colors : "",
          p.wrappers ? "Forminhas: " + p.wrappers : "",
        ].filter(Boolean);
        if (lines.length) {
          drawSection("Personalização");
          for (const line of lines) drawText(line, { size: 18, lineHeight: 28 });
          drawRule();
        }
      } else if (order.observations) {
        drawSection("Observações");
        drawText(String(order.observations), { size: 18, lineHeight: 28 });
        drawRule();
      }

      const total = typeof order.totalCents === "number" ? order.totalCents / 100 : Number(order.total || 0);
      const deposit = typeof order.depositCents === "number" ? order.depositCents / 100 : Number(order.deposit || 0);
      const balance = typeof order.balanceCents === "number" ? order.balanceCents / 100 : Number(order.balance || 0);
      drawSection("Resumo financeiro");
      drawText("VALOR TOTAL", { size: 16, color: colors.muted, weight: 700, lineHeight: 27 });
      y += 5;
      drawText(formatMoney(total), { size: 40, color: colors.roseDark, weight: 700, lineHeight: 54 });
      y += 1;
      drawText("Entrada prevista (60%): " + formatMoney(deposit), { size: 19, weight: 600, lineHeight: 31 });
      drawText("Saldo previsto (40%): " + formatMoney(balance), { size: 19, lineHeight: 31 });
      const paymentStart = order.paymentInitial || order.paymentMethod || "";
      const paymentBalance = order.paymentBalance || order.balancePaymentMethod || "";
      if (paymentStart) drawText("Pagamento da entrada: " + paymentStart, { size: 17, color: colors.cocoaSoft, lineHeight: 28 });
      if (paymentBalance) drawText("Pagamento do restante: " + paymentBalance, { size: 17, color: colors.cocoaSoft, lineHeight: 28 });
      y += 24;

      const finalHeight = y + 82;
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = width;
      finalCanvas.height = finalHeight;
      const finalCtx = finalCanvas.getContext("2d");
      if (!finalCtx) throw new Error("Não foi possível finalizar a imagem da comanda.");
      finalCtx.fillStyle = colors.cream;
      finalCtx.fillRect(0, 0, width, finalHeight);
      finalCtx.drawImage(workCanvas, 0, 0, width, finalHeight, 0, 0, width, finalHeight);
      finalCtx.strokeStyle = colors.line;
      finalCtx.lineWidth = 2;
      finalCtx.beginPath();
      finalCtx.moveTo(left, finalHeight - 56);
      finalCtx.lineTo(width - left, finalHeight - 56);
      finalCtx.stroke();
      finalCtx.fillStyle = colors.muted;
      finalCtx.font = "16px Arial, sans-serif";
      finalCtx.textAlign = "center";
      finalCtx.fillText("A encomenda será confirmada após a confirmação da data e da entrada.", width / 2, finalHeight - 27);

      const blob = await new Promise<Blob>((resolve, reject) => {
        finalCanvas.toBlob((result) => {
          if (result) resolve(result);
          else reject(new Error("Não foi possível gerar a imagem da comanda."));
        }, "image/png");
      });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = "Comanda_" + String(order.orderCode || "pedido").replace(/[^a-zA-Z0-9_-]/g, "_") + ".png";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Não foi possível baixar a comanda.");
    }
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
      setCustomerOrders(Array.isArray(result.orders) ? result.orders.map((order: any) => ({ ...order, eventTime: formatOrderTime(order.eventTime), name: order.name || name, phone })) : []);
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
    if (delivery.service === "Entrega" && (cleanCep(delivery.cep).length !== 8 || !delivery.number.trim() || !delivery.city.trim() || !delivery.state.trim())) { setCheckoutStep(2); setToast("Informe o CEP e o número para preencher o endereço da entrega"); return; }
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
          personalization: { phrase: details.phrase, age: details.age, decoration: details.decoration, colors: details.colors },
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Não foi possível registrar o pedido.");
      const submittedOrderCode = result.orderCode || orderCode;
      // A solicitação foi registrada na planilha/agenda. Não é necessário copiar ou enviar mensagem manualmente pelo WhatsApp.
      setLastSubmittedOrder({
        orderCode: submittedOrderCode,
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        eventDate: details.eventDate,
        eventTime: details.eventTime,
        service: delivery.service,
        address: delivery.service === "Entrega" ? formattedAddress : ORIGIN,
        total,
        deposit,
        balance,
        paymentMethod,
        balancePaymentMethod,
        items: cart.map((item) => ({
          name: item.name,
          variant: item.variant,
          type: item.type,
          quantity: item.qty,
          totalCents: Math.round(item.qty * item.unitPrice * 100),
        })),
        personalization: {
          phrase: details.phrase,
          age: details.age,
          decoration: details.decoration,
          colors: details.colors,
        },
        status: "Solicitação recebida — aguardando confirmação da data e da entrada",
      });
      setOrderSuccessOpen(true);
      setOrderOpen(false);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Não foi possível registrar o pedido. Tente novamente.");
    } finally {
      setOrderSubmitting(false);
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

  const sweetsSuggestion = () => {
    const guests = Math.max(1, Math.floor(Number(guestCount) || 1));
    const minimumEstimate = guests * 4;
    const maximumEstimate = guests * 6;
    const roundUpToPack = (value: number) => Math.max(25, Math.ceil(value / 25) * 25);
    const roundToPack = (value: number) => Math.max(25, Math.round(value / 25) * 25);
    const minimumOption = roundUpToPack(minimumEstimate);
    const maximumOption = Math.max(25, Math.floor(maximumEstimate / 25) * 25);
    const balancedOption = roundToPack(guests * 5);
    const recommended = minimumOption <= maximumOption
      ? Math.min(maximumOption, Math.max(minimumOption, balancedOption))
      : roundToPack((minimumEstimate + maximumEstimate) / 2);
    const extraNote = recommended > 200
      ? " Para quantidades acima de 200, combine as quantidades entre os sabores no cardápio."
      : "";
    return `Para ${guests} convidados, a estimativa é de ${minimumEstimate} a ${maximumEstimate} docinhos (4 a 6 por pessoa). Como trabalhamos com quantidades em múltiplos de 25 por sabor, minha sugestão inicial é ${recommended} unidades.${extraNote} Você pode ajustar os sabores e as quantidades diretamente no cardápio.`;
  };

  return (
    <main className={showroom ? "storefront-page" : "home-page"}>
      <header className="site-header">
        <a className="brand" href="/" aria-label="Brigadeiro e Beijinho - início">
          <img
            src="/assets/logo-complete.webp"
            alt="Doceria Brigadeiro & Beijinho"
            width="900"
            height="673"
          />
        </a>
        <nav className={mobileMenu ? "nav-open" : ""} aria-label="Navegação principal">
          <a href="/#como-pedir" onClick={() => setMobileMenu(false)}>Como pedir</a>
          <a href="/#cardapio" onClick={() => setMobileMenu(false)}>Cardápio</a>
          <a href="/bolos" onClick={() => setMobileMenu(false)}>Bolos</a>
          <a href="/docinhos" onClick={() => setMobileMenu(false)}>Doces e Bombons</a>
          <a href="/presentes" onClick={() => setMobileMenu(false)}>Presentes</a>
          <a href="/decoracoes" onClick={() => setMobileMenu(false)}>Decorações</a>
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

      {!showroom && <section className="hero" id="inicio">
        <div className="hero-copy">
          <span className="eyebrow">Bolos e doces artesanais em Belo Horizonte</span>
          <h1>Bolos e doces para sua comemoração</h1>
          <p>Encontre bolos, docinhos e presentes. Confira sabores e preços.</p>
          <p className="hero-deadline">Todos os pedidos precisam de 72 horas de antecedência.</p>
          <div className="hero-search-access">
            <form action="/buscar" method="get" className="hero-search-form" role="search">
              <label htmlFor="hero-product-search">Encontre rápido no cardápio</label>
              <div><input id="hero-product-search" type="search" name="q" placeholder="Busque por doce, recheio ou tamanho..." aria-label="Buscar produtos e sabores"/><button type="submit">Pesquisar →</button></div>
            </form>
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
      </section>}
      {!showroom && <section className="home-bolo-showcase" id="bolos-destaque">
        <div className="home-bolo-heading">
          <span className="section-kicker">Bolos personalizados</span>
          <h2>Escolha seu bolo</h2>
          <p>Veja o tamanho, a quantidade de fatias e o valor inicial.</p>
        </div>
        <div className="home-bolo-grid">
          {cakeSizeCatalog.map(bolo=><article className="home-bolo-card" key={bolo.id}>
            <a href={`/bolos/${bolo.id}`} aria-label={`Quero ${bolo.name} a partir de ${formatMoney(Math.min(...Object.values(bolo.prices)))}`}>
              <img src={showcaseCakeImages[bolo.id]} alt={`Exemplo de decoração feita pela doceria para ${bolo.name}`} loading="lazy"/>
              <div className="home-bolo-details">
                <h3>{bolo.name}</h3>
                <p>{bolo.subtitle}</p>
                <strong>A partir de {formatMoney(Math.min(...Object.values(bolo.prices)))}</strong>
                <span className="home-bolo-buy">Quero esse →</span>
              </div>
            </a>
          </article>)}
        </div>
        <div className="home-bolo-note"><span>Fotos ilustrativas das nossas decorações.</span><a href="/decoracoes">Ver ideias de decoração →</a></div>
      </section>}
      {!showroom && <section className="order-explainer" id="como-pedir" aria-label="Como pedir">
        <div><span className="section-kicker">É simples encomendar</span><h2>Como fazer seu pedido</h2></div>
        <div className="order-explainer-steps">
          <p><b>1. Escolha</b> Bolos, docinhos ou presentes na vitrine.</p>
          <p><b>2. Personalize</b> Veja sabores, quantidades e valores no próprio produto.</p>
          <p><b>3. Envie</b> Revise e solicite sua encomenda. Confirmamos a disponibilidade antes de fechar.</p>
        </div>
      </section>}
      {showroom && <section className="storefront-heading" aria-label="Vitrine de produtos">
        <span className="section-kicker">Nossa vitrine · Monte seu pedido por aqui</span>
        <h1>{focusedCake ? focusedCake.name : category === "bolos" ? "Bolos personalizados" : category === "docinhos" ? "Doces e bombons" : category === "combos" ? "Combos e kits" : "Presentes especiais"}</h1>
        <p>{focusedCake ? `${focusedCake.subtitle} · A partir de ${formatMoney(Math.min(...Object.values(focusedCake.prices)))}` : category === "bolos" ? "Escolha pelo tamanho e confira os recheios." : category === "docinhos" ? "Encontre os sabores e confira os valores." : "Veja o que acompanha cada opção."}</p>
        <form action="/buscar" role="search" className="storefront-search"><input name="q" type="search" placeholder="Buscar recheio, doce ou tamanho..." aria-label="Buscar no cardápio"/><button type="submit">Buscar →</button></form>
      </section>}
      <section className="catalog-section" id="cardapio">
        <div className="section-heading">
          <span className="section-kicker">Feito com carinho para suas comemorações</span>
          <h2>{focusedCake ? "Escolha massa, recheio e decoração" : showroom ? (category === "bolos" ? "Escolha seu bolo" : category === "docinhos" ? "Escolha seus docinhos" : category === "combos" ? "Monte seu kit" : "Escolha um presente") : "Outros produtos"}</h2>
          <p>
            {focusedCake ? "Escolha as opções abaixo e acompanhe o valor." : showroom ? "Veja os produtos e seus preços." : "Encontre doces, bombons e presentes."}
          </p>
        </div>

        {!showroom && (catalogTab === "choose" ? (
          <>
            <div className="catalog-link-list" aria-label="Categorias do cardápio">
              <a href="/docinhos">
                <span className="catalog-link-symbol">🍬</span>
                <span><strong>Doces e bombons</strong><small>Sabores e quantidades</small></span>
                <b>A partir de R$ 40,00 / 25 un.</b><em>Ver doces →</em>
              </a>
              <a href="/presentes">
                <span className="catalog-link-symbol">🎁</span>
                <span><strong>Presentes e kits</strong><small>Bentôs, cupcakes e combos</small></span>
                <b>A partir de R$ 59,90</b><em>Ver presentes →</em>
              </a>
            </div>
          </>
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
        ))}

        {(catalogTab === "cakes" || catalogTab === "all") && (
          <>
            {catalogTab === "all" && (
              <div className="full-menu-heading">
                <span>01 · BOLOS</span>
                <h3>Bolos personalizados e bolos de corte</h3>
                <p>Escolha tamanho, categoria de recheio, massa e decoração.</p>
              </div>
            )}
            {!showroom && <div className="cake-guide">
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
            }
            {!showroom && <div className="cake-category-explanation">
              <div>
                <span className="section-kicker">Recheios</span>
                <h3>Tipos de recheio</h3>
              </div>
              <div className="cake-category-grid">
                <div>
                  <strong>Clássico</strong>
                  <p>Brigadeiro, Ninho, Prestígio e outros.</p>
                </div>
                <div>
                  <strong>Especial</strong>
                  <p>Nutella, frutas, nozes e mousses.</p>
                </div>
                <div>
                  <strong>Gourmet</strong>
                  <p>Pistache, amêndoas e castanhas.</p>
                </div>
              </div>
              <p className="cake-category-note">
                O recheio define a categoria e o preço. Decorações adicionais são cobradas à parte.
              </p>
            </div>}
            {!showroom && <div
              className="static-photo-strip"
              aria-label="Fotos de bolos produzidos pela Doceria Brigadeiro & Beijinho"
            >
              {cakeCatalogGallery.map((photo) => (
                <figure key={photo.src}>
                  <img src={photo.src} alt={photo.alt} />
                </figure>
              ))}
            </div>}
            <div className="cake-grid">
              {(focusedCake ? cakeSizeCatalog.filter(cake=>cake.id===focusedCake.id) : cakeSizeCatalog).map((cake) => {
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
                  <article className="product-card cake-card" id={`produto-${cake.id}`} key={cake.id}>
                    <details className="catalog-item-details">
                      <summary className="catalog-item-summary">
                        <img className="catalog-summary-img" src={({
                          mini:"/assets/monthly-cake.webp", p:"/assets/cake-classic.webp",
                          m:"/assets/cake-floral.webp", g:"/assets/cake-lilac.webp",
                          gg:"/assets/cake-ribbons.webp", corte:"/assets/cake-theme.webp"
                        } as Record<string,string>)[cake.id]} alt="" />
                        <div className="catalog-summary-name"><h3>{cake.name}</h3><span>{cake.subtitle}</span></div>
                        <div className="catalog-summary-prices">
                          <span>Clássico <b>{formatMoney(cake.prices.Classico)}</b></span>
                          <span>Especial <b>{formatMoney(cake.prices.Especial)}</b></span>
                          <span>Gourmet <b>{formatMoney(cake.prices.Gourmet)}</b></span>
                        </div>
                        <strong className="catalog-summary-action">Escolher <span aria-hidden="true">⌄</span></strong>
                      </summary>
                      <div className="catalog-item-options">
                        <p className="catalog-brief-note">{cake.description}</p>
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
                                    Todos os pedidos precisam de 72 horas de antecedência.
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
                      </div>
                    </details>
                  </article>
                );
              })}
            </div>
            <p className="catalog-note cake-catalog-note">
              O tamanho Mini é uma ótima escolha para mesversários,
              comemorações íntimas e presentes. Todos os pedidos precisam de 72 horas de antecedência.
            </p>
          </>
        )}

        {(catalogTab === "sweets" || catalogTab === "all") && (
          <>
            {catalogTab === "all" && (
              <div className="full-menu-heading">
                <span>02 · DOCINHOS E BOMBONS</span>
                <h3>Docinhos, bombons e doces finos</h3>
                <p>Confira os sabores e os preços por categoria. As quantidades são selecionadas em múltiplos de 25.</p>
              </div>
            )}
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
            {catalogTab !== "all" && (
              <div className="flavor-filters" aria-label="Tipos de doces">
                {category === "docinhos" && <button type="button" className={sweetGroupId === "all" ? "active" : ""} onClick={() => setSweetGroupId("all")}>Todos</button>}
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
            )}
            {category !== "docinhos" && <div
              className="static-photo-strip"
              aria-label="Fotos de doces e bombons da Doceria Brigadeiro & Beijinho"
            >
              {sweetsCatalogGallery.map((photo) => (
                <figure key={photo.src}>
                  <img src={photo.src} alt={photo.alt} />
                </figure>
              ))}
            </div>}
            {displayedSweetGroups.map((group) => (
              <section className="sweet-catalog-subsection" id={group.id} key={group.id}>
                <div className="sweet-group-title">
                  <div>
                    <span>Pedido mínimo: 25 por sabor</span>
                    <h3>{group.name}</h3>
                  </div>
                  <strong>{formatMoney(group.hundredPrice)} / 100 unidades</strong>
                </div>
                <div className="sweet-grid">
                  {group.items.map((sweet) => {
                    const quantity = sweetQuantities[sweet.id] ?? 25;
                    const wrapperColor = sweetWrappers[sweet.id] ?? "Branca";
                    const wrapper =
                      wrapperOptions.find((option) => option.value === wrapperColor) ?? wrapperOptions[0];
                    const itemTotal =
                      (group.hundredPrice / 100) * quantity +
                      (quantity / 25) * wrapper.fee;
                    return (
                      <article className="sweet-card" id={`produto-${sweet.id}`} key={sweet.id}>
                        <details className="catalog-item-details">
                          <summary className="catalog-item-summary">
                            <img className={`catalog-summary-img ${sweetSpriteIds.has(sweet.id) ? "sweet-photo--sprite" : ""}`}
                              src={sweetPhoto(sweet.id, group.type)} style={{objectPosition:sweetPhotoPosition(sweet.id)}}
                              alt={`Foto de ${sweet.name}`} />
                            <div className="catalog-summary-name"><h4>{sweet.name}</h4><span>{sweet.description}</span></div>
                            <div className="catalog-summary-prices catalog-summary-single">
                              <span>25 un. <b>{formatMoney(group.hundredPrice / 4)}</b></span>
                              <span>100 un. <b>{formatMoney(group.hundredPrice)}</b></span>
                            </div>
                            <strong className="catalog-summary-action">Escolher <span aria-hidden="true">⌄</span></strong>
                          </summary>
                          <div className="catalog-item-options">
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
                          <button type="button" onClick={() => addSweet(group, sweet)}>
                            Adicionar
                          </button>
                        </div>
                        </div>
                        </details>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}

          </>
        )}

        {(catalogTab === "gifts" || catalogTab === "all") && (
          <div className="gift-grid">
            {catalogTab === "all" && (
              <div className="full-menu-heading">
                <span>03 · PRESENTES</span>
                <h3>Bentôs, cupcakes e presentes</h3>
                <p>Escolha opções para presentear ou completar sua comemoração.</p>
              </div>
            )}
            {(category === "combos" ? gifts.filter(gift => gift.id === "bento-combo" || gift.id.startsWith("caixa")) : gifts).map((gift, index) => (
              <article className="gift-card gift-card-with-image" id={`produto-${gift.id}`} key={gift.id}>
                <details className="catalog-item-details">
                  <summary className="catalog-item-summary">
                    <img className="catalog-summary-img" src={gift.image} alt="" />
                    <div className="catalog-summary-name"><h3>{gift.name}</h3><span>{gift.description}</span></div>
                    <div className="catalog-summary-prices catalog-summary-single"><span>A partir de <b>{formatMoney(gift.price)}</b></span></div>
                    <strong className="catalog-summary-action">Escolher <span aria-hidden="true">⌄</span></strong>
                  </summary>
                  <div className="catalog-item-options">
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
                        <option value="Especial">Especial + R$ 8,00</option>
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
                        <option value="Especial">Especial + R$ 8,00</option>
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
                </div>
                </details>
              </article>
            ))}
          </div>
        )}
      </section>

      {!showroom && <>
      <section className="gallery-section" id="galeria">
        <div className="gallery-copy">
          <span className="section-kicker">Feito de verdade</span>
          <h2>Um bolo para cada história</h2>
          <p>
            Cada decoração parte da sua referência e ganha o cuidado artesanal
            da nossa produção. Confira um dos nossos trabalhos.
          </p>
          <a href={INSTAGRAM} target="_blank" rel="noreferrer">
            Veja nossos produtos no Instagram <span>→</span>
          </a>
        </div>
        <div className="gallery-grid gallery-grid-single">
          <figure className="gallery-tall">
            <img src="/assets/cake-theme.webp" alt="Bolo temático personalizado em rosa" />
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

      </>}
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
        <div className="floating-socials" aria-label="Redes sociais">
          <a
            className="instagram-float"
            href={INSTAGRAM}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Acessar o Instagram da Doceria Brigadeiro e Beijinho"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle className="instagram-dot" cx="17.5" cy="6.5" r="1" />
            </svg>
          </a>
          <a
            className="whatsapp-float"
            href={WHATSAPP_INFO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Falar pelo WhatsApp"
          >
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <path d="M16 3a12.5 12.5 0 0 0-10.9 18.6L3.5 28l6.6-1.6A12.5 12.5 0 1 0 16 3Zm0 22.8c-2 0-3.9-.6-5.5-1.6l-.4-.2-3.9 1 1-3.8-.2-.4A10.2 10.2 0 1 1 16 25.8Zm5.6-7.6c-.3-.1-1.8-.9-2.1-1-.3-.1-.5-.1-.7.2l-1 1.2c-.2.2-.4.2-.7.1-1.9-.9-3.2-1.8-4.5-4-.3-.5.3-.5.9-1.7.1-.2.1-.4 0-.6l-.9-2.1c-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.9s1.2 3.3 1.4 3.5c.2.2 2.4 3.7 5.9 5.2.8.4 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 1.8-.7 2.1-1.5.3-.7.3-1.4.2-1.5-.2-.2-.5-.3-.8-.4Z" />
            </svg>
          </a>
     </div>
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
          <p className="assistant-category-hint">
            Quer consultar sabores, tamanhos ou preços? Escolha uma categoria e eu te levo direto ao cardápio.
          </p>
          <div className="assistant-options assistant-category-options">
            <button
              type="button"
              onClick={() => {
                setCatalogTab("cakes");
                setAssistantOpen(false);
                document.getElementById("cardapio")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Sabores e tamanhos de bolos
            </button>
            <button
              type="button"
              onClick={() => {
                setCatalogTab("sweets");
                setAssistantOpen(false);
                document.getElementById("cardapio")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Sabores e preços de doces e bombons
            </button>
            <button
              type="button"
              onClick={() => {
                setCatalogTab("gifts");
                setAssistantOpen(false);
                document.getElementById("cardapio")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Bentô, cupcakes e presentes
            </button>
            <button
              type="button"
              onClick={() => {
                setCatalogTab("all");
                setAssistantOpen(false);
                document.getElementById("cardapio")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Ainda não decidi — ver cardápio completo
            </button>
          </div>
          <div className="assistant-guest">
            <label htmlFor="guest-count">Quantidade de convidados</label>
            <input
              id="guest-count"
              type="number"
              min="1"
              max="1000"
              value={guestCount}
              onChange={(event) =>
                setGuestCount(Math.max(1, Math.floor(Number(event.target.value) || 1)))
              }
            />
          </div>
          <div className="assistant-options">
            <button type="button" onClick={() => setAssistantAnswer(cakeSuggestion())}>
              Qual tamanho de bolo?
            </button>
            <button
              type="button"
              onClick={() => setAssistantAnswer(sweetsSuggestion())}
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
                      <strong>Todos os pedidos precisam de 72 horas de antecedência.</strong>
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
                      <small>
                        O link para pagamento será disponibilizado após você finalizar
                        e enviar o pedido.
                      </small>
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

      {orderSuccessOpen && lastSubmittedOrder && (
        <div className="payment-notice-overlay" role="dialog" aria-modal="true" aria-label="Solicitação recebida">
          <div className="payment-notice-modal customer-portal-modal">
            <span>Solicitação recebida</span>
            <h2>Recebemos sua encomenda!</h2>
            <p>
              Obrigada, {lastSubmittedOrder.name}! Sua solicitação <strong>{lastSubmittedOrder.orderCode}</strong> foi registrada.
            </p>
            <div className="order-success-summary">
              <div><span>Data solicitada</span><strong>{lastSubmittedOrder.eventDate} às {lastSubmittedOrder.eventTime}</strong></div>
              <div><span>Atendimento</span><strong>{lastSubmittedOrder.service}</strong></div>
              <div><span>Valor estimado</span><strong>{formatMoney(lastSubmittedOrder.total)}</strong></div>
              <div><span>Entrada prevista (60%)</span><strong>{formatMoney(lastSubmittedOrder.deposit)}</strong></div>
              {lastSubmittedOrder.balance > 0 && <div><span>Restante (40%)</span><strong>{formatMoney(lastSubmittedOrder.balance)}</strong></div>}
            </div>
            {lastSubmittedOrder.paymentMethod === "Cartão" && (
              <div className="selected-payment-details card-selected">
                <strong>Pedido registrado com sucesso!</strong>
                <p>Agora você já pode realizar o pagamento da entrada de {formatMoney(lastSubmittedOrder.deposit)} pelo cartão.</p>
                <a href={CARD_PAYMENT_URL} target="_blank" rel="noreferrer">
                  Abrir link seguro para pagamento
                </a>
              </div>
            )}
            <div className="payment-notice-info">
              <strong>Próximos passos</strong>
              <p>
                Nossa equipe entrará em contato pelo WhatsApp informado no cadastro para confirmar a disponibilidade da data e os detalhes do pedido. A encomenda será confirmada após a confirmação da data e o pagamento da entrada de 60%.
              </p>
            </div>
            <div>
              <button className="comanda-download-button" type="button" onClick={() => void downloadOrderComanda(lastSubmittedOrder)}>Baixar comanda</button>
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
                      <button className="comanda-download-button" type="button" onClick={() => void downloadOrderComanda(order)}>Baixar comanda</button>
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