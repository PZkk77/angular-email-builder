import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BeefreeExampleComponent, BuilderType } from './beefree-example.component';

export type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  message: string;
  type: ToastType;
  title?: string;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, BeefreeExampleComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  toast = signal<ToastState | null>(null);
  toastVisible = signal(false);

  selectedBuilderType = signal<BuilderType>('emailBuilder');
  selectedBuilderLanguage = signal('en-US');

  private toastTimers: ReturnType<typeof setTimeout>[] = [];

  uiLanguages = [
    { label: 'en-US', value: 'en-US' },
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

  builderTypes = [
    { label: 'Email Builder', value: 'emailBuilder' },
    { label: 'Page Builder', value: 'pageBuilder' },
    { label: 'Popup Builder', value: 'popupBuilder' },
    { label: 'File Manager', value: 'fileManager' },
  ];

  showToast = (message: string, type: ToastType, title?: string, durationMs = 5000) => {
    this.toastTimers.forEach(t => clearTimeout(t));
    this.toastTimers = [];

    this.toast.set({ message, type, title });
    this.toastVisible.set(true);

    const dismissTimer = setTimeout(() => {
      this.toastVisible.set(false);
      const removeTimer = setTimeout(() => this.toast.set(null), 400);
      this.toastTimers.push(removeTimer);
    }, durationMs);
    this.toastTimers.push(dismissTimer);
  };

  ngOnInit() {
    this.showToast('Your Angular Beefree SDK app is up and running.', 'success', 'Congratulations!');
  }

  ngOnDestroy() {
    this.toastTimers.forEach(t => clearTimeout(t));
  }

  onBuilderTypeChange(event: Event) {
    this.selectedBuilderType.set((event.target as HTMLSelectElement).value as BuilderType);
  }

  onBuilderLanguageChange(event: Event) {
    this.selectedBuilderLanguage.set((event.target as HTMLSelectElement).value);
  }
}
