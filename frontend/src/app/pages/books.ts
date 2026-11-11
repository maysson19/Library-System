import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { I18nService } from '../core/i18n';
import { Book, BookRequest } from '../core/models';
import { errMsg } from '../core/util';

@Component({
  selector: 'app-books',
  imports: [FormsModule],
  template: `
    <div class="container page">
      <div class="page-head">
        <div>
          <h2>{{ i18n.t('books.title') }}</h2>
          <p class="muted">{{ i18n.t('books.count', { n: books().length }) }}</p>
        </div>
        <div class="toolbar">
          <input type="text" [ngModel]="query" (ngModelChange)="query = $event; load()"
                 [placeholder]="i18n.t('browse.search')" />
          @if (auth.isStaff()) {
            <button class="primary" (click)="newBook()">{{ i18n.t('books.add') }}</button>
          }
        </div>
      </div>

      @if (message()) { <div class="alert ok">{{ message() }}</div> }
      @if (error()) { <div class="alert err">{{ error() }}</div> }

      @if (showForm()) {
        <div class="card">
          <h3>{{ editingId() ? i18n.t('books.formEdit') : i18n.t('books.formAdd') }}</h3>
          <div class="grid">
            <div><label>{{ i18n.t('f.title') }}</label><input type="text" [(ngModel)]="form.title" /></div>
            <div><label>{{ i18n.t('f.author') }}</label><input type="text" [(ngModel)]="form.author" /></div>
            <div><label>{{ i18n.t('f.isbn') }}</label><input type="text" [(ngModel)]="form.isbn" /></div>
            <div><label>{{ i18n.t('f.category') }}</label><input type="text" [(ngModel)]="form.category" /></div>
            <div><label>{{ i18n.t('f.copies') }}</label><input type="number" min="1" [(ngModel)]="form.totalCopies" /></div>
            <div><label>{{ i18n.t('f.year') }}</label><input type="number" [(ngModel)]="form.publishYear" /></div>
            <div><label>{{ i18n.t('f.coverUrl') }}</label><input type="text" [(ngModel)]="form.coverUrl" placeholder="https://..." /></div>
            <div><label>{{ i18n.t('f.description') }}</label><input type="text" [(ngModel)]="form.description" /></div>
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
              <th>{{ i18n.t('f.title') }}</th><th>{{ i18n.t('f.author') }}</th><th>{{ i18n.t('f.isbn') }}</th>
              <th>{{ i18n.t('f.category') }}</th><th>{{ i18n.t('f.yearShort') }}</th>
              <th>{{ i18n.t('f.availableTotal') }}</th><th>{{ i18n.t('c.status') }}</th>
              @if (auth.isStaff()) { <th>{{ i18n.t('c.actions') }}</th> }
            </tr>
          </thead>
          <tbody>
            @for (b of books(); track b.id) {
              <tr>
                <td><b>{{ b.title }}</b></td>
                <td>{{ b.author }}</td>
                <td>{{ b.isbn }}</td>
                <td>{{ b.category ? i18n.categoryName(b.category) : '' }}</td>
                <td>{{ b.publishYear ?? '-' }}</td>
                <td>{{ b.availableCopies }} / {{ b.totalCopies }}</td>
                <td>
                  @if (b.availableCopies > 0) {
                    <span class="badge ok">{{ i18n.t('status.available') }}</span>
                  } @else {
                    <span class="badge danger">{{ i18n.t('status.unavailable') }}</span>
                  }
                </td>
                @if (auth.isStaff()) {
                  <td>
                    <button class="small" (click)="edit(b)">{{ i18n.t('c.edit') }}</button>
                    @if (auth.isAdmin()) {
                      <button class="small danger" (click)="remove(b)">{{ i18n.t('c.delete') }}</button>
                    }
                  </td>
                }
              </tr>
            } @empty {
              <tr><td class="empty" colspan="8">{{ i18n.t('books.empty') }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class BooksPage implements OnInit {
  auth = inject(AuthService);
  i18n = inject(I18nService);
  private api = inject(ApiService);

  books = signal<Book[]>([]);
  message = signal('');
  error = signal('');
  showForm = signal(false);
  editingId = signal<number | null>(null);

  query = '';
  form: BookRequest = this.emptyForm();

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.getBooks(this.query).subscribe({
      next: (list) => this.books.set(list),
      error: (e) => this.error.set(errMsg(e)),
    });
  }

  emptyForm(): BookRequest {
    return { title: '', author: '', isbn: '', category: '', totalCopies: 1, publishYear: null, description: '', coverUrl: '' };
  }

  private clearAlerts() {
    this.message.set('');
    this.error.set('');
  }

  newBook() {
    this.form = this.emptyForm();
    this.editingId.set(null);
    this.showForm.set(true);
    this.clearAlerts();
  }

  edit(b: Book) {
    this.form = {
      title: b.title,
      author: b.author,
      isbn: b.isbn,
      category: b.category ?? '',
      totalCopies: b.totalCopies,
      publishYear: b.publishYear ?? null,
      description: b.description ?? '',
      coverUrl: b.coverUrl ?? '',
    };
    this.editingId.set(b.id);
    this.showForm.set(true);
    this.clearAlerts();
  }

  save() {
    const id = this.editingId();
    const request = id ? this.api.updateBook(id, this.form) : this.api.createBook(this.form);
    request.subscribe({
      next: () => {
        this.message.set(this.i18n.t(id ? 'books.updated' : 'books.added'));
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

  remove(b: Book) {
    if (!confirm(this.i18n.t('books.confirmDelete', { name: b.title }))) return;
    this.api.deleteBook(b.id).subscribe({
      next: () => {
        this.message.set(this.i18n.t('books.deleted'));
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
