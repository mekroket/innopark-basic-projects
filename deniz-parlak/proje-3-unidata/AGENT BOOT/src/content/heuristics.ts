const TITLE_PATTERNS = [
  'Prof\\.?\\s*Dr\\.?',
  'Doç\\.?\\s*Dr\\.?',
  'Dr\\.?\\s*Öğr\\.?\\s*Üyesi',
  'Dr\\.?\\s*Öğretim\\s*Üyesi',
  'Yrd\\.?\\s*Doç\\.?\\s*Dr\\.?',
  'Arş\\.?\\s*Gör\\.?\\s*Dr\\.?',
  'Araş\\.?\\s*Gör\\.?\\s*Dr\\.?',
  'Arş\\.?\\s*Gör\\.?',
  'Araş\\.?\\s*Gör\\.?',
  'Öğr\\.?\\s*Gör\\.?\\s*Dr\\.?',
  'Öğretim\\s*Gör\\.?\\s*Dr\\.?',
  'Öğr\\.?\\s*Gör\\.?',
  'Öğretim\\s+Görevlisi',
  'Araştırma\\s+Görevlisi',
  'Prof\\.?\\s*Dr\\.?',
  'Doç\\.?\\s*Dr\\.?',
  'Dr\\.?\\s*Öğr\\.?\\s*Üyesi',
  'Yrd\\.?\\s*Doç\\.?\\s*Dr\\.?',
  'Arş\\.?\\s*Gör\\.?\\s*Dr\\.?',
  'Arş\\.?\\s*Gör\\.?',
  'Öğr\\.?\\s*Gör\\.?\\s*Dr\\.?',
  'Öğr\\.?\\s*Gör\\.?',
  'Araştırma\\s+Görevlisi',
  'Öğretim\\s+Görevlisi',
  'Professor',
  'Associate\\s+Professor',
  'Assistant\\s+Professor',
  'Lecturer\\s+Dr\\.?',
  'Lecturer',
  'Research\\s+Assistant',
  'Teaching\\s+Assistant',
  'Mühendis',
  'Müh\\.?',
  'Müdür\\s+Yardımcısı',
  'Müdür',
  'Uzman\\s+Yardımcısı',
  'Uzman',
  'Şef',
  'Koordinatör'
];

const TITLE_REGEX = new RegExp(`(^|[^\\p{L}\\p{N}])(${TITLE_PATTERNS.join('|')})(?![\\p{L}\\p{N}])`, 'iu');
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+(?:\s*\[at\]\s*|\s*\(at\)\s*|\s+at\s+|@)[a-zA-Z0-9.-]+(?:\s*\[dot\]\s*|\s*\(dot\)\s*|\s+dot\s+|\.)[a-zA-Z]{2,}/i;
const PHONE_REGEX = /(?:\+90|0)?\s*(?:\(?\d{3}\)?[\s.-]*)\d{1,4}[\s.-]*\d{1,4}(?:[\s.-]*\d{1,4})?(?:\s*(?:dahili|dhl|ext|\/)\s*\d{1,6})?/i;
const INTERNAL_PHONE_REGEX = /(?:dahili|dhl|telefon|tel|phone)\s*[:\-]?\s*(\d{3,6})/i;
const NAVIGATION_NOISE_REGEX = /anasayfa|home|men[üu]|navigation|breadcrumb|duyuru|haber|etkinlik|yay[ıi]n|publication|proje|cv|özgeçmiş|dersler|tezler|patent|arama|search|login|giriş|kalite|mezun|iletisim|iletişim/i;
const BLOCKED_CONTENT_REGEX = /breadcrumb|men[üu]|navigation|sidebar|duyurular|haberler|etkinlikler|yay[ıi]nlar|publications?|projeler|projects?|patentler|tezler|dersler|cv|özgeçmiş|curriculum vitae|books?|articles?|citations?/i;
const BLOCKED_CONTENT_MATCH_REGEX = /breadcrumb|men[üu]|navigation|sidebar|duyurular|haberler|etkinlikler|yay[ıi]nlar|publications?|projeler|projects?|patentler|tezler|dersler|cv|özgeçmiş|curriculum vitae|books?|articles?|citations?/gi;
const UNIT_NOISE_REGEX = /telefon|phone|e-?posta|email|mail|dahili|fax|web|http|www\.|@|prof\.|doç\.|dr\.|arş\.|öğr\./i;
const PERSON_NAME_REGEX = /^\p{L}[\p{L}.'-]*(?:\s+\p{L}[\p{L}.'-]*){1,4}$/u;

