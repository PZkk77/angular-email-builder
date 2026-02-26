import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { App } from './app'
import { BeefreeTokenService } from './beefree-token.service'
import { BeefreeService, BEEFREE_SDK_FACTORY } from '@beefree.io/angular-email-builder'

describe('App', () => {
  let component: App
  let fixture: ComponentFixture<App>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        {
          provide: BeefreeTokenService,
          useValue: { getBuilderToken: vi.fn().mockResolvedValue({ access_token: 't', v2: true }) },
        },
        {
          provide: BeefreeService,
          useValue: {
            save: vi.fn(), togglePreview: vi.fn(), saveAsTemplate: vi.fn(),
            load: vi.fn(), getTemplateJson: vi.fn(), loadConfig: vi.fn(),
            setActiveInstance: vi.fn(), registerInstance: vi.fn(),
            unregisterInstance: vi.fn(), hasInstance: vi.fn().mockReturnValue(false),
          },
        },
        {
          provide: BEEFREE_SDK_FACTORY,
          useValue: vi.fn().mockReturnValue({
            start: vi.fn().mockResolvedValue(undefined),
            join: vi.fn().mockResolvedValue(undefined),
            loadConfig: vi.fn().mockResolvedValue({}),
          }),
        },
      ],
    }).compileComponents()

    fixture = TestBed.createComponent(App)
    component = fixture.componentInstance
  })

  afterEach(() => {
    vi.useRealTimers()
    fixture.destroy()
  })

  it('should create the app', () => {
    expect(component).toBeTruthy()
  })

  it('should render header with logo', () => {
    fixture.detectChanges()
    const logo = fixture.nativeElement.querySelector('header img[alt="Beefree SDK"]')
    expect(logo).toBeTruthy()
  })

  it('should show toast on init', () => {
    fixture.detectChanges()
    expect(component.toast()).toEqual(
      expect.objectContaining({ type: 'success', title: 'Congratulations!' }),
    )
    expect(component.toastVisible()).toBe(true)
  })

  it('should dismiss toast after duration', () => {
    vi.useFakeTimers()
    fixture.detectChanges()
    expect(component.toastVisible()).toBe(true)

    vi.advanceTimersByTime(5000)
    expect(component.toastVisible()).toBe(false)

    vi.advanceTimersByTime(400)
    expect(component.toast()).toBeNull()
  })

  it('should clear previous timers when showing a new toast', () => {
    vi.useFakeTimers()
    fixture.detectChanges()

    component.showToast('second', 'info')
    expect(component.toast()!.message).toBe('second')

    vi.advanceTimersByTime(5000)
    expect(component.toastVisible()).toBe(false)
    vi.advanceTimersByTime(400)
    expect(component.toast()).toBeNull()
  })

  it('should update selectedBuilderType on change event', () => {
    const event = { target: { value: 'pageBuilder' } } as unknown as Event
    component.onBuilderTypeChange(event)
    expect(component.selectedBuilderType()).toBe('pageBuilder')
  })

  it('should update selectedBuilderLanguage on change event', () => {
    const event = { target: { value: 'it-IT' } } as unknown as Event
    component.onBuilderLanguageChange(event)
    expect(component.selectedBuilderLanguage()).toBe('it-IT')
  })

  it('should clear timers on destroy so callbacks do not fire', () => {
    vi.useFakeTimers()
    fixture.detectChanges()
    expect(component.toastVisible()).toBe(true)

    component.ngOnDestroy()

    vi.advanceTimersByTime(6000)
    expect(component.toastVisible()).toBe(true)
  })
})
