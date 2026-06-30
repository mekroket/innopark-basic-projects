import { AcademicRecord, WebsiteApiSettings, WebsiteSendStatus } from '../shared/types';

export interface WebsiteSendResult {
  success: boolean;
  message: string;
  status: WebsiteSendStatus;
  received?: number;
  saved?: number;
  invalid?: number;
  errors?: unknown[];
}

export class WebsiteApiClient {
  constructor(private readonly settings: WebsiteApiSettings) {}

  async sendRecords(records: AcademicRecord[]): Promise<WebsiteSendResult> {
    const apiUrl = this.settings.apiUrl.trim();
    const apiKey = this.settings.apiKey.trim();

    if (!apiUrl || !apiKey) {
      return {
        success: false,
        status: 'error',
        message: 'API URL ve API anahtari gereklidir.'
      };
    }

    let endpoint: URL;
    try {
      endpoint = resolveImportEndpoint(apiUrl);
    } catch {
      return {
        success: false,
        status: 'error',
        message: 'API URL gecersiz.'
      };
    }

    const mappedRecords = records.map(toWebsiteRecord);
    const websiteRecords = mappedRecords.filter(isImportableWebsiteRecord);
    const skipped = records.length - websiteRecords.length;

    if (websiteRecords.length === 0) {
      return {
        success: false,
        status: 'error',
        message: 'PHP import icin gecerli kayit yok. Ad soyad ve universite zorunludur.'
      };
    }

    try {
      const response = await fetch(endpoint.href, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          academics: websiteRecords,
          source: 'chrome-extension',
          sent_at: new Date().toISOString()
        })
      });

      const result = await parseJsonResponse(response);

      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          status: 'unauthorized',
          message: 'Yetkisiz istek. API anahtarini kontrol edin.'
        };
      }

      if (result && result.success === false) {
        return {
          success: false,
          status: 'error',
          message: buildPhpErrorMessage(response.status, result, skipped),
          received: numberResult(result.received),
          saved: numberResult(result.saved),
          invalid: numberResult(result.invalid),
          errors: Array.isArray(result.errors) ? result.errors : undefined
        };
      }

      if (!response.ok) {
        return {
          success: false,
          status: 'error',
          message: `API hatasi: HTTP ${response.status}`
        };
      }

      const saved = numberResult(result?.saved) ?? websiteRecords.length;
      const invalid = numberResult(result?.invalid) ?? 0;
      const success = skipped === 0 && invalid === 0 && saved === websiteRecords.length;

      return {
        success,
        status: success ? 'success' : 'error',
        message: buildSuccessMessage(websiteRecords.length, saved, skipped, invalid),
        received: numberResult(result?.received) ?? websiteRecords.length,
        saved,
        invalid,
        errors: Array.isArray(result?.errors) ? result?.errors : undefined
      };
    } catch {
      return {
        success: false,
        status: 'network_failure',
        message: 'Ag hatasi. API sunucusuna ulasilamadi.'
      };
    }
  }
}

type WebsiteAcademicRecord = Record<
  'full_name'
  | 'academic_title'
  | 'university'
  | 'faculty'
  | 'department'
  | 'sub_department'
  | 'email'
  | 'phone'
  | 'profile_url'
  | 'source_url',
  string | null
>;

function toWebsiteRecord(record: AcademicRecord): WebsiteAcademicRecord {
  return {
    full_name: limitString(joinTitleAndName(record.academicTitle, record.fullName), 190),
    academic_title: limitString(record.academicTitle, 120),
    university: limitString(record.university, 190),
    faculty: limitString(record.faculty, 190),
    department: limitString(record.department, 190),
    sub_department: limitString(record.subDepartment, 190),
    email: normalizeWebsiteEmail(record.email),
    phone: limitString(record.phone, 80),
    profile_url: limitString(record.profileUrl, 500),
    source_url: limitString(record.sourceUrl, 500)
  };
}

function joinTitleAndName(title: string | null | undefined, fullName: string | null | undefined): string {
  const normalizedTitle = (title || '').trim();
  const normalizedName = (fullName || '').trim();
  if (!normalizedTitle) return normalizedName;
  if (!normalizedName) return normalizedTitle;
  return normalizedName.toLocaleLowerCase('tr-TR').startsWith(normalizedTitle.toLocaleLowerCase('tr-TR'))
    ? normalizedName
    : `${normalizedTitle} ${normalizedName}`;
}

function isImportableWebsiteRecord(record: WebsiteAcademicRecord): boolean {
  return Boolean(record.full_name && record.university);
}

function resolveImportEndpoint(apiUrl: string): URL {
  const endpoint = new URL(apiUrl);
  const path = endpoint.pathname.replace(/\/+$/, '');

  if (path === '' || path === '/') {
    endpoint.pathname = '/api/import.php';
  } else if (/\/api$/i.test(path)) {
    endpoint.pathname = `${path}/import.php`;
  }

  return endpoint;
}

async function parseJsonResponse(response: Response): Promise<Record<string, unknown> | null> {
  const text = await response.text();
  if (!text) return null;

  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function buildPhpErrorMessage(status: number, result: Record<string, unknown>, localSkipped = 0): string {
  const message = typeof result.message === 'string' ? result.message : `API hatasi: HTTP ${status}`;
  const invalid = typeof result.invalid === 'number' ? result.invalid : 0;
  const saved = typeof result.saved === 'number' ? result.saved : null;

  if (saved !== null || invalid > 0 || localSkipped > 0) {
    return `${message} Kaydedilen: ${saved ?? 0}, hatali: ${invalid}, botta atlanan: ${localSkipped}.`;
  }

  return message;
}

function buildSuccessMessage(sent: number, saved: number, skipped: number, invalid: number): string {
  const parts = [
    `${saved}/${sent} kayit web sitesine aktarildi`
  ];
  if (invalid > 0) parts.push(`${invalid} kayit API tarafinda reddedildi`);
  if (skipped > 0) parts.push(`${skipped} eksik kayit bot tarafinda gonderilmedi`);
  return `${parts.join(', ')}.`;
}

function numberResult(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function limitString(value: string | null | undefined, maxLength: number): string | null {
  const normalized = (value || '').trim();
  if (!normalized) return null;
  return normalized.length > maxLength ? normalized.slice(0, maxLength) : normalized;
}

function normalizeWebsiteEmail(value: string | null | undefined): string | null {
  const email = limitString(value, 190);
  if (!email) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
