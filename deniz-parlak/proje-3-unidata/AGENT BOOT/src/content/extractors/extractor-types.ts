import { ScraperStatus } from '../../shared/types';

export interface ExtractorRuntime {
  canContinue(): boolean;
  delay(ms: number): Promise<void>;
  registerAbortController(controller: AbortController): void;
  unregisterAbortController(controller: AbortController): void;
  sendStatus(state: ScraperStatus['state'], lastAction: string): void;
}

export interface ExtractorStrategy {
  name: string;
  selectors: string[];
}
