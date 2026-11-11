import { Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { I18nService } from '../core/i18n';
import { Book } from '../core/models';
import { NotificationService } from '../core/notification.service';
import { errMsg } from '../core/util';

const COVERS = ['#2d6e43', '#6b2d5e', '#2c4e73', '#1f6b6b', '#7a4a2a'];

@Component({
  selector: 'app-book-card',
  template: `
    <div class="bcard">
      <div class="cover" [style.background]="cover()">
        @if (showImage()) {
          <img class="cover-img" [src]="imageUrl()" [alt]="book().title"
               referrerpolicy="no-referrer" (error)="failed.set(true)" />
        } @else {
          <span class="c-title">{{ book().title }}</span>
          <span class="c-author">{{ book().author }}</span>
        }
      </div>
      <h4 class="b-title">{{ book().title }}</h4>
      <p class="b-author">{{ book().author }}@if (book().publishYear) { · {{ book().publishYear }} }</p>
      @if (book().description) {
        <p class="b-desc">{{ book().description }}</p>
      }

      @if (book().availableCopies > 0) {
        <span class="pill ok">{{ i18n.t('book.available', { a: book().availableCopies, t: book().totalCopies }) }}</span>
      } @else {
        <span class="pill no">{{ i18n.t('book.unavailable') }}</span>
      }

      <button class="primary block" (click)="action()" [disabled]="isStudent() && book().availableCopies <= 0">
        {{ isStudent() ? i18n.t('req.borrowBtn') : i18n.t('book.borrowNow') }}
      </button>

      @if (note()) {
        <p class="card-note" [class.err]="noteIsError()">{{ note() }}</p>
      }
    </div>
  `,
})
export class BookCard {
  book = input.required<Book>();

  i18n = inject(I18nService);
  private auth = inject(AuthService);
  private api = inject(ApiService);
  private router = inject(Router);
  private notif = inject(NotificationService);

  // Set to true when the real cover could not be loaded, then the colored cover is shown
  failed = signal(false);
  note = signal('');
  noteIsError = signal(false);

  cover = computed(() => COVERS[this.book().id % COVERS.length]);

  // The real cover: your own link if you added one, otherwise Open Library by ISBN
  imageUrl = computed(() => {
    const b = this.book();
    if (b.coverUrl) return b.coverUrl;
    const isbn = (b.isbn ?? '').replace(/[^0-9Xx]/g, '');
    return isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false` : null;
  });
  showImage = computed(() => this.imageUrl() !== null && !this.failed());

  isStudent = computed(() => this.auth.role() === 'STUDENT');

  // Visitor: login. Staff: borrow screen. Student: sends a request to the librarian.
  action() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    if (this.isStudent()) {
      this.api.requestBorrow(this.book().id).subscribe({
        next: () => {
          this.noteIsError.set(false);
          this.note.set(this.i18n.t('req.sent'));
          this.notif.refresh();
        },
        error: (e) => {
          this.noteIsError.set(true);
          this.note.set(errMsg(e));
        },
      });
      return;
    }
    this.router.navigate(['/loans'], { queryParams: { bookId: this.book().id } });
  }
}
