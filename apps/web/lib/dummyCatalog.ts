export type Currency = "USD" | "EUR";

export type DummyCatalogProduct = {
  id: string;
  sku: string;
  slug: string;
  category?: string | null;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  imageUrls?: string[];
  cpu?: string | null;
  gpu?: string | null;
  keyboardLayout?: string | null;
  usage?: string | null;
  screenSize?: string | null;
  displayType?: string | null;
  resolution?: string | null;
  maxResolution?: string | null;
  refreshRate?: number | null;
  ramMemory?: number | null;
  ssdSize?: number | null;
  storage?: string | null;
  featured: boolean;
  bestSeller?: boolean;
  stockQty: number;
  price: number;
  promoPrice?: number | null;
  currency: Currency;
};

type ProductSeed = Omit<DummyCatalogProduct, "currency" | "price"> & {
  usdPrice: number;
  promoUsdPrice?: number;
};

const EUR_RATE = 0.92;

const cloudflareImageUrls = (
  process.env.NEXT_PUBLIC_DUMMY_IMAGE_URLS || ""
)
  .split(",")
  .map((x) => x.trim())
  .filter(Boolean);

const productImage = (seed: string, index: number) => {
  if (cloudflareImageUrls[index]) return cloudflareImageUrls[index];
  return `/api/dummy-image?seed=${encodeURIComponent(seed)}`;
};

const galleryCountForProductId = (id: string) => {
  const n = Number.parseInt(id.replace("dummy-", ""), 10);
  if (!Number.isFinite(n) || n < 1) return 3;
  return 3 + ((n - 1) % 4); // 3..6
};

const buildGalleryImages = (slug: string, id: string) => {
  const count = galleryCountForProductId(id);
  const baseOffset = (Number.parseInt(id.replace("dummy-", ""), 10) - 1) * 6;
  return Array.from({ length: count }, (_, i) =>
    productImage(`${slug}-gallery-${i + 1}`, baseOffset + i),
  );
};

