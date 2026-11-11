import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { I18nService } from '../core/i18n';
import { Loan, Summary } from '../core/models';
import { errMsg } from '../core/util';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  template: `
    <div class="container page">
      <div class="page-head">
        <div>
          <h2>{{ i18n.t('dash.title') }}</h2>
          <p class="muted">{{ i18n.t('dash.hello', { name: auth.user()?.fullName ?? '' }) }}</p>
        </div>
        <div class="toolbar">
          <a routerLink="/loans" class="btn-yellow small">{{ i18n.t('dash.newLoan') }}</a>
          <a routerLink="/books" class="btn-ghost">{{ i18n.t('dash.manageBooks') }}</a>
          <a routerLink="/students" class="btn-ghost">{{ i18n.t('nav.students') }}</a>
        </div>
      </div>

      @if (error()) { <div class="alert err">{{ error() }}</div> }

      @if (summary(); as s) {
        <div class="stats">
          <div class="stat">
            <span class="ico">📚</span>
            <div><b>{{ s.totalBooks }}</b><span>{{ i18n.t('dash.stat.titles') }}</span></div>
          </div>
          <div class="stat">
            <span class="ico">📗</span>
            <div><b>{{ s.availableCopies }} / {{ s.totalCopies }}</b><span>{{ i18n.t('dash.stat.copies') }}</span></div>
          </div>
          <div class="stat">
            <span class="ico">🎓</span>
            <div><b>{{ s.totalStudents }}</b><span>{{ i18n.t('dash.stat.students') }}</span></div>
          </div>
          <div class="stat">
            <span class="ico">📖</span>
            <div><b>{{ s.activeLoans }}</b><span>{{ i18n.t('dash.stat.borrowed') }}</span></div>
          </div>
          <div class="stat danger">
            <span class="ico">⏰</span>
            <div><b>{{ s.overdueLoans }}</b><span>{{ i18n.t('dash.stat.overdue') }}</span></div>
          </div>
        </div>
      }

      <div class="two-col">
        <div>
          <h3>{{ i18n.t('dash.recent') }}</h3>
          <div class="card table-wrap">
            <table>
              <thead>
                <tr><th>{{ i18n.t('f.student') }}</th><th>{{ i18n.t('f.book') }}</th><th>{{ i18n.t('f.dueDate') }}</th></tr>
              </thead>
              <tbody>
                @for (l of recent(); track l.id) {
                  <tr>
                    <td>{{ l.studentName }}</td>
                    <td><b>{{ l.bookTitle }}</b></td>
                    <td>{{ l.dueDate }}</td>
                  </tr>
                } @empty {
                  <tr><td class="empty" colspan="3">{{ i18n.t('dash.noLoans') }}</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3>{{ i18n.t('dash.overdueTitle') }}</h3>
          <div class="card table-wrap">
            <table>
              <thead>
                <tr><th>{{ i18n.t('f.student') }}</th><th>{{ i18n.t('f.book') }}</th><th>{{ i18n.t('dash.delay') }}</th></tr>
              </thead>
              <tbody>
                @for (l of overdue(); track l.id) {
                  <tr>
                    <td>{{ l.studentName }}</td>
                    <td><b>{{ l.bookTitle }}</b></td>
                    <td><span class="badge danger">{{ i18n.t('ls.daysOnly', { n: l.daysOverdue }) }}</span></td>
                  </tr>
                } @empty {
                  <tr><td class="empty" colspan="3">{{ i18n.t('dash.noOverdue') }}</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardPage implements OnInit {
  auth = inject(AuthService);
  i18n = inject(I18nService);
  private api = inject(ApiService);

  summary = signal<Summary | null>(null);
  recent = signal<Loan[]>([]);
  overdue = signal<Loan[]>([]);
  error = signal('');

  ngOnInit() {
    this.api.getSummary().subscribe({
      next: (s) => this.summary.set(s),
      error: (e) => this.error.set(errMsg(e)),
    });
    this.api.getLoans().subscribe({
      next: (list) => this.recent.set([...list].sort((a, b) => b.id - a.id).slice(0, 5)),
      error: (e) => this.error.set(errMsg(e)),
    });
    this.api.getOverdueReport().subscribe({
      next: (list) => this.overdue.set(list.slice(0, 5)),
      error: (e) => this.error.set(errMsg(e)),
    });
  }
}
