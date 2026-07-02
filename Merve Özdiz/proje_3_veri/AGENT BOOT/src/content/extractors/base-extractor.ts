import { AcademicRecord } from '../../shared/types';
import {
  cleanUnitName,
  extractDepartment,
  extractFaculty,
  extractNameAndTitle,
  extractTextClassification,
  extractUnitsFromCommaText,
  extractUniversityName,
  formatUnitName,
  getTextContentWithSpaces,
  isBlockedContentText,
  normalizeFullName,
  normalizeText,
  scorePersonnelText
} from '../heuristics';
import { ExtractorRuntime } from './extractor-types';

const HOVER_WAIT_MS = 450;
const PROFILE_LIMIT = 2000;
const PROFILE_CONCURRENCY = 6;
const PAGE_TRANSITION_MS = 2500;

export abstract class BaseExtractor {
  abstract readonly name: string;

  protected constructor(
    protected readonly documentRef: Document,
    protected readonly runtime: ExtractorRuntime
  ) {}

  async extractPage(sourceUrl: string): Promise<AcademicRecord[]> {
    const university = extractUniversityName(this.documentRef);
    const contextText = this.collectContextText();
    const defaultFaculty = cleanUnitName(extractFaculty(contextText));
    const defaultDepartment = cleanUnitName(extractDepartment(contextText));
    const candidates = this.collectCandidateElements();
    const records: AcademicRecord[] = [];
    const seen = new Set<string>();

    for (const element of candidates) {
      if (!this.runtime.canContinue()) break;

      const record = this.buildRecordFromElement(element, {
        university,
        faculty: defaultFaculty,
        department: defaultDepartment,
        sourceUrl
      });

      if (!record) continue;

      await this.enrichRecordFromHoverCard(element, record);
      if (!this.runtime.canContinue()) break;

      const key = [record.email, record.profileUrl, record.fullName, record.department].filter(Boolean).join('|');
      if (!seen.has(key)) {
        seen.add(key);
        records.push(record);
      }
    }

    await this.enrichRecordsFromProfiles(records);
    return records;
  }

  async goToNextPage(): Promise<boolean> {
    const nextButton = this.findNextPageButton();
    if (nextButton) {
      nextButton.click();
      await this.runtime.delay(PAGE_TRANSITION_MS);
      return this.runtime.canContinue();
    }

    return this.tryInfiniteScroll();
  }

  protected abstract collectCandidateElements(): Element[];

  protected collectBySelectors(selectors: string[], minScore = 4): Element[] {
    const elements = new Set<Element>();

    selectors.forEach((selector) => {
      this.documentRef.querySelectorAll(selector).forEach((element) => {
        const text = normalizeText(element.textContent);
        if (!this.isRejectedCandidate(element) && !isBlockedContentText(text) && text.length >= 12 && text.length <= 1800 && scorePersonnelText(text) >= minScore) {
          elements.add(element);
        }
      });
    });

    return Array.from(elements);
  }

  protected buildRecordFromElement(
    element: Element,
    defaults: Pick<AcademicRecord, 'university' | 'faculty' | 'department' | 'sourceUrl'>
  ): AcademicRecord | null {
    const text = getTextContentWithSpaces(element);
    const classification = extractTextClassification(text);
    const profileUrls = this.findProfileUrls(element);
    const profileUrl = profileUrls[0] || '';
    const nameText = this.findNameText(element, text);
    const { fullName, academicTitle } = extractNameAndTitle(nameText);
    const units = extractUnitsFromCommaText(text);

    if (!profileUrl && this.isLikelyFilterText(fullName, text)) {
      return null;
    }

    if (!fullName || fullName.length < 5 || (!academicTitle && !classification.email && !profileUrl)) {
      return null;
    }

    const img = element.querySelector('img');
    let photoUrl: string | null = null;
    if (img) {
      const src = img.getAttribute('src');
      if (src && !/logo|icon|search|facebook|twitter|linkedin|spacer|banner|arrow/i.test(src)) {
        try {
          photoUrl = new URL(src, this.documentRef.baseURI || defaults.sourceUrl).href;
        } catch {
          // ignore
        }
      }
    }

    return {
      fullName,
      academicTitle,
      university: defaults.university,
      faculty: cleanUnitName(units.faculty || extractFaculty(text) || defaults.faculty),
      department: cleanUnitName(units.department || extractDepartment(text) || defaults.department),
      email: classification.email || null,
      phone: classification.phone || null,
      photoUrl: photoUrl || null,
      profileUrl: profileUrl || defaults.sourceUrl,
      profileUrls,
      sourceUrl: defaults.sourceUrl
    };
  }

