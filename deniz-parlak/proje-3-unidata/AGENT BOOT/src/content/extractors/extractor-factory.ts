import { BaseExtractor } from './base-extractor';
import { AvesisExtractor } from './avesis-extractor';
import { GenericUniversityExtractor } from './generic-university-extractor';
import { ExtractorRuntime } from './extractor-types';

export class ExtractorFactory {
  static create(documentRef: Document, runtime: ExtractorRuntime): BaseExtractor {
    if (AvesisExtractor.canHandle(documentRef)) {
      return new AvesisExtractor(documentRef, runtime);
    }

    return new GenericUniversityExtractor(documentRef, runtime);
  }
}
