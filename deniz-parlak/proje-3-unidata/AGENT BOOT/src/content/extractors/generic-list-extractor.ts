import { AcademicRecord } from '../../shared/types';
import { ExtractorRuntime, ExtractorStrategy } from './extractor-types';
import {
  cleanUnitName,
  extractDepartment,
  extractFaculty,
  extractNameAndTitle,
  extractTextClassification,
  extractUniversityName,
  formatUnitName,
  getTextContentWithSpaces,
  isBlockedContentText,
  isValidPersonName,
  normalizeText,
  scorePersonnelText
} from '../heuristics';

export interface ListExtractResult {
  record: AcademicRecord;
  element: Element;
}

const STRATEGIES: ExtractorStrategy[] = [
  {
    name: 'Kart Yerleşimi',
    selectors: [
      '.card',
      '[class*="card"]',
      '[class*="profile-card"]',
      '[class*="person-card"]',
      '[class*="academic-card"]',
      '[class*="staff-card"]'
    ]
  },
  {
    name: 'Tablo Yerleşimi',
    selectors: [
      'table tbody tr',
      '.table tbody tr',
      '[role="table"] [role="row"]'
    ]
  },
  {
    name: 'Medya Yerleşimi',
    selectors: [
      '.media',
      '.media-body',
      '[class*="media"]',
      '[class*="personnel-item"]',
      '[class*="staff-item"]',
      '[class*="academic-item"]'
    ]
  },
  {
    name: 'Bootstrap Grid',
    selectors: [
      '.row > [class*="col-"]',
      '[class*="row"] > [class*="col"]',
      '.container [class*="col-md"]',
      '.container-fluid [class*="col-md"]'
    ]
  },
  {
    name: 'Accordion',
    selectors: [
      '.accordion-item',
      '.accordion-body',
      '.panel',
      '.panel-body',
      '[class*="accordion"] [class*="item"]'
    ]
  },
  {
    name: 'Liste',
    selectors: [
      'main li',
      '.content li',
      '[class*="content"] li',
      '[class*="personel"] li',
      '[class*="akademik"] li',
      '[class*="academic"] li',
      '[class*="staff"] li'
    ]
  },
  {
    name: 'Semantic HTML',
    selectors: [
      'article',
      'main section',
      '[itemtype*="Person"]',
      '[typeof*="Person"]',
      '[class*="person"]',
      '[class*="staff"]',
      '[class*="akademik"]',
      '[class*="academic"]',
      '[class*="ogretim"]',
      '[class*="öğretim"]',
      '.views-row',
      '[class*="views-row"]',
      '[class*="view-row"]'
    ]
  }
];

export class GenericListExtractor {
  constructor(
    private readonly documentRef: Document,
    private readonly runtime: ExtractorRuntime,
    private readonly findProfileUrls: (element: Element) => string[],
    private readonly collectBySelectors: (selectors: string[], minScore?: number) => Element[],
    private readonly isRejectedCandidate: (element: Element) => boolean
  ) {}

  async extract(sourceUrl: string): Promise<ListExtractResult[]> {
    const structuredLineRecords = await this.extractFromStructuredPersonLines(sourceUrl);
    if (structuredLineRecords.length > 0) {
      return structuredLineRecords;
    }

    const linkRecords = await this.extractFromPersonLinks(sourceUrl);

    const university = extractUniversityName(this.documentRef);
    const contextText = this.collectContextText();
    const defaultFaculty = cleanUnitName(extractFaculty(contextText));
    const defaultDepartment = cleanUnitName(extractDepartment(contextText));
    const candidates = this.collectCandidateElements();

    const strategyResults: ListExtractResult[] = [];
    const seen = new Set<string>();

    for (const element of candidates) {
      const record = this.buildRecordFromElement(element, {
        university,
        faculty: defaultFaculty,
        department: defaultDepartment,
        sourceUrl
      });

      if (!record) continue;

      const key = [record.email, record.profileUrl, record.fullName, record.department].filter(Boolean).join('|');
      if (!seen.has(key)) {
        seen.add(key);
        strategyResults.push({ record, element });
      }
    }

    if (strategyResults.length >= linkRecords.length) {
      if (strategyResults.length > 0) {
        this.runtime.sendStatus('EXTRACTING', `Strateji yerleşimi ile ${strategyResults.length} kayıt seçildi`);
      }
      return strategyResults;
    }

    if (linkRecords.length > 0) {
      this.runtime.sendStatus('EXTRACTING', `Bağlantı yerleşimi ile ${linkRecords.length} kayıt seçildi`);
    }
    return linkRecords;
  }

