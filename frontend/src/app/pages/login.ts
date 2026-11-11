import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { I18nService } from '../core/i18n';
import { errMsg } from '../core/util';
import { PasswordInput } from '../shared/password-input';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, PasswordInput],
  template: `
    <div class="container narrow">
      <div class="login-card">
        <h2>{{ i18n.t('login.title') }}</h2>
        <p class="sub">{{ i18n.t('login.sub') }}</p>

        @if (error()) {
          <div class="alert err">{{ error() }}</div>
        }

        <label>{{ i18n.t('f.username') }}</label>
        <input type="text" name="lib-user" [(ngModel)]="username" (keyup.enter)="submit()" autocomplete="off" />

        <label>{{ i18n.t('f.password') }}</label>
        <app-password-input name="lib-pass" [(value)]="password" (enter)="submit()" />

        <button class="primary block go" (click)="submit()" [disabled]="loading()">
          {{ loading() ? i18n.t('login.loading') : i18n.t('login.submit') }}
        </button>
        <a routerLink="/" class="btn-outline">{{ i18n.t('login.back') }}</a>
      </div>
    </div>
  `,
})
export class LoginPage {
  i18n = inject(I18nService);
  private auth = inject(AuthService);
  private router = inject(Router);

  username = '';
  password = '';
  error = signal('');
  loading = signal(false);

  submit() {
    if (!this.username || !this.password) {
      this.error.set(this.i18n.t('login.enterBoth'));
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate([this.auth.isStaff() ? '/dashboard' : '/']);
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(errMsg(e));
      },
    });
  }
}
