/*
 * Public API Surface of @beefree.io/angular-email-builder
 */

// Components
export { BeefreeBuilder } from './lib/builder/builder'

// Service
export { BeefreeService } from './lib/beefree.service'

// Constants & Tokens
export { BEEFREE_SDK_FACTORY, DEFAULT_CONTAINER, SDK_LOADER_URL } from './lib/constants'
export type { BeefreeSDKFactory } from './lib/constants'

// SDK type re-exports
export type * from '@beefree.io/sdk/dist/types/bee'

// SDK runtime value re-exports (enums and consts)
export {
  StageModeOptions,
  StageDisplayOptions,
  SidebarTabs,
  ExecCommands,
  LoadWorkspaceOptions,
  BeePluginErrorCodes,
  OnInfoDetailHandle,
  ModuleTypes,
  ModuleDescriptorNames,
  ModuleDescriptorOrderNames,
  RowLayoutType,
  EngageHandle,
  OnCommentChangeEnum,
  WorkspaceStage,
  ContentCodes,
  ActionCodes,
  EventCodes,
  BeePluginRoles,
  TokenStatus,
  PREVIEW_CONTROL,
} from '@beefree.io/sdk/dist/types/bee'
