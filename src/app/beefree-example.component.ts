import { Component, computed, inject, signal, Input, OnInit, OnChanges, SimpleChanges, ElementRef, viewChild, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BeefreeBuilder, BeefreeService } from '@beefree.io/angular-email-builder';
import type { IToken, IEntityContentJson, BeePluginError } from '@beefree.io/angular-email-builder';
import { BeefreeTokenService } from './beefree-token.service';
import { environment } from '../environments/environment';
import type { ToastType } from './app';
import i18nEnUS from './i18n/en-US.json';
import i18nItIT from './i18n/it-IT.json';
import i18nEsES from './i18n/es-ES.json';
import i18nFrFR from './i18n/fr-FR.json';
import i18nDeDE from './i18n/de-DE.json';
import i18nPtBR from './i18n/pt-BR.json';
import i18nIdID from './i18n/id-ID.json';
import i18nJaJP from './i18n/ja-JP.json';
import i18nZhCN from './i18n/zh-CN.json';
import i18nZhHK from './i18n/zh-HK.json';
import i18nCsCZ from './i18n/cs-CZ.json';
import i18nNbNO from './i18n/nb-NO.json';
import i18nDaDK from './i18n/da-DK.json';
import i18nSvSE from './i18n/sv-SE.json';
import i18nPlPL from './i18n/pl-PL.json';
import i18nHuHU from './i18n/hu-HU.json';
import i18nRuRU from './i18n/ru-RU.json';
import i18nKoKR from './i18n/ko-KR.json';
import i18nNlNL from './i18n/nl-NL.json';
import i18nFiFI from './i18n/fi-FI.json';
import i18nRoRO from './i18n/ro-RO.json';
import i18nSlSI from './i18n/sl-SI.json';

export type BuilderType = 'emailBuilder' | 'pageBuilder' | 'popupBuilder' | 'fileManager';

interface TextSegment {
  text: string;
  style?: 'bold' | 'code';
}

@Component({
  selector: 'app-beefree-example',
  standalone: true,
  imports: [CommonModule, BeefreeBuilder],
  template: `
    <div class="beefree-example">
      @if (credentialsError()) {
        <div class="credentials-notice">
          <h2>{{ i18n().title }}</h2>
          <p>
            @for (segment of descriptionSegments(); track $index) {
              @if (segment.style === 'bold') {
                <strong>{{ segment.text }}</strong>
              } @else if (segment.style === 'code') {
                <code>{{ segment.text }}</code>
              } @else {
                {{ segment.text }}
              }
            }
          </p>
          <ol>
            <li><a href="https://developers.beefree.io/console" target="_blank" rel="noopener">{{ i18n().step1 }}</a></li>
            <li>{{ i18n().step2 }}</li>
            <li>{{ i18n().step3 }}</li>
          </ol>
          <p>{{ i18n().docs }} <a href="https://docs.beefree.io/get-started" target="_blank" rel="noopener">Getting Started guide</a>.</p>
          <button (click)="refreshToken()">{{ i18n().retry }}</button>
        </div>
      } @else if (isLoadingToken()) {
        <div class="loading">Loading {{ builderType }}...</div>
      } @else if (tokenError()) {
        <div class="error">
          <p>{{ tokenError() }}</p>
          <button (click)="refreshToken()">Retry</button>
        </div>
      } @else if (beefreeToken()) {
        <div class="builders-area" #buildersArea [class.co-editing]="isShared()">
          <div class="builder-panel"
            [style.width.%]="isShared() ? splitPosition() : 100"
            [class.dragging]="isDragging()"
            role="group" tabindex="0"
            (click)="setActiveInstance(clientConfig.container)"
            (keydown.enter)="setActiveInstance(clientConfig.container)">
            <ng-container *ngTemplateOutlet="instanceControls; context: { container: clientConfig.container }"></ng-container>
            <lib-beefree-builder
              [token]="beefreeToken()!"
              [template]="currentTemplate()"
              [width]="'100%'"
              [height]="builderHeight()"
              [config]="clientConfig"
              [shared]="isShared()"
              (bbSessionStarted)="onSessionStarted($event)" />
          </div>

          @if (isShared()) {
            <div class="split-divider"
              [class.dragging]="isDragging()"
              role="separator"
              aria-orientation="vertical"
              [attr.aria-valuenow]="splitPosition()"
              [attr.aria-valuemin]="25"
              [attr.aria-valuemax]="75"
              aria-label="Resize panels"
              tabindex="0"
              (mousedown)="onDividerMouseDown($event)"
              (keydown)="onDividerKeyDown($event)">
              <div class="split-divider-handle"></div>
            </div>
            <div class="builder-panel"
              [style.width.%]="100 - splitPosition()"
              [class.dragging]="isDragging()"
              role="group" tabindex="0"
              (click)="setActiveInstance(coEditingConfig.container)"
              (keydown.enter)="setActiveInstance(coEditingConfig.container)">
              <ng-container *ngTemplateOutlet="instanceControls; context: { container: coEditingConfig.container }"></ng-container>
              @if (secondToken() && sessionId()) {
                <lib-beefree-builder
                  [token]="secondToken()!"
                  [width]="'100%'"
                  [height]="builderHeight()"
                  [config]="coEditingConfig"
                  [shared]="true"
                  [sessionId]="sessionId()" />
              } @else {
                <div class="loading">Joining session...</div>
              }
            </div>
          }
        </div>
      }
    </div>

    <ng-template #instanceControls let-container="container">
      <div class="controls">
        <div class="button-group">
          <button (click)="setActiveInstance(container); togglePreview()" [disabled]="!builderReady() || isExecuting() || builderType === 'fileManager'">Preview</button>
          <button (click)="setActiveInstance(container); save()" [disabled]="!builderReady() || isExecuting() || builderType === 'fileManager'">Save</button>
          <button (click)="setActiveInstance(container); saveAsTemplate()" [disabled]="!builderReady() || isExecuting() || builderType === 'fileManager'">Save as Template</button>
          @if (!isShared()) {
            <button (click)="setActiveInstance(container); loadSampleTemplate()" [disabled]="!builderReady() || isExecuting() || builderType === 'fileManager'">Load Sample Template</button>
          }
          <button (click)="setActiveInstance(container); exportTemplateJson()" [disabled]="!builderReady() || isExecuting() || builderType === 'fileManager'">Export JSON</button>
        </div>
      </div>
    </ng-template>
  `,
  styleUrls: ['./beefree-example.component.scss'],
})
export class BeefreeExampleComponent implements OnInit, OnChanges {
  @Input() builderType: BuilderType = 'emailBuilder';
  @Input() builderLanguage = 'en-US';
  @Input() onNotify?: (message: string, type: ToastType, title?: string) => void;

