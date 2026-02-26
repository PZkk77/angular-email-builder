import { TestBed } from '@angular/core/testing'
import { BEEFREE_SDK_FACTORY } from './constants'

vi.mock('@beefree.io/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    start: vi.fn().mockResolvedValue(undefined),
    join: vi.fn().mockResolvedValue(undefined),
    loadConfig: vi.fn().mockResolvedValue({}),
  })),
}))

describe('BEEFREE_SDK_FACTORY default', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({})
  })

  it('should create a BeefreeSDK instance via the default factory', () => {
    const factory = TestBed.inject(BEEFREE_SDK_FACTORY)
    const sdk = factory({ access_token: 'test', v2: true })
    expect(sdk).toBeTruthy()
    expect(sdk.start).toBeDefined()
  })
})
