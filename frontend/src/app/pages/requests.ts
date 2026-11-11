import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { I18nService } from '../core/i18n';
import { LoanRequest } from '../core/models';
import { NotificationService } from '../core/notification.service';
import { errMsg } from '../core/util';

// Librarian: the student requests waiting for a decision
@Component({
  selector: 'app-requests',
  imports: [FormsModule],
  template: `
    <div class="container page">
      <div class="page-head">
        <div>
          <h2>{{ i18n.t('requests.title') }}</h2>
          <p class="muted">{{ i18n.t('requests.pendingCount', { n: pending().length }) }}</p>
        </div>
        <div class="toolbar">
          <button (click)="load()">{{ i18n.t('c.refresh') }}</button>
        </div>
      </div>

      @if (message()) { <div class="alert ok">{{ message() }}</div> }
      @if (error()) { <div class="alert err">{{ error() }}</div> }

      @for (r of pending(); track r.id) {
        <div class="card req-card">
          <div class="req-head">
            <span class="badge" [class.warn]="r.type === 'BORROW'" [class.gray]="r.type === 'RETURN'">
              {{ i18n.t('req.type.' + r.type) }}
            </span>
            <span class="muted">{{ fmt(r.createdAt) }}</span>
          </div>

          <div class="req-main">
            <div>
              <div class="req-label">{{ i18n.t('f.student') }}</div>
              <b>{{ r.studentName }}</b> <span class="muted">({{ r.studentCode }})</span>
            </div>
            <div>
              <div class="req-label">{{ i18n.t('f.book') }}</div>
              <b>{{ r.bookTitle }}</b>
            </div>
          </div>

          @if (r.standing; as st) {
            <div class="standing">
              <div class="req-label">{{ i18n.t('requests.studentStatus') }}</div>
              <div class="chips-row">
                <span class="badge" [class.ok]="st.activeLoans < st.maxLoans" [class.danger]="st.activeLoans >= st.maxLoans">
                  {{ i18n.t('requests.activeLoans', { a: st.activeLoans, m: st.maxLoans }) }}
                </span>
                <span class="badge" [class.ok]="st.overdueLoans === 0" [class.danger]="st.overdueLoans > 0">
                  {{ i18n.t('requests.overdueBooks', { n: st.overdueLoans }) }}
                </span>
                @if (r.type === 'BORROW') {
                  <span class="badge" [class.ok]="st.availableCopies > 0" [class.danger]="st.availableCopies <= 0">
                    {{ i18n.t('requests.copies', { n: st.availableCopies }) }}
                  </span>
                }
              </div>
              <p class="verdict" [class.good]="st.eligible" [class.bad]="!st.eligible">
                @if (r.type === 'RETURN') { {{ i18n.t('requests.returnInfo') }} }
                @else if (st.eligible) { {{ i18n.t('requests.eligible') }} }
                @else { {{ i18n.t('requests.notEligible') }} }
              </p>
            </div>
          }

          @if (rejectingId() === r.id) {
            <label>{{ i18n.t('requests.reasonLabel') }}</label>
            <input type="text" [(ngModel)]="reasonText" />
            <div class="actions">
              <button class="danger" (click)="confirmReject(r)">{{ i18n.t('requests.confirmReject') }}</button>
              <button (click)="rejectingId.set(null)">{{ i18n.t('c.cancel') }}</button>
            </div>
          } @else {
            <div class="actions">
              <button class="primary" (click)="approve(r)" [disabled]="!(r.standing?.eligible ?? true)">{{ i18n.t('requests.approve') }}</button>
              <button class="danger" (click)="startReject(r)">{{ i18n.t('requests.reject') }}</button>
            </div>
          }
        </div>
      } @empty {
        <div class="card"><p class="muted" style="margin:0">{{ i18n.t('requests.none') }}</p></div>
      }

      <h3 style="margin: 24px 0 12px">{{ i18n.t('requests.history') }}</h3>
      <div class="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>{{ i18n.t('req.type') }}</th><th>{{ i18n.t('f.student') }}</th><th>{{ i18n.t('f.book') }}</th>
              <th>{{ i18n.t('c.status') }}</th><th>{{ i18n.t('requests.reason') }}</th><th>{{ i18n.t('requests.decidedBy') }}</th>
            </tr>
          </thead>
          <tbody>
            @for (r of history(); track r.id) {
              <tr>
                <td>{{ i18n.t('req.type.' + r.type) }}</td>
                <td>{{ r.studentName }}</td>
                <td><b>{{ r.bookTitle }}</b></td>
                <td>
                  <span class="badge" [class.ok]="r.status === 'APPROVED'" [class.danger]="r.status === 'REJECTED'">
                    {{ i18n.t('req.status.' + r.status) }}
                  </span>
                </td>
                <td>{{ r.reason ?? '-' }}</td>
                <td>{{ r.decidedBy ?? '-' }}</td>
              </tr>
            } @empty {
              <tr><td class="empty" colspan="6">{{ i18n.t('requests.noHistory') }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class RequestsPage implements OnInit {
  i18n = inject(I18nService);
  private api = inject(ApiService);
  private notif = inject(NotificationService);

  pending = signal<LoanRequest[]>([]);
  history = signal<LoanRequest[]>([]);
  message = signal('');
  error = signal('');
  rejectingId = signal<number | null>(null);
  reasonText = '';

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.getPendingRequests().subscribe({
      next: (list) => this.pending.set(list),
      error: (e) => this.error.set(errMsg(e)),
    });
    this.api.getRequestHistory().subscribe({
      next: (list) => this.history.set(list),
      error: (e) => this.error.set(errMsg(e)),
    });
    this.notif.refresh();
  }

  fmt(iso: string): string {
    return iso ? iso.slice(0, 16).replace('T', ' ') : '';
  }

  // A ready reason based on the student status; the librarian can edit it
  private suggestion(r: LoanRequest): string {
    const st = r.standing;
    if (!st || r.type === 'RETURN') return '';
    if (st.overdueLoans > 0) return this.i18n.t('requests.text.overdue');
    if (st.activeLoans >= st.maxLoans) return this.i18n.t('requests.text.max');
    if (st.availableCopies <= 0) return this.i18n.t('requests.text.copies');
    return '';
  }

  startReject(r: LoanRequest) {
    this.message.set('');
    this.error.set('');
    this.reasonText = this.suggestion(r);
    this.rejectingId.set(r.id);
  }

  approve(r: LoanRequest) {
    this.message.set('');
    this.error.set('');
    this.api.approveRequest(r.id, '').subscribe({
      next: () => {
        this.message.set(this.i18n.t('requests.approved'));
        this.load();
      },
      error: (e) => this.error.set(errMsg(e)),
    });
  }

  confirmReject(r: LoanRequest) {
    if (!this.reasonText.trim()) {
      this.message.set('');
      this.error.set(this.i18n.t('requests.reasonRequired'));
      return;
    }
    this.api.rejectRequest(r.id, this.reasonText).subscribe({
      next: () => {
        this.rejectingId.set(null);
        this.error.set('');
        this.message.set(this.i18n.t('requests.rejected'));
        this.load();
      },
      error: (e) => this.error.set(errMsg(e)),
    });
  }
}
