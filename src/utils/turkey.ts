// All 81 Turkish provinces
export const TURKEY_CITIES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin",
  "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur",
  "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan",
  "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul",
  "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kırıkkale", "Kırklareli", "Kırşehir",
  "Kilis", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş",
  "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Şanlıurfa", "Siirt", "Sinop",
  "Sivas", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"
];

// Format phone input as +90 (5XX) XXX XX XX
export function formatTurkishPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  let clean = digits;
  if (clean.startsWith("90")) clean = clean.slice(2);
  else if (clean.startsWith("0")) clean = clean.slice(1);
  clean = clean.slice(0, 10);
  
  if (clean.length === 0) return "";
  if (clean.length <= 3) return `+90 (${clean}`;
  if (clean.length <= 6) return `+90 (${clean.slice(0, 3)}) ${clean.slice(3)}`;
  if (clean.length <= 8) return `+90 (${clean.slice(0, 3)}) ${clean.slice(3, 6)} ${clean.slice(6)}`;
  return `+90 (${clean.slice(0, 3)}) ${clean.slice(3, 6)} ${clean.slice(6, 8)} ${clean.slice(8)}`;
}

// Extract clean +905XXXXXXXXX from formatted display value
export function extractPhoneDigits(formatted: string): string {
  const digits = formatted.replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length >= 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length >= 11) return `+90${digits.slice(1)}`;
  if (digits.length === 10) return `+90${digits}`;
  return `+90${digits}`;
}

// Convert stored +905XXXXXXXXX to display format
export function phoneToDisplay(stored: string | null | undefined): string {
  if (!stored) return "";
  return formatTurkishPhone(stored);
}
