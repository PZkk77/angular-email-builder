import { TestBed } from '@angular/core/testing'
import { BeefreeService } from './beefree.service'
import BeefreeSDK from '@beefree.io/sdk'
import type { IEntityContentJson, ILoadStageMode, LoadWorkspaceOptions } from '@beefree.io/sdk/dist/types/bee'

function createMockBee(): BeefreeSDK {
  return {
    save: vi.fn().mockResolvedValue({ status: 'ok' }),
    saveAsTemplate: vi.fn().mockResolvedValue({ status: 'ok' }),
    preview: vi.fn(),
    toggleStructure: vi.fn(),
    togglePreview: vi.fn(),
    toggleComments: vi.fn(),
    toggleMergeTagsPreview: vi.fn(),
    showComment: vi.fn(),
    send: vi.fn(),
    load: vi.fn(),
    reload: vi.fn(),
    switchPreview: vi.fn(),
    loadConfig: vi.fn().mockResolvedValue({}),
    getConfig: vi.fn().mockReturnValue({ uid: 'test' }),
    loadWorkspace: vi.fn(),
    loadStageMode: vi.fn(),
    loadRows: vi.fn(),
    switchTemplateLanguage: vi.fn(),
    getTemplateJson: vi.fn().mockResolvedValue({ data: {} }),
    execCommand: vi.fn().mockReturnValue({ result: true }),
    updateToken: vi.fn(),
    join: vi.fn().mockResolvedValue(undefined),
    start: vi.fn().mockResolvedValue(undefined),
    startFileManager: vi.fn().mockResolvedValue(undefined),
  } as unknown as BeefreeSDK
}

