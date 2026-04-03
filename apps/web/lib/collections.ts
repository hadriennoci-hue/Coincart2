export type CollectionKey =
  | "accessories"
  | "audio"
  | "cameras"
  | "connectivity"
  | "controllers"
  | "desktops"
  | "docking-stations"
  | "electric-scooters"
  | "foldable-monitors"
  | "gaming-chairs"
  | "gaming-consoles"
  | "gaming-desks"
  | "gaming-laptops"
  | "gaming-monitors"
  | "graphics-cards"
  | "headsets-earbuds"
  | "keyboards"
  | "laptop-bags"
  | "mice"
  | "monitors"
  | "projectors"
  | "storage"
  | "ultrawide-monitors"
  | "webcams"
  | "work-laptops";

export const collectionMeta: Array<{
  key: CollectionKey;
  label: string;
  icon: string;
  intro: string;
}> = [
  {
    key: "accessories",
    label: "Accessories",
    icon: "AC",
    intro: "Adapters, styluses, and small extras that round out the setup.",
  },
  {
    key: "audio",
    label: "Audio",
    icon: "AD",
    intro: "Speakers and standalone audio gear for desks, rooms, and entertainment spaces.",
  },
  {
    key: "cameras",
    label: "Cameras",
    icon: "CM",
    intro: "Capture gear for streaming, photography, and portable recording.",
  },
  {
    key: "connectivity",
    label: "Connectivity",
    icon: "CN",
    intro: "Hubs, adapters, and connection tools that expand ports and network access.",
  },
  {
    key: "controllers",
    label: "Controllers",
    icon: "CT",
    intro: "Game controllers built for couch play, arcade sessions, and PC setups.",
  },
  {
    key: "desktops",
    label: "Desktops",
    icon: "DT",
    intro: "Desktop systems for gaming, office, and creator workloads.",
  },
  {
    key: "docking-stations",
    label: "Docking Stations",
    icon: "DK",
    intro: "Desk docks that simplify cable management, charging, and multi-display work.",
  },
  {
    key: "electric-scooters",
    label: "Electric Scooters",
    icon: "ES",
    intro: "Compact electric mobility for urban commuting and short daily rides.",
  },
  {
    key: "foldable-monitors",
    label: "Foldable Monitors",
    icon: "FM",
    intro: "Portable foldable displays designed for travel-friendly dual-screen setups.",
  },
  {
    key: "gaming-chairs",
    label: "Gaming Chairs",
    icon: "GC",
    intro: "Supportive seating for long sessions, desks, and battle station builds.",
  },
  {
    key: "gaming-consoles",
    label: "Gaming Consoles",
    icon: "GS",
    intro: "Console hardware for living-room gaming and plug-and-play entertainment.",
  },
  {
    key: "gaming-desks",
    label: "Gaming Desks",
    icon: "GD",
    intro: "Dedicated desks sized for monitors, peripherals, and cable-heavy setups.",
  },
  {
    key: "gaming-laptops",
    label: "Gaming Laptops",
    icon: "GL",
    intro: "High-performance laptops tuned for esports, AAA gaming, and creator-heavy workloads.",
  },
  {
    key: "gaming-monitors",
    label: "Gaming Monitors",
    icon: "GM",
    intro: "Fast-refresh displays for competitive play, low latency, and immersive visuals.",
  },
  {
    key: "graphics-cards",
    label: "Graphics Cards",
    icon: "GP",
    intro: "Discrete GPUs for gaming rigs, creator systems, and accelerated workloads.",
  },
  {
    key: "headsets-earbuds",
    label: "Headsets & Earbuds",
    icon: "HE",
    intro: "Personal audio for calls, gaming, commuting, and portable listening.",
  },
  {
    key: "keyboards",
    label: "Keyboards",
    icon: "KB",
    intro: "Compact, mechanical, and productivity-focused keyboards for every layout preference.",
  },
  {
    key: "laptop-bags",
    label: "Laptop Bags",
    icon: "LB",
    intro: "Sleeves and bags that protect laptops while staying travel-ready.",
  },
  {
    key: "mice",
    label: "Mice",
    icon: "MS",
    intro: "Pointing devices for office work, travel kits, and gaming precision.",
  },
  {
    key: "monitors",
    label: "Monitors",
    icon: "MN",
    intro: "General-purpose displays for productivity, office setups, and everyday viewing.",
  },
  {
    key: "projectors",
    label: "Projectors",
    icon: "PJ",
    intro: "Large-format projection gear for presentations, home cinema, and events.",
  },
  {
    key: "storage",
    label: "Storage",
    icon: "ST",
    intro: "Extra capacity for backups, transportable files, and system expansion.",
  },
  {
    key: "ultrawide-monitors",
    label: "Ultrawide Monitors",
    icon: "UW",
    intro: "Wide-format monitors built for multitasking, simulation, and immersive gaming.",
  },
  {
    key: "webcams",
    label: "Webcams",
    icon: "WC",
    intro: "Video peripherals for meetings, streaming, and creator setups.",
  },
  {
    key: "work-laptops",
    label: "Work Laptops",
    icon: "WL",
    intro: "Portable systems focused on office work, mobility, battery life, and everyday productivity.",
  },
];

export const collectionByKey = Object.fromEntries(
  collectionMeta.map((entry) => [entry.key, entry]),
) as Record<CollectionKey, (typeof collectionMeta)[number]>;

export const laptopCollectionKeys = ["gaming-laptops", "work-laptops"] as const satisfies CollectionKey[];

export const displayCollectionKeys = [
  "foldable-monitors",
  "gaming-monitors",
  "monitors",
  "projectors",
  "ultrawide-monitors",
] as const satisfies CollectionKey[];

export const collectionsWithScreenFilters = [
  ...displayCollectionKeys,
  ...laptopCollectionKeys,
] as const satisfies CollectionKey[];

export const isLaptopCollectionKey = (value?: string | null): value is (typeof laptopCollectionKeys)[number] =>
  laptopCollectionKeys.includes((value ?? "") as (typeof laptopCollectionKeys)[number]);

export const isDisplayCollectionKey = (value?: string | null): value is (typeof displayCollectionKeys)[number] =>
  displayCollectionKeys.includes((value ?? "") as (typeof displayCollectionKeys)[number]);
