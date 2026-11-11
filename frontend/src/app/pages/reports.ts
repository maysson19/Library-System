import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { I18nService } from '../core/i18n';
import { Loan } from '../core/models';
import { errMsg } from '../core/util';

@Component({
  selector: 'app-reports',
  imports: [FormsModule],
  template: `
    <div class="container page">
      <div class="page-head">
        <div>
          <h2>{{ i18n.t('reports.title') }}</h2>
          <p class="muted">{{ i18n.t('reports.sub') }}</p>
        </div>
        <div class="toolbar">
          <button (click)="load()">{{ i18n.t('c.refresh') }}</button>
          <button class="primary" (click)="print()">{{ i18n.t('c.print') }}</button>
        </div>
      </div>

      @if (error()) { <div class="alert err">{{ error() }}</div> }

      <h3 style="margin: 0 0 12px">{{ i18n.t('reports.borrowedTitle', { n: borrowed().length }) }}</h3>
      <div class="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>{{ i18n.t('f.student') }}</th><th>{{ i18n.t('f.book') }}</th><th>{{ i18n.t('f.borrowDate') }}</th>
              <th>{{ i18n.t('f.dueDate') }}</th><th>{{ i18n.t('c.status') }}</th>
            </tr>
          </thead>
          <tbody>
            @for (l of borrowed(); track l.id) {
              <tr>
                <td>{{ l.studentCode }} - {{ l.studentName }}</td>
                <td><b>{{ l.bookTitle }}</b></td>
                <td>{{ l.borrowDate }}</td>
                <td>{{ l.dueDate }}</td>
                <td>
                  @if (l.overdue) { <span class="badge danger">{{ i18n.t('ls.overdue') }}</span> }
                  @else { <span class="badge warn">{{ i18n.t('ls.borrowed') }}</span> }
                </td>
              </tr>
            } @empty {
              <tr><td class="empty" colspan="5">{{ i18n.t('reports.noBorrowed') }}</td></tr>
            }
          </tbody>
        </table>
      </div>

      <h3 style="margin: 24px 0 12px">{{ i18n.t('reports.overdueTitle', { n: overdue().length }) }}</h3>
      <div class="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>{{ i18n.t('f.student') }}</th><th>{{ i18n.t('f.codeShort') }}</th><th>{{ i18n.t('f.book') }}</th>
              <th>{{ i18n.t('f.dueDate') }}</th><th>{{ i18n.t('reports.overdueDays') }}</th>
            </tr>
          </thead>
          <tbody>
            @for (l of overdue(); track l.id) {
              <tr>
                <td>{{ l.studentName }}</td>
                <td>{{ l.studentCode }}</td>
                <td><b>{{ l.bookTitle }}</b></td>
                <td>{{ l.dueDate }}</td>
                <td><span class="badge danger">{{ i18n.t('ls.daysOnly', { n: l.daysOverdue }) }}</span></td>
              </tr>
            } @empty {
              <tr><td class="empty" colspan="5">{{ i18n.t('reports.noOverdue') }}</td></tr>
            }
          </tbody>
        </table>
      </div>

      <h3 style="margin: 24px 0 12px">{{ i18n.t('reports.logTitle', { n: logs().length }) }}</h3>
      <div class="card">
        <div class="filters">
          <div><label>{{ i18n.t('reports.from') }}</label><input type="date" [(ngModel)]="from" /></div>
          <div><label>{{ i18n.t('reports.to') }}</label><input type="date" [(ngModel)]="to" /></div>
          <div>
            <label>{{ i18n.t('c.status') }}</label>
            <select [(ngModel)]="status">
              <option value="">{{ i18n.t('c.all') }}</option>
              <option value="BORROWED">{{ i18n.t('ls.borrowed') }}</option>
              <option value="OVERDUE">{{ i18n.t('ls.overdue') }}</option>
              <option value="RETURNED">{{ i18n.t('ls.returned') }}</option>
            </select>
          </div>
          <button class="primary" (click)="searchLogs()">{{ i18n.t('c.search') }}</button>
          <button (click)="exportCsv()" [disabled]="logs().length === 0">{{ i18n.t('reports.export') }}</button>
        </div>
      </div>
      <div class="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th><th>{{ i18n.t('f.student') }}</th><th>{{ i18n.t('f.book') }}</th><th>{{ i18n.t('f.borrowDate') }}</th>
              <th>{{ i18n.t('f.dueDate') }}</th><th>{{ i18n.t('f.returnDate') }}</th><th>{{ i18n.t('c.status') }}</th>
              <th>{{ i18n.t('f.issuedBy') }}</th>
            </tr>
          </thead>
          <tbody>
            @for (l of logs(); track l.id) {
              <tr>
                <td>{{ l.id }}</td>
                <td>{{ l.studentName }}</td>
                <td><b>{{ l.bookTitle }}</b></td>
                <td>{{ l.borrowDate }}</td>
                <td>{{ l.dueDate }}</td>
                <td>{{ l.returnDate ?? '-' }}</td>
                <td>
                  @if (l.status === 'RETURNED') { <span class="badge gray">{{ i18n.t('ls.returned') }}</span> }
                  @else if (l.overdue) { <span class="badge danger">{{ i18n.t('ls.overdueDays', { n: l.daysOverdue }) }}</span> }
                  @else { <span class="badge warn">{{ i18n.t('ls.borrowed') }}</span> }
                </td>
                <td>{{ l.issuedBy ?? '-' }}</td>
              </tr>
            } @empty {
              <tr><td class="empty" colspan="8">{{ i18n.t('reports.noResults') }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class ReportsPage implements OnInit {
  i18n = inject(I18nService);
  private api = inject(ApiService);

  borrowed = signal<Loan[]>([]);
  overdue = signal<Loan[]>([]);
  logs = signal<Loan[]>([]);
  error = signal('');

  from = '';
  to = '';
  status = '';

  ngOnInit() {
    this.load();
  }

  load() {
    this.error.set('');
    this.api.getBorrowedReport().subscribe({
      next: (l) => this.borrowed.set(l),
      error: (e) => this.error.set(errMsg(e)),
    });
    this.api.getOverdueReport().subscribe({
      next: (l) => this.overdue.set(l),
      error: (e) => this.error.set(errMsg(e)),
    });
    this.searchLogs();
  }

  searchLogs() {
    this.api.searchLoans(this.from, this.to, this.status).subscribe({
      next: (l) => this.logs.set(l),
      error: (e) => this.error.set(errMsg(e)),
    });
  }

  // Downloads the loan history as a CSV file (in the current language), which opens directly in Excel
  exportCsv() {
    const statusText = (l: Loan) =>
      this.i18n.t(l.status === 'RETURNED' ? 'ls.returned' : l.overdue ? 'ls.overdue' : 'ls.borrowed');
    const quote = (v: unknown) => '"' + String(v ?? '').replace(/"/g, '""') + '"';

    const header = this.i18n.t('csv.header').split('|');
    const rows = this.logs().map((l) => [
      l.id, l.studentCode, l.studentName, l.bookTitle, l.isbn, l.borrowDate,
      l.dueDate, l.returnDate ?? '', statusText(l), l.issuedBy ?? '',
    ]);

    const csv = [header, ...rows].map((r) => r.map(quote).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'loans-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  print() {
    window.print();
  }
}
