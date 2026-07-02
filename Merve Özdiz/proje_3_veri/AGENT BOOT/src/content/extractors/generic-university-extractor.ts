import { AcademicRecord } from '../../shared/types';
import { BaseExtractor } from './base-extractor';
import { ExtractorRuntime } from './extractor-types';
import { GenericListExtractor } from './generic-list-extractor';
import { GenericProfileExtractor } from './generic-profile-extractor';

const PROFILE_LIMIT = 2000;

export class GenericUniversityExtractor extends BaseExtractor {
  readonly name = 'Genel Üniversite';

  constructor(documentRef: Document, runtime: ExtractorRuntime) {
    super(documentRef, runtime);
  }

  async extractPage(sourceUrl: string): Promise<AcademicRecord[]> {
    const listExtractor = new GenericListExtractor(
      this.documentRef,
      this.runtime,
      (el) => this.findProfileUrls(el),
      (selectors, minScore) => this.collectBySelectors(selectors, minScore),
      (el) => this.isRejectedCandidate(el)
    );

    const listResults = await listExtractor.extract(sourceUrl);
    const records: AcademicRecord[] = [];
    const seen = new Set<string>();

    for (const item of listResults) {
      if (!this.runtime.canContinue()) break;

      const record = item.record;
      await this.enrichRecordFromHoverCard(item.element, record);
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

  protected async enrichRecordFromProfile(record: AcademicRecord, force = false): Promise<void> {
    if (!force && !this.isMissingContact(record) && this.hasUnitInfo(record) && !this.hasNoisyUnitInfo(record)) return;

    const profileIndex = Number(sessionStorage.getItem('profileFetchCount') || '0');
    if (profileIndex >= PROFILE_LIMIT) return;
    sessionStorage.setItem('profileFetchCount', String(profileIndex + 1));

    for (const profileUrl of this.getProfileUrlsToEnrich(record)) {
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

        const profileData = GenericProfileExtractor.extract(profileDocument, profileUrl);

        record.fullName = profileData.fullName || record.fullName;
        record.academicTitle = profileData.academicTitle || record.academicTitle;
        record.university = profileData.university || record.university;
        record.faculty = profileData.faculty || record.faculty;
        record.department = profileData.department || record.department;
        if (profileData.subDepartment) {
          record.subDepartment = profileData.subDepartment;
        }
        record.email = record.email || profileData.email || null;
        record.phone = record.phone || profileData.phone || null;
        record.photoUrl = profileData.photoUrl || record.photoUrl || null;

      } catch {
        if (this.runtime.canContinue()) {
          this.runtime.sendStatus('EXTRACTING', `Detay sayfası okunamadı: ${record.fullName}`);
        }
      } finally {
        this.runtime.unregisterAbortController(controller);
      }
    }
  }

  protected isRejectedCandidate(element: Element): boolean {
    return Boolean(element.closest([
      'aside',
      'nav',
      'footer',
      'form',
      '.sidebar',
      '#sidebar',
      '.side-bar',
      '#side-bar',
      '.pagination',
      '.filters',
      '.facet',
      '.facets'
    ].join(',')));
  }

  protected collectCandidateElements(): Element[] {
    return [];
  }

  private getProfileUrlsToEnrich(record: AcademicRecord): string[] {
    return Array.from(new Set([...(record.profileUrls || []), record.profileUrl]))
      .filter((url) => Boolean(url) && url !== record.sourceUrl);
  }
}