const seeds: ProductSeed[] = [
  {
    id: "dummy-001",
    sku: "LT-GRY-14-A14",
    slug: "aerobook-14-pro-ryzen7",
    category: "Laptops",
    name: "AeroBook 14 Pro Ryzen 7",
    description: "Thin performance laptop with all-day battery and dedicated RTX graphics.",
    imageUrl: productImage("aerobook-14-pro", 0),
    cpu: "AMD Ryzen 7 8845HS",
    gpu: "NVIDIA RTX 4060",
    keyboardLayout: "QWERTY",
    usage: "Creator",
    screenSize: '14.0"',
    displayType: "OLED",
    resolution: "2880x1800",
    maxResolution: "2880x1800",
    refreshRate: 120,
    ramMemory: 32,
    ssdSize: 1000,
    storage: "1TB NVMe",
    featured: true,
    bestSeller: true,
    stockQty: 18,
    usdPrice: 1499,
    promoUsdPrice: 1399,
  },
  {
    id: "dummy-002",
    sku: "LT-GLX-16-I9",
    slug: "galaxion-16-ultra-i9",
    category: "Laptops",
    name: "Galaxion 16 Ultra i9",
    description: "High-end gaming laptop for 1440p and 4K workloads.",
    imageUrl: productImage("galaxion-16-ultra", 1),
    cpu: "Intel Core i9-14900HX",
    gpu: "NVIDIA RTX 4080",
    keyboardLayout: "AZERTY",
    usage: "Gaming",
    screenSize: '16.0"',
    displayType: "Mini LED",
    resolution: "2560x1600",
    maxResolution: "3840x2160",
    refreshRate: 240,
    ramMemory: 32,
    ssdSize: 2000,
    storage: "2TB NVMe",
    featured: true,
    bestSeller: true,
    stockQty: 7,
    usdPrice: 2799,
    promoUsdPrice: 2599,
  },
  {
    id: "dummy-003",
    sku: "LT-NOVA-13-I5",
    slug: "nova13-business-i5",
    category: "Laptops",
    name: "Nova13 Business i5",
    description: "Compact business laptop with secure hardware TPM and LTE option.",
    imageUrl: productImage("nova13-business", 2),
    cpu: "Intel Core i5-1340P",
    gpu: "Intel Iris Xe",
    keyboardLayout: "QWERTZ",
    usage: "Office",
    screenSize: '13.3"',
    displayType: "IPS",
    resolution: "1920x1200",
    maxResolution: "2560x1600",
    refreshRate: 60,
    ramMemory: 16,
    ssdSize: 512,
    storage: "512GB NVMe",
    featured: false,
    stockQty: 23,
    usdPrice: 1099,
  },
  {
    id: "dummy-004",
    sku: "AF-CRISP-XL9",
    slug: "crispcore-xl9-airfryer",
    category: "Air Fryers",
    name: "CrispCore XL9 Smart Airfryer",
    description: "Dual-zone air fryer with app control and precision temperature profiles.",
    imageUrl: productImage("crispcore-xl9", 3),
    usage: "Home Kitchen",
    featured: true,
    stockQty: 41,
    usdPrice: 249,
    promoUsdPrice: 219,
  },
  {
    id: "dummy-005",
    sku: "AF-TURBO-5L",
    slug: "turbofry-5l-essential",
    category: "Air Fryers",
    name: "TurboFry 5L Essential",
    description: "Reliable daily air fryer with low-noise convection mode.",
    imageUrl: productImage("turbofry-5l", 4),
    usage: "Home Kitchen",
    featured: false,
    bestSeller: true,
    stockQty: 58,
    usdPrice: 119,
  },
  {
    id: "dummy-006",
    sku: "EB-URB-500",
    slug: "urbanvolt-500-city-ebike",
    category: "Electric Bikes",
    name: "UrbanVolt 500 City E-Bike",
    description: "Step-through city e-bike with removable battery and integrated lights.",
    imageUrl: productImage("urbanvolt-500", 5),
    usage: "Urban Mobility",
    featured: true,
    stockQty: 12,
    usdPrice: 1899,
  },
  {
    id: "dummy-007",
    sku: "EB-TRAIL-750",
    slug: "trailstorm-750-fat-tire-ebike",
    category: "Electric Bikes",
    name: "TrailStorm 750 Fat Tire E-Bike",
    description: "All-terrain e-bike with torque sensor and hydraulic disc brakes.",
    imageUrl: productImage("trailstorm-750", 6),
    usage: "Outdoor",
    featured: false,
    stockQty: 9,
    usdPrice: 2399,
  },
  {
    id: "dummy-008",
    sku: "HP-NOVA-ANC",
    slug: "novaphone-anc-wireless",
    category: "Headphones",
    name: "NovaPhone ANC Wireless",
    description: "Premium wireless headphones with adaptive ANC and low-latency mode.",
    imageUrl: productImage("novaphone-anc", 7),
    usage: "Audio",
    featured: true,
    stockQty: 67,
    usdPrice: 329,
    promoUsdPrice: 299,
  },
  {
    id: "dummy-009",
    sku: "HP-STUDIO-X",
    slug: "studiox-open-back-headphones",
    category: "Headphones",
    name: "StudioX Open-Back Headphones",
    description: "Reference-grade wired headphones for mixing and mastering.",
    imageUrl: productImage("studiox-openback", 8),
    usage: "Audio",
    featured: false,
    stockQty: 29,
    usdPrice: 249,
  },
  {
    id: "dummy-010",
    sku: "MON-AURA-34",
    slug: "auraview-34-ultrawide-monitor",
    category: "Monitors",
    name: "AuraView 34 UltraWide",
    description: "34-inch ultrawide monitor for productivity and immersive gameplay.",
    imageUrl: productImage("auraview-34", 9),
    screenSize: '34.0"',
    displayType: "VA",
    resolution: "3440x1440",
    maxResolution: "3440x1440",
    refreshRate: 165,
    featured: false,
    stockQty: 15,
    usdPrice: 699,
  },
  {
    id: "dummy-011",
    sku: "SPK-PULSE-2",
    slug: "pulsebar-2-soundbar",
    category: "Audio",
    name: "PulseBar 2 Dolby Soundbar",
    description: "Compact soundbar with spatial upmixing and wireless subwoofer.",
    imageUrl: productImage("pulsebar-2", 10),
    usage: "Audio",
    featured: false,
    stockQty: 38,
    usdPrice: 449,
  },
  {
    id: "dummy-012",
    sku: "LT-ARC-15-R9",
    slug: "arcforge-15-creator-r9",
    category: "Laptops",
    name: "ArcForge 15 Creator Ryzen 9",
    description: "Workstation-class creator laptop tuned for 3D and video rendering.",
    imageUrl: productImage("arcforge-15", 11),
    cpu: "AMD Ryzen 9 8945HS",
    gpu: "NVIDIA RTX 4070",
    keyboardLayout: "QWERTY",
    usage: "Creator",
    screenSize: '15.6"',
    displayType: "IPS",
    resolution: "2560x1600",
    maxResolution: "3840x2160",
    refreshRate: 165,
    ramMemory: 64,
    ssdSize: 2000,
    storage: "2TB NVMe",
    featured: false,
    stockQty: 11,
    usdPrice: 2299,
  },
  {
    id: "dummy-013",
    sku: "AF-CHEF-12",
    slug: "chefair-pro-12l-oven",
    category: "Air Fryers",
    name: "ChefAir Pro 12L Oven",
    description: "Large-format air fryer oven with rotisserie and dehydration modes.",
    imageUrl: productImage("chefair-pro-12l", 12),
    usage: "Home Kitchen",
    featured: false,
    stockQty: 22,
    usdPrice: 299,
  },
  {
    id: "dummy-014",
    sku: "HP-CITY-BUDS",
    slug: "citybuds-pro-ii",
    category: "Headphones",
    name: "CityBuds Pro II",
    description: "True wireless earbuds with strong call isolation and 30h battery life.",
    imageUrl: productImage("citybuds-pro-ii", 13),
    usage: "Audio",
    featured: false,
    bestSeller: true,
    stockQty: 80,
    usdPrice: 179,
    promoUsdPrice: 159,
  },
  {
    id: "dummy-015",
    sku: "EB-CARGO-600",
    slug: "cargojet-600-family-ebike",
    category: "Electric Bikes",
    name: "CargoJet 600 Family E-Bike",
    description: "Longtail family cargo bike with dual battery support.",
    imageUrl: productImage("cargojet-600", 14),
    usage: "Urban Mobility",
    featured: false,
    stockQty: 4,
    usdPrice: 2999,
  },
  {
    id: "dummy-016",
    sku: "KB-MECH-RGB",
    slug: "mechforge-rgb-keyboard",
    category: "Accessories",
    name: "MechForge RGB Keyboard",
    description: "Hot-swappable mechanical keyboard with aluminum top plate.",
    imageUrl: productImage("mechforge-rgb", 15),
    keyboardLayout: "QWERTY",
    usage: "Gaming",
    featured: false,
    bestSeller: true,
    stockQty: 55,
    usdPrice: 139,
  },
  {
    id: "dummy-017",
    sku: "LT-STEALTH-17",
    slug: "stealth17-pro-max",
    category: "Laptops",
    name: "Stealth17 Pro Max",
    description: "17-inch desktop replacement tuned for simulation and AI workloads.",
    imageUrl: productImage("stealth17-pro-max", 16),
    cpu: "Intel Core Ultra 9 285H",
    gpu: "NVIDIA RTX 4090",
    keyboardLayout: "QWERTY",
    usage: "Gaming",
    screenSize: '17.3"',
    displayType: "Mini LED",
    resolution: "2560x1600",
    maxResolution: "3840x2160",
    refreshRate: 240,
    ramMemory: 64,
    ssdSize: 4000,
    storage: "4TB NVMe",
    featured: true,
    stockQty: 3,
    usdPrice: 3999,
  },
  {
    id: "dummy-018",
    sku: "CAM-ACTION-4K",
    slug: "actioneye-4k-camera",
    category: "Cameras",
    name: "ActionEye 4K Camera",
    description: "Stabilized action camera with waterproof housing and HDR video.",
    imageUrl: productImage("actioneye-4k", 17),
    usage: "Outdoor",
    featured: false,
    stockQty: 31,
    usdPrice: 349,
  },
];

