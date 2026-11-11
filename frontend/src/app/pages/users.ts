import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { I18nService } from '../core/i18n';
import { CreateUserRequest, CreatedAccount, Role, Student, UserAccount } from '../core/models';
import { errMsg } from '../core/util';
import { PasswordInput } from '../shared/password-input';

@Component({
  selector: 'app-users',
  imports: [FormsModule, PasswordInput],
  template: `
    <div class="container page">
      <div class="page-head">
        <div>
          <h2>{{ i18n.t('users.title') }}</h2>
          <p class="muted">{{ i18n.t('users.count', { n: users().length }) }}</p>
        </div>
        <div class="toolbar">
          <button (click)="createStudentAccounts()">{{ i18n.t('users.createStudentAccounts') }}</button>
          <button class="primary" (click)="newUser()">{{ i18n.t('users.add') }}</button>
        </div>
      </div>

      @if (message()) { <div class="alert ok">{{ message() }}</div> }
      @if (error()) { <div class="alert err">{{ error() }}</div> }

      @if (created().length > 0) {
        <div class="card">
          <h3>{{ i18n.t('users.accountsCreated', { n: created().length }) }}</h3>
          <p class="muted">{{ i18n.t('users.defaultPwNote') }}</p>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{{ i18n.t('f.student') }}</th><th>{{ i18n.t('f.codeShort') }}</th>
                  <th>{{ i18n.t('f.username') }}</th><th>{{ i18n.t('f.password') }}</th>
                </tr>
              </thead>
              <tbody>
                @for (a of created(); track a.username) {
                  <tr>
                    <td>{{ a.studentName }}</td><td>{{ a.studentCode }}</td>
                    <td><b>{{ a.username }}</b></td><td>{{ a.password }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="actions"><button (click)="created.set([])">{{ i18n.t('c.close') }}</button></div>
        </div>
      }

      @if (showForm()) {
        <div class="card">
          <h3>{{ i18n.t('users.formAdd') }}</h3>
          <div class="grid">
            <div><label>{{ i18n.t('f.username') }}</label><input type="text" [(ngModel)]="form.username" /></div>
            <div><label>{{ i18n.t('users.passwordHint') }}</label><app-password-input name="new-user-pass" [(value)]="form.password" /></div>
            <div><label>{{ i18n.t('f.fullName') }}</label><input type="text" [(ngModel)]="form.fullName" /></div>
            <div>
              <label>{{ i18n.t('f.role') }}</label>
              <select [(ngModel)]="form.role">
                @for (r of roles; track r) {
                  <option [ngValue]="r">{{ i18n.t('role.' + r) }}</option>
                }
              </select>
            </div>
            @if (form.role === 'STUDENT') {
              <div>
                <label>{{ i18n.t('users.linkedStudent') }}</label>
                <select [(ngModel)]="form.studentId">
                  <option [ngValue]="null">{{ i18n.t('users.chooseStudent') }}</option>
                  @for (s of students(); track s.id) {
                    <option [ngValue]="s.id">{{ s.studentCode }} - {{ s.fullName }}</option>
                  }
                </select>
              </div>
            }
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
              <th>{{ i18n.t('f.username') }}</th><th>{{ i18n.t('f.name') }}</th><th>{{ i18n.t('f.role') }}</th>
              <th>{{ i18n.t('users.thStudent') }}</th><th>{{ i18n.t('c.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            @for (u of users(); track u.id) {
              <tr>
                <td><b>{{ u.username }}</b></td>
                <td>{{ u.fullName }}</td>
                <td>
                  @if (u.role === 'ADMIN') { <span class="badge danger">{{ i18n.t('role.' + u.role) }}</span> }
                  @else if (u.role === 'LIBRARIAN') { <span class="badge warn">{{ i18n.t('role.' + u.role) }}</span> }
                  @else { <span class="badge ok">{{ i18n.t('role.' + u.role) }}</span> }
                </td>
                <td>{{ u.studentName ?? '-' }}</td>
                <td>
                  <button class="small" (click)="resetPassword(u)">{{ i18n.t('users.resetPassword') }}</button>
                  <button class="small danger" (click)="remove(u)">{{ i18n.t('c.delete') }}</button>
                </td>
              </tr>
            } @empty {
              <tr><td class="empty" colspan="5">{{ i18n.t('users.empty') }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class UsersPage implements OnInit {
  i18n = inject(I18nService);
  private api = inject(ApiService);

  users = signal<UserAccount[]>([]);
  students = signal<Student[]>([]);
  message = signal('');
  error = signal('');
  showForm = signal(false);
  created = signal<CreatedAccount[]>([]);

  roles: Role[] = ['LIBRARIAN', 'ADMIN', 'STUDENT'];
  form: CreateUserRequest = this.emptyForm();

  ngOnInit() {
    this.load();
    this.api.getStudents().subscribe({
      next: (s) => this.students.set(s),
      error: (e) => this.error.set(errMsg(e)),
    });
  }

  load() {
    this.api.getUsers().subscribe({
      next: (list) => this.users.set(list),
      error: (e) => this.error.set(errMsg(e)),
    });
  }

  emptyForm(): CreateUserRequest {
    return { username: '', password: '', fullName: '', role: 'LIBRARIAN', studentId: null };
  }

  createStudentAccounts() {
    this.api.createStudentAccounts().subscribe({
      next: (list) => {
        this.error.set('');
        this.created.set(list);
        this.message.set(list.length ? '' : this.i18n.t('users.noMissing'));
        this.load();
      },
      error: (e) => {
        this.message.set('');
        this.error.set(errMsg(e));
      },
    });
  }

  newUser() {
    this.form = this.emptyForm();
    this.showForm.set(true);
    this.message.set('');
    this.error.set('');
  }

  save() {
    const body: CreateUserRequest = {
      ...this.form,
      studentId: this.form.role === 'STUDENT' ? this.form.studentId : null,
    };
    this.api.createUser(body).subscribe({
      next: () => {
        this.message.set(this.i18n.t('users.added'));
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

  resetPassword(u: UserAccount) {
    const pwd = prompt(this.i18n.t('users.promptPw', { u: u.username }));
    if (!pwd) return;
    this.api.resetPassword(u.id, pwd).subscribe({
      next: () => {
        this.message.set(this.i18n.t('users.pwChanged'));
        this.error.set('');
      },
      error: (e) => {
        this.message.set('');
        this.error.set(errMsg(e));
      },
    });
  }

  remove(u: UserAccount) {
    if (!confirm(this.i18n.t('users.confirmDelete', { u: u.username }))) return;
    this.api.deleteUser(u.id).subscribe({
      next: () => {
        this.message.set(this.i18n.t('users.deleted'));
        this.error.set('');
        this.load();
      },
      error: (e) => {
        this.message.set('');
        this.error.set(errMsg(e));
      },
    });
  }
}
