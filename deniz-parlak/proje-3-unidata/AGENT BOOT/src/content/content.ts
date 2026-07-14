import { ScraperStatus } from '../shared/types';
import { ExtractorFactory } from './extractors/extractor-factory';
import { ExtractorRuntime } from './extractors/extractor-types';
import { normalizeText } from './heuristics';

const PAGE_WAIT_MS = 1200;
const MAX_AUTO_PAGES = 120;

let isRunning = false;
let isPaused = false;
let processedPages = 0;

const activeTimers = new Set<number>();
const activeRequests = new Set<AbortController>();

const runtime: ExtractorRuntime = {
  canContinue,
  delay,
  registerAbortController(controller: AbortController) {
    activeRequests.add(controller);
  },
  unregisterAbortController(controller: AbortController) {
    activeRequests.delete(controller);
  },
  sendStatus
};

chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (status?: ScraperStatus) => {
  if (status?.state === 'EXTRACTING') {
    startExtraction();
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'BEGIN_EXTRACTION') {
    startExtraction();
    sendResponse({ success: true });
    return;
  }

  if (message.type === 'PAUSE_SCRAPING') {
    isPaused = true;
    clearTimers();
    sendResponse({ success: true });
    return;
  }

  if (message.type === 'RESUME_SCRAPING') {
    isPaused = false;
    startExtraction();
    sendResponse({ success: true });
    return;
  }

  if (message.type === 'STOP_SCRAPING') {
    stopLocally();
    sendResponse({ success: true });
  }
});

function startExtraction(): void {
  if (isRunning && !isPaused) return;
  if (!isRunning) {
    processedPages = 0;
    sessionStorage.removeItem('profileFetchCount');
  }

  isRunning = true;
  isPaused = false;
  runExtractionLoop().catch((error: unknown) => {
    isRunning = false;
    sendStatus('ERROR', `Hata oluştu: ${error instanceof Error ? error.message : String(error)}`);
  });
}

async function runExtractionLoop(): Promise<void> {
  while (isRunning && !isPaused && processedPages < MAX_AUTO_PAGES) {
    processedPages += 1;
    await waitForStableContent();
    if (!canContinue()) return;

    const extractor = ExtractorFactory.create(document, runtime);
    sendStatus('EXTRACTING', `${extractor.name} extractor ile sayfa ${processedPages} analiz ediliyor`);

    const records = await extractor.extractPage(window.location.href);
    if (!canContinue()) return;

    chrome.runtime.sendMessage({
      type: 'SAVE_RECORDS',
      data: records,
      currentUrl: window.location.href,
      currentPage: processedPages,
      lastAction: `${extractor.name}: ${records.length} kayıt işlendi`
    });

    sendStatus('EXTRACTING', `${extractor.name}: sonraki sayfa aranıyor`);
    const movedToNextPage = await extractor.goToNextPage();
    if (!movedToNextPage) {
      isRunning = false;
      sendStatus('COMPLETE', 'Tarama tamamlandı');
      return;
    }
  }

  if (processedPages >= MAX_AUTO_PAGES) {
    isRunning = false;
    sendStatus('COMPLETE', 'Güvenli sayfa sınırına ulaşıldı');
  }
}

async function waitForStableContent(): Promise<void> {
  let previousLength = 0;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (!canContinue()) return;
    const currentLength = normalizeText(document.body.textContent).length;
    if (currentLength > 300 && Math.abs(currentLength - previousLength) < 40) {
      return;
    }

    previousLength = currentLength;
    await delay(PAGE_WAIT_MS / 2);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      activeTimers.delete(timer);
      resolve();
    }, ms);
    activeTimers.add(timer);
  });
}

function clearTimers(): void {
  activeTimers.forEach((timer) => window.clearTimeout(timer));
  activeTimers.clear();
}

function canContinue(): boolean {
  return isRunning && !isPaused;
}

function stopLocally(): void {
  isRunning = false;
  isPaused = false;
  clearTimers();
  activeRequests.forEach((controller) => controller.abort());
  activeRequests.clear();
}

function sendStatus(state: ScraperStatus['state'], lastAction: string): void {
  chrome.runtime.sendMessage({
    type: 'STATUS_UPDATE',
    state,
    currentUrl: window.location.href,
    currentPage: processedPages,
    lastAction
  });
}
