import { TestBed } from '@angular/core/testing'
import { BeefreeTokenService } from './beefree-token.service'

describe('BeefreeTokenService', () => {
  let service: BeefreeTokenService
  let fetchSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    TestBed.configureTestingModule({})
    service = TestBed.inject(BeefreeTokenService)
    fetchSpy = vi.fn()
    globalThis.fetch = fetchSpy
  })

  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should return token on successful auth', async () => {
    const mockToken = { access_token: 'abc', v2: true }
    fetchSpy.mockResolvedValue(new Response(JSON.stringify(mockToken), { status: 200 }))

    const token = await service.getToken('client-id', 'client-secret', 'user-1')

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://auth.getbee.io/loginV2',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ client_id: 'client-id', client_secret: 'client-secret', uid: 'user-1' }),
      }),
    )
    expect(token).toEqual(mockToken)
  })

  it('should use default userId when not provided', async () => {
    fetchSpy.mockResolvedValue(new Response('{}', { status: 200 }))

    await service.getToken('cid', 'csec')

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('"uid":"user"'),
      }),
    )
  })

  it('should throw on network failure', async () => {
    fetchSpy.mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(service.getToken('cid', 'csec')).rejects.toThrow(
      'Authentication failed: unable to reach the authentication server',
    )
  })

  it('should throw on non-ok response with body', async () => {
    fetchSpy.mockResolvedValue(new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' }))

    await expect(service.getToken('cid', 'csec')).rejects.toThrow(
      'Authentication failed: 401 Unauthorized',
    )
  })

  it('should throw on non-ok response when body read fails', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: () => Promise.reject(new Error('read error')),
    } as unknown as Response
    fetchSpy.mockResolvedValue(mockResponse)

    await expect(service.getToken('cid', 'csec')).rejects.toThrow(
      'Authentication failed: 500 Internal Server Error',
    )
  })

  it('should delegate getBuilderToken to getToken', async () => {
    fetchSpy.mockResolvedValue(new Response('{"access_token":"t"}', { status: 200 }))
    const spy = vi.spyOn(service, 'getToken')

    await service.getBuilderToken('cid', 'csec', 'uid')

    expect(spy).toHaveBeenCalledWith('cid', 'csec', 'uid')
  })
})
