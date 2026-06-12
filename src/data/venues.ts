import type { Venue } from "@/lib/types";

/** The 16 official venues of the FIFA World Cup 2026. */
export const VENUES: Venue[] = [
  // Mexico
  { id: "azteca", nameEn: "Estadio Azteca", nameAr: "ملعب أزتيكا", cityEn: "Mexico City", cityAr: "مكسيكو سيتي", country: "Mexico", lat: 19.3029, lng: -99.1505, tz: "America/Mexico_City", capacity: 87523 },
  { id: "akron", nameEn: "Estadio Akron", nameAr: "ملعب أكرون", cityEn: "Guadalajara", cityAr: "غوادالاخارا", country: "Mexico", lat: 20.6817, lng: -103.4628, tz: "America/Mexico_City", capacity: 49813 },
  { id: "bbva", nameEn: "Estadio BBVA", nameAr: "ملعب بي بي في إيه", cityEn: "Monterrey", cityAr: "مونتيري", country: "Mexico", lat: 25.6691, lng: -100.2447, tz: "America/Monterrey", capacity: 53500 },
  // Canada
  { id: "bmo", nameEn: "BMO Field", nameAr: "ملعب بي إم أو", cityEn: "Toronto", cityAr: "تورونتو", country: "Canada", lat: 43.6332, lng: -79.4186, tz: "America/Toronto", capacity: 45736 },
  { id: "bcplace", nameEn: "BC Place", nameAr: "بي سي بليس", cityEn: "Vancouver", cityAr: "فانكوفر", country: "Canada", lat: 49.2768, lng: -123.1119, tz: "America/Vancouver", capacity: 54500 },
  // USA — East
  { id: "metlife", nameEn: "MetLife Stadium", nameAr: "ملعب ميتلايف", cityEn: "New York / New Jersey", cityAr: "نيويورك / نيوجيرسي", country: "USA", lat: 40.8135, lng: -74.0745, tz: "America/New_York", capacity: 82500 },
  { id: "gillette", nameEn: "Gillette Stadium", nameAr: "ملعب جيليت", cityEn: "Boston", cityAr: "بوسطن", country: "USA", lat: 42.0909, lng: -71.2643, tz: "America/New_York", capacity: 64628 },
  { id: "lincoln", nameEn: "Lincoln Financial Field", nameAr: "ملعب لينكولن فاينانشال", cityEn: "Philadelphia", cityAr: "فيلادلفيا", country: "USA", lat: 39.9008, lng: -75.1675, tz: "America/New_York", capacity: 69796 },
  { id: "hardrock", nameEn: "Hard Rock Stadium", nameAr: "ملعب هارد روك", cityEn: "Miami", cityAr: "ميامي", country: "USA", lat: 25.958, lng: -80.2389, tz: "America/New_York", capacity: 64767 },
  { id: "mercedes", nameEn: "Mercedes-Benz Stadium", nameAr: "ملعب مرسيدس بنز", cityEn: "Atlanta", cityAr: "أتلانتا", country: "USA", lat: 33.7553, lng: -84.4006, tz: "America/New_York", capacity: 71000 },
  // USA — Central
  { id: "nrg", nameEn: "NRG Stadium", nameAr: "ملعب إن آر جي", cityEn: "Houston", cityAr: "هيوستن", country: "USA", lat: 29.6847, lng: -95.4107, tz: "America/Chicago", capacity: 72220 },
  { id: "att", nameEn: "AT&T Stadium", nameAr: "ملعب إيه تي آند تي", cityEn: "Dallas", cityAr: "دالاس", country: "USA", lat: 32.7473, lng: -97.0945, tz: "America/Chicago", capacity: 80000 },
  { id: "arrowhead", nameEn: "Arrowhead Stadium", nameAr: "ملعب أروهيد", cityEn: "Kansas City", cityAr: "كانساس سيتي", country: "USA", lat: 39.0489, lng: -94.4839, tz: "America/Chicago", capacity: 76416 },
  // USA — West
  { id: "sofi", nameEn: "SoFi Stadium", nameAr: "ملعب سوفاي", cityEn: "Los Angeles", cityAr: "لوس أنجلوس", country: "USA", lat: 33.9535, lng: -118.3392, tz: "America/Los_Angeles", capacity: 70240 },
  { id: "levis", nameEn: "Levi's Stadium", nameAr: "ملعب ليفايز", cityEn: "San Francisco Bay Area", cityAr: "منطقة خليج سان فرانسيسكو", country: "USA", lat: 37.4032, lng: -121.9698, tz: "America/Los_Angeles", capacity: 68500 },
  { id: "lumen", nameEn: "Lumen Field", nameAr: "ملعب لومن", cityEn: "Seattle", cityAr: "سياتل", country: "USA", lat: 47.5952, lng: -122.3316, tz: "America/Los_Angeles", capacity: 69000 },
];

export const VENUE_MAP: Record<string, Venue> = Object.fromEntries(
  VENUES.map((v) => [v.id, v])
);
