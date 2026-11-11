import { Component, inject, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { I18nService } from '../core/i18n';

// A password field with an eye button that shows or hides the password
@Component({
  selector: 'app-password-input',
  imports: [FormsModule],
  template: `
    <div class="pw">
      <input [type]="visible() ? 'text' : 'password'" [name]="name()" [ngModel]="value()"
             (ngModelChange)="value.set($event)" (keyup.enter)="enter.emit()"
             [attr.autocomplete]="autocomplete()" />
      <button type="button" class="eye" (click)="visible.set(!visible())"
              [title]="visible() ? i18n.t('pw.hide') : i18n.t('pw.show')"
              [attr.aria-label]="visible() ? i18n.t('pw.hide') : i18n.t('pw.show')">
        @if (visible()) {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
            <circle cx="12" cy="12" r="3" />
            <line x1="3" y1="3" x2="21" y2="21" />
          </svg>
        } @else {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        }
      </button>
    </div>
  `,
})
export class PasswordInput {
  i18n = inject(I18nService);

  value = model('');
  name = input('password');
  autocomplete = input('new-password');
  enter = output<void>();
  visible = signal(false);
}
