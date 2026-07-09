import { AcademicRecord } from '../../shared/types';
import { extractTextClassification, extractUnitsFromCommaText, normalizeFullName, normalizeText } from '../heuristics';
import { BaseExtractor } from './base-extractor';
import { ExtractorRuntime } from './extractor-types';

export class AvesisExtractor extends BaseExtractor {
  readonly name = 'AVESİS';

  constructor(documentRef: Document, runtime: ExtractorRuntime) {
    super(documentRef, runtime);
  }

  static canHandle(documentRef: Document): boolean {
    const host = window.location.hostname.toLocaleLowerCase('tr-TR');
    const text = normalizeText(`${documentRef.title} ${documentRef.body?.textContent || ''}`).toLocaleLowerCase('tr-TR');
    return host.includes('avesis')
      || documentRef.querySelectorAll('.researcher-row, [data-networkuserid]').length > 0
      || text.includes('akademik veri yönetim sistemi');
  }

  protected collectCandidateElements(): Element[] {
    const candidates = this.collectBySelectors([
      '.researcher-row',
      '.researcher-row-container',
      '[data-networkuserid]'
    ], 4);

    return candidates.filter((element) => !this.isRejectedCandidate(element));
  }

  protected buildRecordFromElement(
    element: Element,
    defaults: Pick<AcademicRecord, 'university' | 'faculty' | 'department' | 'sourceUrl'>
  ): AcademicRecord | null {
    const record = super.buildRecordFromElement(element, defaults);
    if (!record) return null;

    const text = normalizeText(element.textContent);
    const parts = text.split(',').map((part) => normalizeText(part)).filter(Boolean);
    const classification = extractTextClassification(text);
    const units = extractUnitsFromCommaText(text);

    if (parts[0]) {
      record.fullName = normalizeFullName(parts[0]);
    }

    record.academicTitle = record.academicTitle || classification.title || null;

    if (!classification.title && !record.profileUrl) {
      return null;
    }

    record.faculty = units.faculty || parts[1] || record.faculty;
    record.department = units.department || parts[2] || record.department;

    return record;
  }
}