  private beefreeTokenService = inject(BeefreeTokenService);
  private beefreeService = inject(BeefreeService);
  private destroyRef = inject(DestroyRef);

  private buildersArea = viewChild<ElementRef>('buildersArea');

  beefreeToken = signal<IToken | null>(null);
  isLoadingToken = signal(true);
  tokenError = signal<string | null>(null);
  credentialsError = signal(false);
  isExecuting = signal(false);
  private selectedBuilderLanguage = signal('en-US');
  builderReady = computed(() => !!this.beefreeToken() && !this.credentialsError() && !this.tokenError() && !this.isLoadingToken());

  // Co-editing state
  isShared = signal(false);
  sessionId = signal<string | null>(null);
  secondToken = signal<IToken | null>(null);
  coEditingActive = computed(() => this.isShared() && !!this.sessionId() && !!this.secondToken());
  private toggleGeneration = 0;
  currentTemplate = signal<IEntityContentJson | null>(null);

  // Split divider state
  splitPosition = signal(50);
  isDragging = signal(false);

  builderHeight = computed(() => 'calc(100vh - 128px)');

  defaultContentLanguage = { label: 'en-US', value: 'en-US' };

  additionalContentLanguages = [
    { label: 'it-IT', value: 'it-IT' },
    { label: 'es-ES', value: 'es-ES' },
    { label: 'fr-FR', value: 'fr-FR' },
    { label: 'de-DE', value: 'de-DE' },
    { label: 'pt-BR', value: 'pt-BR' },
    { label: 'id-ID', value: 'id-ID' },
    { label: 'ja-JP', value: 'ja-JP' },
    { label: 'zh-CN', value: 'zh-CN' },
    { label: 'zh-HK', value: 'zh-HK' },
    { label: 'cs-CZ', value: 'cs-CZ' },
    { label: 'nb-NO', value: 'nb-NO' },
    { label: 'da-DK', value: 'da-DK' },
    { label: 'sv-SE', value: 'sv-SE' },
    { label: 'pl-PL', value: 'pl-PL' },
    { label: 'hu-HU', value: 'hu-HU' },
    { label: 'ru-RU', value: 'ru-RU' },
    { label: 'ko-KR', value: 'ko-KR' },
    { label: 'nl-NL', value: 'nl-NL' },
    { label: 'fi-FI', value: 'fi-FI' },
    { label: 'ro-RO', value: 'ro-RO' },
    { label: 'sl-SI', value: 'sl-SI' },
  ];