  private collectCandidateElements(): Element[] {
    for (const strategy of STRATEGIES) {
      const candidates = this.collectBySelectors(strategy.selectors, 2)
        .filter((element) => this.hasPersonSignal(element));

      if (candidates.length > 0) {
        this.runtime.sendStatus('EXTRACTING', `${strategy.name} stratejisi ile kayıt aranıyor`);
        return this.dedupeNestedCandidates(candidates.flatMap((candidate) => this.splitCompositeCandidate(candidate)));
      }
    }

    return [];
  }

  private async extractFromPersonLinks(sourceUrl: string): Promise<ListExtractResult[]> {
    const root = this.findContentRoot();
    const university = extractUniversityName(this.documentRef);
    const faculty = this.findPageFaculty(root);
    const results: ListExtractResult[] = [];
    const seen = new Set<string>();
    let currentDepartment = '';
    let currentSubDepartment = '';

    const orderedElements = Array.from(root.querySelectorAll<HTMLElement>([
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      '.dept-header .fw-semibold',
      '.abd-header strong',
      '[class*="department"]',
      '[class*="bolum"]',
      '[class*="bölüm"]',
      '[class*="abd-header"] strong',
      'a[href]',
      'article',
      '.card',
      '[class*="person"]',
      '[class*="staff"]',
      '[class*="academic"]',
      '[class*="akademik"]'
    ].join(',')));

    for (const element of orderedElements) {
      if (!this.runtime.canContinue()) break;
      if (this.isRejectedCandidate(element)) continue;

      const text = normalizeText(element.textContent);
      const departmentHeading = this.extractDepartmentHeading(text);
      if (departmentHeading) {
        currentDepartment = departmentHeading;
        currentSubDepartment = '';
        continue;
      }

      const subDepartmentHeading = this.extractSubDepartmentHeading(text);
      if (subDepartmentHeading) {
        currentSubDepartment = subDepartmentHeading;
        continue;
      }

      if (element.tagName !== 'A' || !this.isPersonLink(element as HTMLAnchorElement)) {
        continue;
      }

      const recordElement = this.findSmallRecordElement(element as HTMLAnchorElement);
      const recordText = normalizeText(recordElement.textContent);
      const classification = extractTextClassification(`${recordText} ${element.textContent || ''}`);
      const { fullName, academicTitle } = extractNameAndTitle(element.textContent || recordText);
      const profileUrls = this.findProfileUrls(recordElement);
      const department = cleanUnitName(currentDepartment || extractDepartment(recordText));

      const record: AcademicRecord = {
        fullName,
        academicTitle: academicTitle || classification.title || null,
        university,
        faculty: cleanUnitName(faculty || extractFaculty(recordText)),
        department,
        subDepartment: cleanUnitName(currentSubDepartment),
        email: classification.email || null,
        phone: classification.phone || null,
        photoUrl: null,
        profileUrl: profileUrls[0] || sourceUrl,
        profileUrls,
        sourceUrl
      };

      if (!isValidPersonName(record.fullName)) continue;

      const key = [record.email, record.profileUrl, record.fullName, record.department].filter(Boolean).join('|');
      if (!seen.has(key)) {
        seen.add(key);
        results.push({ record, element: recordElement });
      }
    }

    return results;
  }

