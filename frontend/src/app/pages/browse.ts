import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { categoryMeta, sortCategories } from '../core/category';
import { I18nService } from '../core/i18n';
import { Book } from '../core/models';
import { BookCard } from '../shared/book-card';

@Component({
  selector: 'app-browse',
  imports: [FormsModule, BookCard],
  template: `
    <div class="container page">
      <div class="page-head">
        <div>
          <h2>{{ i18n.t('browse.title') }}</h2>
          <p class="muted">{{ i18n.t('browse.count', { shown: filtered().length, total: books().length }) }}</p>
        </div>
        <div class="toolbar">
          <input type="text" [ngModel]="query()" (ngModelChange)="query.set($event)"
                 [placeholder]="i18n.t('browse.search')" />
        </div>
      </div>

      <div class="chips">
        <button class="chip" [class.on]="category() === 'all'" (click)="category.set('all')">{{ i18n.t('c.all') }}</button>
        @for (c of categories(); track c.key) {
          <button class="chip" [class.on]="category() === c.key" (click)="category.set(c.key)">
            {{ c.icon }} {{ i18n.categoryName(c.key) }}
          </button>
        }
      </div>

      @if (error()) {
        <div class="alert err">{{ i18n.t('home.loadError') }}</div>
      }

      <div class="book-grid">
        @for (b of filtered(); track b.id) {
          <app-book-card [book]="b" />
        } @empty {
          <p class="muted">{{ i18n.t('browse.noResults') }}</p>
        }
      </div>
    </div>
  `,
})
export class BrowsePage implements OnInit {
  i18n = inject(I18nService);
  private api = inject(ApiService);

  books = signal<Book[]>([]);
  error = signal(false);
  query = signal('');
  category = signal('all');

  categories = computed(() => {
    const names = new Set<string>();
    for (const b of this.books()) if (b.category) names.add(b.category);
    return sortCategories([...names]).map((name) => ({ key: name, ...categoryMeta(name) }));
  });

  filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const cat = this.category();
    return this.books()
      .filter((b) => cat === 'all' || b.category === cat)
      .filter(
        (b) =>
          !q ||
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          (b.category ?? '').toLowerCase().includes(q) ||
          this.i18n.categoryName(b.category ?? '').toLowerCase().includes(q) ||
          b.isbn.toLowerCase().includes(q)
      );
  });

  ngOnInit() {
    this.api.getPublicBooks().subscribe({
      next: (list) => this.books.set([...list].sort((a, b) => b.id - a.id)),
      error: () => this.error.set(true),
    });
  }
}
