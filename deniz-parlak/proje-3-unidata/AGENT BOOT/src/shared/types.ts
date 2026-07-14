export interface AcademicRecord {
  fullName: string;
  academicTitle: string | null;
  university: string | null;
  faculty: string | null;
  department: string | null;
  subDepartment?: string | null;
  email: string | null;
  phone: string | null;
  photoUrl?: string | null;
  profileUrl: string;
  profileUrls?: string[];
  sourceUrl: string;
}

export type ScraperState = 'IDLE' | 'EXTRACTING' | 'PAUSED' | 'STOPPED' | 'COMPLETE' | 'ERROR';

export interface ScraperStatus {
  state: ScraperState;
  recordsCollected: number;
  currentUrl: string;
  queueLength: number;
  currentPage: number;
  elapsedMs: number;
  lastAction: string;
}

export interface WebsiteApiSettings {
  apiUrl: string;
  apiKey: string;
}

export type WebsiteSendStatus = 'success' | 'error' | 'unauthorized' | 'network_failure';

export interface ActionResponse {
  success: boolean;
  message: string;
  status?: WebsiteSendStatus;
}
