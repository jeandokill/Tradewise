import sedan from "@/assets/car-sedan.jpg";
import suv from "@/assets/car-suv.jpg";
import hatch from "@/assets/car-hatch.jpg";
import truck from "@/assets/car-truck.jpg";
import battery from "@/assets/part-battery.jpg";
import brake from "@/assets/part-brake.jpg";
import headlight from "@/assets/part-headlight.jpg";
import wheel from "@/assets/part-wheel.jpg";
import motor from "@/assets/part-motor.jpg";
import charger from "@/assets/part-charger.jpg";
import suspension from "@/assets/part-suspension.jpg";

export type Car = {
  id: string;
  name: string;
  type: string;
  price: number;
  range: string;
  image: string;
  description: string;
  isNew?: boolean;
  partIds: string[];
};

export type Part = {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  inStock?: number;
};

export const parts: Part[] = [
  { id: "battery-72", name: "72kWh Lithium Battery Pack", category: "EV", price: 4800, image: battery, inStock: 12,
    description: "High-density 72kWh lithium-ion battery pack engineered for long-range electric sedans and SUVs. Liquid-cooled, with built-in BMS, fast-charge support up to 150 kW, and an 8-year/160,000 km warranty." },
  { id: "motor-pmsm", name: "PMSM Electric Drive Motor", category: "EV", price: 2150, image: motor, inStock: 9,
    description: "Permanent-magnet synchronous motor delivering smooth torque from 0 RPM. 96% peak efficiency, sealed against dust and water (IP67), and compatible with most modern EV drivetrains." },
  { id: "charger-t2", name: "Type-2 Charging Connector", category: "EV", price: 320, image: charger, inStock: 40,
    description: "Industry-standard Type-2 (Mennekes) AC charging connector. Supports up to 22 kW three-phase charging, weather-sealed housing, and a 5 m durable cable." },
  { id: "brake-perf", name: "Performance Brake Disc + Caliper", category: "Brakes", price: 460, image: brake, inStock: 22,
    description: "Cross-drilled, vented brake disc paired with a 4-piston caliper for confident, fade-resistant stopping power. Includes ceramic pads and stainless braided lines." },
  { id: "headlight-led", name: "Matrix LED Headlight Assembly", category: "Lighting", price: 540, image: headlight, inStock: 18,
    description: "Adaptive Matrix LED headlight assembly with auto high-beam, cornering light and DRL signature. Plug-and-play harness for most modern EV platforms." },
  { id: "wheel-19", name: '19" Alloy Wheel & Tire', category: "Wheels", price: 380, image: wheel, inStock: 30,
    description: "Lightweight forged-aluminum 19\" alloy wheel pre-fitted with a low-rolling-resistance EV tire. Reduces unsprung mass and improves range." },
  { id: "suspension-coil", name: "Coil-over Suspension Strut", category: "Suspension", price: 290, image: suspension, inStock: 16,
    description: "Adjustable coil-over strut with 30 levels of damping. Designed for daily comfort with sporty handling, includes anti-corrosion coating." },
];

export const cars: Car[] = [
  { id: "ev-sedan", name: "Voltaire S1 Sedan", type: "Electric Sedan", price: 38900, range: "520 km", image: sedan, isNew: true,
    description: "The Voltaire S1 is a midsize electric sedan with a 72 kWh battery, AWD dual-motor option, and a luxurious minimalist cabin. 0–100 km/h in 5.6s with up to 520 km of WLTP range.",
    partIds: ["battery-72", "motor-pmsm", "charger-t2", "brake-perf", "wheel-19"] },
  { id: "ev-suv", name: "Aurora X7 SUV", type: "Electric SUV", price: 52400, range: "610 km", image: suv, isNew: true,
    description: "Aurora X7 is a 7-seat electric SUV built for families and long trips. Adaptive air suspension, panoramic glass roof, and 610 km of real-world range on a single charge.",
    partIds: ["battery-72", "motor-pmsm", "headlight-led", "suspension-coil", "wheel-19"] },
  { id: "ev-hatch", name: "Mini Spark EV", type: "Compact Hatchback", price: 21500, range: "320 km", image: hatch,
    description: "Compact, agile and affordable, the Mini Spark EV is the perfect city commuter. 320 km range, fast 50 kW DC charging, and a smart 10.25\" touchscreen.",
    partIds: ["charger-t2", "brake-perf", "headlight-led", "wheel-19"] },
  { id: "ev-truck", name: "Titan Volt Pickup", type: "Electric Pickup", price: 64900, range: "480 km", image: truck, isNew: true,
    description: "The Titan Volt is a rugged electric pickup with 1,200 kg payload, 4,500 kg towing, and a frunk that doubles your storage. Built for work, weekends and the road ahead.",
    partIds: ["battery-72", "motor-pmsm", "suspension-coil", "brake-perf", "wheel-19"] },
];

export const getCar = (id: string) => cars.find((c) => c.id === id);
export const getPart = (id: string) => parts.find((p) => p.id === id);
export const getPartsForCar = (id: string) => {
  const car = getCar(id);
  if (!car) return [];
  return car.partIds.map(getPart).filter(Boolean) as Part[];
};
export const getCarsForPart = (partId: string) =>
  cars.filter((c) => c.partIds.includes(partId));
