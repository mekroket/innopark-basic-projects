import { AcademicRecord } from '../../shared/types';
import {
  cleanUnitName,
  extractDepartment,
  extractFaculty,
  extractNameAndTitle,
  extractTextClassification,
  formatUnitName,
  isBlockedContentText,
  isValidPersonName,
  normalizeText
} from '../heuristics';

export class GenericProfileExtractor {
  static extract(profileDocument: Document, profileUrl: string): Partial<AcademicRecord> {
    const bodyText = normalizeText(profileDocument.body.textContent);

    let fullName = '';
    let academicTitle: string | null = null;
    const nameSelectors = [
      'h1',
      'h2',
      '.person-name',
      '.title',
      '.name',
      '[class*="name"]',
      '[class*="isim"]',
      '[class*="person-title"]',
      '[class*="title"]'
    ];
    for (const selector of nameSelectors) {
      const el = profileDocument.querySelector(selector);
      const text = normalizeText(el?.textContent);
      if (text && text.length > 3 && text.length < 120 && !/akademik|personel|anasayfa|rehber|tarihçe|iletişim/i.test(text)) {
        const parsed = extractNameAndTitle(text);
        if (!isValidPersonName(parsed.fullName)) continue;
        fullName = parsed.fullName;
        academicTitle = parsed.academicTitle;
        break;
      }
    }

    const emailElements = profileDocument.querySelectorAll([
      '.mail',
      '[class*="mail"]',
      '.email',
      '[class*="email"]',
      '.contact',
      '[class*="contact"]'
    ].join(','));
    const mailtoAnchors = profileDocument.querySelectorAll('a[href^="mailto:"]');

    const phoneElements = profileDocument.querySelectorAll([
      '.phone',
      '[class*="phone"]',
      '[class*="tel"]',
      '.contact',
      '[class*="contact"]',
      '.telefon',
      '[class*="telefon"]'
    ].join(','));
    const telAnchors = profileDocument.querySelectorAll('a[href^="tel:"]');

    const specificContactText = [
      ...Array.from(emailElements).map((el) => el.textContent),
      ...Array.from(mailtoAnchors).map((el) => el.getAttribute('href')?.replace(/^mailto:/i, '').split('?')[0]),
      ...Array.from(phoneElements).map((el) => el.textContent),
      ...Array.from(telAnchors).map((el) => el.getAttribute('href')?.replace(/^tel:/i, ''))
    ].join(' ');

    const classification = extractTextClassification(normalizeText(specificContactText));
    let email = classification.email;
    let phone = classification.phone;

    if ((!email || !phone) && !isBlockedContentText(bodyText)) {
      const fullTextClassification = extractTextClassification(bodyText);
      email ||= fullTextClassification.email;
      phone ||= fullTextClassification.phone;
    }

    const unitFields = Array.from(profileDocument.querySelectorAll<HTMLElement>('.unialan, [class*="unialan"]'))
      .map((element) => normalizeText(element.textContent))
      .filter(Boolean);

    const breadcrumbText = Array.from(profileDocument.querySelectorAll('.breadcrumb, [class*="breadcrumb"], .breadcrumbs'))
      .map((el) => normalizeText(el.textContent))
      .join(' ');

    const departmentBlockText = Array.from(profileDocument.querySelectorAll('[class*="department"], [class*="bolum"], [class*="bölüm"]'))
      .map((el) => normalizeText(el.textContent))
      .join(' ');

    const facultyBlockText = Array.from(profileDocument.querySelectorAll('[class*="faculty"], [class*="fakulte"], [class*="fakülte"]'))
      .map((el) => normalizeText(el.textContent))
      .join(' ');

    const profileInfoText = Array.from(profileDocument.querySelectorAll('[class*="profile-info"], [class*="profile-detail"], [class*="personal-info"]'))
      .map((el) => normalizeText(el.textContent))
      .join(' ');

    const combinedUnitsText = [
      unitFields.join('\n'),
      breadcrumbText,
      departmentBlockText,
      facultyBlockText,
      profileInfoText
    ].join('\n');

    let universityCandidate = unitFields.find((field) => /Üniversitesi/i.test(field)) || '';
    if (!universityCandidate) {
      const match = bodyText.match(/([A-ZÇĞİÖŞÜ][A-Za-zÇĞİÖŞÜçğıöşü0-9\s.'-]{2,}Üniversitesi)/);
      universityCandidate = match?.[1] || '';
    }

    const facultyLines = combinedUnitsText.split(/[\n\r|>›»•/\\*:#]+|\s+-\s+/).map((l) => l.trim()).filter(Boolean);

    let facultyCandidate = unitFields.find((field) => /Fakültesi|Yüksekokulu|Enstitüsü/i.test(field)) || '';
    if (!facultyCandidate) {
      for (const line of facultyLines) {
        const match = extractFaculty(line);
        if (match && match !== 'Belirtilmemiş') {
          facultyCandidate = match;
          break;
        }
      }
    }

    let departmentCandidate = unitFields.find((field) => /Bölümü/i.test(field)) || '';
    if (!departmentCandidate) {
      for (const line of facultyLines) {
        const match = extractDepartment(line);
        if (match && match !== 'Belirtilmemiş') {
          departmentCandidate = match;
          break;
        }
      }
    }

    let subDepartmentCandidate = unitFields.find((field) => /Anabilim Dalı|Ana Bilim Dalı/i.test(field)) || '';
    if (!subDepartmentCandidate) {
      const match = combinedUnitsText.match(/([A-Za-zÇĞİÖŞÜçğıöşü0-9\s.'/-]{3,}\s+anab[ıiiİ]l[ıiiİ]m\s+dal[ıiIİ])(?![A-Za-zÇĞİÖŞÜçğıöşü0-9])/ui)
        || combinedUnitsText.match(/([A-Za-zÇĞİÖŞÜçğıöşü0-9\s.'/-]{3,}\s+ana\s+b[ıiiİ]l[ıiiİ]m\s+dal[ıiIİ])(?![A-Za-zÇĞİÖŞÜçğıöşü0-9])/ui);
      subDepartmentCandidate = match?.[1] || '';
    }

    const profileImg = profileDocument.querySelector('.profile-img img, .portrait img, .photo img, .avatar img, [class*="profile"] img, [class*="avatar"] img, img');
    let photoUrl: string | null = null;
    if (profileImg) {
      const src = profileImg.getAttribute('src');
      if (src && !/logo|icon|search|facebook|twitter|linkedin|spacer|banner|arrow/i.test(src)) {
        try {
          photoUrl = new URL(src, profileDocument.baseURI || profileUrl).href;
        } catch {
          // ignore
        }
      }
    }

    return {
      fullName: fullName || undefined,
      academicTitle: academicTitle || null,
      university: universityCandidate ? formatUnitName(universityCandidate) : undefined,
      faculty: cleanUnitName(facultyCandidate) || undefined,
      department: cleanUnitName(departmentCandidate) || undefined,
      subDepartment: cleanUnitName(subDepartmentCandidate) || undefined,
      email: email || undefined,
      phone: phone || undefined,
      photoUrl: photoUrl || null
    };
  }
}
