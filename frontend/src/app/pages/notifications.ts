import { Component, OnInit, inject, signal } from '@angular/core';
import { ApiService } from '../core/api.service';
import { I18nService } from '../core/i18n';
import { LoanRequest } from '../core/models';
import { NotificationService } from '../core/notification.service';
import { errMsg } from '../core/util';

// Student: the status of my requests and the librarian answers
@Component({
  selector: 'app-notifications',
  template: `
    <div class="container page">
      <div class="page-head">
        <div>
          <h2>{{ i18n.t('notif.title') }}</h2>
          <p class="muted">{{ i18n.t('notif.sub') }}</p>
        </div>
      </div>

      @if (error()) { <div class="alert err">{{ error() }}</div> }

      @for (r of requests(); track r.id) {
        <div class="card notif" [class.is-new]="r.unread">
          <div class="notif-head">
            <div>
              <b>{{ i18n.t('req.type.' + r.type) }}</b> — {{ r.bookTitle }}
              @if (r.unread) { <span class="badge warn" style="margin-inline-start: 8px">{{ i18n.t('notif.new') }}</span> }
            </div>
            <span class="badge" [class.warn]="r.status === 'PENDING'" [class.ok]="r.status === 'APPROVED'" [class.danger]="r.status === 'REJECTED'">
              {{ i18n.t('req.status.' + r.status) }}
            </span>
          </div>
          @if (r.status === 'PENDING') {
            <p class="muted">{{ i18n.t('notif.waiting') }}</p>
          }
          @if (r.status === 'REJECTED' && r.reason) {
            <p class="notif-reason bad">{{ i18n.t('notif.reason', { r: r.reason }) }}</p>
          }
          @if (r.status === 'APPROVED' && r.reason) {
            <p class="notif-reason good">{{ i18n.t('notif.note', { r: r.reason }) }}</p>
          }
          <p class="muted notif-time">{{ fmt(r.decidedAt ?? r.createdAt) }}</p>
        </div>
      } @empty {
        <div class="card"><p class="muted" style="margin:0">{{ i18n.t('notif.empty') }}</p></div>
      }
    </div>
  `,
})
export class NotificationsPage implements OnInit {
  i18n = inject(I18nService);
  private api = inject(ApiService);
  private notif = inject(NotificationService);

  requests = signal<LoanRequest[]>([]);
  error = signal('');

  ngOnInit() {
    this.api.getMyRequests().subscribe({
      next: (list) => {
        this.requests.set(list);
        // opening this page marks the news as read (the cards keep the "New" tag for now)
        if (list.some((r) => r.unread)) {
          this.api.markNotificationsRead().subscribe({ next: () => this.notif.refresh(), error: () => undefined });
        }
      },
      error: (e) => this.error.set(errMsg(e)),
    });
  }

  fmt(iso: string): string {
    return iso ? iso.slice(0, 16).replace('T', ' ') : '';
  }
}
