import { ComponentFixture, TestBed } from '@angular/core/testing'
import { PLATFORM_ID } from '@angular/core'
import { IToken, IBeeConfig, IEntityContentJson } from '@beefree.io/sdk/dist/types/bee'
import { BeefreeBuilder } from './builder'
import { BeefreeService } from '../beefree.service'
import { BEEFREE_SDK_FACTORY, BeefreeSDKFactory } from '../constants'

function createMockSDK(overrides: Record<string, unknown> = {}) {
  return {
    start: vi.fn().mockResolvedValue(undefined),
    join: vi.fn().mockResolvedValue(undefined),
    loadConfig: vi.fn().mockResolvedValue({}),
    ...overrides,
  }
}

describe('BeefreeBuilder', () => {
  let component: BeefreeBuilder
  let fixture: ComponentFixture<BeefreeBuilder>
  let service: BeefreeService
  let mockSDKInstance: ReturnType<typeof createMockSDK>
  let mockFactory: BeefreeSDKFactory

  const mockToken: IToken = { access_token: 'test-token', v2: true }
  const mockTemplate = {} as IEntityContentJson

  const mockConfig: IBeeConfig = {
    container: 'test-container',
    uid: 'test-uid',
  }

  beforeEach(async () => {
    mockSDKInstance = createMockSDK()
    mockFactory = vi.fn().mockReturnValue(mockSDKInstance) as unknown as BeefreeSDKFactory

    await TestBed.configureTestingModule({
      imports: [BeefreeBuilder],
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: BEEFREE_SDK_FACTORY, useValue: mockFactory },
      ],
    }).compileComponents()

    service = TestBed.inject(BeefreeService)
    fixture = TestBed.createComponent(BeefreeBuilder)
    component = fixture.componentInstance
  })

  afterEach(() => {
    fixture.destroy()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should render container div with default dimensions', () => {
    fixture.componentRef.setInput('token', mockToken)
    fixture.componentRef.setInput('config', mockConfig)
    fixture.componentRef.setInput('template', mockTemplate)
    fixture.detectChanges()

    const el = fixture.nativeElement.querySelector('#test-container')
    expect(el).toBeTruthy()
    expect(el.style.width).toBe('100%')
    expect(el.style.height).toBe('100%')
  })

  it('should render container div with custom dimensions', () => {
    fixture.componentRef.setInput('token', mockToken)
    fixture.componentRef.setInput('config', mockConfig)
    fixture.componentRef.setInput('template', mockTemplate)
    fixture.componentRef.setInput('width', '80%')
    fixture.componentRef.setInput('height', '600px')
    fixture.detectChanges()

    const el = fixture.nativeElement.querySelector('#test-container')
    expect(el.style.width).toBe('80%')
    expect(el.style.height).toBe('600px')
  })

  it('should use DEFAULT_CONTAINER when config has no container', () => {
    fixture.componentRef.setInput('token', mockToken)
    fixture.componentRef.setInput('config', {} as IBeeConfig)
    expect(component.container()).toBe('beefree-sdk-container')
  })

  it('should use config container when provided', () => {
    fixture.componentRef.setInput('token', mockToken)
    fixture.componentRef.setInput('config', { container: 'custom-id' })
    expect(component.container()).toBe('custom-id')
  })

  it('should emit bbError when uid is missing', () => {
    const errorSpy = vi.fn()
    component.bbError.subscribe(errorSpy)

    fixture.componentRef.setInput('token', mockToken)
    fixture.componentRef.setInput('config', { container: 'test-container' })
    fixture.componentRef.setInput('template', mockTemplate)
    fixture.detectChanges()

    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('uid') }),
    )
  })

  it('should emit bbError when token is falsy', () => {
    const errorSpy = vi.fn()
    component.bbError.subscribe(errorSpy)

    fixture.componentRef.setInput('token', null as unknown as IToken)
    fixture.componentRef.setInput('config', mockConfig)
    fixture.componentRef.setInput('template', mockTemplate)
    fixture.detectChanges()

    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('token') }),
    )
  })

  it('should have default input values', () => {
    expect(component.width()).toBe('100%')
    expect(component.height()).toBe('100%')
    expect(component.shared()).toBe(false)
    expect(component.sessionId()).toBeNull()
    expect(component.loaderUrl()).toBeNull()
    expect(component.bucketDir()).toBeUndefined()
    expect(component.template()).toBeNull()
  })

  it('should clean up on destroy', async () => {
    const unregisterSpy = vi.spyOn(service, 'unregisterInstance')
    fixture.componentRef.setInput('token', mockToken)
    fixture.componentRef.setInput('config', mockConfig)
    fixture.detectChanges()
    await new Promise((r) => setTimeout(r, 0))

    component.ngOnDestroy()

    expect(unregisterSpy).toHaveBeenCalledWith('test-container')
  })

  it('should not re-initialize when only width changes', async () => {
    fixture.componentRef.setInput('token', mockToken)
    fixture.componentRef.setInput('config', mockConfig)
    fixture.componentRef.setInput('template', mockTemplate)
    fixture.detectChanges()
    await new Promise((r) => setTimeout(r, 0))

    ;(mockFactory as ReturnType<typeof vi.fn>).mockClear()

    fixture.componentRef.setInput('width', '80%')
    fixture.detectChanges()

    expect(mockFactory).not.toHaveBeenCalled()
  })

  // --- Initialization via factory ---

  it('should create SDK instance via factory and call start', async () => {
    const registerSpy = vi.spyOn(service, 'registerInstance')
    fixture.componentRef.setInput('token', mockToken)
    fixture.componentRef.setInput('config', mockConfig)
    fixture.componentRef.setInput('template', mockTemplate)
    fixture.detectChanges()

    await new Promise((r) => setTimeout(r, 0))

    expect(mockFactory).toHaveBeenCalledWith(mockToken, expect.objectContaining({ beePluginUrl: expect.any(String) }))
    expect(mockSDKInstance.start).toHaveBeenCalled()
    expect(registerSpy).toHaveBeenCalledWith('test-container', expect.anything())
  })

  it('should use join path when shared and sessionId are set', async () => {
    const registerSpy = vi.spyOn(service, 'registerInstance')
    fixture.componentRef.setInput('token', mockToken)
    fixture.componentRef.setInput('config', mockConfig)
    fixture.componentRef.setInput('template', mockTemplate)
    fixture.componentRef.setInput('shared', true)
    fixture.componentRef.setInput('sessionId', 'session-abc')
    fixture.detectChanges()

    await new Promise((r) => setTimeout(r, 0))

    expect(mockSDKInstance.join).toHaveBeenCalledWith(
      expect.objectContaining({ container: 'test-container', uid: 'test-uid' }),
      'session-abc',
      undefined,
    )
    expect(mockSDKInstance.start).not.toHaveBeenCalled()
    expect(registerSpy).toHaveBeenCalledWith('test-container', expect.anything())
  })

  it('should call onError when start rejects', async () => {
    const errorSpy = vi.fn()
    mockSDKInstance.start = vi.fn().mockRejectedValue('sdk-failure')

    fixture.componentRef.setInput('token', mockToken)
    fixture.componentRef.setInput('config', { ...mockConfig, onError: errorSpy })
    fixture.componentRef.setInput('template', mockTemplate)
    fixture.detectChanges()

    await new Promise((r) => setTimeout(r, 0))

    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('sdk-failure') }),
    )
  })

  it('should call onError when join rejects', async () => {
    const errorSpy = vi.fn()
    mockSDKInstance.join = vi.fn().mockRejectedValue('join-failure')

    fixture.componentRef.setInput('token', mockToken)
    fixture.componentRef.setInput('config', { ...mockConfig, onError: errorSpy })
    fixture.componentRef.setInput('template', mockTemplate)
    fixture.componentRef.setInput('shared', true)
    fixture.componentRef.setInput('sessionId', 'session-abc')
    fixture.detectChanges()

    await new Promise((r) => setTimeout(r, 0))

    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('join-failure') }),
    )
  })

  it('should use empty object as template when template is null', async () => {
    fixture.componentRef.setInput('token', mockToken)
    fixture.componentRef.setInput('config', mockConfig)
    fixture.componentRef.setInput('template', null)
    fixture.detectChanges()

    await new Promise((r) => setTimeout(r, 0))

    expect(mockSDKInstance.start).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({}),
      undefined,
      expect.objectContaining({ shared: false }),
    )
  })

  it('should unregister existing instance before re-initializing', () => {
    const unregisterSpy = vi.spyOn(service, 'unregisterInstance')
    vi.spyOn(service, 'hasInstance').mockReturnValue(true)

    fixture.componentRef.setInput('token', mockToken)
    fixture.componentRef.setInput('config', mockConfig)
    fixture.componentRef.setInput('template', mockTemplate)
    fixture.detectChanges()

    expect(unregisterSpy).toHaveBeenCalledWith('test-container')
  })

  it('should clear container element content on re-initialization', async () => {
    fixture.componentRef.setInput('token', mockToken)
    fixture.componentRef.setInput('config', mockConfig)
    fixture.componentRef.setInput('template', mockTemplate)
    fixture.detectChanges()
    await new Promise((r) => setTimeout(r, 0))

    const el = fixture.nativeElement.querySelector('#test-container')
    el.innerHTML = '<div>old content</div>'

    fixture.componentRef.setInput('token', { ...mockToken })
    fixture.detectChanges()

    expect(el.innerHTML).toBe('')
  })

  it('should pass custom loaderUrl to the SDK factory', () => {
    fixture.componentRef.setInput('token', mockToken)
    fixture.componentRef.setInput('config', mockConfig)
    fixture.componentRef.setInput('template', mockTemplate)
    fixture.componentRef.setInput('loaderUrl', 'https://custom-loader.example.com')
    fixture.detectChanges()

    expect(mockFactory).toHaveBeenCalledWith(
      mockToken,
      expect.objectContaining({ beePluginUrl: 'https://custom-loader.example.com' }),
    )
  })

  // --- buildCallbackOverrides ---

  describe('buildCallbackOverrides', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let builderAny: any

    beforeEach(() => {
      builderAny = component
    })

    it('should create overrides for all SDK callbacks', () => {
      fixture.componentRef.setInput('token', mockToken)
      fixture.componentRef.setInput('config', mockConfig)

      const overrides = builderAny.buildCallbackOverrides(mockConfig)
      expect(overrides.onSave).toBeDefined()
      expect(overrides.onAutoSave).toBeDefined()
      expect(overrides.onStart).toBeDefined()
    })

    it('should call config callback when provided', () => {
      fixture.componentRef.setInput('token', mockToken)
      const configWithCb = { ...mockConfig, onSave: vi.fn() }
      fixture.componentRef.setInput('config', configWithCb)

      const overrides = builderAny.buildCallbackOverrides(configWithCb)
      overrides.onSave('json', 'html', null, 1, null)
      expect(configWithCb.onSave).toHaveBeenCalledWith('json', 'html', null, 1, null)
    })

    it('should emit with undefined for zero-arg callbacks', () => {
      const spy = vi.fn()
      component.bbStart.subscribe(spy)
      fixture.componentRef.setInput('token', mockToken)
      fixture.componentRef.setInput('config', mockConfig)

      const overrides = builderAny.buildCallbackOverrides(mockConfig)
      overrides.onStart()

      expect(spy).toHaveBeenCalledWith(undefined)
    })

    it('should emit single arg directly for one-arg callbacks', () => {
      const spy = vi.fn()
      component.bbAutoSave.subscribe(spy)
      fixture.componentRef.setInput('token', mockToken)
      fixture.componentRef.setInput('config', mockConfig)

      const overrides = builderAny.buildCallbackOverrides(mockConfig)
      overrides.onAutoSave('json-string')

      expect(spy).toHaveBeenCalledWith('json-string')
    })

    it('should emit args as array for multi-arg callbacks', () => {
      const spy = vi.fn()
      component.bbSave.subscribe(spy)
      fixture.componentRef.setInput('token', mockToken)
      fixture.componentRef.setInput('config', mockConfig)

      const overrides = builderAny.buildCallbackOverrides(mockConfig)
      overrides.onSave('json', 'html', null, 1, null)

      expect(spy).toHaveBeenCalledWith(['json', 'html', null, 1, null])
    })

    it('should call both config callback and output emitter', () => {
      const configSpy = vi.fn()
      const outputSpy = vi.fn()
      component.bbAutoSave.subscribe(outputSpy)
      const configWithCb = { ...mockConfig, onAutoSave: configSpy }
      fixture.componentRef.setInput('token', mockToken)
      fixture.componentRef.setInput('config', configWithCb)

      const overrides = builderAny.buildCallbackOverrides(configWithCb)
      overrides.onAutoSave('json-data')

      expect(configSpy).toHaveBeenCalledWith('json-data')
      expect(outputSpy).toHaveBeenCalledWith('json-data')
    })
  })

  // --- syncCallbacks ---

  describe('syncCallbacks', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let builderAny: any

    beforeEach(() => {
      builderAny = component
    })

    it('should call syncCallbacks on config-only change when editor is ready', async () => {
      fixture.componentRef.setInput('token', mockToken)
      fixture.componentRef.setInput('config', mockConfig)
      fixture.detectChanges()
      await new Promise((r) => setTimeout(r, 0))

      fixture.componentRef.setInput('config', { ...mockConfig, language: 'it-IT' })
      fixture.detectChanges()

      expect(mockSDKInstance.loadConfig).toHaveBeenCalled()
    })

    it('should forward 3001 error to config onWarning', async () => {
      const warningSpy = vi.fn()
      fixture.componentRef.setInput('token', mockToken)
      fixture.componentRef.setInput('config', mockConfig)
      fixture.detectChanges()
      await new Promise((r) => setTimeout(r, 0))

      builderAny.bee = { loadConfig: vi.fn().mockRejectedValue({ code: 3001 }) }
      const configWithWarning = { ...mockConfig, onWarning: warningSpy }
      fixture.componentRef.setInput('config', configWithWarning)
      fixture.detectChanges()

      await new Promise((r) => setTimeout(r, 0))
      expect(warningSpy).toHaveBeenCalledWith({ code: 3001 })
    })

    it('should forward non-3001 error to config onError', async () => {
      const errorSpy = vi.fn()
      fixture.componentRef.setInput('token', mockToken)
      fixture.componentRef.setInput('config', mockConfig)
      fixture.detectChanges()
      await new Promise((r) => setTimeout(r, 0))

      builderAny.bee = { loadConfig: vi.fn().mockRejectedValue({ code: 5000 }) }
      const configWithError = { ...mockConfig, onError: errorSpy }
      fixture.componentRef.setInput('config', configWithError)
      fixture.detectChanges()

      await new Promise((r) => setTimeout(r, 0))
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ code: 1000, message: expect.stringContaining('Error updating') }),
      )
    })
  })
})

describe('BeefreeBuilder (SSR)', () => {
  let component: BeefreeBuilder
  let fixture: ComponentFixture<BeefreeBuilder>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeefreeBuilder],
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: BEEFREE_SDK_FACTORY, useValue: vi.fn() },
      ],
    }).compileComponents()

    fixture = TestBed.createComponent(BeefreeBuilder)
    component = fixture.componentInstance
  })

  afterEach(() => {
    fixture.destroy()
  })

  it('should skip initialization on server platform', () => {
    const errorSpy = vi.fn()
    component.bbError.subscribe(errorSpy)
    fixture.detectChanges()

    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('should not access document on destroy in server platform', () => {
    fixture.detectChanges()
    expect(() => component.ngOnDestroy()).not.toThrow()
  })
})
