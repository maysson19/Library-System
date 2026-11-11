import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../core/api.service';
import { I18nService } from '../core/i18n';
import { Book, Loan, Student } from '../core/models';
import { SettingsService } from '../core/settings.service';
import { errMsg } from '../core/util';

@Component({
  selector: 'app-loans',
  imports: [FormsModule],
  template: `
    <div class="container page">
      <div class="page-head">
        <div>
          <h2>{{ i18n.t('loans.title') }}</h2>
          <p class="muted">{{ i18n.t('loans.active', { n: activeCount() }) }}</p>
        </div>
      </div>

      @if (message()) { <div class="alert ok">{{ message() }}</div> }
      @if (error()) { <div class="alert err">{{ error() }}</div> }

      <div class="card">
        <h3>{{ i18n.t('loans.borrowTitle') }}</h3>
        <div class="grid">
          <div>
            <label>{{ i18n.t('loans.studentLabel') }}</label>
            <select [(ngModel)]="studentId">
              <option [ngValue]="null">{{ i18n.t('loans.chooseStudent') }}</option>
              @for (s of students(); track s.id) {
                <option [ngValue]="s.id">{{ s.studentCode }} - {{ s.fullName }}</option>
              }
            </select>
          </div>
          <div>
            <label>{{ i18n.t('loans.bookLabel') }}</label>
            <select [(ngModel)]="bookId">
              <option [ngValue]="null">{{ i18n.t('loans.chooseBook') }}</option>
              @for (b of availableBooks(); track b.id) {
                <option [ngValue]="b.id">{{ i18n.t('loans.bookOption', { title: b.title, n: b.availableCopies }) }}</option>
              }
            </select>
          </div>
        </div>
        <div class="actions">
          <button class="primary" (click)="borrow()">{{ i18n.t('loans.submit') }}</button>
        </div>
        <p class="muted">
          {{ i18n.t('loans.rules', {
            days: settings.loanDays(), max: settings.maxLoans(),
            renews: settings.maxRenewals(), renewDays: settings.renewDays()
          }) }}
        </p>
      </div>

      <div class="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th><th>{{ i18n.t('f.student') }}</th><th>{{ i18n.t('f.book') }}</th><th>{{ i18n.t('f.borrowDate') }}</th>
              <th>{{ i18n.t('f.dueDate') }}</th><th>{{ i18n.t('c.status') }}</th><th>{{ i18n.t('f.issuedBy') }}</th><th></th>
            </tr>
          </thead>
          <tbody>
            @for (l of sortedLoans(); track l.id) {
              <tr>
                <td>{{ l.id }}</td>
                <td>{{ l.studentName }}</td>
                <td><b>{{ l.bookTitle }}</b></td>
                <td>{{ l.borrowDate }}</td>
                <td>{{ l.dueDate }}@if (l.renewCount > 0) { <span class="muted"> {{ i18n.t('loans.renewedTag') }}</span> }</td>
                <td>
                  @if (l.status === 'RETURNED') { <span class="badge gray">{{ i18n.t('ls.returnedOn', { d: l.returnDate ?? '' }) }}</span> }
                  @else if (l.overdue) { <span class="badge danger">{{ i18n.t('ls.overdueDays', { n: l.daysOverdue }) }}</span> }
                  @else { <span class="badge warn">{{ i18n.t('ls.borrowed') }}</span> }
                </td>
                <td>{{ l.issuedBy ?? '-' }}</td>
                <td>
                  @if (l.status === 'BORROWED') {
                    <button class="small primary" (click)="giveBack(l)">{{ i18n.t('loans.return') }}</button>
                    @if (l.canRenew) {
                      <button class="small" (click)="renew(l)">{{ i18n.t('loans.renew') }}</button>
                    }
                  }
                </td>
              </tr>
            } @empty {
              <tr><td class="empty" colspan="8">{{ i18n.t('loans.empty') }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class LoansPage implements OnInit {
  i18n = inject(I18nService);
  settings = inject(SettingsService);
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  students = signal<Student[]>([]);
  books = signal<Book[]>([]);
  loans = signal<Loan[]>([]);
  message = signal('');
  error = signal('');

  studentId: number | null = null;
  bookId: number | null = null;

  availableBooks = computed(() => this.books().filter((b) => b.availableCopies > 0));
  sortedLoans = computed(() => [...this.loans()].sort((a, b) => b.id - a.id));
  activeCount = computed(() => this.loans().filter((l) => l.status === 'BORROWED').length);

  ngOnInit() {
    // "Borrow now" on a book card opens this page with the book already selected
    const preselected = this.route.snapshot.queryParamMap.get('bookId');
    if (preselected) this.bookId = Number(preselected);
    this.loadAll();
  }

  loadAll() {
    this.api.getStudents().subscribe({ next: (s) => this.students.set(s), error: (e) => this.error.set(errMsg(e)) });
    this.api.getBooks('').subscribe({ next: (b) => this.books.set(b), error: (e) => this.error.set(errMsg(e)) });
    this.api.getLoans().subscribe({ next: (l) => this.loans.set(l), error: (e) => this.error.set(errMsg(e)) });
  }

  private ok(msg: string) {
    this.message.set(msg);
    this.error.set('');
    this.loadAll();
  }

  private fail(e: unknown) {
    this.message.set('');
    this.error.set(errMsg(e));
  }

  borrow() {
    if (this.studentId === null || this.bookId === null) {
      this.message.set('');
      this.error.set(this.i18n.t('loans.pickBoth'));
      return;
    }
    this.api.borrow(this.studentId, this.bookId).subscribe({
      next: (loan) => {
        this.studentId = null;
        this.bookId = null;
        this.ok(this.i18n.t('loans.borrowed', { d: loan.dueDate }));
      },
      error: (e) => this.fail(e),
    });
  }

  giveBack(l: Loan) {
    this.api.returnLoan(l.id).subscribe({
      next: () => this.ok(this.i18n.t('loans.returned', { t: l.bookTitle })),
      error: (e) => this.fail(e),
    });
  }

  renew(l: Loan) {
    this.api.renewLoan(l.id).subscribe({
      next: (res) => this.ok(this.i18n.t('loans.renewedMsg', { d: res.dueDate })),
      error: (e) => this.fail(e),
    });
  }
}