  private i18nMap: Record<string, typeof i18nEnUS> = {
    'en-US': i18nEnUS,
    'it-IT': i18nItIT,
    'es-ES': i18nEsES,
    'fr-FR': i18nFrFR,
    'de-DE': i18nDeDE,
    'pt-BR': i18nPtBR,
    'id-ID': i18nIdID,
    'ja-JP': i18nJaJP,
    'zh-CN': i18nZhCN,
    'zh-HK': i18nZhHK,
    'cs-CZ': i18nCsCZ,
    'nb-NO': i18nNbNO,
    'da-DK': i18nDaDK,
    'sv-SE': i18nSvSE,
    'pl-PL': i18nPlPL,
    'hu-HU': i18nHuHU,
    'ru-RU': i18nRuRU,
    'ko-KR': i18nKoKR,
    'nl-NL': i18nNlNL,
    'fi-FI': i18nFiFI,
    'ro-RO': i18nRoRO,
    'sl-SI': i18nSlSI,
  };

  i18n = computed(() => (this.i18nMap[this.selectedBuilderLanguage()] ?? i18nEnUS).credentials);

  descriptionSegments = computed<TextSegment[]>(() => {
    const raw = this.i18n().description;
    const placeholderMap: Record<string, TextSegment> = {
      type: { text: this.builderType, style: 'bold' },
      clientId: { text: 'clientId', style: 'code' },
      clientSecret: { text: 'clientSecret', style: 'code' },
      envFile: { text: 'src/environments/environment.ts', style: 'code' },
    };

    const parts = raw.split(/\{(\w+)\}/);
    return parts
      .map((part, i) => (i % 2 === 1 && placeholderMap[part]) ? placeholderMap[part] : { text: part })
      .filter(s => s.text);
  });

  private handleBuilderError = (error: BeePluginError) => {
    console.error('Beefree error:', error);
    const msg = error.message || JSON.stringify(error);
    this.onNotify?.(msg, 'error', 'Error');
  };

  clientConfig = {
    uid: 'demo-user',
    container: 'beefree-sdk-builder',
    language: 'en-US',
    username: 'User 1',
    userColor: '#00aced',
    userHandle: 'user1',
    templateLanguage: this.defaultContentLanguage,
    templateLanguages: this.additionalContentLanguages,
    onSave: (_pageJson: string, _pageHtml: string, _ampHtml: string | null, _templateVersion: number, _language: string | null) => {
      console.log('onSave called:', { _pageJson, _pageHtml, _ampHtml, _templateVersion, _language });
      this.onNotify?.('Check console for details.', 'success', 'Design saved');
    },
    onSaveAsTemplate: (_pageJson: string, _templateVersion: number) => {
      console.log('onSaveAsTemplate called:', { _pageJson, _templateVersion });
      this.onNotify?.('Check console for details.', 'success', 'Design saved as template');
    },
    onSend: (htmlFile: string) => {
      console.log('onSend called:', htmlFile);
      this.onNotify?.('Check console for details.', 'success', 'Template sent');
    },
    onError: this.handleBuilderError,
  };

  coEditingConfig = {
    uid: 'demo-user-2',
    container: 'beefree-sdk-builder-2',
    language: 'en-US',
    username: 'User 2',
    userColor: '#000000',
    userHandle: 'user2',
    templateLanguage: this.defaultContentLanguage,
    templateLanguages: this.additionalContentLanguages,
    onSave: (_pageJson: string, _pageHtml: string, _ampHtml: string | null, _templateVersion: number, _language: string | null) => {
      console.log('onSave (User 2) called:', { _pageJson, _pageHtml, _ampHtml, _templateVersion, _language });
      this.onNotify?.('Check console for details.', 'success', 'Design saved');
    },
    onSaveAsTemplate: (_pageJson: string, _templateVersion: number) => {
      console.log('onSaveAsTemplate (User 2) called:', { _pageJson, _templateVersion });
      this.onNotify?.('Check console for details.', 'success', 'Design saved as template');
    },
    onSend: (htmlFile: string) => {
      console.log('onSend (User 2) called:', htmlFile);
      this.onNotify?.('Check console for details.', 'success', 'Template sent');
    },
    onError: this.handleBuilderError,
  };

  // --- Divider drag handlers ---

  private onMouseMove = (e: MouseEvent) => {
    const el = this.buildersArea()?.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    this.splitPosition.set(Math.min(75, Math.max(25, pct)));
  };

  private onMouseUp = () => {
    this.isDragging.set(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  };

  onDividerMouseDown(event: MouseEvent) {
    event.preventDefault();
    this.isDragging.set(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  onDividerKeyDown(event: KeyboardEvent) {
    const step = 2;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.splitPosition.set(Math.max(25, this.splitPosition() - step));
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.splitPosition.set(Math.min(75, this.splitPosition() + step));
    }
  }

  // --- Lifecycle ---

  async ngOnInit() {
    await this.loadBeefreeToken(this.builderType);
    this.destroyRef.onDestroy(() => {
      document.removeEventListener('mousemove', this.onMouseMove);
      document.removeEventListener('mouseup', this.onMouseUp);
    });
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['builderType'] && !changes['builderType'].firstChange) {
      this.isExecuting.set(false);
      this.stopCoEditing();
      await this.loadBeefreeToken(this.builderType);
    }

    if (changes['builderLanguage'] && !changes['builderLanguage'].firstChange) {
      this.selectedBuilderLanguage.set(this.builderLanguage);
      this.clientConfig.language = this.builderLanguage;
      this.coEditingConfig.language = this.builderLanguage;
      if (this.builderReady()) {
        this.beefreeService.loadConfig({ language: this.builderLanguage });
      }
    }
  }

  private isAuthError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    const msg = error.message;
    return /^Authentication failed: [45]\d{2}\b/.test(msg) || msg.startsWith('Invalid credentials:');
  }