  protected findNameText(element: Element, fallbackText: string): string {
    const preferredSelectors = [
      '.researcher-title a',
      'a[href*="profil"]',
      'a[href*="profile"]',
      'a[href*="personel"]',
      'a[href*="staff"]',
      'a[href*="akademik"]',
      'a[href*="academic"]',
      'h1',
      'h2',
      'h3',
      'h4',
      '.name',
      '[class*="name"]',
      '[class*="isim"]',
      '[class*="person-title"]',
      '[class*="title"]'
    ];

    for (const selector of preferredSelectors) {
      const match = element.matches(selector) ? element : element.querySelector(selector);
      const text = normalizeText(match?.textContent);
      if (text && scorePersonnelText(`${text} ${fallbackText}`) >= 3) {
        return text;
      }
    }

    return fallbackText.split(/\s{2,}|\|/)[0] || fallbackText;
  }

  protected findProfileUrls(element: Element): string[] {
    const urls = new Set<string>();
    const addUrl = (value?: string | null) => {
      const normalized = normalizeText(value);
      if (!normalized || normalized === '#' || /^javascript:/i.test(normalized)) return;
      if (!/profil|profile|personel|staff|cv|akademik|academic|researcher|arastirmaci|araştırmacı/i.test(normalized)) return;

      try {
        urls.add(new URL(normalized, window.location.href).href);
      } catch {
        // Geçersiz bağlantılar kayıt kalitesini bozmasın diye atlanır.
      }
    };

    if (element instanceof HTMLAnchorElement) {
      addUrl(element.getAttribute('href'));
    }

    addUrl(element.closest<HTMLAnchorElement>('a[href]')?.getAttribute('href'));
    element.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((anchor) => addUrl(anchor.getAttribute('href')));

    const dataUrlAttributes = [
      'data-url',
      'data-href',
      'data-link',
      'data-profileurl',
      'data-profile-url',
      'data-targeturl',
      'data-target-url'
    ];

    [element, ...Array.from(element.querySelectorAll<HTMLElement>('*'))].forEach((node) => {
      dataUrlAttributes.forEach((attribute) => addUrl(node.getAttribute(attribute)));

      const onclick = node.getAttribute('onclick') || '';
      Array.from(onclick.matchAll(/(?:location\.href|window\.open)\s*\(?\s*['"]([^'"]+)['"]/gi))
        .forEach((match) => addUrl(match[1]));
    });

    const dataElement = element.matches('[data-networkuserid]')
      ? element
      : element.querySelector('[data-networkuserid]');
    const networkId = dataElement?.getAttribute('data-networkuserid')
      || element.getAttribute('data-userid')
      || element.querySelector('[data-userid]')?.getAttribute('data-userid');

    if (networkId) {
      [
        `/profil/${networkId}`,
        `/Profile/${networkId}`,
        `/profile/${networkId}`,
        `/arastirmaci/${networkId}`,
        `/researcher/${networkId}`
      ].forEach((path) => urls.add(new URL(path, window.location.origin).href));
    }

    Array.from(element.outerHTML.matchAll(/(?:href|data-url|data-href|data-link)=["']([^"']+)["']/gi))
      .forEach((match) => addUrl(match[1]));

    return Array.from(urls);
  }

  protected async enrichRecordFromHoverCard(element: Element, record: AcademicRecord): Promise<void> {
    if (!this.isMissingContact(record)) return;

    const target = this.findHoverTarget(element);
    if (!target) return;

    this.runtime.sendStatus('EXTRACTING', `İletişim kartı okunuyor: ${record.fullName}`);
    target.scrollIntoView({ block: 'center', inline: 'nearest' });
    await this.runtime.delay(120);
    if (!this.runtime.canContinue()) return;

    this.triggerHover(target);
    let classification = { email: '', phone: '', title: '' };
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await this.runtime.delay(HOVER_WAIT_MS);
      if (!this.runtime.canContinue()) return;

      const hoverText = this.collectHoverContactText(record.fullName);
      classification = extractTextClassification(hoverText);
      if (classification.email || classification.phone) break;
    }

    record.email ||= classification.email;
    record.phone ||= classification.phone;
    this.clearHover(target);
  }

