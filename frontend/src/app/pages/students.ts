import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { I18nService } from '../core/i18n';
import { Loan, Student, StudentRequest } from '../core/models';
import { errMsg } from '../core/util';

@Component({
  selector: 'app-students',
  imports: [FormsModule],
  template: `
    <div class="container page">
      <div class="page-head">
        <div>
          <h2>{{ i18n.t('students.title') }}</h2>
          <p class="muted">{{ i18n.t('students.count', { n: students().length }) }}</p>
        </div>
        <div class="toolbar">
          <button class="primary" (click)="newStudent()">{{ i18n.t('students.add') }}</button>
        </div>
      </div>

      @if (message()) { <div class="alert ok">{{ message() }}</div> }
      @if (error()) { <div class="alert err">{{ error() }}</div> }

      @if (showForm()) {
        <div class="card">
          <h3>{{ editingId() ? i18n.t('students.formEdit') : i18n.t('students.formAdd') }}</h3>
          <div class="grid">
            <div><label>{{ i18n.t('f.code') }}</label><input type="text" [(ngModel)]="form.studentCode" /></div>
            <div><label>{{ i18n.t('f.name') }}</label><input type="text" [(ngModel)]="form.fullName" /></div>
            <div><label>{{ i18n.t('f.email') }}</label><input type="text" [(ngModel)]="form.email" /></div>
            <div><label>{{ i18n.t('f.phone') }}</label><input type="text" [(ngModel)]="form.phone" /></div>
          </div>
          <div class="actions">
            <button class="primary" (click)="save()">{{ i18n.t('c.save') }}</button>
            <button (click)="showForm.set(false)">{{ i18n.t('c.cancel') }}</button>
          </div>
        </div>
      }

      <div class="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>{{ i18n.t('f.codeShort') }}</th><th>{{ i18n.t('f.name') }}</th>
              <th>{{ i18n.t('f.emailShort') }}</th><th>{{ i18n.t('f.phone') }}</th><th>{{ i18n.t('c.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            @for (s of students(); track s.id) {
              <tr>
                <td>{{ s.studentCode }}</td>
                <td><b>{{ s.fullName }}</b></td>
                <td>{{ s.email }}</td>
                <td>{{ s.phone }}</td>
                <td>
                  <button class="small" (click)="showHistory(s)">{{ i18n.t('students.history') }}</button>
                  <button class="small" (click)="edit(s)">{{ i18n.t('c.edit') }}</button>
                  @if (auth.isAdmin()) {
                    <button class="small danger" (click)="remove(s)">{{ i18n.t('c.delete') }}</button>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td class="empty" colspan="5">{{ i18n.t('students.empty') }}</td></tr>
            }
          </tbody>
        </table>
      </div>

      @if (history() !== null) {
        <div class="card">
          <h3>{{ i18n.t('students.historyTitle', { name: historyName() }) }}</h3>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{{ i18n.t('f.book') }}</th><th>{{ i18n.t('f.borrowDate') }}</th>
                  <th>{{ i18n.t('f.dueDate') }}</th><th>{{ i18n.t('f.returnDate') }}</th><th>{{ i18n.t('c.status') }}</th>
                </tr>
              </thead>
              <tbody>
                @for (l of history(); track l.id) {
                  <tr>
                    <td>{{ l.bookTitle }}</td>
                    <td>{{ l.borrowDate }}</td>
                    <td>{{ l.dueDate }}</td>
                    <td>{{ l.returnDate ?? '-' }}</td>
                    <td>
                      @if (l.status === 'RETURNED') { <span class="badge gray">{{ i18n.t('ls.returned') }}</span> }
                      @else if (l.overdue) { <span class="badge danger">{{ i18n.t('ls.overdueDays', { n: l.daysOverdue }) }}</span> }
                      @else { <span class="badge warn">{{ i18n.t('ls.borrowed') }}</span> }
                    </td>
                  </tr>
                } @empty {
                  <tr><td class="empty" colspan="5">{{ i18n.t('students.noLoans') }}</td></tr>
                }
              </tbody>
            </table>
          </div>
          <div class="actions"><button (click)="history.set(null)">{{ i18n.t('c.close') }}</button></div>
        </div>
      }
    </div>
  `,
})
export class StudentsPage implements OnInit {
  auth = inject(AuthService);
  i18n = inject(I18nService);
  private api = inject(ApiService);

  students = signal<Student[]>([]);
  message = signal('');
  error = signal('');
  showForm = signal(false);
  editingId = signal<number | null>(null);
  history = signal<Loan[] | null>(null);
  historyName = signal('');

  form: StudentRequest = this.emptyForm();

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.getStudents().subscribe({
      next: (list) => this.students.set(list),
      error: (e) => this.error.set(errMsg(e)),
    });
  }

  emptyForm(): StudentRequest {
    return { studentCode: '', fullName: '', email: '', phone: '' };
  }

  private clearAlerts() {
    this.message.set('');
    this.error.set('');
  }

  newStudent() {
    this.form = this.emptyForm();
    this.editingId.set(null);
    this.showForm.set(true);
    this.clearAlerts();
  }

  edit(s: Student) {
    this.form = {
      studentCode: s.studentCode,
      fullName: s.fullName,
      email: s.email ?? '',
      phone: s.phone ?? '',
    };
    this.editingId.set(s.id);
    this.showForm.set(true);
    this.clearAlerts();
  }

  save() {
    const id = this.editingId();
    const request = id ? this.api.updateStudent(id, this.form) : this.api.createStudent(this.form);
    request.subscribe({
      next: () => {
        this.message.set(this.i18n.t(id ? 'students.updated' : 'students.added'));
        this.error.set('');
        this.showForm.set(false);
        this.load();
      },
      error: (e) => {
        this.message.set('');
        this.error.set(errMsg(e));
      },
    });
  }

  remove(s: Student) {
    if (!confirm(this.i18n.t('students.confirmDelete', { name: s.fullName }))) return;
    this.api.deleteStudent(s.id).subscribe({
      next: () => {
        this.message.set(this.i18n.t('students.deleted'));
        this.error.set('');
        this.load();
      },
      error: (e) => {
        this.message.set('');
        this.error.set(errMsg(e));
      },
    });
  }

  showHistory(s: Student) {
    this.api.getStudentLoans(s.id).subscribe({
      next: (list) => {
        this.historyName.set(s.fullName);
        this.history.set(list);
      },
      error: (e) => this.error.set(errMsg(e)),
    });
  }
}