export function normalizeText(value?: string | null): string {
  return (value || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

export function getTextContentWithSpaces(element?: Element | null): string {
  if (!element) return '';
  let text = '';
  const walk = (node: Node) => {
    if (node.nodeType === 3) {
      text += node.nodeValue;
    } else if (node.nodeType === 1) {
      const tagName = (node as Element).tagName.toUpperCase();
      const isBlock = ['DIV', 'P', 'LI', 'TD', 'TR', 'TH', 'OPTION', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BR', 'A', 'SPAN'].includes(tagName);
      if (isBlock) text += ' ';
      node.childNodes.forEach(walk);
      if (isBlock) text += ' ';
    }
  };
  walk(element);
  return normalizeText(text);
}

export function normalizeEmail(value: string): string {
  return normalizeText(value)
    .replace(/\s*(\[at\]|\(at\)| at )\s*/i, '@')
    .replace(/\s*(\[dot\]|\(dot\)| dot )\s*/gi, '.')
    .replace(/\s+/g, '');
}

export function formatUnitName(value: string): string {
  const normalized = normalizeText(value)
    .replace(/^[\s:;,-]+|[\s:;,-]+$/g, '')
    .replace(/\s+(Bölüm Başkanı|Anabilim Dalı Başkanı|Ana Bilim Dalı Başkanı)$/i, '');

  if (!normalized) return '';

  return normalized
    .toLocaleLowerCase('tr-TR')
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      if (['ve', 'ile', 'de', 'da'].includes(word)) return word;
      return word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1);
    })
    .join(' ');
}

export function normalizePhone(value: string, sourceText = ''): string {
  const normalized = normalizeText(value).replace(/[().-]/g, ' ');
  const digits = normalized.replace(/\D/g, '');
  const hasPhoneLabel = /(telefon|tel|phone|dahili|dhl|iletişim|contact)/i.test(sourceText);
  const hasCountryOrLocalPrefix = /^\s*(\+90|0)/.test(normalized);

  if (!digits) return '';
  if (hasCountryOrLocalPrefix && digits.length >= 7) return normalizeText(normalized);
  if (hasPhoneLabel && digits.length >= 3) return normalizeText(normalized);
  if (digits.length >= 10) return normalizeText(normalized);
  return '';
}

export function extractTextClassification(text: string) {
  const normalized = normalizeText(text);
  const email = normalized.match(EMAIL_REGEX)?.[0] || '';
  const phone = normalized.match(PHONE_REGEX)?.[0] || normalized.match(INTERNAL_PHONE_REGEX)?.[1] || '';
  const titleMatch = normalized.match(TITLE_REGEX);
  const title = titleMatch?.[2] || titleMatch?.[0] || '';

  return {
    email: email ? normalizeEmail(email) : '',
    phone: phone ? normalizePhone(phone, normalized) : '',
    title: normalizeText(title)
  };
}

