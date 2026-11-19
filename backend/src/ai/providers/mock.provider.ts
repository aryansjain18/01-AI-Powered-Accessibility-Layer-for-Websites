import { DEFAULT_LANGUAGE } from '@studylens/shared';
import type { ProcessResult } from '@studylens/shared';
import type { AiProvider, ProviderRequest } from '../provider.interface';

/** Deterministic offline provider. Never calls the network. */
export class MockProvider implements AiProvider {
  readonly name = 'mock';
  readonly model = 'mock-model';

  async complete(req: ProviderRequest): Promise<ProcessResult> {
    return {
      text: `[mock:${req.action}] ${req.text}`,
      language: req.targetLanguage ?? DEFAULT_LANGUAGE,
      steps: [],
    };
  }
}