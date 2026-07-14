import { ActionResponse, ScraperState, ScraperStatus, WebsiteApiSettings } from '../shared/types';

const API_URL_STORAGE_KEY = 'apiUrl';
const API_KEY_STORAGE_KEY = 'apiKey';

const stateLabels: Record<ScraperState, string> = {
  IDLE: 'Hazir',
  EXTRACTING: 'Taraniyor',
  PAUSED: 'Duraklatildi',
  STOPPED: 'Durduruldu',
  COMPLETE: 'Tamamlandi',
  ERROR: 'Hata'
};

let isSendingToWebsite = false;

document.addEventListener('DOMContentLoaded', () => {
  const startBtn = getButton('startBtn');
  const pauseBtn = getButton('pauseBtn');
  const resumeBtn = getButton('resumeBtn');
  const stopBtn = getButton('stopBtn');
  const exportBtn = getButton('exportBtn');
  const sendBtn = getButton('sendBtn');
  const clearBtn = getButton('clearBtn');
  const saveApiSettingsBtn = getButton('saveApiSettingsBtn');
  const apiUrlInput = getInput('apiUrlInput');
  const apiKeyInput = getInput('apiKeyInput');

  loadApiSettings(apiUrlInput, apiKeyInput);

  startBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await sendMessage({ type: 'START_SCRAPING', url: tab?.url || '' });
    } catch (error) {
      showNotification(`Tarama baslatilamadi: ${formatError(error)}`, 'error');
    } finally {
      updateStatus();
    }
  });

  pauseBtn.addEventListener('click', () => sendAndRefresh({ type: 'PAUSE_SCRAPING' }));
  resumeBtn.addEventListener('click', () => sendAndRefresh({ type: 'RESUME_SCRAPING' }));
  stopBtn.addEventListener('click', () => sendAndRefresh({ type: 'STOP_SCRAPING' }));
  exportBtn.addEventListener('click', () => handleExport());
  sendBtn.addEventListener('click', () => handleSendToWebsite(apiUrlInput, apiKeyInput, sendBtn));
  clearBtn.addEventListener('click', () => sendAndRefresh({ type: 'CLEAR_RECORDS' }));
  saveApiSettingsBtn.addEventListener('click', () => saveApiSettings(apiUrlInput, apiKeyInput));

  updateStatus();
  window.setInterval(updateStatus, 1000);
});

async function sendAndRefresh(message: unknown): Promise<void> {
  try {
    await sendMessage(message);
  } catch (error) {
    showNotification(`Islem basarisiz: ${formatError(error)}`, 'error');
  } finally {
    updateStatus();
  }
}

async function handleExport(): Promise<void> {
  try {
    const response = await sendMessage<ActionResponse>({ type: 'EXPORT_EXCEL' });
    showNotification(response.message, response.success ? 'success' : 'error');
  } catch (error) {
    showNotification(`Excel olusturulamadi: ${formatError(error)}`, 'error');
  } finally {
    updateStatus();
  }
}

async function handleSendToWebsite(
  apiUrlInput: HTMLInputElement,
  apiKeyInput: HTMLInputElement,
  sendBtn: HTMLButtonElement
): Promise<void> {
  const settings = readApiSettings(apiUrlInput, apiKeyInput);
  if (!settings.apiUrl || !settings.apiKey) {
    showNotification('API URL ve API anahtari girin.', 'warning');
    return;
  }

  isSendingToWebsite = true;
  sendBtn.disabled = true;
  showNotification('Kayitlar web sitesine aktariliyor...', 'loading');

  try {
    await setStoredApiSettings(settings);
    const response = await sendMessage<ActionResponse>({ type: 'SEND_TO_WEBSITE' });
    showNotification(response.message, response.success ? 'success' : response.status || 'error');
  } catch (error) {
    showNotification(`Kayitlar aktarilamadi: ${formatError(error)}`, 'network_failure');
  } finally {
    isSendingToWebsite = false;
    sendBtn.disabled = false;
    updateStatus();
  }
}

