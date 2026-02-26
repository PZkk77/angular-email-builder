import { Injectable } from '@angular/core'
import { BehaviorSubject, Observable } from 'rxjs'
import BeefreeSDK from '@beefree.io/sdk'
import {
  BeeSaveOptions,
  ExecCommand,
  ExecCommands,
  IBeeConfig,
  IBeeConfigFileManager,
  IBeeOptions,
  IEntityContentJson,
  IExecCommandOptions,
  ILanguage,
  ILoadStageMode,
  ITemplateJson,
  IToken,
  LoadConfigOptions,
  LoadWorkspaceOptions,
  SaveAsTemplateResponse,
  SaveResponse,
  ILoadConfig,
} from '@beefree.io/sdk/dist/types/bee'

interface BeefreeInstance {
  bee: BeefreeSDK
}

/**
 * Service for managing and interacting with Beefree SDK builder instances.
 *
 * Instances are keyed by their container ID (matching the `config.container` value).
 * The first registered instance becomes the active one automatically.
 *
 * All SDK methods operate on the currently active instance. Use
 * `setActiveInstance()` to switch between multiple instances.
 */
@Injectable({
  providedIn: 'root',
})
export class BeefreeService {
  private instances = new Map<string, BeefreeInstance>()
  private activeInstanceId$ = new BehaviorSubject<string | null>(null)

  get activeInstance$(): Observable<string | null> {
    return this.activeInstanceId$.asObservable()
  }

  // --- Instance management ---

  registerInstance(containerId: string, bee: BeefreeSDK): void {
    this.instances.set(containerId, { bee })
    if (this.instances.size === 1) {
      this.setActiveInstance(containerId)
    }
  }

  unregisterInstance(containerId: string): void {
    this.instances.delete(containerId)
    if (this.activeInstanceId$.value === containerId) {
      const remaining = Array.from(this.instances.keys())
      this.setActiveInstance(remaining[0] ?? null)
    }
  }

  setActiveInstance(containerId: string | null): void {
    if (containerId && !this.instances.has(containerId)) {
      console.warn(`Beefree instance '${containerId}' not found`)
      return
    }
    this.activeInstanceId$.next(containerId)
  }

  getActiveInstanceId(): string | null {
    return this.activeInstanceId$.value
  }

  getInstanceIds(): string[] {
    return Array.from(this.instances.keys())
  }

  hasInstance(containerId: string): boolean {
    return this.instances.has(containerId)
  }

  // --- SDK methods (operate on active instance) ---

  private getActiveSDK(): BeefreeSDK {
    const id = this.activeInstanceId$.value
    const instance = id ? this.instances.get(id) : undefined
    if (!instance) {
      throw new Error('No active Beefree instance found')
    }
    return instance.bee
  }

  save(options?: BeeSaveOptions): Promise<SaveResponse> {
    return this.getActiveSDK().save(options)
  }

  saveAsTemplate(): Promise<SaveAsTemplateResponse> {
    return this.getActiveSDK().saveAsTemplate()
  }

  send(args?: ILanguage): void {
    return this.getActiveSDK().send(args)
  }

  load(template: IEntityContentJson): void {
    return this.getActiveSDK().load(template)
  }

  reload(template: IEntityContentJson, options?: IBeeOptions): void {
    return this.getActiveSDK().reload(template, options)
  }

  preview(): void {
    return this.getActiveSDK().preview()
  }

  switchPreview(args?: ILanguage): void {
    return this.getActiveSDK().switchPreview(args)
  }

  togglePreview(): void {
    return this.getActiveSDK().togglePreview()
  }

  toggleStructure(): void {
    return this.getActiveSDK().toggleStructure()
  }

  toggleComments(): void {
    return this.getActiveSDK().toggleComments()
  }

  toggleMergeTagsPreview(): void {
    return this.getActiveSDK().toggleMergeTagsPreview()
  }

  showComment(comment: unknown): void {
    return this.getActiveSDK().showComment(comment)
  }

  loadConfig(args: ILoadConfig, options?: LoadConfigOptions): Promise<IBeeConfig> {
    return this.getActiveSDK().loadConfig(args, options)
  }

  updateConfig(partialConfig: ILoadConfig, options?: LoadConfigOptions): Promise<IBeeConfig> {
    return this.getActiveSDK().loadConfig(partialConfig, options)
  }

  getConfig(): IBeeConfig {
    return this.getActiveSDK().getConfig()
  }

  loadWorkspace(type: LoadWorkspaceOptions): void {
    return this.getActiveSDK().loadWorkspace(type)
  }

  loadStageMode(args: ILoadStageMode): void {
    return this.getActiveSDK().loadStageMode(args)
  }

  loadRows(): void {
    return this.getActiveSDK().loadRows()
  }

  switchTemplateLanguage(args: ILanguage): void {
    return this.getActiveSDK().switchTemplateLanguage(args)
  }

  getTemplateJson(): Promise<ITemplateJson> {
    return this.getActiveSDK().getTemplateJson()
  }

  execCommand(command: ExecCommands, options?: IExecCommandOptions): ExecCommand {
    return this.getActiveSDK().execCommand(command, options)
  }

  updateToken(updateTokenArgs: IToken): void {
    return this.getActiveSDK().updateToken(updateTokenArgs)
  }

  join(config: IBeeConfig, sessionId: string, bucketDir?: string): Promise<unknown> {
    return this.getActiveSDK().join(config, sessionId, bucketDir)
  }

  start(
    config: IBeeConfig,
    template: IEntityContentJson | object,
    bucketDir?: string,
    options?: IBeeOptions,
  ): Promise<unknown> {
    return this.getActiveSDK().start(config, template, bucketDir, options)
  }

  startFileManager(config: IBeeConfigFileManager, bucketDir?: string, options?: IBeeOptions): Promise<unknown> {
    return this.getActiveSDK().startFileManager(config, bucketDir, options)
  }
}