const toCurrencyPrice = (usdPrice: number, currency: Currency) =>
  currency === "USD" ? usdPrice : Number((usdPrice * EUR_RATE).toFixed(2));

const withCurrency = (seed: ProductSeed, currency: Currency): DummyCatalogProduct => {
  const imageUrls = buildGalleryImages(seed.slug, seed.id);
  return {
    ...seed,
    imageUrls,
    imageUrl: imageUrls[0] ?? seed.imageUrl ?? null,
    price: toCurrencyPrice(seed.usdPrice, currency),
    promoPrice:
      typeof seed.promoUsdPrice === "number"
        ? toCurrencyPrice(seed.promoUsdPrice, currency)
        : null,
    currency,
  };
};

export const listDummyProducts = (currency: Currency) =>
  seeds.map((seed) => withCurrency(seed, currency));

export const getDummyProductBySlug = (slug: string, currency: Currency) => {
  const seed = seeds.find((item) => item.slug === slug);
  return seed ? withCurrency(seed, currency) : null;
};

export const getDummyProductsBySkus = (skus: string[], currency: Currency) => {
  const set = new Set(skus);
  return seeds.filter((seed) => set.has(seed.sku)).map((seed) => withCurrency(seed, currency));
};

export const getDummyOrderById = (orderId: string) => {
  const products = listDummyProducts("EUR").slice(0, 3);
  const lines = [
    { sku: products[0].sku, productName: products[0].name, unitPrice: products[0].price, quantity: 1 },
    { sku: products[1].sku, productName: products[1].name, unitPrice: products[1].price, quantity: 1 },
    { sku: products[2].sku, productName: products[2].name, unitPrice: products[2].price, quantity: 2 },
  ];
  const subtotal = lines.reduce((sum, x) => sum + x.unitPrice * x.quantity, 0);
  const shipping = 10;

  return {
    id: orderId,
    customerEmail: "demo.customer@coincart.store",
    customerPhone: "+33 6 11 22 33 44",
    currency: "EUR" as Currency,
    shippingMethod: "DHL Standard",
    estimatedDeliveryDays: 5,
    shippingCost: shipping,
    totalAmount: Number((subtotal + shipping).toFixed(2)),
    status: orderId.endsWith("-paid") ? "paid" : "pending_payment",
    btcpayInvoiceId: `inv_${orderId}`,
    btcpayCheckoutUrl: "https://btcpay.example.test/invoice/demo",
    createdAt: new Date().toISOString(),
    items: lines.map((x) => ({
      ...x,
      lineTotal: Number((x.unitPrice * x.quantity).toFixed(2)),
    })),
  };
};