async function loadApiSettings(apiUrlInput: HTMLInputElement, apiKeyInput: HTMLInputElement): Promise<void> {
  const settings = await getStoredApiSettings();
  apiUrlInput.value = settings.apiUrl;
  apiKeyInput.value = settings.apiKey;
}

async function saveApiSettings(apiUrlInput: HTMLInputElement, apiKeyInput: HTMLInputElement): Promise<void> {
  const settings = readApiSettings(apiUrlInput, apiKeyInput);
  if (!settings.apiUrl || !settings.apiKey) {
    showNotification('API URL ve API anahtari bos birakilamaz.', 'warning');
    return;
  }

  await setStoredApiSettings(settings);
  showNotification('API ayarlari kaydedildi.', 'success');
}

function readApiSettings(apiUrlInput: HTMLInputElement, apiKeyInput: HTMLInputElement): WebsiteApiSettings {
  return {
    apiUrl: apiUrlInput.value.trim(),
    apiKey: apiKeyInput.value.trim()
  };
}

function updateStatus(): void {
  chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response?: ScraperStatus) => {
    if (!response) return;

    setText('statusEl', stateLabels[response.state] || response.state);
    setText('countEl', response.recordsCollected.toString());
    setText('pageEl', response.currentPage.toString());
    setText('elapsedEl', formatElapsed(response.elapsedMs));
    setText('lastActionEl', response.lastAction || 'Hazir');
    setText('currentUrlEl', response.currentUrl || 'Aktif sekme bekleniyor');

    const badge = document.getElementById('stateBadge');
    if (badge) {
      badge.textContent = stateLabels[response.state] || response.state;
      badge.dataset.state = response.state.toLocaleLowerCase('tr-TR');
    }

    setControls(response.state, response.recordsCollected);
  });
}

function setControls(state: ScraperState, recordsCollected: number): void {
  getButton('startBtn').disabled = state === 'EXTRACTING';
  getButton('pauseBtn').disabled = state !== 'EXTRACTING';
  getButton('resumeBtn').disabled = state !== 'PAUSED';
  getButton('stopBtn').disabled = state !== 'EXTRACTING' && state !== 'PAUSED';
  getButton('exportBtn').disabled = recordsCollected === 0;
  getButton('sendBtn').disabled = recordsCollected === 0 || isSendingToWebsite;
  getButton('clearBtn').disabled = recordsCollected === 0 || state === 'EXTRACTING';
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function getButton(id: string): HTMLButtonElement {
  return document.getElementById(id) as HTMLButtonElement;
}

function getInput(id: string): HTMLInputElement {
  return document.getElementById(id) as HTMLInputElement;
}

function setText(id: string, value: string): void {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function showNotification(
  message: string,
  kind: 'success' | 'loading' | 'warning' | 'error' | 'unauthorized' | 'network_failure'
): void {
  const element = document.getElementById('notificationEl');
  if (!element) return;
  element.textContent = message;
  element.dataset.kind = kind;
}

function getStoredApiSettings(): Promise<WebsiteApiSettings> {
  return new Promise((resolve) => {
    chrome.storage.local.get([API_URL_STORAGE_KEY, API_KEY_STORAGE_KEY], (items) => {
      resolve({
        apiUrl: typeof items[API_URL_STORAGE_KEY] === 'string' ? items[API_URL_STORAGE_KEY] : '',
        apiKey: typeof items[API_KEY_STORAGE_KEY] === 'string' ? items[API_KEY_STORAGE_KEY] : ''
      });
    });
  });
}

function setStoredApiSettings(settings: WebsiteApiSettings): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set(
      {
        [API_URL_STORAGE_KEY]: settings.apiUrl,
        [API_KEY_STORAGE_KEY]: settings.apiKey
      },
      () => resolve()
    );
  });
}

function sendMessage<TResponse = unknown>(message: unknown): Promise<TResponse> {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(message, (response?: TResponse) => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(error.message));
          return;
        }

        resolve(response as TResponse);
      });
    } catch (error) {
      reject(error);
    }
  });
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