  protected findHoverTarget(element: Element): HTMLElement | null {
    const selectors = [
      '.researcher-title a',
      'a[data-networkuserid]',
      '[data-networkuserid]',
      'a[href]',
      'h2',
      'h3',
      'h4'
    ];

    for (const selector of selectors) {
      const target = element.matches(selector)
        ? element
        : element.querySelector(selector);

      if (target instanceof HTMLElement) {
        return target;
      }
    }

    return element instanceof HTMLElement ? element : null;
  }

  protected async enrichRecordsFromProfiles(records: AcademicRecord[]): Promise<void> {
    const queue = records.filter((record) => this.getRecordProfileUrls(record).length > 0 && (this.isMissingContact(record) || !this.hasUnitInfo(record) || this.hasNoisyUnitInfo(record)));
    const workers = Array.from({ length: Math.min(PROFILE_CONCURRENCY, queue.length) }, async () => {
      while (queue.length > 0 && this.runtime.canContinue()) {
        const record = queue.shift();
        if (record) {
          await this.enrichRecordFromProfile(record);
        }
      }
    });

    await Promise.all(workers);
  }

  protected async enrichRecordFromProfile(record: AcademicRecord, force = false): Promise<void> {
    if (!force && !this.isMissingContact(record) && this.hasUnitInfo(record) && !this.hasNoisyUnitInfo(record)) return;

    const profileIndex = Number(sessionStorage.getItem('profileFetchCount') || '0');
    if (profileIndex >= PROFILE_LIMIT) return;
    sessionStorage.setItem('profileFetchCount', String(profileIndex + 1));

    for (const profileUrl of this.getRecordProfileUrls(record)) {
      if (!this.runtime.canContinue() || (!force && !this.isMissingContact(record) && this.hasUnitInfo(record) && !this.hasNoisyUnitInfo(record))) return;

      const controller = new AbortController();
      this.runtime.registerAbortController(controller);

      try {
        this.runtime.sendStatus('EXTRACTING', `Detay sayfası okunuyor: ${record.fullName}`);
        const response = await fetch(profileUrl, {
          credentials: 'include',
          signal: controller.signal
        });
        if (!response.ok) continue;

        const html = await response.text();
        if (!this.runtime.canContinue()) return;
        const profileDocument = new DOMParser().parseFromString(html, 'text/html');
        const profileText = normalizeText(profileDocument.body.textContent);
        const classification = extractTextClassification(`${profileText} ${this.collectContactHints(profileDocument)}`);
        const structuredData = this.extractStructuredProfileData(profileDocument);

        record.fullName = structuredData.fullName || record.fullName;
        record.university = structuredData.university || record.university;
        record.faculty = structuredData.faculty || record.faculty;
        record.department = structuredData.department || record.department;
        record.subDepartment ||= structuredData.subDepartment;
        record.email ||= structuredData.email || classification.email;
        record.phone ||= structuredData.phone || classification.phone;
        const units = extractUnitsFromCommaText(profileText);
        record.faculty ||= cleanUnitName(units.faculty || extractFaculty(profileText));
        record.department ||= cleanUnitName(units.department || extractDepartment(profileText));
      } catch {
        if (this.runtime.canContinue()) {
          this.runtime.sendStatus('EXTRACTING', `Detay sayfası okunamadı: ${record.fullName}`);
        }
      } finally {
        this.runtime.unregisterAbortController(controller);
      }
    }
  }

