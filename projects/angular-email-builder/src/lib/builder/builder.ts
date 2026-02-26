import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  OnDestroy,
  output,
  PLATFORM_ID,
  untracked,
} from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import type BeefreeSDK from '@beefree.io/sdk'
import {
  BeePluginError,
  BeePluginInfo,
  BeePluginMessageEditDetail,
  BeePluginOnCommentPayload,
  IBeeConfig,
  IEntityContentJson,
  IEntityJson,
  IPluginSessionChangeInfo,
  IPluginSessionInfo,
  IToken,
  LoadWorkspaceOptions,
  ViewTypes,
} from '@beefree.io/sdk/dist/types/bee'
import { BEEFREE_SDK_FACTORY, DEFAULT_CONTAINER, SDK_LOADER_URL } from '../constants'
import { BeefreeService } from '../beefree.service'
import type { OutputEmitterRef } from '@angular/core'

/**
 * Maps SDK callback names (used in IBeeConfig) to Angular output property names.
 * Outputs use a "bb" (Beefree Builder) prefix to avoid collisions with native
 * DOM events and to clearly namespace the library's event bindings.
 */
const SDK_TO_OUTPUT: Record<string, string> = {
  onAutoSave: 'bbAutoSave',
  onChange: 'bbChange',
  onComment: 'bbComment',
  onError: 'bbError',
  onInfo: 'bbInfo',
  onLoad: 'bbLoad',
  onLoadWorkspace: 'bbLoadWorkspace',
  onPreview: 'bbPreview',
  onPreviewChange: 'bbPreviewChange',
  onRemoteChange: 'bbRemoteChange',
  onSave: 'bbSave',
  onSaveAsTemplate: 'bbSaveAsTemplate',
  onSaveRow: 'bbSaveRow',
  onSend: 'bbSend',
  onSessionChange: 'bbSessionChange',
  onSessionStarted: 'bbSessionStarted',
  onStart: 'bbStart',
  onTemplateLanguageChange: 'bbTemplateLanguageChange',
  onTogglePreview: 'bbTogglePreview',
  onViewChange: 'bbViewChange',
  onWarning: 'bbWarning',
}

/**
 * Primary Beefree SDK builder component.
 *
 * Wraps the Beefree SDK and provides Angular bindings for all builder types
 * (email, page, popup, file manager). The builder type is determined by the
 * SDK configuration, not by the component selector.
 *
 * Callbacks can be provided either as output event bindings or inside
 * the `config` object. When both are provided, both are invoked.
 */
