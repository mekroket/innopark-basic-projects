import { WebsiteApiClient } from './api-client';
import { AcademicRecord, ActionResponse, ScraperState, ScraperStatus, WebsiteApiSettings } from '../shared/types';
import * as XLSX from 'xlsx';

const records = new Map<string, AcademicRecord>();
const API_URL_STORAGE_KEY = 'apiUrl';
const API_KEY_STORAGE_KEY = 'apiKey';

let currentState: ScraperState = 'IDLE';
let currentUrl = '';
let currentPage = 0;
let startedAt = 0;
let elapsedBeforePause = 0;
let lastAction = 'Hazır';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_SCRAPING') {
    startScraping(message.url).then(sendResponse);
    return true;
  }

  if (message.type === 'PAUSE_SCRAPING') {
    pauseScraping().then(sendResponse);
    return true;
  }

  if (message.type === 'RESUME_SCRAPING') {
    resumeScraping().then(sendResponse);
    return true;
  }

  if (message.type === 'STOP_SCRAPING') {
    stopScraping().then(sendResponse);
    return true;
  }

  if (message.type === 'CLEAR_RECORDS') {
    records.clear();
    currentPage = 0;
    lastAction = 'Veriler temizlendi';
    sendResponse({ success: true });
    return;
  }

  if (message.type === 'SAVE_RECORDS') {
    saveRecords(message.data || []);
    currentUrl = message.currentUrl || sender.tab?.url || currentUrl;
    currentPage = message.currentPage || currentPage;
    lastAction = message.lastAction || `${records.size} kayıt hazır`;
    sendResponse({ success: true, count: records.size });
    return;
  }

  if (message.type === 'STATUS_UPDATE') {
    currentState = message.state || currentState;
    currentUrl = message.currentUrl || sender.tab?.url || currentUrl;
    currentPage = message.currentPage || currentPage;
    lastAction = message.lastAction || lastAction;
    sendResponse({ success: true });
    return;
  }

  if (message.type === 'GET_STATUS') {
    sendResponse(getStatus());
    return;
  }

  if (message.type === 'EXPORT_EXCEL') {
    exportToExcel().then(sendResponse);
    return true;
  }

  if (message.type === 'SEND_TO_WEBSITE') {
    sendToWebsite().then(sendResponse);
    return true;
  }
});

async function startScraping(url?: string): Promise<{ success: boolean }> {
  currentState = 'EXTRACTING';
  currentUrl = url || currentUrl;
  currentPage = 0;
  startedAt = Date.now();
  elapsedBeforePause = 0;
  lastAction = 'Tarama başlatıldı';

  const tab = await getActiveTab();
  if (tab?.id) {
    await ensureContentScriptAndSend(tab.id, { type: 'BEGIN_EXTRACTION' });
  }

  return { success: true };
}

function getWebsiteApiSettings(): Promise<WebsiteApiSettings> {
  return new Promise((resolve) => {
    chrome.storage.local.get([API_URL_STORAGE_KEY, API_KEY_STORAGE_KEY], (items) => {
      resolve({
        apiUrl: typeof items[API_URL_STORAGE_KEY] === 'string' ? items[API_URL_STORAGE_KEY] : '',
        apiKey: typeof items[API_KEY_STORAGE_KEY] === 'string' ? items[API_KEY_STORAGE_KEY] : ''
      });
    });
  });
}

async function pauseScraping(): Promise<{ success: boolean }> {
  if (currentState !== 'EXTRACTING') return { success: true };
  elapsedBeforePause = getElapsedMs();
  currentState = 'PAUSED';
  lastAction = 'Tarama duraklatıldı';
  await broadcastToActiveTab({ type: 'PAUSE_SCRAPING' });
  return { success: true };
}

async function resumeScraping(): Promise<{ success: boolean }> {
  if (currentState !== 'PAUSED') return { success: true };
  startedAt = Date.now();
  currentState = 'EXTRACTING';
  lastAction = 'Tarama devam ediyor';
  await broadcastToActiveTab({ type: 'RESUME_SCRAPING' });
  return { success: true };
}

async function stopScraping(): Promise<{ success: boolean }> {
  currentState = 'STOPPED';
  elapsedBeforePause = 0;
  startedAt = 0;
  lastAction = 'Tarama durduruldu';
  await broadcastToActiveTab({ type: 'STOP_SCRAPING' });
  return { success: true };
}

function saveRecords(newRecords: AcademicRecord[]): void {
  newRecords.forEach((record) => {
    const normalizedRecord = normalizeRecord(record);
    if (!normalizedRecord.fullName || !normalizedRecord.sourceUrl) return;

    const key = buildRecordKey(normalizedRecord);
    const existing = records.get(key);
    records.set(key, existing ? mergeRecords(existing, normalizedRecord) : normalizedRecord);
  });
}

function normalizeRecord(record: AcademicRecord): AcademicRecord {
  return {
    academicTitle: record.academicTitle || null,
    fullName: record.fullName,
    university: record.university || null,
    faculty: record.faculty || null,
    department: record.department || null,
    subDepartment: record.subDepartment || null,
    email: record.email || null,
    phone: record.phone || null,
    photoUrl: record.photoUrl || null,
    profileUrl: record.profileUrl || record.sourceUrl || '',
    profileUrls: record.profileUrls || [],
    sourceUrl: record.sourceUrl || currentUrl
  };
}