  protected findNextPageButton(): HTMLElement | null {
    const selectors = [
      'div[data-key="next"]',
      'a[rel="next"]',
      'button[aria-label*="sonraki" i]',
      'a[aria-label*="sonraki" i]',
      'button[aria-label*="ileri" i]',
      'a[aria-label*="ileri" i]',
      'button[aria-label*="next" i]',
      'a[aria-label*="next" i]',
      '.pagination .next:not(.disabled)',
      '.page-next:not(.disabled)',
      '[class*="load-more"]',
      '[class*="loadmore"]'
    ];

    for (const selector of selectors) {
      const element = this.documentRef.querySelector<HTMLElement>(selector);
      if (this.isClickableNext(element)) return element;
    }

    const textButton = Array.from(this.documentRef.querySelectorAll<HTMLElement>('a, button, div[role="button"]'))
      .find((element) => this.isClickableNext(element) && /sonraki|ileri|next|load more|daha fazla|devam|yükle|›|»/i.test(normalizeText(element.textContent)));

    if (textButton) return textButton;
    return this.findNextNumericPageButton();
  }

  protected isClickableNext(element: HTMLElement | null): element is HTMLElement {
    if (!element) return false;
    const disabled = element.hasAttribute('disabled')
      || element.getAttribute('aria-disabled') === 'true'
      || element.classList.contains('disabled')
      || element.classList.contains('is-disabled');
    return !disabled;
  }

  protected collectContextText(): string {
    const elements = Array.from(this.documentRef.querySelectorAll('title, h1, h2, h3, .breadcrumb, .breadcrumbs, .path, #breadcrumbs, #breadcrumb, .page-title, .title'));
    const filteredText = elements
      .filter((el) => !el.closest('nav, header, footer, .menu, #menu, .navbar, #navbar, .sidebar, #sidebar, .navigation'))
      .map((el) => getTextContentWithSpaces(el))
      .join(' ');
    return normalizeText(filteredText);
  }

  protected collectContactHints(documentRef: ParentNode): string {
    const hints: string[] = [];

    documentRef.querySelectorAll<HTMLAnchorElement>('a[href^="mailto:"]').forEach((anchor) => {
      hints.push(anchor.getAttribute('href')?.replace(/^mailto:/i, '').split('?')[0] || '');
      hints.push(anchor.textContent || '');
    });

    documentRef.querySelectorAll<HTMLAnchorElement>('a[href^="tel:"]').forEach((anchor) => {
      hints.push(anchor.getAttribute('href')?.replace(/^tel:/i, '') || '');
      hints.push(anchor.textContent || '');
    });

    documentRef.querySelectorAll('dt, th, strong, b, label, span, div').forEach((element) => {
      const label = normalizeText(element.textContent).toLocaleLowerCase('tr-TR');
      if (!/(e-?posta|mail|telefon|tel|dahili|iletişim|contact|phone|email)/i.test(label)) return;

      hints.push(element.textContent || '');
      const next = element.nextElementSibling;
      if (next) hints.push(next.textContent || '');
      const parent = element.parentElement;
      if (parent) hints.push(parent.textContent || '');
    });

    return normalizeText(hints.join(' '));
  }

  protected isRejectedCandidate(element: Element): boolean {
    return Boolean(element.closest([
      'aside',
      'nav',
      'footer',
      'form',
      '.filter',
      '.filters',
      '.facet',
      '.facets',
      '.sidebar',
      '.pagination',
      '[class*="filter"]',
      '[class*="facet"]',
      '[class*="sidebar"]'
    ].join(',')));
  }