  private async loadBeefreeToken(builderType: BuilderType) {
    try {
      this.isLoadingToken.set(true);
      this.tokenError.set(null);
      this.credentialsError.set(false);

      const token = await this.beefreeTokenService.getBuilderToken(
        environment[builderType].clientId,
        environment[builderType].clientSecret,
        environment[builderType].userId
      );

      this.beefreeToken.set(token);
    } catch (error) {
      console.error('Failed to load Beefree token:', error);
      if (this.isAuthError(error)) {
        this.credentialsError.set(true);
      } else {
        this.tokenError.set(`Failed to load ${builderType}. Please try again.`);
      }
    } finally {
      this.isLoadingToken.set(false);
    }
  }

  async refreshToken() {
    await this.loadBeefreeToken(this.builderType);
  }

  // --- Co-editing ---

  async toggleCoEditing() {
    const generation = ++this.toggleGeneration;

    if (this.builderReady()) {
      try {
        const result = await this.beefreeService.getTemplateJson();
        if (generation !== this.toggleGeneration) return;
        this.currentTemplate.set(
          (result as { data: { json: IEntityContentJson } }).data.json
        );
      } catch {
        // Continue without saved template
      }
    }

    if (this.isShared()) {
      this.stopCoEditing();
    } else {
      this.isShared.set(true);
    }
    this.reinitializeBuilder();
  }

  private reinitializeBuilder() {
    const token = this.beefreeToken();
    if (token) {
      this.beefreeToken.set({ ...token });
    }
  }

  onSessionStarted(event: unknown) {
    const { sessionId } = event as { sessionId: string };
    this.sessionId.set(sessionId);
    this.fetchSecondToken();
  }

  private async fetchSecondToken() {
    try {
      const token = await this.beefreeTokenService.getBuilderToken(
        environment[this.builderType].clientId,
        environment[this.builderType].clientSecret,
        'demo-user-2'
      );
      this.secondToken.set(token);
    } catch (error) {
      console.error('Failed to fetch second user token:', error);
      this.stopCoEditing();
    }
  }

  private stopCoEditing() {
    this.isShared.set(false);
    this.sessionId.set(null);
    this.secondToken.set(null);
    this.splitPosition.set(50);
  }

  setActiveInstance(containerId: string) {
    this.beefreeService.setActiveInstance(containerId);
  }

  // --- Proof-of-concept action buttons ---

  togglePreview() {
    this.executeBeefreeMethod(() => this.beefreeService.togglePreview());
  }

  save() {
    this.executeBeefreeMethod(() => this.beefreeService.save());
  }

  saveAsTemplate() {
    this.executeBeefreeMethod(() => this.beefreeService.saveAsTemplate());
  }

  async loadSampleTemplate() {
    try {
      this.isExecuting.set(true);
      const url = environment[this.builderType].templateUrl;

      let template: IEntityContentJson;
      if (url) {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to load template: ${response.status} ${response.statusText}`);
        }
        const json: IEntityContentJson = await response.json();
        template = (json as unknown as { json: IEntityContentJson }).json ?? json;
      } else {
        template = {} as IEntityContentJson;
      }

      await this.beefreeService.load(template);
    } catch (error) {
      console.error('Load failed:', error);
      this.onNotify?.(
        error instanceof Error ? error.message : 'Unknown error',
        'error',
        'Load failed'
      );
    } finally {
      this.isExecuting.set(false);
    }
  }

  async exportTemplateJson() {
    try {
      this.isExecuting.set(true);
      const json = await this.beefreeService.getTemplateJson();
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      this.onNotify?.(
        error instanceof Error ? error.message : 'Unknown error',
        'error',
        'Export failed'
      );
    } finally {
      this.isExecuting.set(false);
    }
  }

  private async executeBeefreeMethod(method: () => void | Promise<unknown>) {
    try {
      this.isExecuting.set(true);
      await method();
    } catch (error) {
      console.error('Beefree method error:', error);
      this.onNotify?.(
        error instanceof Error ? error.message : 'Unknown error',
        'error',
        'Error'
      );
    } finally {
      this.isExecuting.set(false);
    }
  }
}