@Component({
  selector: 'lib-beefree-builder',
  imports: [],
  template: `<div [id]="container()" [style.width]="width()" [style.height]="height()"></div>`,
  styleUrls: ['./builder.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BeefreeBuilder implements OnDestroy {
  // --- Inputs ---

  readonly token = input.required<IToken>()
  readonly template = input<IEntityContentJson | null>(null)
  readonly config = input<IBeeConfig>({ container: DEFAULT_CONTAINER })
  readonly width = input('100%')
  readonly height = input('100%')
  readonly shared = input(false)
  readonly sessionId = input<string | null>(null)
  readonly loaderUrl = input<string | null>(null)
  readonly bucketDir = input<string | undefined>(undefined)

  // --- Outputs ---
  // Prefixed with "bb" (Beefree Builder) to namespace the library's events.
  // e.g. (bbSave)="handleSave($event)" corresponds to IBeeConfig.onSave

  readonly bbAutoSave = output<string>()
  readonly bbChange = output<[string, BeePluginMessageEditDetail, number]>()
  readonly bbComment = output<[BeePluginOnCommentPayload, string]>()
  readonly bbError = output<BeePluginError>()
  readonly bbInfo = output<BeePluginInfo>()
  readonly bbLoad = output<IEntityJson>()
  readonly bbLoadWorkspace = output<LoadWorkspaceOptions>()
  readonly bbPreview = output<boolean>()
  readonly bbPreviewChange = output<unknown>()
  readonly bbRemoteChange = output<[string, BeePluginMessageEditDetail, number]>()
  readonly bbSave = output<[string, string, string | null, number, string | null]>()
  readonly bbSaveAsTemplate = output<[string, number]>()
  readonly bbSaveRow = output<[string, string, string]>()
  readonly bbSend = output<string>()
  readonly bbSessionChange = output<IPluginSessionChangeInfo>()
  readonly bbSessionStarted = output<IPluginSessionInfo>()
  readonly bbStart = output<void>()
  readonly bbTemplateLanguageChange = output<{ label: string; value: string; isMain: boolean }>()
  readonly bbTogglePreview = output<boolean>()
  readonly bbViewChange = output<ViewTypes>()
  readonly bbWarning = output<BeePluginError>()

  private bee: BeefreeSDK | null = null

  private editorReady = false
  private prevToken: IToken | null = null
  private platformId = inject(PLATFORM_ID)
  private beefreeService = inject(BeefreeService)
  private sdkFactory = inject(BEEFREE_SDK_FACTORY)

  readonly container = computed(
    () => (this.config()?.container as string) || DEFAULT_CONTAINER,
  )

  constructor() {
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return

      const token = this.token()
      const config = this.config()

      untracked(() => {
        const tokenChanged = token !== this.prevToken
        this.prevToken = token

        if (this.editorReady && !tokenChanged) {
          this.syncCallbacks(config)
        } else {
          this.initializeBeefree(token, config)
        }
      })
    })
  }

  ngOnDestroy(): void {
    this.beefreeService.unregisterInstance(this.container())
    if (isPlatformBrowser(this.platformId)) {
      const el = document.getElementById(this.container())
      if (el) {
        el.innerHTML = ''
      }
    }
    this.bee = null
    this.editorReady = false
  }

  private initializeBeefree(token: IToken, config: IBeeConfig): void {
    if (!token) {
      this.bbError.emit({ message: "Can't start the builder without a token" })
      return
    }

    if (!config.uid) {
      this.bbError.emit({ message: "Can't start the builder without a uid in the config" })
      return
    }

    const containerId = this.container()

    if (this.beefreeService.hasInstance(containerId)) {
      this.beefreeService.unregisterInstance(containerId)
    }

    const el = document.getElementById(containerId)
    if (el) {
      el.innerHTML = ''
    }

    this.editorReady = false
    this.bee = this.sdkFactory(token, {
      beePluginUrl: this.loaderUrl() ?? SDK_LOADER_URL,
    })

    const mergedConfig = this.buildMergedConfig(config)

    if (this.shared() && this.sessionId()) {
      this.bee
        .join(mergedConfig, this.sessionId()!, this.bucketDir())
        .then(() => this.handleStartupSuccess())
        .catch((err: unknown) => {
          mergedConfig.onError?.({
            message: `Error joining the shared session: ${err}`,
          })
        })
    } else {
      this.bee
        .start(mergedConfig, this.template() ?? ({} as IEntityContentJson), this.bucketDir(), {
          shared: this.shared(),
        })
        .then(() => this.handleStartupSuccess())
        .catch((err: unknown) => {
          mergedConfig.onError?.({
            message: `Error starting the builder: ${err}`,
          })
        })
    }
  }

  private handleStartupSuccess(): void {
    this.editorReady = true
    this.beefreeService.registerInstance(this.container(), this.bee!)
  }

  private syncCallbacks(config: IBeeConfig): void {
    const callbacks = this.buildCallbackOverrides(config)
    this.bee?.loadConfig?.(callbacks).catch((err: { code?: number }) => {
      if (err.code === 3001) {
        config.onWarning?.(err as never)
      } else {
        config.onError?.({ code: 1000, message: `Error updating builder config: ${err}` })
      }
    })
  }

  private buildMergedConfig(config: IBeeConfig): IBeeConfig {
    const callbacks = this.buildCallbackOverrides(config)
    return {
      ...config,
      container: this.container(),
      ...callbacks,
    }
  }

  private buildCallbackOverrides(config: IBeeConfig): Partial<IBeeConfig> {
    const overrides: Record<string, (...args: never[]) => void> = {}

    for (const [sdkName, outputName] of Object.entries(SDK_TO_OUTPUT)) {
      const emitter = (this as Record<string, unknown>)[outputName] as OutputEmitterRef<unknown>
      const configCb = config[sdkName as keyof IBeeConfig] as
        | ((...args: never[]) => void)
        | undefined

      overrides[sdkName] = (...args: never[]) => {
        configCb?.(...args)
        if (args.length === 0) emitter.emit(undefined)
        else if (args.length === 1) emitter.emit(args[0])
        else emitter.emit(args)
      }
    }

    return overrides as Partial<IBeeConfig>
  }
}