  protected isLikelyFilterText(fullName: string, sourceText: string): boolean {
    const normalizedName = normalizeText(fullName);
    const normalizedSource = normalizeText(sourceText);
    return /\(\d+\)$/.test(normalizedName)
      || (!extractTextClassification(normalizedSource).email && !/[A-ZÇĞİÖŞÜ][a-zçğıöşü]+ [A-ZÇĞİÖŞÜ][a-zçğıöşü]+/.test(normalizedName));
  }

  protected isMissingContact(record: AcademicRecord): boolean {
    return !record.email || !record.phone;
  }

  protected hasUnitInfo(record: AcademicRecord): boolean {
    return Boolean(record.faculty && record.department);
  }

  protected hasNoisyUnitInfo(record: AcademicRecord): boolean {
    const unitText = `${record.faculty} ${record.department}`;
    return (record.faculty || '').length > 90
      || (record.department || '').length > 90
      || /Hoşgeldiniz|Anasayfa|Akademik Dokümanlar|Kalite|Mezunlar|İletişim|Bölüm Başkanı.*Anabilim Dalı Başkanı/i.test(unitText)
      || (unitText.match(/Prof\.|Doç\.|Dr\.|Arş\.|Öğr\./g) || []).length > 1;
  }

  private triggerHover(target: HTMLElement): void {
    ['pointerover', 'mouseover', 'mouseenter'].forEach((eventName) => {
      target.dispatchEvent(new MouseEvent(eventName, {
        bubbles: true,
        cancelable: true,
        view: window
      }));
    });
  }

  private clearHover(target: HTMLElement): void {
    ['pointerout', 'mouseout', 'mouseleave'].forEach((eventName) => {
      target.dispatchEvent(new MouseEvent(eventName, {
        bubbles: true,
        cancelable: true,
        view: window
      }));
    });
  }

  private collectHoverContactText(fullName: string): string {
    const normalizedName = normalizeText(fullName).toLocaleLowerCase('tr-TR');
    const nameParts = normalizedName.split(' ').filter((part) => part.length > 2);
    const candidates = Array.from(this.documentRef.body.querySelectorAll<HTMLElement>('*'))
      .filter((element) => this.isVisibleElement(element))
      .map((element) => {
        const text = normalizeText(element.textContent);
        const lowerText = text.toLocaleLowerCase('tr-TR');
        const classification = extractTextClassification(text);
        const nameScore = nameParts.filter((part) => lowerText.includes(part)).length;
        const contactScore = Number(Boolean(classification.email)) * 5
          + Number(Boolean(classification.phone)) * 4
          + Number(/iletişim|e-?posta|mail|telefon|tel|dahili|contact|phone|email/i.test(lowerText)) * 3;

        return {
          element,
          text,
          score: contactScore + nameScore
        };
      })
      .filter((candidate) => candidate.text.length > 8 && candidate.text.length < 1800 && candidate.score >= 4)
      .sort((a, b) => b.score - a.score);

    const best = candidates[0];
    if (!best) return '';
    return normalizeText(`${best.text} ${this.collectContactHints(best.element)}`);
  }

  private isVisibleElement(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none'
      && style.visibility !== 'hidden'
      && Number(style.opacity) !== 0
      && rect.width > 20
      && rect.height > 10
      && rect.bottom > 0
      && rect.right > 0
      && rect.top < window.innerHeight
      && rect.left < window.innerWidth;
  }

  private getRecordProfileUrls(record: AcademicRecord): string[] {
    return Array.from(new Set([...(record.profileUrls || []), record.profileUrl]))
      .filter((url) => Boolean(url) && url !== record.sourceUrl);
  }