function buildRecordKey(record: AcademicRecord): string {
  return (record.email || record.profileUrl || `${record.fullName}|${record.university || ''}|${record.department || ''}`).toLocaleLowerCase('tr-TR');
}

function mergeRecords(current: AcademicRecord, incoming: AcademicRecord): AcademicRecord {
  return {
    academicTitle: current.academicTitle || incoming.academicTitle || null,
    fullName: current.fullName || incoming.fullName,
    university: current.university || incoming.university || null,
    faculty: current.faculty || incoming.faculty || null,
    department: current.department || incoming.department || null,
    subDepartment: current.subDepartment || incoming.subDepartment || null,
    email: current.email || incoming.email || null,
    phone: current.phone || incoming.phone || null,
    photoUrl: current.photoUrl || incoming.photoUrl || null,
    profileUrl: current.profileUrl || incoming.profileUrl,
    profileUrls: Array.from(new Set([...(current.profileUrls || []), ...(incoming.profileUrls || [])])),
    sourceUrl: current.sourceUrl || incoming.sourceUrl
  };
}

function getStatus(): ScraperStatus {
  return {
    state: currentState,
    recordsCollected: records.size,
    currentUrl,
    queueLength: 0,
    currentPage,
    elapsedMs: getElapsedMs(),
    lastAction
  };
}

function getElapsedMs(): number {
  if (currentState === 'EXTRACTING' && startedAt > 0) {
    return elapsedBeforePause + Date.now() - startedAt;
  }
  return elapsedBeforePause;
}

async function exportToExcel(): Promise<{ success: boolean; message: string }> {
  const hasSubDepartment = Array.from(records.values()).some((record) => Boolean(record.subDepartment));
  const data = Array.from(records.values()).map((record) => ({
    'Ad Soyad': formatDisplayName(record),
    'Üniversite': record.university || '',
    'Fakülte': record.faculty || '',
    'Bölüm': record.department || '',
    ...(hasSubDepartment ? { 'Anabilim Dalı': record.subDepartment || '' } : {}),
    'E-Posta': record.email || '',
    'Telefon': record.phone || ''
  }));

  if (data.length === 0) {
    lastAction = 'Excel oluşturulamadı: kayıt yok';
    return { success: false, message: lastAction };
  }

  const worksheet = XLSX.utils.json_to_sheet(data, {
    header: hasSubDepartment
      ? ['Ad Soyad', 'Üniversite', 'Fakülte', 'Bölüm', 'Anabilim Dalı', 'E-Posta', 'Telefon']
      : ['Ad Soyad', 'Üniversite', 'Fakülte', 'Bölüm', 'E-Posta', 'Telefon']
  });
  worksheet['!cols'] = [
    { wch: 34 },
    { wch: 30 },
    { wch: 34 },
    { wch: 34 },
    ...(hasSubDepartment ? [{ wch: 34 }] : []),
    { wch: 30 },
    { wch: 20 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Personel');
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const dataUrl = await blobToDataUrl(blob);

  await chrome.downloads.download({
    url: dataUrl,
    filename: `akademik_personel_${new Date().toISOString().slice(0, 10)}.xlsx`,
    saveAs: true
  });

  lastAction = 'Excel dosyası oluşturuldu';
  return { success: true, message: lastAction };
}

function formatDisplayName(record: AcademicRecord): string {
  const title = (record.academicTitle || '').trim();
  const fullName = (record.fullName || '').trim();
  if (!title) return fullName;
  if (!fullName) return title;
  return fullName.toLocaleLowerCase('tr-TR').startsWith(title.toLocaleLowerCase('tr-TR'))
    ? fullName
    : `${title} ${fullName}`;
}

async function sendToWebsite(): Promise<ActionResponse> {
  if (records.size === 0) {
    lastAction = 'Gonderilecek kayit yok';
    return { success: false, message: lastAction, status: 'error' };
  }

  const settings = await getWebsiteApiSettings();
  const result = await new WebsiteApiClient(settings).sendRecords(Array.from(records.values()));
  lastAction = result.message;
  return result;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

async function broadcastToActiveTab(message: unknown): Promise<void> {
  const tab = await getActiveTab();
  if (tab?.id) {
    await sendTabMessage(tab.id, message);
  }
}

async function sendTabMessage(tabId: number, message: unknown): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, message);
  } catch {
    lastAction = 'Sayfa betiği henüz hazır değil';
  }
}

async function ensureContentScriptAndSend(tabId: number, message: unknown): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, message);
    return;
  } catch {
    lastAction = 'Sayfa betiği yükleniyor';
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });
    await chrome.tabs.sendMessage(tabId, message);
    lastAction = 'Sayfa betiği yüklendi, tarama başladı';
  } catch {
    currentState = 'ERROR';
    lastAction = 'Sayfa betiği yüklenemedi. Sayfayı yenileyip tekrar deneyin.';
  }
}
