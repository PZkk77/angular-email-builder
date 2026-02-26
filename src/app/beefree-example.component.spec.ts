import { ComponentFixture, TestBed } from '@angular/core/testing'
import { SimpleChange } from '@angular/core'
import { BeefreeExampleComponent } from './beefree-example.component'
import { BeefreeTokenService } from './beefree-token.service'
import { BeefreeService, BEEFREE_SDK_FACTORY } from '@beefree.io/angular-email-builder'
import type { IToken } from '@beefree.io/angular-email-builder'

const MOCK_TOKEN: IToken = { access_token: 'test-token', v2: true }

function createMockTokenService() {
  return {
    getBuilderToken: vi.fn().mockResolvedValue(MOCK_TOKEN),
  }
}

function createMockBeefreeService() {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    togglePreview: vi.fn(),
    saveAsTemplate: vi.fn(),
    load: vi.fn().mockResolvedValue(undefined),
    getTemplateJson: vi.fn().mockResolvedValue({ data: { json: {} } }),
    loadConfig: vi.fn(),
    setActiveInstance: vi.fn(),
    registerInstance: vi.fn(),
    unregisterInstance: vi.fn(),
    hasInstance: vi.fn().mockReturnValue(false),
  }
}

describe('BeefreeExampleComponent', () => {
  let component: BeefreeExampleComponent
  let fixture: ComponentFixture<BeefreeExampleComponent>
  let mockTokenService: ReturnType<typeof createMockTokenService>
  let mockBeefreeService: ReturnType<typeof createMockBeefreeService>
  let fetchSpy: ReturnType<typeof vi.fn>
  let originalFetch: typeof globalThis.fetch

  beforeEach(async () => {
    vi.spyOn(console, 'error').mockImplementation(() => { /* suppress expected errors */ })
    vi.spyOn(console, 'log').mockImplementation(() => { /* suppress expected logs */ })

    mockTokenService = createMockTokenService()
    mockBeefreeService = createMockBeefreeService()

    await TestBed.configureTestingModule({
      imports: [BeefreeExampleComponent],
      providers: [
        { provide: BeefreeTokenService, useValue: mockTokenService },
        { provide: BeefreeService, useValue: mockBeefreeService },
        { provide: BEEFREE_SDK_FACTORY, useValue: vi.fn().mockReturnValue({
          start: vi.fn().mockResolvedValue(undefined),
          join: vi.fn().mockResolvedValue(undefined),
          loadConfig: vi.fn().mockResolvedValue({}),
        })},
      ],
    }).compileComponents()

    originalFetch = globalThis.fetch
    fetchSpy = vi.fn()
    globalThis.fetch = fetchSpy

    fixture = TestBed.createComponent(BeefreeExampleComponent)
    component = fixture.componentInstance
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    fixture.destroy()
    vi.restoreAllMocks()
  })

  // --- Initialization ---

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should load token on init', async () => {
    await component.ngOnInit()
    expect(mockTokenService.getBuilderToken).toHaveBeenCalled()
    expect(component.beefreeToken()).toEqual(MOCK_TOKEN)
    expect(component.isLoadingToken()).toBe(false)
  })

  it('should set credentialsError on auth error', async () => {
    mockTokenService.getBuilderToken.mockRejectedValue(
      new Error('Authentication failed: 401 Unauthorized'),
    )
    await component.ngOnInit()
    expect(component.credentialsError()).toBe(true)
    expect(component.beefreeToken()).toBeNull()
  })

  it('should set tokenError on generic error', async () => {
    mockTokenService.getBuilderToken.mockRejectedValue(new Error('Network down'))
    await component.ngOnInit()
    expect(component.tokenError()).toContain('Failed to load')
    expect(component.credentialsError()).toBe(false)
  })

  it('should set tokenError on non-Error throw', async () => {
    mockTokenService.getBuilderToken.mockRejectedValue('string-error')
    await component.ngOnInit()
    expect(component.tokenError()).toContain('Failed to load')
  })

  // --- isAuthError ---

  it('should detect 4xx auth errors', async () => {
    mockTokenService.getBuilderToken.mockRejectedValue(
      new Error('Authentication failed: 403 Forbidden'),
    )
    await component.ngOnInit()
    expect(component.credentialsError()).toBe(true)
  })

  it('should detect 5xx auth errors', async () => {
    mockTokenService.getBuilderToken.mockRejectedValue(
      new Error('Authentication failed: 500 Internal'),
    )
    await component.ngOnInit()
    expect(component.credentialsError()).toBe(true)
  })

  it('should detect Invalid credentials errors', async () => {
    mockTokenService.getBuilderToken.mockRejectedValue(
      new Error('Invalid credentials: bad key'),
    )
    await component.ngOnInit()
    expect(component.credentialsError()).toBe(true)
  })

  it('should not flag non-auth errors as credentials errors', async () => {
    mockTokenService.getBuilderToken.mockRejectedValue(new Error('Timeout'))
    await component.ngOnInit()
    expect(component.credentialsError()).toBe(false)
    expect(component.tokenError()).toBeTruthy()
  })

  // --- refreshToken ---

  it('should reload token on refresh', async () => {
    await component.ngOnInit()
    mockTokenService.getBuilderToken.mockResolvedValue({ access_token: 'new', v2: true })
    await component.refreshToken()
    expect(component.beefreeToken()!.access_token).toBe('new')
  })

  // --- ngOnChanges ---

  it('should reload token when builderType changes (not first change)', async () => {
    await component.ngOnInit()
    mockTokenService.getBuilderToken.mockClear()

    await component.ngOnChanges({
      builderType: new SimpleChange('emailBuilder', 'pageBuilder', false),
    })

    expect(mockTokenService.getBuilderToken).toHaveBeenCalled()
  })

  it('should not reload token on first builderType change', async () => {
    await component.ngOnInit()
    mockTokenService.getBuilderToken.mockClear()

    await component.ngOnChanges({
      builderType: new SimpleChange(undefined, 'emailBuilder', true),
    })

    expect(mockTokenService.getBuilderToken).not.toHaveBeenCalled()
  })

  it('should update language and call loadConfig on language change', async () => {
    await component.ngOnInit()
    component.builderLanguage = 'it-IT'

    await component.ngOnChanges({
      builderLanguage: new SimpleChange('en-US', 'it-IT', false),
    })

    expect(mockBeefreeService.loadConfig).toHaveBeenCalledWith({ language: 'it-IT' })
  })

  it('should not call loadConfig on first language change', async () => {
    await component.ngOnInit()

    await component.ngOnChanges({
      builderLanguage: new SimpleChange(undefined, 'en-US', true),
    })

    expect(mockBeefreeService.loadConfig).not.toHaveBeenCalled()
  })

  it('should not call loadConfig when builder is not ready', async () => {
    component.builderLanguage = 'it-IT'

    await component.ngOnChanges({
      builderLanguage: new SimpleChange('en-US', 'it-IT', false),
    })

    expect(mockBeefreeService.loadConfig).not.toHaveBeenCalled()
  })

  // --- Builder actions ---

  it('should call togglePreview', async () => {
    await component.ngOnInit()
    await component.togglePreview()
    expect(mockBeefreeService.togglePreview).toHaveBeenCalled()
    expect(component.isExecuting()).toBe(false)
  })

  it('should call save', async () => {
    await component.ngOnInit()
    await component.save()
    expect(mockBeefreeService.save).toHaveBeenCalled()
  })

  it('should call saveAsTemplate', async () => {
    await component.ngOnInit()
    await component.saveAsTemplate()
    expect(mockBeefreeService.saveAsTemplate).toHaveBeenCalled()
  })

  it('should handle errors in executeBeefreeMethod', async () => {
    const notifySpy = vi.fn()
    component.onNotify = notifySpy
    mockBeefreeService.save.mockRejectedValue(new Error('save-fail'))

    await component.save()
    await new Promise((r) => setTimeout(r, 0))

    expect(notifySpy).toHaveBeenCalledWith('save-fail', 'error', 'Error')
    expect(component.isExecuting()).toBe(false)
  })

  it('should handle non-Error throws in executeBeefreeMethod', async () => {
    const notifySpy = vi.fn()
    component.onNotify = notifySpy
    mockBeefreeService.togglePreview.mockImplementation(() => {
      throw 'string-error'
    })

    await component.togglePreview()

    expect(notifySpy).toHaveBeenCalledWith('Unknown error', 'error', 'Error')
  })

  // --- loadSampleTemplate ---

  it('should load blank template when templateUrl is empty', async () => {
    await component.loadSampleTemplate()

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(mockBeefreeService.load).toHaveBeenCalledWith({})
    expect(component.isExecuting()).toBe(false)
  })

  it('should load sample template successfully when url is set', async () => {
    const { environment } = await import('../environments/environment')
    const origUrl = environment.emailBuilder.templateUrl
    environment.emailBuilder.templateUrl = 'https://example.com/template.json'

    const templateJson = { page: { rows: [] } }
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ json: templateJson }), { status: 200 }),
    )

    await component.loadSampleTemplate()

    expect(mockBeefreeService.load).toHaveBeenCalledWith(templateJson)
    expect(component.isExecuting()).toBe(false)
    environment.emailBuilder.templateUrl = origUrl
  })

  it('should fall back to raw json when no wrapper', async () => {
    const { environment } = await import('../environments/environment')
    const origUrl = environment.emailBuilder.templateUrl
    environment.emailBuilder.templateUrl = 'https://example.com/template.json'

    const rawJson = { page: { rows: [] } }
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify(rawJson), { status: 200 }),
    )

    await component.loadSampleTemplate()

    expect(mockBeefreeService.load).toHaveBeenCalledWith(rawJson)
    environment.emailBuilder.templateUrl = origUrl
  })

  it('should handle fetch failure in loadSampleTemplate', async () => {
    const { environment } = await import('../environments/environment')
    const origUrl = environment.emailBuilder.templateUrl
    environment.emailBuilder.templateUrl = 'https://example.com/template.json'

    const notifySpy = vi.fn()
    component.onNotify = notifySpy
    fetchSpy.mockResolvedValue(new Response('', { status: 404, statusText: 'Not Found' }))

    await component.loadSampleTemplate()

    expect(notifySpy).toHaveBeenCalledWith(
      expect.stringContaining('404'),
      'error',
      'Load failed',
    )
    environment.emailBuilder.templateUrl = origUrl
  })

  it('should handle network error in loadSampleTemplate', async () => {
    const { environment } = await import('../environments/environment')
    const origUrl = environment.emailBuilder.templateUrl
    environment.emailBuilder.templateUrl = 'https://example.com/template.json'

    const notifySpy = vi.fn()
    component.onNotify = notifySpy
    fetchSpy.mockRejectedValue(new Error('Network error'))

    await component.loadSampleTemplate()

    expect(notifySpy).toHaveBeenCalledWith('Network error', 'error', 'Load failed')
    environment.emailBuilder.templateUrl = origUrl
  })

  it('should handle non-Error in loadSampleTemplate', async () => {
    const { environment } = await import('../environments/environment')
    const origUrl = environment.emailBuilder.templateUrl
    environment.emailBuilder.templateUrl = 'https://example.com/template.json'

    const notifySpy = vi.fn()
    component.onNotify = notifySpy
    fetchSpy.mockRejectedValue('string-err')

    await component.loadSampleTemplate()

    expect(notifySpy).toHaveBeenCalledWith('Unknown error', 'error', 'Load failed')
    environment.emailBuilder.templateUrl = origUrl
  })

  // --- exportTemplateJson ---

  it('should export template as JSON download', async () => {
    const mockUrl = 'blob:http://localhost/abc'
    const origCreateObjectURL = URL.createObjectURL
    const origRevokeObjectURL = URL.revokeObjectURL
    URL.createObjectURL = vi.fn().mockReturnValue(mockUrl)
    URL.revokeObjectURL = vi.fn()

    const clickSpy = vi.fn()
    const origCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        return { href: '', download: '', click: clickSpy } as unknown as HTMLAnchorElement
      }
      return origCreateElement(tag)
    })

    mockBeefreeService.getTemplateJson.mockResolvedValue({ page: {} })

    await component.exportTemplateJson()

    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl)
    expect(component.isExecuting()).toBe(false)

    URL.createObjectURL = origCreateObjectURL
    URL.revokeObjectURL = origRevokeObjectURL
  })

  it('should handle error in exportTemplateJson', async () => {
    const notifySpy = vi.fn()
    component.onNotify = notifySpy
    mockBeefreeService.getTemplateJson.mockRejectedValue(new Error('export-fail'))

    await component.exportTemplateJson()

    expect(notifySpy).toHaveBeenCalledWith('export-fail', 'error', 'Export failed')
  })

  it('should handle non-Error in exportTemplateJson', async () => {
    const notifySpy = vi.fn()
    component.onNotify = notifySpy
    mockBeefreeService.getTemplateJson.mockRejectedValue(42)

    await component.exportTemplateJson()

    expect(notifySpy).toHaveBeenCalledWith('Unknown error', 'error', 'Export failed')
  })

  // --- setActiveInstance ---

  it('should delegate setActiveInstance to service', () => {
    component.setActiveInstance('container-1')
    expect(mockBeefreeService.setActiveInstance).toHaveBeenCalledWith('container-1')
  })

  // --- Co-editing ---

  it('should toggle co-editing on (start shared mode)', async () => {
    await component.ngOnInit()
    await component.toggleCoEditing()

    expect(component.isShared()).toBe(true)
  })

  it('should toggle co-editing off', async () => {
    await component.ngOnInit()

    await component.toggleCoEditing()
    expect(component.isShared()).toBe(true)

    await component.toggleCoEditing()
    expect(component.isShared()).toBe(false)
    expect(component.sessionId()).toBeNull()
    expect(component.secondToken()).toBeNull()
  })

  it('should capture current template when toggling co-editing with ready builder', async () => {
    await component.ngOnInit()
    const templateData = { page: { rows: [{ columns: [] }] } }
    mockBeefreeService.getTemplateJson.mockResolvedValue({
      data: { json: templateData },
    })

    await component.toggleCoEditing()

    expect(mockBeefreeService.getTemplateJson).toHaveBeenCalled()
    expect(component.currentTemplate()).toEqual(templateData)
  })

  it('should continue without template if getTemplateJson fails', async () => {
    await component.ngOnInit()
    mockBeefreeService.getTemplateJson.mockRejectedValue(new Error('fail'))

    await component.toggleCoEditing()

    expect(component.isShared()).toBe(true)
  })

  it('should discard stale toggle result', async () => {
    await component.ngOnInit()

    let resolveFirst!: (v: unknown) => void
    mockBeefreeService.getTemplateJson.mockReturnValueOnce(
      new Promise((r) => { resolveFirst = r }),
    )

    const firstToggle = component.toggleCoEditing()

    mockBeefreeService.getTemplateJson.mockResolvedValueOnce({ data: { json: { second: true } } })
    await component.toggleCoEditing()

    resolveFirst({ data: { json: { stale: true } } })
    await firstToggle

    expect(component.currentTemplate()).toEqual({ second: true })
  })

  it('should set sessionId and fetch second token on session started', async () => {
    await component.ngOnInit()

    component.onSessionStarted({ sessionId: 'sess-123' })

    await new Promise((r) => setTimeout(r, 0))

    expect(component.sessionId()).toBe('sess-123')
    expect(component.secondToken()).toEqual(MOCK_TOKEN)
  })

  it('should stop co-editing if second token fetch fails', async () => {
    await component.ngOnInit()
    component.isShared.set(true)
    mockTokenService.getBuilderToken.mockRejectedValue(new Error('fail'))

    component.onSessionStarted({ sessionId: 'sess-123' })
    await new Promise((r) => setTimeout(r, 0))

    expect(component.isShared()).toBe(false)
    expect(component.secondToken()).toBeNull()
  })

  // --- Divider drag ---

  it('should handle divider mouse down and move', () => {
    component.onDividerMouseDown(new MouseEvent('mousedown', { clientX: 100 }))
    expect(component.isDragging()).toBe(true)
  })

  it('should update split position on mouse move when buildersArea exists', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const compAny = component as any

    const mockEl = {
      nativeElement: {
        getBoundingClientRect: () => ({
          left: 0, width: 1000, top: 0, right: 1000, bottom: 500, height: 500,
          x: 0, y: 0, toJSON: () => ({}),
        }),
      },
    }
    compAny.buildersArea = () => mockEl

    compAny.onMouseMove(new MouseEvent('mousemove', { clientX: 300 }))
    expect(component.splitPosition()).toBe(30)

    compAny.onMouseMove(new MouseEvent('mousemove', { clientX: 50 }))
    expect(component.splitPosition()).toBe(25)

    compAny.onMouseMove(new MouseEvent('mousemove', { clientX: 900 }))
    expect(component.splitPosition()).toBe(75)
  })

  it('should guard onMouseMove when buildersArea is not available', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const compAny = component as any
    compAny.onMouseMove(new MouseEvent('mousemove', { clientX: 500 }))
    expect(component.splitPosition()).toBe(50)
  })

  it('should set up and clean up document listeners on mouse drag', () => {
    component.onDividerMouseDown(new MouseEvent('mousedown'))
    expect(component.isDragging()).toBe(true)
    expect(document.body.style.cursor).toBe('col-resize')
    expect(document.body.style.userSelect).toBe('none')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const compAny = component as any
    compAny.onMouseUp()
    expect(component.isDragging()).toBe(false)
    expect(document.body.style.cursor).toBe('')
    expect(document.body.style.userSelect).toBe('')
  })

  it('should handle ArrowLeft key on divider', () => {
    component.splitPosition.set(50)
    component.onDividerKeyDown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    expect(component.splitPosition()).toBe(48)
  })

  it('should handle ArrowRight key on divider', () => {
    component.splitPosition.set(50)
    component.onDividerKeyDown(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    expect(component.splitPosition()).toBe(52)
  })

  it('should clamp ArrowLeft at minimum 25', () => {
    component.splitPosition.set(25)
    component.onDividerKeyDown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    expect(component.splitPosition()).toBe(25)
  })

  it('should clamp ArrowRight at maximum 75', () => {
    component.splitPosition.set(75)
    component.onDividerKeyDown(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    expect(component.splitPosition()).toBe(75)
  })

  it('should ignore non-arrow keys on divider', () => {
    component.splitPosition.set(50)
    component.onDividerKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(component.splitPosition()).toBe(50)
  })

  // --- Config callbacks ---

  it('should call onNotify via clientConfig.onSave', () => {
    const notifySpy = vi.fn()
    component.onNotify = notifySpy

    component.clientConfig.onSave('json', 'html', null, 1, null)
    expect(notifySpy).toHaveBeenCalledWith(
      'Check console for details.', 'success', 'Design saved',
    )
  })

  it('should call onNotify via clientConfig.onSaveAsTemplate', () => {
    const notifySpy = vi.fn()
    component.onNotify = notifySpy

    component.clientConfig.onSaveAsTemplate('json', 1)
    expect(notifySpy).toHaveBeenCalledWith(
      'Check console for details.', 'success', 'Design saved as template',
    )
  })

  it('should call onNotify via clientConfig.onSend', () => {
    const notifySpy = vi.fn()
    component.onNotify = notifySpy

    component.clientConfig.onSend('<html></html>')
    expect(notifySpy).toHaveBeenCalledWith(
      'Check console for details.', 'success', 'Template sent',
    )
  })

  it('should call onNotify via clientConfig.onError', () => {
    const notifySpy = vi.fn()
    component.onNotify = notifySpy

    component.clientConfig.onError({ message: 'Something broke' })
    expect(notifySpy).toHaveBeenCalledWith('Something broke', 'error', 'Error')
  })

  it('should handle onError with no message', () => {
    const notifySpy = vi.fn()
    component.onNotify = notifySpy

    component.clientConfig.onError({} as never)
    expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining('{'), 'error', 'Error')
  })

  it('should call onNotify via coEditingConfig.onSave', () => {
    const notifySpy = vi.fn()
    component.onNotify = notifySpy

    component.coEditingConfig.onSave('json', 'html', null, 1, null)
    expect(notifySpy).toHaveBeenCalledWith(
      'Check console for details.', 'success', 'Design saved',
    )
  })

  it('should call onNotify via coEditingConfig.onSaveAsTemplate', () => {
    const notifySpy = vi.fn()
    component.onNotify = notifySpy

    component.coEditingConfig.onSaveAsTemplate('json', 1)
    expect(notifySpy).toHaveBeenCalledWith(
      'Check console for details.', 'success', 'Design saved as template',
    )
  })

  it('should call onNotify via coEditingConfig.onSend', () => {
    const notifySpy = vi.fn()
    component.onNotify = notifySpy

    component.coEditingConfig.onSend('<html></html>')
    expect(notifySpy).toHaveBeenCalledWith(
      'Check console for details.', 'success', 'Template sent',
    )
  })

  it('should call onNotify via coEditingConfig.onError', () => {
    const notifySpy = vi.fn()
    component.onNotify = notifySpy

    component.coEditingConfig.onError({ message: 'User 2 error' })
    expect(notifySpy).toHaveBeenCalledWith('User 2 error', 'error', 'Error')
  })

  // --- i18n / descriptionSegments ---

  it('should compute descriptionSegments with placeholders', () => {
    const segments = component.descriptionSegments()
    expect(segments.length).toBeGreaterThan(0)
    const boldSegment = segments.find((s) => s.style === 'bold')
    const codeSegment = segments.find((s) => s.style === 'code')
    expect(boldSegment).toBeTruthy()
    expect(codeSegment).toBeTruthy()
  })

  // --- Computed properties ---

  it('should compute builderReady correctly', async () => {
    expect(component.builderReady()).toBe(false)
    await component.ngOnInit()
    expect(component.builderReady()).toBe(true)
  })

  it('should compute builderHeight', () => {
    expect(component.builderHeight()).toBe('calc(100vh - 128px)')
  })

  it('should compute coEditingActive', async () => {
    expect(component.coEditingActive()).toBe(false)
    await component.ngOnInit()
    component.isShared.set(true)
    component.sessionId.set('sess')
    component.secondToken.set(MOCK_TOKEN)
    expect(component.coEditingActive()).toBe(true)
  })

  // --- builderType change stops co-editing ---

  it('should stop co-editing when builderType changes', async () => {
    await component.ngOnInit()
    component.isShared.set(true)
    component.sessionId.set('sess')
    component.secondToken.set(MOCK_TOKEN)

    await component.ngOnChanges({
      builderType: new SimpleChange('emailBuilder', 'pageBuilder', false),
    })

    expect(component.isShared()).toBe(false)
    expect(component.sessionId()).toBeNull()
  })

  it('should reset isExecuting when builderType changes', async () => {
    await component.ngOnInit()
    component.isExecuting.set(true)

    await component.ngOnChanges({
      builderType: new SimpleChange('emailBuilder', 'fileManager', false),
    })

    expect(component.isExecuting()).toBe(false)
  })

  // --- Coverage: edge branches ---

  it('should fall back to en-US i18n when language is unknown', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(component as any).selectedBuilderLanguage.set('xx-XX')
    const i18n = component.i18n()
    expect(i18n).toBeTruthy()
    expect(i18n.title).toBeDefined()
  })

  it('should skip getTemplateJson when builder is not ready during toggleCoEditing', async () => {
    await component.toggleCoEditing()

    expect(mockBeefreeService.getTemplateJson).not.toHaveBeenCalled()
    expect(component.isShared()).toBe(true)
  })

  it('should not reinitialize when beefreeToken is null', async () => {
    component.beefreeToken.set(null)
    component.isShared.set(true)

    await component.toggleCoEditing()

    expect(component.isShared()).toBe(false)
  })
})
