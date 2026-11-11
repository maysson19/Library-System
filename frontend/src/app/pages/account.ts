import { Component, OnInit, inject, signal } from '@angular/core';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { I18nService } from '../core/i18n';
import { Loan } from '../core/models';
import { NotificationService } from '../core/notification.service';
import { errMsg } from '../core/util';
import { PasswordInput } from '../shared/password-input';

@Component({
  selector: 'app-account',
  imports: [PasswordInput],
  template: `
    <div class="container page">
      <div class="page-head">
        <div>
          <h2>{{ i18n.t('account.title') }}</h2>
          <p class="muted">{{ i18n.t(isStudent() ? 'account.subStudent' : 'account.sub') }}</p>
        </div>
      </div>

      <div class="two-col">
        <div class="card">
          <h3>{{ i18n.t('account.info') }}</h3>
          <dl class="kv">
            <dt>{{ i18n.t('f.name') }}</dt><dd>{{ auth.user()?.fullName }}</dd>
            <dt>{{ i18n.t('f.username') }}</dt><dd>{{ auth.user()?.username }}</dd>
            <dt>{{ i18n.t('f.role') }}</dt><dd>{{ roleLabel() }}</dd>
          </dl>
        </div>

        <div class="card">
          <h3>{{ i18n.t('account.changePw') }}</h3>
          @if (message()) { <div class="alert ok">{{ message() }}</div> }
          @if (error()) { <div class="alert err">{{ error() }}</div> }

          <label>{{ i18n.t('account.oldPw') }}</label>
          <app-password-input name="old-pass" autocomplete="current-password" [(value)]="oldPassword" />
          <label>{{ i18n.t('account.newPw') }}</label>
          <app-password-input name="new-pass" [(value)]="newPassword" />
          <label>{{ i18n.t('account.confirmPw') }}</label>
          <app-password-input name="confirm-pass" [(value)]="confirmPassword" />
          <div class="actions">
            <button class="primary" (click)="changePassword()">{{ i18n.t('c.save') }}</button>
          </div>
        </div>
      </div>

      @if (isStudent()) {
        <h3 style="margin: 8px 0 12px">{{ i18n.t('account.myLoans') }}</h3>
        @if (loanMessage()) { <div class="alert ok">{{ loanMessage() }}</div> }
        @if (loansError()) { <div class="alert err">{{ loansError() }}</div> }
        <div class="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>{{ i18n.t('f.book') }}</th><th>{{ i18n.t('f.borrowDate') }}</th>
                <th>{{ i18n.t('f.dueDate') }}</th><th>{{ i18n.t('c.status') }}</th><th>{{ i18n.t('account.loanActions') }}</th>
              </tr>
            </thead>
            <tbody>
              @for (l of loans(); track l.id) {
                <tr>
                  <td><b>{{ l.bookTitle }}</b></td>
                  <td>{{ l.borrowDate }}</td>
                  <td>{{ l.dueDate }}</td>
                  <td>
                    @if (l.status === 'RETURNED') { <span class="badge gray">{{ i18n.t('ls.returnedOn', { d: l.returnDate ?? '' }) }}</span> }
                    @else if (l.overdue) { <span class="badge danger">{{ i18n.t('ls.overdueDays', { n: l.daysOverdue }) }}</span> }
                    @else { <span class="badge warn">{{ i18n.t('ls.borrowed') }}</span> }
                  </td>
                  <td>
                    @if (l.status === 'BORROWED') {
                      <button class="small primary" (click)="requestReturn(l)">{{ i18n.t('req.returnBtn') }}</button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td class="empty" colspan="5">{{ i18n.t('account.noLoans') }}</td></tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class AccountPage implements OnInit {
  auth = inject(AuthService);
  i18n = inject(I18nService);
  private api = inject(ApiService);
  private notif = inject(NotificationService);

  loans = signal<Loan[]>([]);
  message = signal('');
  error = signal('');
  loanMessage = signal('');
  loansError = signal('');

  oldPassword = '';
  newPassword = '';
  confirmPassword = '';

  isStudent() {
    return this.auth.role() === 'STUDENT';
  }

  roleLabel() {
    const r = this.auth.role();
    return r ? this.i18n.t('role.' + r) : '';
  }

  ngOnInit() {
    if (this.isStudent()) this.loadLoans();
  }

  loadLoans() {
    this.api.getMyLoans().subscribe({
      next: (list) => this.loans.set(list),
      error: (e) => this.loansError.set(errMsg(e)),
    });
  }

  // The student asks to return the book, the librarian confirms the receipt
  requestReturn(l: Loan) {
    this.loanMessage.set('');
    this.loansError.set('');
    this.api.requestReturn(l.id).subscribe({
      next: () => {
        this.loanMessage.set(this.i18n.t('req.returnSent'));
        this.notif.refresh();
      },
      error: (e) => this.loansError.set(errMsg(e)),
    });
  }

  changePassword() {
    this.message.set('');
    if (!this.oldPassword || !this.newPassword) {
      this.error.set(this.i18n.t('account.enterBoth'));
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.error.set(this.i18n.t('account.mismatch'));
      return;
    }
    this.api.changePassword(this.oldPassword, this.newPassword).subscribe({
      next: () => {
        this.error.set('');
        this.message.set(this.i18n.t('account.changed'));
        this.oldPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: (e) => this.error.set(errMsg(e)),
    });
  }
}
