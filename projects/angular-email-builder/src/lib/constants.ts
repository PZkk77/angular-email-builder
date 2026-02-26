import { InjectionToken } from '@angular/core'
import BeefreeSDK from '@beefree.io/sdk'
import type { IToken, SDKOptions } from '@beefree.io/sdk/dist/types/bee'

export const DEFAULT_CONTAINER = 'beefree-sdk-container'
export const SDK_LOADER_URL = 'https://loader.getbee.io/v2/api/loader'

export type BeefreeSDKFactory = (token: IToken, options?: SDKOptions) => BeefreeSDK

/**
 * Injection token for the Beefree SDK factory function.
 *
 * The default factory creates a real `BeefreeSDK` instance.
 * Override this token in tests or to customize SDK instantiation:
 *
 * ```typescript
 * providers: [
 *   { provide: BEEFREE_SDK_FACTORY, useValue: (token, opts) => mockSdk }
 * ]
 * ```
 */
export const BEEFREE_SDK_FACTORY = new InjectionToken<BeefreeSDKFactory>(
  'BeefreeSDKFactory',
  {
    providedIn: 'root',
    factory: () => (token: IToken, options?: SDKOptions) => new BeefreeSDK(token, options),
  },
)
