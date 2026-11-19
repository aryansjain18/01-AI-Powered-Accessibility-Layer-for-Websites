import { DEFAULT_LANGUAGE } from '@studylens/shared';
import type { ProcessResult } from '@studylens/shared';
import type { AiProvider, ProviderRequest } from '../provider.interface';
import { validateResult } from '../validation/result.validation';

/** Deterministic offline provider. Never calls the network. Passes the same validator. */
export class MockProvider implements AiProvider {
  readonly name = 'mock';
  readonly model = 'mock-model';

  async complete(req: ProviderRequest): Promise<ProcessResult> {
    const raw = {
      text: `Simplified: ${req.text}`,
      steps: [],
      caveats: ['This is a mock response. Set AI_PROVIDER=groq for real simplification.'],
    };
    return validateResult(raw, req.targetLanguage ?? DEFAULT_LANGUAGE);
  }
}