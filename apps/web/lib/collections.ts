export type CollectionKey =
  | "audio"
  | "cases"
  | "desktops"
  | "displays"
  | "input-devices"
  | "laptops"
  | "lifestyle"
  | "tablets";

export const collectionMeta: Array<{
  key: CollectionKey;
  label: string;
  icon: string;
  intro: string;
}> = [
  {
    key: "audio",
    label: "Audio",
    icon: "AU",
    intro: "Headsets, earbuds, and audio gear for work, gaming, and everyday use.",
  },
  {
    key: "cases",
    label: "Cases",
    icon: "CS",
    intro: "Protective and functional computer cases selected for reliability and airflow.",
  },
  {
    key: "desktops",
    label: "Desktops",
    icon: "DT",
    intro: "Desktop systems for gaming, office, and creator workloads.",
  },
  {
    key: "displays",
    label: "Displays",
    icon: "DP",
    intro: "Monitors and displays optimized for productivity, gaming, and color work.",
  },
  {
    key: "input-devices",
    label: "Input Devices",
    icon: "IN",
    intro: "Keyboards, pointing devices, and peripherals for precision and comfort.",
  },
  {
    key: "laptops",
    label: "Laptops",
    icon: "LP",
    intro: "Laptop configurations for office, creator, and gaming use cases.",
  },
  {
    key: "lifestyle",
    label: "Lifestyle",
    icon: "LF",
    intro: "Everyday tech accessories and audio products for mobile lifestyles.",
  },
  {
    key: "tablets",
    label: "Tablets",
    icon: "TB",
    intro: "Portable tablet devices for work, study, and entertainment.",
  },
];

export const collectionByKey = Object.fromEntries(
  collectionMeta.map((entry) => [entry.key, entry]),
) as Record<CollectionKey, (typeof collectionMeta)[number]>;