  private extractStructuredProfileData(profileDocument: Document): Partial<AcademicRecord> {
    const unitFields = Array.from(profileDocument.querySelectorAll<HTMLElement>('.unialan, [class*="unialan"]'))
      .map((element) => normalizeText(element.textContent))
      .filter(Boolean);

    const contactText = normalizeText([
      ...Array.from(profileDocument.querySelectorAll<HTMLElement>('.mail, [class*="mail"], .email, [class*="email"]')).map((element) => element.textContent),
      ...Array.from(profileDocument.querySelectorAll<HTMLAnchorElement>('a[href^="mailto:"]')).map((anchor) => anchor.getAttribute('href')?.replace(/^mailto:/i, '').split('?')[0]),
      ...Array.from(profileDocument.querySelectorAll<HTMLElement>('.telefon, [class*="telefon"], .phone, [class*="phone"], [class*="tel"]')).map((element) => element.textContent),
      ...Array.from(profileDocument.querySelectorAll<HTMLAnchorElement>('a[href^="tel:"]')).map((anchor) => anchor.getAttribute('href')?.replace(/^tel:/i, ''))
    ].join(' '));

    const classification = extractTextClassification(contactText);
    const university = unitFields[0] || unitFields.find((field) => /Üniversitesi/i.test(field)) || '';
    const faculty = unitFields[1] || extractFaculty(unitFields.join(' '));
    const department = unitFields[2] || this.pickStructuredDepartment(unitFields, 1);
    const subDepartment = unitFields[3] || '';
    
    const hElement = profileDocument.querySelector('h1, h2, .person-name, .title, .name, [class*="name"], [class*="isim"]');
    const { fullName, academicTitle } = extractNameAndTitle(hElement?.textContent || '');

    const profileImg = profileDocument.querySelector('.profile-img img, .portrait img, .photo img, .avatar img, [class*="profile"] img, [class*="avatar"] img, img');
    let photoUrl: string | null = null;
    if (profileImg) {
      const src = profileImg.getAttribute('src');
      if (src && !/logo|icon|search|facebook|twitter|linkedin|spacer|banner|arrow/i.test(src)) {
        try {
          photoUrl = new URL(src, profileDocument.baseURI).href;
        } catch {
          // ignore
        }
      }
    }

    return {
      fullName: fullName || undefined,
      academicTitle: academicTitle || null,
      university: university ? formatUnitName(university) : '',
      faculty: cleanUnitName(faculty),
      department: cleanUnitName(department),
      subDepartment: cleanUnitName(subDepartment),
      email: classification.email || null,
      phone: classification.phone || null,
      photoUrl: photoUrl || null
    };
  }

  private pickStructuredDepartment(unitFields: string[], facultyIndex: number): string {
    const afterFaculty = facultyIndex >= 0 ? unitFields.slice(facultyIndex + 1) : unitFields;
    const department = afterFaculty.find((field) => {
      return Boolean(field)
        && !/Üniversitesi|Fakültesi|Yüksekokulu|Enstitüsü/i.test(field)
        && !extractTextClassification(field).email;
    });

    return department ? formatUnitName(department) : '';
  }

  private findNextNumericPageButton(): HTMLElement | null {
    const active = this.documentRef.querySelector<HTMLElement>('.pagination .active, [aria-current="page"], .page-item.active');
    const activeNumber = Number(normalizeText(active?.textContent));
    if (!Number.isFinite(activeNumber)) return null;

    return Array.from(this.documentRef.querySelectorAll<HTMLElement>('a, button'))
      .find((element) => this.isClickableNext(element) && Number(normalizeText(element.textContent)) === activeNumber + 1) || null;
  }

  private async tryInfiniteScroll(): Promise<boolean> {
    const beforeHeight = this.documentRef.documentElement.scrollHeight;
    const beforeTextLength = normalizeText(this.documentRef.body.textContent).length;
    window.scrollTo({ top: beforeHeight, behavior: 'smooth' });
    await this.runtime.delay(PAGE_TRANSITION_MS);
    if (!this.runtime.canContinue()) return false;

    const afterHeight = this.documentRef.documentElement.scrollHeight;
    const afterTextLength = normalizeText(this.documentRef.body.textContent).length;
    return afterHeight > beforeHeight + 80 || afterTextLength > beforeTextLength + 200;
  }
}
