/**
 * Spec-table helpers for the Coincart product page.
 *
 * In Coincart, ALL Wizhard metafields arrive in product.extraAttributes as
 * { name: string; options: string[] } entries (e.g. { name: "dpi", options: ["1600"] }).
 * This module applies human-readable labels and filters out entries that are
 * already shown elsewhere in the page (short_pitch, color, etc.).
 */

/** Human-readable labels for known Wizhard metafield keys. */
export const METAFIELD_LABEL_OVERRIDES: Record<string, string> = {
  product_subtype: "Type",
  operating_system: "Operating System",
  touchscreen: "Touchscreen",
  panel_type: "Panel Type",
  storage_type: "Storage Type",
  ai_performance: "AI Performance",
  anti_ghosting: "Anti-Ghosting",
  aperture: "Aperture",
  architecture: "Architecture",
  armrests: "Armrests",
  aspect_ratio: "Aspect Ratio",
  audio: "Audio",
  backrest: "Backrest",
  battery: "Battery",
  battery_life: "Battery Life",
  board_power: "Board Power",
  brakes: "Brakes",
  brightness: "Brightness",
  buttons: "Buttons",
  cable_length: "Cable Length",
  capacity: "Capacity",
  card_reader: "Card Reader",
  carry_style: "Carry Style",
  cellular: "Cellular",
  charging_time: "Charging Time",
  chassis_volume: "Chassis Volume",
  compartments: "Compartments",
  compatibility: "Compatibility",
  connection: "Connection",
  connector: "Connector",
  contrast_ratio: "Contrast Ratio",
  controls: "Controls",
  cooling: "Cooling",
  curved: "Curved",
  design: "Design",
  dimensions: "Dimensions",
  display: "Display",
  display_support: "Display Support",
  dpi: "DPI",
  dram_cache: "DRAM Cache",
  driver_size: "Driver Size",
  endurance: "Endurance",
  ethernet: "Ethernet",
  features: "Features",
  field_of_view: "Field of View",
  focal_length: "Focal Length",
  focus: "Focus",
  form_factor: "Form Factor",
  frame_rate: "Frame Rate",
  frequency_response: "Frequency Response",
  gpu_clock: "GPU Clock",
  gpu_memory: "VRAM",
  gpu_model: "GPU Model",
  gsync_freesync: "G-Sync / FreeSync",
  hdr: "HDR",
  heatsink: "Heatsink",
  host_connection: "Host Connection",
  interface: "Interface",
  iops: "IOPS",
  keyboard_mouse: "Keyboard & Mouse",
  keystroke_life: "Keystroke Life",
  lamp_life: "Lamp Life",
  laptop_size: "Laptop Size",
  layout: "Layout",
  lighting: "Lighting",
  max_displays: "Max Displays",
  max_load: "Max Load",
  max_speed: "Max Speed",
  memory: "Memory",
  microphone: "Microphone",
  model_size: "AI Model Size",
  motor: "Motor",
  numeric_keypad: "Numeric Keypad",
  phone_fit: "Phone Fit",
  pillows: "Pillows",
  platform_compatibility: "Platform Compatibility",
  plug_type: "Plug Type",
  ports: "Ports",
  power: "Power",
  power_adapter: "Power Adapter",
  power_delivery: "Power Delivery",
  pressure_levels: "Pressure Levels",
  privacy_cover: "Privacy Cover",
  processor: "Processor",
  processor_brand: "Processor Brand",
  processor_cores: "Processor Cores",
  processor_model: "Processor Model",
  protection: "Protection",
  qos: "QoS",
  ram_max: "Max RAM",
  ram_type: "RAM Type",
  range: "Range",
  read_speed: "Read Speed",
  receiver: "Receiver",
  response_time: "Response Time",
  security: "Security",
  sensors: "Sensors",
  series: "Series",
  sim_support: "SIM Support",
  size: "Size",
  sound: "Sound",
  stabilization: "Stabilization",
  streaming: "Streaming",
  suspension: "Suspension",
  switch_type: "Switch Type",
  throw_ratio: "Throw Ratio",
  tilt_support: "Tilt Support",
  triggers: "Triggers",
  upscaling: "Upscaling",
  usb: "USB",
  usb_ports: "USB Ports",
  users: "Max Users",
  vibration: "Vibration",
  video_outputs: "Video Outputs",
  water_resistant: "Water Resistant",
  weather_resistant: "Weather Resistant",
  weight: "Weight",
  wireless_range: "Wireless Range",
  wireless_standard: "Wi-Fi Standard",
  write_speed: "Write Speed",
};

/**
 * Keys that should never appear in the spec table because they are either
 * already displayed elsewhere on the page or are pure noise.
 */
const SKIP_KEYS = new Set([
  "short_pitch",
  "color",
  "colour",
  "tag",
  "tags",
]);

/** Normalize a label for deduplication checks. */
export const normalizeLabel = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Convert snake_case key → Title Case as fallback label. */
const keyToLabel = (key: string): string =>
  METAFIELD_LABEL_OVERRIDES[key] ??
  key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

/**
 * Build the spec rows from product.extraAttributes.
 *
 * @param extraAttributes  Raw extraAttributes array from the Product
 * @param seenLabels       Set of normalized labels already shown (from the typed specRows above)
 * @returns Array of { label, value } rows ready for the spec table
 */
export const buildExtraSpecRows = (
  extraAttributes: Array<{ name: string; options: string[] }> | undefined | null,
  seenLabels: Set<string>,
): Array<{ label: string; value: string }> => {
  const rows: Array<{ label: string; value: string }> = [];

  for (const attribute of extraAttributes ?? []) {
    const rawKey = attribute.name.trim().toLowerCase().replace(/[\s-]+/g, "_");
    const rawName = attribute.name.trim();
    if (!rawName) continue;
    if (SKIP_KEYS.has(rawKey)) continue;

    const options = attribute.options.map((o) => o.trim()).filter(Boolean);
    if (options.length === 0) continue;

    const label = keyToLabel(rawKey);
    const normalized = normalizeLabel(label);
    if (seenLabels.has(normalized)) continue;

    rows.push({ label, value: options.join(", ") });
    seenLabels.add(normalized);
  }

  return rows;
};