describe('BeefreeService', () => {
  let service: BeefreeService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    service = TestBed.inject(BeefreeService)
  })

  afterEach(() => {
    for (const id of service.getInstanceIds()) {
      service.unregisterInstance(id)
    }
  })

  // --- Instance management ---

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should throw when no active instance', () => {
    expect(() => service.save()).toThrow('No active Beefree instance found')
  })

  it('should register and auto-activate first instance', () => {
    const bee = createMockBee()
    service.registerInstance('container-1', bee)
    expect(service.getActiveInstanceId()).toBe('container-1')
    expect(service.hasInstance('container-1')).toBe(true)
  })

  it('should not auto-activate subsequent instances', () => {
    service.registerInstance('c1', createMockBee())
    service.registerInstance('c2', createMockBee())
    expect(service.getActiveInstanceId()).toBe('c1')
  })

  it('should switch active instance', () => {
    service.registerInstance('c1', createMockBee())
    service.registerInstance('c2', createMockBee())

    service.setActiveInstance('c2')
    expect(service.getActiveInstanceId()).toBe('c2')
  })

  it('should warn on setting non-existent instance', () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    service.setActiveInstance('nonexistent')
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('nonexistent'))
    spy.mockRestore()
  })

  it('should fallback to remaining instance on unregister', () => {
    service.registerInstance('c1', createMockBee())
    service.registerInstance('c2', createMockBee())
    service.setActiveInstance('c1')

    service.unregisterInstance('c1')
    expect(service.getActiveInstanceId()).toBe('c2')
    expect(service.hasInstance('c1')).toBe(false)
  })

  it('should set active to null when last instance is unregistered', () => {
    service.registerInstance('c1', createMockBee())
    service.unregisterInstance('c1')
    expect(service.getActiveInstanceId()).toBeNull()
  })

  it('should not change active when unregistering a non-active instance', () => {
    service.registerInstance('c1', createMockBee())
    service.registerInstance('c2', createMockBee())
    expect(service.getActiveInstanceId()).toBe('c1')

    service.unregisterInstance('c2')
    expect(service.getActiveInstanceId()).toBe('c1')
  })

  it('should return all instance IDs', () => {
    service.registerInstance('a', createMockBee())
    service.registerInstance('b', createMockBee())
    expect(service.getInstanceIds()).toEqual(['a', 'b'])
  })

  it('should allow setting active instance to null', () => {
    service.registerInstance('c1', createMockBee())
    service.setActiveInstance(null)
    expect(service.getActiveInstanceId()).toBeNull()
  })

  it('should emit active instance changes via observable', () => {
    const emissions: (string | null)[] = []
    const sub = service.activeInstance$.subscribe((id) => emissions.push(id))

    service.registerInstance('c1', createMockBee())
    service.registerInstance('c2', createMockBee())
    service.setActiveInstance('c2')

    expect(emissions).toEqual([null, 'c1', 'c2'])
    sub.unsubscribe()
  })

  // --- SDK delegation methods ---

  it('should delegate save to active SDK instance', async () => {
    const bee = createMockBee()
    service.registerInstance('c1', bee)
    await service.save()
    expect(bee.save).toHaveBeenCalled()
  })

  it('should delegate save with options', async () => {
    const bee = createMockBee()
    service.registerInstance('c1', bee)
    await service.save({ status: 'draft' } as never)
    expect(bee.save).toHaveBeenCalledWith({ status: 'draft' })
  })

  it('should delegate saveAsTemplate', async () => {
    const bee = createMockBee()
    service.registerInstance('c1', bee)
    await service.saveAsTemplate()
    expect(bee.saveAsTemplate).toHaveBeenCalled()
  })

  it('should delegate send', () => {
    const bee = createMockBee()
    service.registerInstance('c1', bee)
    service.send({ language: 'en-US' })
    expect(bee.send).toHaveBeenCalledWith({ language: 'en-US' })
  })

  it('should delegate load', () => {
    const bee = createMockBee()
    service.registerInstance('c1', bee)
    const template = { page: {} } as IEntityContentJson
    service.load(template)
    expect(bee.load).toHaveBeenCalledWith(template)
  })

  it('should delegate reload', () => {
    const bee = createMockBee()
    service.registerInstance('c1', bee)
    const template = { page: {} } as IEntityContentJson
    service.reload(template, { shared: true })
    expect(bee.reload).toHaveBeenCalledWith(template, { shared: true })
  })

  it('should delegate preview', () => {
    const bee = createMockBee()
    service.registerInstance('c1', bee)
    service.preview()
    expect(bee.preview).toHaveBeenCalled()
  })

  it('should delegate switchPreview', () => {
    const bee = createMockBee()
    service.registerInstance('c1', bee)
    service.switchPreview({ language: 'it-IT' })
    expect(bee.switchPreview).toHaveBeenCalledWith({ language: 'it-IT' })
  })

  it('should delegate togglePreview', () => {
    const bee = createMockBee()
    service.registerInstance('c1', bee)
    service.togglePreview()
    expect(bee.togglePreview).toHaveBeenCalled()
  })

  it('should delegate toggleStructure', () => {
    const bee = createMockBee()
    service.registerInstance('c1', bee)
    service.toggleStructure()
    expect(bee.toggleStructure).toHaveBeenCalled()
  })

  it('should delegate toggleComments', () => {
    const bee = createMockBee()
    service.registerInstance('c1', bee)
    service.toggleComments()
    expect(bee.toggleComments).toHaveBeenCalled()
  })

  it('should delegate toggleMergeTagsPreview', () => {
    const bee = createMockBee()
    service.registerInstance('c1', bee)
    service.toggleMergeTagsPreview()
    expect(bee.toggleMergeTagsPreview).toHaveBeenCalled()
  })

  it('should delegate showComment', () => {
    const bee = createMockBee()
    service.registerInstance('c1', bee)
    const comment = { id: '123' }
    service.showComment(comment)
    expect(bee.showComment).toHaveBeenCalledWith(comment)
  })

  it('should delegate loadConfig', async () => {
    const bee = createMockBee()
    service.registerInstance('c1', bee)
    await service.loadConfig({ language: 'it-IT' })
    expect(bee.loadConfig).toHaveBeenCalledWith({ language: 'it-IT' }, undefined)
  })

  it('should delegate updateConfig (alias for loadConfig)', async () => {
    const bee = createMockBee()
    service.registerInstance('c1', bee)
    await service.updateConfig({ language: 'fr-FR' })
    expect(bee.loadConfig).toHaveBeenCalledWith({ language: 'fr-FR' }, undefined)
  })

  it('should delegate getConfig', () => {
    const bee = createMockBee()
    service.registerInstance('c1', bee)
    const config = service.getConfig()
    expect(bee.getConfig).toHaveBeenCalled()
    expect(config).toEqual({ uid: 'test' })
  })

  it('should delegate loadWorkspace', () => {
    const bee = createMockBee()
    service.registerInstance('c1', bee)
    service.loadWorkspace('default' as LoadWorkspaceOptions)
    expect(bee.loadWorkspace).toHaveBeenCalledWith('default')
  })

  it('should delegate loadStageMode', () => {
    const bee = createMockBee()
    service.registerInstance('c1', bee)
    const args = { stage: 'desktop' } as unknown as ILoadStageMode
    service.loadStageMode(args)
    expect(bee.loadStageMode).toHaveBeenCalledWith(args)
  })

  it('should delegate loadRows', () => {
    const bee = createMockBee()
    service.registerInstance('c1', bee)
    service.loadRows()
    expect(bee.loadRows).toHaveBeenCalled()
  })

  it('should delegate switchTemplateLanguage', () => {
    const bee = createMockBee()
    service.registerInstance('c1', bee)
    service.switchTemplateLanguage({ language: 'de-DE' })
    expect(bee.switchTemplateLanguage).toHaveBeenCalledWith({ language: 'de-DE' })
  })

  it('should delegate getTemplateJson', async () => {
    const bee = createMockBee()
    service.registerInstance('c1', bee)
    const result = await service.getTemplateJson()
    expect(bee.getTemplateJson).toHaveBeenCalled()
    expect(result).toEqual({ data: {} })
  })

  it('should delegate execCommand', () => {
    const bee = createMockBee()
    service.registerInstance('c1', bee)
    const result = service.execCommand('undo' as never)
    expect(bee.execCommand).toHaveBeenCalledWith('undo', undefined)
    expect(result).toEqual({ result: true })
  })

  it('should delegate updateToken', () => {
    const bee = createMockBee()
    service.registerInstance('c1', bee)
    const newToken = { access_token: 'new-token', v2: true as const }
    service.updateToken(newToken)
    expect(bee.updateToken).toHaveBeenCalledWith(newToken)
  })

  it('should delegate join', async () => {
    const bee = createMockBee()
    service.registerInstance('c1', bee)
    const config = { uid: 'user', container: 'c1' }
    await service.join(config, 'session-123', 'bucket/')
    expect(bee.join).toHaveBeenCalledWith(config, 'session-123', 'bucket/')
  })

  it('should delegate start', async () => {
    const bee = createMockBee()
    service.registerInstance('c1', bee)
    const config = { uid: 'user', container: 'c1' }
    const template = { page: {} } as IEntityContentJson
    await service.start(config, template, 'bucket/', { shared: true })
    expect(bee.start).toHaveBeenCalledWith(config, template, 'bucket/', { shared: true })
  })

  it('should delegate startFileManager', async () => {
    const bee = createMockBee()
    service.registerInstance('c1', bee)
    const config = { uid: 'user', container: 'c1' } as never
    await service.startFileManager(config, 'bucket/')
    expect(bee.startFileManager).toHaveBeenCalledWith(config, 'bucket/', undefined)
  })

  it('should operate on the correct instance after switching', () => {
    const bee1 = createMockBee()
    const bee2 = createMockBee()
    service.registerInstance('c1', bee1)
    service.registerInstance('c2', bee2)

    service.setActiveInstance('c2')
    service.preview()
    expect(bee2.preview).toHaveBeenCalled()
    expect(bee1.preview).not.toHaveBeenCalled()
  })
})