  private async extractFromStructuredPersonLines(sourceUrl: string): Promise<ListExtractResult[]> {
    const personLines = Array.from(this.documentRef.querySelectorAll<HTMLElement>('.person-line'));
    if (personLines.length === 0) return [];

    const university = extractUniversityName(this.documentRef);
    const faculty = cleanUnitName(this.findPageFaculty(this.findContentRoot()));
    const results: ListExtractResult[] = [];
    const seen = new Set<string>();

    for (const line of personLines) {
      if (!this.runtime.canContinue()) break;
      if (this.isRejectedCandidate(line)) continue;

      const anchor = line.querySelector('a[href]') as HTMLAnchorElement | null;
      if (!anchor || !this.isStructuredPersonLineLink(anchor)) continue;

      const recordText = normalizeText(line.textContent);
      const classification = extractTextClassification(recordText);
      const { fullName, academicTitle } = extractNameAndTitle(anchor.textContent || recordText);
      const profileUrls = this.findProfileUrls(line);
      const department = cleanUnitName(this.findStructuredDepartment(line) || extractDepartment(recordText));
      const subDepartment = cleanUnitName(this.findStructuredSubDepartment(line));

      const record: AcademicRecord = {
        fullName,
        academicTitle: academicTitle || classification.title || null,
        university,
        faculty: cleanUnitName(extractFaculty(recordText) || faculty),
        department,
        subDepartment,
        email: classification.email || null,
        phone: classification.phone || null,
        photoUrl: null,
        profileUrl: profileUrls[0] || sourceUrl,
        profileUrls,
        sourceUrl
      };

      if (!isValidPersonName(record.fullName)) continue;

      const key = [record.email, record.profileUrl, record.fullName, record.department, record.subDepartment].filter(Boolean).join('|');
      if (!seen.has(key)) {
        seen.add(key);
        results.push({ record, element: line });
      }
    }

    if (results.length > 0) {
      this.runtime.sendStatus('EXTRACTING', `Personel satırı yapısı ile ${results.length} kayıt bulundu`);
    }

    return results;
  }

  private buildRecordFromElement(
    element: Element,
    defaults: Pick<AcademicRecord, 'university' | 'faculty' | 'department' | 'sourceUrl'>
  ): AcademicRecord | null {
    const text = getTextContentWithSpaces(element);
    if (isBlockedContentText(text)) return null;

    const classification = extractTextClassification(text);
    const profileUrls = this.findProfileUrls(element);
    const profileUrl = profileUrls[0] || '';
    const explicitName = this.findExplicitNameText(element);
    const nameText = explicitName || this.findNameText(element, text);
    const parsedName = extractNameAndTitle(nameText);
    const fullName = explicitName || parsedName.fullName;
    const academicTitle = parsedName.academicTitle || extractTextClassification(text).title || null;
    const units = this.extractUnitsFromCommaText(text);

    if (!profileUrl && this.isLikelyFilterText(fullName, text)) {
      return null;
    }

    if (!isValidPersonName(fullName) || (!academicTitle && !classification.email && !profileUrl)) {
      return null;
    }

    return {
      fullName,
      academicTitle,
      university: defaults.university,
      faculty: cleanUnitName(units.faculty || extractFaculty(text) || defaults.faculty),
      department: cleanUnitName(units.department || extractDepartment(text) || defaults.department),
      email: classification.email || null,
      phone: classification.phone || null,
      photoUrl: null,
      profileUrl: profileUrl || defaults.sourceUrl,
      profileUrls,
      sourceUrl: defaults.sourceUrl
    };
  }

  private findNameText(element: Element, fallbackText: string): string {
    const preferredSelectors = [
      '.researcher-title a',
      'h1',
      'h2',
      'h3',
      'h4',
      '.name',
      '[class*="name"]',
      '[class*="isim"]',
      '[class*="person-title"]',
      '[class*="title"]',
      'a[href*="profil"]',
      'a[href*="profile"]',
      'a[href*="personel"]',
      'a[href*="staff"]',
      'a[href*="akademik"]',
      'a[href*="academic"]'
    ];

    for (const selector of preferredSelectors) {
      const match = element.matches(selector) ? element : element.querySelector(selector);
      if (!match || (match === element && element.children.length > 0)) continue;

      const text = getTextContentWithSpaces(match);
      if (this.isUsableNameText(text) && !this.isNoisyNameText(text)) {
        return text;
      }
    }

    const fallbackName = fallbackText
      .split(/\s{2,}|\||\n/)
      .map((segment) => normalizeText(segment))
      .find((segment) => this.isUsableNameText(segment) && !this.isNoisyNameText(segment));

    return fallbackName || fallbackText;
  }