export function extractNameAndTitle(rawText: string): { fullName: string; academicTitle: string | null } {
  const normalized = normalizeText(rawText);
  if (!normalized || normalized.length > 160 || NAVIGATION_NOISE_REGEX.test(normalized)) {
    return { fullName: '', academicTitle: null };
  }

  const classification = extractTextClassification(normalized);
  const title = classification.title || null;

  let clean = normalized;
  if (title) {
    clean = clean.replace(new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '');
  }

  clean = clean.replace(/[(),:;]/g, ' ').replace(/\s+-\s+/g, ' ').replace(/\s+/g, ' ').trim();

  const words = clean.split(' ').filter(Boolean);
  const nameWords: string[] = [];

  for (const word of words) {
    if (word.length < 2) continue;
    if (!/^[A-ZÇĞİÖŞÜa-zçğıöşü]/.test(word)) continue; // Allow lower letters but check starts with letter

    const lower = word.toLocaleLowerCase('tr-TR');
    const noiseList = [
      'fakültesi', 'bölümü', 'anabilim', 'dalı', 'programı', 'yüksekokulu', 'enstitüsü',
      'üyeliği', 'üyesi', 'görevlisi', 'seminerleri', 'zoom', 'tarih', 'saat', 'kasım', 'ekim',
      'aralık', 'ocak', 'şubat', 'mart', 'nisan', 'mayıs', 'haziran', 'temmuz', 'ağustos',
      'eylül', 'pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi', 'pazar',
      'sinema', 'konferans', 'salonu', 'odası', 'ofisi', 'telefon', 'e-posta', 'eposta',
      'email', 'mail', 'cv', 'web', 'kişisel', 'sayfası', 'özgeçmiş', 'rehber', 'akademik',
      'personel', 'idari', 'teknik', 'öğretim', 'üye', 'yönetim', 'kalite', 'sistemi',
      'mühendisliği', 'mühendislik', 'bilimleri', 'bilgisi', 'teknolojisi', 'teknolojileri',
      'temel', 'uygulamalı', 'doğa', 'iktisadi', 'idari', 'sosyal', 'insani', 'edebiyat',
      'fen', 'tıp', 'hukuk', 'iletişim', 'mimarlık', 'tasarım', 'güzel', 'sanatlar',
      'sağlık', 'spor', 'ilahiyat', 'eğitim', 'bilgisayar', 'yazılım', 'elektronik',
      'haberleşme', 'elektrik', 'makine', 'inşaat', 'endüstri', 'kimya', 'biyoloji',
      'fizik', 'matematik', 'istatistik', 'mimari', 'şehir', 'bölge', 'planlama',
      'yapay', 'zeka', 'veri', 'analitiği', 'siber', 'güvenlik', 'ağları', 'kontrol',
      'otomasyon', 'mekatronik', 'biyomedikal', 'malzeme', 'metalurji', 'maden',
      'jeoloji', 'jeofizik', 'çevre', 'gıda', 'tarım', 'orman', 'tekstil', 'havacılık',
      'uzay', 'semineri', 'paneli', 'toplantısı', 'dersi', 'labı', 'laboratuvarı',
      'saati', 'tarihli', 'yılı', 'yıllık', 'dönemi', 'dönemlik', 'günü', 'başkanı',
      'yardımcısı', 'dekanı', 'vekil', 'dekan', 'müdür', 'müdürü', 'koordinatörü',
      'danışmanı', 'temsilcisi', 'sekreteri', 'şefi', 'uzmanı', 'başkanlığı', 'rektör',
      'rektörü', 'senato', 'kurul', 'kurulu', 'anasayfa', 'profil', 'profili',
      'detay', 'detayı', 'yayınlar', 'makaleler', 'projeler', 'patentler', 'kitaplar',
      'tezler', 'ödüller', 'burslar', 'dersler', 'homepage', 'giriş', 'kayıt', 'arama',
      'ara', 'mdbf', 'seminerler', 'akademik-kadro', 'faculty', 'members', 'people',
      'staff', 'academic', 'tarihçe', 'yazarlar', 'yazarı', 'yazar', 'konu', 'konular'
    ];
    if (noiseList.includes(lower)) continue;
    nameWords.push(word);
  }

  // Ensure name contains only alphabetic-like characters
  const cleanName = nameWords.filter(w => /^[\p{L}\s.'-]+$/u.test(w)).slice(0, 5).join(' ');
  return {
    fullName: isValidPersonName(cleanName) ? cleanName : '',
    academicTitle: title
  };
}

export function normalizeFullName(rawText: string): string {
  const { fullName } = extractNameAndTitle(rawText);
  return fullName;
}

export function isValidPersonName(value?: string | null): boolean {
  const normalized = normalizeText(value);
  if (!normalized || normalized.length < 5 || normalized.length > 90) return false;
  if (NAVIGATION_NOISE_REGEX.test(normalized)) return false;
  if (/[0-9@:/\\|<>()[\]{}]/.test(normalized)) return false;
  return PERSON_NAME_REGEX.test(normalized);
}

export function extractUniversityName(documentRef: Document = document): string | null {
  const candidates = [
    documentRef.querySelector('meta[property="og:site_name"]')?.getAttribute('content'),
    documentRef.querySelector('meta[name="application-name"]')?.getAttribute('content'),
    documentRef.querySelector('meta[name="author"]')?.getAttribute('content'),
    documentRef.title,
    ...Array.from(documentRef.querySelectorAll('script[type="application/ld+json"]'))
      .map((element) => element.textContent),
    ...Array.from(documentRef.querySelectorAll('header, .navbar, .topbar, .logo, h1, h2'))
      .slice(0, 20)
      .map((element) => element.textContent)
  ];

  for (const candidate of candidates) {
    const match = normalizeText(candidate).match(/([A-ZÇĞİÖŞÜ][A-Za-zÇĞİÖŞÜçğıöşü0-9\s.'-]{2,}Üniversitesi)/);
    if (match?.[1]) {
      return normalizeText(match[1]);
    }
  }

  return null;
}

export function cleanUnitName(name?: string | null): string | null {
  if (!name) return null;
  const clean = formatUnitName(name)
    .replace(/^(Fakülte|Faculty|Bölüm|Department|Program|Birim)\s*[:\-]\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean || clean === 'Belirtilmemiş') return null;
  if (clean.length > 80) return null;
  if (NAVIGATION_NOISE_REGEX.test(clean) || UNIT_NOISE_REGEX.test(clean)) return null;
  if ((clean.match(/Fakültesi|Bölümü?|Anabilim Dalı|Ana Bilim Dalı|Programı/gi) || []).length > 2) return null;
  return clean;
}

export function extractFaculty(text: string): string {
  return extractUnitBySuffix(text, ['Fakültesi', 'Yüksekokulu', 'Enstitüsü']);
}

export function extractDepartment(text: string): string {
  return extractUnitBySuffix(text, ['Bölümü', 'Anabilim Dalı', 'Ana Bilim Dalı', 'Programı', 'Birimi']);
}

export function extractUnitsFromCommaText(text: string): { faculty: string; department: string } {
  const parts = normalizeText(text).split(',').map((part) => normalizeText(part)).filter(Boolean);
  const facultyIndex = parts.findIndex((part) => includesAny(part, ['fakültesi', 'yüksekokulu', 'enstitüsü']));
  const faculty = facultyIndex >= 0 ? formatUnitName(parts[facultyIndex]) : extractFaculty(text);
  const department = extractDepartment(text)
    || (facultyIndex >= 0 ? formatUnitName(parts.slice(facultyIndex + 1).find(isLikelyUnitName) || '') : '');

  return { faculty, department };
}

export function scorePersonnelText(text: string): number {
  const normalized = normalizeText(text);
  const classification = extractTextClassification(normalized);
  let score = 0;
  if (classification.title) score += 4;
  if (classification.email) score += 3;
  if (classification.phone) score += 2;
  if (/\b(Fakültesi|Bölümü|Anabilim Dalı|Programı|Yüksekokulu|Enstitüsü)\b/i.test(normalized)) score += 2;
  if (/[A-ZÇĞİÖŞÜ][a-zçğıöşü]+ [A-ZÇĞİÖŞÜ][a-zçğıöşü]+/.test(normalized)) score += 2;
  return score;
}

export function isBlockedContentText(text: string): boolean {
  const normalized = normalizeText(text);
  if (!normalized || normalized.length > 1800) return true;

  const blockedMatches = normalized.match(BLOCKED_CONTENT_MATCH_REGEX) || [];
  if (blockedMatches.length >= 2) return true;
  return BLOCKED_CONTENT_REGEX.test(normalized) && !extractTextClassification(normalized).email;
}

function extractCommaSegment(text: string, keywords: string[]): string {
  const segment = normalizeText(text)
    .split(',')
    .map((part) => normalizeText(part))
    .find((part) => includesAny(part, keywords)) || '';
  return formatUnitName(segment);
}

function extractUnitBySuffix(text: string, suffixes: string[]): string {
  const rawSegments = (text || '')
    .split(/[\n\r|>›»•/\\*:#]+|\s+-\s+/)
    .map((segment) => normalizeText(segment))
    .filter(Boolean);

  for (const suffix of suffixes) {
    const keyword = suffix.toLocaleLowerCase('tr-TR');
    const commaMatch = extractCommaSegment(text, [keyword]);
    if (commaMatch) return commaMatch;

    const suffixPattern = suffix.replace(/\s+/g, '\\s+');
    const regex = new RegExp(`((?:[A-Za-zÇĞİÖŞÜçğıöşü0-9.'/-]+\\s+){0,7}${suffixPattern})`, 'gi');
    const matches = rawSegments
      .flatMap((segment) => Array.from(segment.matchAll(regex)).map((match) => formatUnitName(match[1])))
      .filter(Boolean)
      .map((match) => cleanUnitName(match) || '')
      .filter(Boolean)
      .filter((match) => !/^(Akademik|Personel|Personeller|Anasayfa|Üniversite)\b/i.test(match));

    if (matches.length > 0) {
      return matches.sort((a, b) => a.length - b.length)[0];
    }
  }

  return '';
}

function includesAny(text: string, keywords: string[]): boolean {
  const lowerText = normalizeText(text).toLocaleLowerCase('tr-TR');
  return keywords.some((keyword) => lowerText.includes(keyword));
}

function isLikelyUnitName(text: string): boolean {
  const normalized = normalizeText(text);
  if (!normalized || /\(\d+\)$/.test(normalized)) return false;
  if (extractTextClassification(normalized).title) return false;
  return /^[A-ZÇĞİÖŞÜ0-9\s.'/-]{4,}$/u.test(normalized);
}