  private findExplicitNameText(element: Element): string {
    const selectors = ['.name', '[class*="name"]', '[class*="isim"]'];

    for (const selector of selectors) {
      const match = element.matches(selector) ? element : element.querySelector(selector);
      if (!match || (match === element && element.children.length > 0)) continue;

      const candidates = this.collectSpecificNameTexts(match);
      const explicitName = this.findParsedPersonName(candidates);
      if (explicitName) {
        return explicitName;
      }
    }

    return '';
  }

  private collectSpecificNameTexts(element: Element): string[] {
    const candidates: string[] = [];
    const directText = Array.from(element.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent)
      .join(' ');

    candidates.push(directText, element.textContent || '');

    for (const child of Array.from(element.children)) {
      const text = normalizeText(child.textContent);
      if (text) candidates.push(text);
    }

    return Array.from(new Set(candidates.map((text) => normalizeText(text)).filter(Boolean)))
      .sort((left, right) => left.length - right.length);
  }

  private findParsedPersonName(candidates: string[]): string {
    for (const text of candidates) {
      if (this.isNoisyNameText(text)) continue;

      const parsed = extractNameAndTitle(text);
      if (parsed.fullName && isValidPersonName(parsed.fullName)) {
        return parsed.fullName;
      }
    }

    return '';
  }

  private isUsableNameText(text: string): boolean {
    const parsed = extractNameAndTitle(text);
    return Boolean(parsed.fullName && isValidPersonName(parsed.fullName));
  }

  private isNoisyNameText(text: string): boolean {
    const normalized = normalizeText(text);
    const lowerText = normalized.toLocaleLowerCase('tr-TR');
    const classification = extractTextClassification(normalized);

    return Boolean(classification.email || classification.phone)
      || /mailto:|@|https?:\/\/|www\./i.test(normalized)
      || /\b(profili\s+g(?:o|\u00f6)r|view\s+profile|profile\s+view|detay(?:i|\u0131)?\s+g(?:o|\u00f6)r|more|read\s+more)\b/i.test(lowerText);
  }

  private isLikelyFilterText(fullName: string, sourceText: string): boolean {
    const normalizedName = normalizeText(fullName);
    const normalizedSource = normalizeText(sourceText);
    return /\(\d+\)$/.test(normalizedName)
      || (!extractTextClassification(normalizedSource).email && !/[A-ZÇĞİÖŞÜ][a-zçğıöşü]+ [A-ZÇĞİÖŞÜ][a-zçğıöşü]+/.test(normalizedName));
  }

  private extractUnitsFromCommaText(text: string): { faculty: string; department: string } {
    const parts = normalizeText(text).split(',').map((part) => normalizeText(part)).filter(Boolean);
    const facultyIndex = parts.findIndex((part) => this.includesAny(part, ['fakültesi', 'yüksekokulu', 'enstitüsü']));
    const faculty = facultyIndex >= 0 ? formatUnitName(parts[facultyIndex]) : extractFaculty(text);
    const department = extractDepartment(text)
      || (facultyIndex >= 0 ? formatUnitName(parts.slice(facultyIndex + 1).find((pt) => this.isLikelyUnitName(pt)) || '') : '');

    return { faculty, department };
  }

  private includesAny(text: string, keywords: string[]): boolean {
    const lowerText = normalizeText(text).toLocaleLowerCase('tr-TR');
    return keywords.some((keyword) => lowerText.includes(keyword));
  }

  private isLikelyUnitName(text: string): boolean {
    const normalized = normalizeText(text);
    if (!normalized || /\(\d+\)$/.test(normalized)) return false;
    if (extractTextClassification(normalized).title) return false;
    return /^[A-ZÇĞİÖŞÜ0-9\s.'/-]{4,}$/u.test(normalized);
  }

  private isStructuredPersonLineLink(anchor: HTMLAnchorElement): boolean {
    const href = anchor.getAttribute('href') || '';
    if (!/akademik-personel|akademik|academic|personel|staff|profile|profil|cv|ozgecmis|özgeçmiş/i.test(href)) {
      return false;
    }

    const text = normalizeText(anchor.textContent);
    if (!text || text.length > 140) return false;
    if (this.isPersonLink(anchor)) return true;

    const withoutTitle = normalizeText(text
      .replace(/^(Prof\.?\s*Dr\.?|Doç\.?\s*Dr\.?|Dr\.?\s*Öğr\.?\s*Üyesi|Öğr\.?\s*Gör\.?\s*Dr\.?|Öğr\.?\s*Gör\.?|Arş\.?\s*Gör\.?\s*Dr\.?|Arş\.?\s*Gör\.?)\s*/i, '')
      .replace(/\s+/g, ' '));
    const nameParts = withoutTitle.split(' ').filter((part) => /[A-Za-zÇĞİÖŞÜçğıöşü]{2,}/.test(part));

    return nameParts.length >= 2;
  }

  private findStructuredDepartment(element: Element): string {
    const departmentCard = element.closest('.dept-card, [class*="dept-card"]');
    const header = departmentCard?.querySelector<HTMLElement>('.dept-header');
    const candidates = [
      header?.querySelector<HTMLElement>('.fs-5')?.textContent,
      header?.querySelector<HTMLElement>('h1,h2,h3,h4,h5,h6,strong')?.textContent,
      header?.textContent
    ];

    for (const candidate of candidates) {
      const department = this.extractDepartmentHeading(candidate || '');
      if (department) return department;
    }

    return '';
  }

  private findStructuredSubDepartment(element: Element): string {
    const subDepartmentBlock = element.closest('.abd-block, [class*="abd-block"]');
    const header = subDepartmentBlock?.querySelector<HTMLElement>('.abd-header');
    const candidates = [
      header?.querySelector<HTMLElement>('strong')?.textContent,
      header?.querySelector<HTMLElement>('h1,h2,h3,h4,h5,h6')?.textContent,
      header?.textContent
    ];

    for (const candidate of candidates) {
      const subDepartment = this.extractSubDepartmentHeading(candidate || '');
      if (subDepartment) return subDepartment;
    }

    return '';
  }

  private findContentRoot(): HTMLElement {
    return this.documentRef.querySelector<HTMLElement>('main')
      || this.documentRef.querySelector<HTMLElement>('[class*="content"]')
      || this.documentRef.querySelector<HTMLElement>('[class*="icerik"]')
      || this.documentRef.body;
  }

  private findPageFaculty(root: HTMLElement): string {
    const candidates = [
      ...Array.from(this.documentRef.querySelectorAll('meta[property="og:title"], meta[name="title"]'))
        .map((element) => element.getAttribute('content')),
      ...Array.from(this.documentRef.querySelectorAll('h1,h2,.breadcrumb,header'))
        .map((element) => element.textContent),
      root.textContent
    ];

    for (const candidate of candidates) {
      const faculty = extractFaculty(candidate || '');
      if (faculty) return faculty;
    }

    return '';
  }

  private isPersonLink(anchor: HTMLAnchorElement): boolean {
    const text = normalizeText(anchor.textContent);
    if (!text || text.length > 120) return false;
    if (scorePersonnelText(text) >= 4) return true;

    const href = anchor.getAttribute('href') || '';
    return /akademik|personel|profile|profil|cv|ozgecmis|özgeçmiş/i.test(href)
      && /[A-ZÇĞİÖŞÜ][A-Za-zÇĞİÖŞÜçğıöşü]+\s+[A-ZÇĞİÖŞÜ][A-Za-zÇĞİÖŞÜçğıöşü]+/.test(text);
  }

  private findSmallRecordElement(anchor: HTMLAnchorElement): Element {
    const selectors = [
      '.card',
      '[class*="card"]',
      '[class*="person"]',
      '[class*="staff"]',
      '[class*="academic"]',
      '[class*="akademik"]',
      'article',
      'li',
      '.row',
      '[class*="col"]'
    ];

    for (const selector of selectors) {
      const parent = anchor.closest(selector);
      const text = normalizeText(parent?.textContent);
      if (parent && text.length >= normalizeText(anchor.textContent).length && text.length <= 900) {
        return parent;
      }
    }

    return anchor;
  }

  private extractDepartmentHeading(text: string): string {
    const normalized = normalizeText(text);
    if (!this.isHeadingLike(normalized)) return '';

    const department = normalized.match(/([A-Za-zÇĞİÖŞÜçğıöşü0-9\s.'/-]{3,}\s+b[öö]l[üü]m[üü])(?![A-Za-zÇĞİÖŞÜçğıöşü0-9])/ui)?.[1]
      || normalized.match(/([A-Za-zÇĞİÖŞÜçğıöşü0-9\s.'/-]{3,}\s+b[öö]l[üü]m)(?![A-Za-zÇĞİÖŞÜçğıöşü0-9])/ui)?.[1]
      || extractDepartment(normalized);

    return formatUnitName(department || '');
  }

  private extractSubDepartmentHeading(text: string): string {
    const normalized = normalizeText(text);
    if (!this.isHeadingLike(normalized)) return '';

    const subDepartment = normalized.match(/([A-Za-zÇĞİÖŞÜçğıöşü0-9\s.'/-]{3,}\s+anab[ıiiİ]l[ıiiİ]m\s+dal[ıiIİ])(?![A-Za-zÇĞİÖŞÜçğıöşü0-9])/ui)?.[1]
      || normalized.match(/([A-Za-zÇĞİÖŞÜçğıöşü0-9\s.'/-]{3,}\s+ana\s+b[ıiiİ]l[ıiiİ]m\s+dal[ıiIİ])(?![A-Za-zÇĞİÖŞÜçğıöşü0-9])/ui)?.[1]
      || normalized.match(/([A-Za-zÇĞİÖŞÜçğıöşü0-9\s.'/-]{3,}\s+program[ıiIİ])(?![A-Za-zÇĞİÖŞÜçğıöşü0-9])/ui)?.[1];

    return formatUnitName(subDepartment || '');
  }

  private isHeadingLike(text: string): boolean {
    const normalized = normalizeText(text);
    if (!normalized || normalized.length > 160) return false;
    
    // Explicitly allow title-cased structural headings
    if (/Bölümü|Bölüm|Fakültesi|Anabilim Dalı|Ana Bilim Dalı|Programı|Yüksekokulu|Enstitüsü/i.test(normalized)) {
      return true;
    }

    const letters = normalized.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/g, '');
    const upperLetters = letters.replace(/[^A-ZÇĞİÖŞÜ]/g, '');
    return letters.length > 3 && upperLetters.length / letters.length > 0.75;
  }

  private hasPersonSignal(element: Element): boolean {
    const text = getTextContentWithSpaces(element);
    if (text.length < 12 || text.length > 1800) return false;
    if (isBlockedContentText(text)) return false;
    if (scorePersonnelText(text) >= 4) return true;

    const hasProfileLink = Array.from(element.querySelectorAll<HTMLAnchorElement>('a[href]'))
      .some((anchor) => /profil|profile|personel|staff|akademik|academic|cv|ozgecmis|özgeçmiş/i.test(anchor.getAttribute('href') || ''));
    return hasProfileLink && /[A-ZÇĞİÖŞÜ][a-zçğıöşü]+ [A-ZÇĞİÖŞÜ][a-zçğıöşü]+/.test(text);
  }

  private splitCompositeCandidate(element: Element): Element[] {
    const selectors = [
      '.profile-card',
      '[class*="profile-card"]',
      '[class*="person-card"]',
      '[class*="staff-card"]',
      '[class*="academic-card"]',
      '.card',
      '[class*="col-"]'
    ];
    const selectorText = selectors.join(',');
    const children = Array.from(element.querySelectorAll(selectorText))
      .filter((candidate) => candidate !== element && this.hasPersonSignal(candidate));

    if (children.length > 1) {
      return children;
    }

    const nameScoped = Array.from(element.querySelectorAll('.name, [class*="name"], [class*="isim"]'))
      .map((nameElement) => nameElement.closest(selectorText) || nameElement.parentElement)
      .filter((candidate): candidate is Element => Boolean(candidate && candidate !== element && this.hasPersonSignal(candidate)));

    const unique = Array.from(new Set(nameScoped));
    return unique.length > 1 ? unique : [element];
  }

  private dedupeNestedCandidates(candidates: Element[]): Element[] {
    return candidates.filter((candidate) => {
      return !candidates.some((other) => other !== candidate && other.contains(candidate) && scorePersonnelText(getTextContentWithSpaces(other)) >= scorePersonnelText(getTextContentWithSpaces(candidate)));
    });
  }

  private collectContextText(): string {
    return normalizeText(Array.from(this.documentRef.querySelectorAll('title, h1, h2, h3, nav, .breadcrumb, header, script[type="application/ld+json"]'))
      .map((element) => element.textContent)
      .join(' '));
  }
}
