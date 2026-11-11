import { Component, DestroyRef, ElementRef, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { categoryMeta, sortCategories } from '../core/category';
import { I18nService } from '../core/i18n';
import { Book } from '../core/models';
import { SettingsService } from '../core/settings.service';
import { BookArt } from '../shared/book-art';
import { BookCard } from '../shared/book-card';

// The texts of each slide are in i18n.ts (slide.N.title / sub / art)
const SLIDES = [
  { n: 1, bg: '#27394d' },
  { n: 2, bg: '#3d3820' },
  { n: 3, bg: '#2a403d' },
];

@Component({
  selector: 'app-home',
  imports: [RouterLink, BookArt, BookCard],
  template: `
    <section class="container">
      <div class="hero" [style.background]="slide().bg">
        <button class="arrow arrow-next" (click)="next()" [attr.aria-label]="i18n.t('home.next')">
          {{ i18n.isRtl() ? '‹' : '›' }}
        </button>

        <div class="hero-text">
          <h1 class="hero-title">{{ slide().title }}</h1>
          <p class="hero-sub">{{ slide().sub }}</p>
          <a routerLink="/browse" class="btn-yellow">{{ i18n.t('home.browseBtn') }}</a>
        </div>

        <app-book-art [text]="slide().art" />

        <button class="arrow arrow-prev" (click)="prev()" [attr.aria-label]="i18n.t('home.prev')">
          {{ i18n.isRtl() ? '›' : '‹' }}
        </button>

        <div class="dots">
          @for (s of slides; track s.n) {
            <button class="dot" [class.on]="$index === idx()" (click)="idx.set($index)"></button>
          }
        </div>
      </div>
    </section>

    <section class="container">
      <h2 class="section-title">{{ i18n.t('home.interests') }}</h2>
      <div class="blobs">
        @for (c of categories(); track c.key) {
          <button class="blob" [class.sel]="selected() === c.key" [style.background]="c.color"
                  (click)="selected.set(c.key)">
            <span class="b-ico">{{ c.icon }}</span>
            <b>{{ i18n.categoryName(c.key) }}</b>
            <small>{{ i18n.booksCount(c.count) }}</small>
          </button>
        }
        <button class="blob" [class.sel]="selected() === 'all'" style="background: #4a4468"
                (click)="selected.set('all')">
          <span class="b-ico">📚</span>
          <b>{{ i18n.t('home.allBooks') }}</b>
          <small>{{ i18n.booksCount(books().length) }}</small>
        </button>
      </div>
    </section>

    <section class="container">
      <div class="section-row">
        <h2 class="section-title">{{ i18n.t('home.latest') }}</h2>
        <div class="arrows">
          <button class="round" (click)="scroll(1)" [attr.aria-label]="i18n.t('home.next')">{{ i18n.isRtl() ? '‹' : '›' }}</button>
          <button class="round" (click)="scroll(-1)" [attr.aria-label]="i18n.t('home.prev')">{{ i18n.isRtl() ? '›' : '‹' }}</button>
        </div>
      </div>

      <div class="track" #trackEl>
        @for (b of filtered(); track b.id) {
          <div class="track-item"><app-book-card [book]="b" /></div>
        } @empty {
          <p class="muted">{{ error() ? i18n.t('home.loadError') : i18n.t('home.noBooks') }}</p>
        }
      </div>
    </section>

    <section class="container" id="why">
      <h2 class="section-title">{{ i18n.t('why.title') }}</h2>
      <div class="why-grid">
        <div class="why-card">
          <div class="ico">🧠</div>
          <h3>{{ i18n.t('why.1.title') }}</h3>
          <p>{{ i18n.t('why.1.text') }}</p>
        </div>
        <div class="why-card">
          <div class="ico">🎯</div>
          <h3>{{ i18n.t('why.2.title') }}</h3>
          <p>{{ i18n.t('why.2.text') }}</p>
        </div>
        <div class="why-card">
          <div class="ico">🗣️</div>
          <h3>{{ i18n.t('why.3.title') }}</h3>
          <p>{{ i18n.t('why.3.text') }}</p>
        </div>
        <div class="why-card">
          <div class="ico">🌿</div>
          <h3>{{ i18n.t('why.4.title') }}</h3>
          <p>{{ i18n.t('why.4.text') }}</p>
        </div>
      </div>
    </section>

    <section class="container" id="about">
      <div class="cta-grid">
        <div class="cta quote">
          <div class="quote-text">{{ i18n.t('cta.quote') }}</div>
          <p>{{ i18n.t('cta.quoteSub') }}</p>
        </div>
        <div class="cta olive">
          <h3>{{ i18n.t('cta.simpleTitle') }}</h3>
          <p>{{ i18n.t('cta.simpleText', { days: settings.loanDays(), max: settings.maxLoans() }) }}</p>
        </div>
        <div class="cta blue">
          <h3>{{ i18n.t('cta.staffTitle') }}</h3>
          <p>{{ i18n.t('cta.staffText') }}</p>
          @if (auth.isStaff()) {
            <a routerLink="/dashboard" class="btn-yellow small">{{ i18n.t('cta.dashboard') }}</a>
          } @else if (auth.isLoggedIn()) {
            <a routerLink="/account" class="btn-yellow small">{{ i18n.t('cta.myLoans') }}</a>
          } @else {
            <a routerLink="/login" class="btn-yellow small">{{ i18n.t('cta.login') }}</a>
          }
        </div>
      </div>
    </section>

    <div class="features">
      <div class="container feat-grid">
        <div class="feat">
          <span class="ico">📅</span>
          <div><b>{{ i18n.t('feat.loan.title', { days: settings.loanDays() }) }}</b><span>{{ i18n.t('feat.loan.text') }}</span></div>
        </div>
        <div class="feat">
          <span class="ico">📚</span>
          <div><b>{{ i18n.t('feat.max.title', { max: settings.maxLoans() }) }}</b><span>{{ i18n.t('feat.max.text') }}</span></div>
        </div>
        <div class="feat">
          <span class="ico">🔔</span>
          <div><b>{{ i18n.t('feat.late.title') }}</b><span>{{ i18n.t('feat.late.text') }}</span></div>
        </div>
        <div class="feat">
          <span class="ico">🖨️</span>
          <div><b>{{ i18n.t('feat.print.title') }}</b><span>{{ i18n.t('feat.print.text') }}</span></div>
        </div>
      </div>
    </div>
  `,
})
export class HomePage implements OnInit {
  private api = inject(ApiService);
  private destroyRef = inject(DestroyRef);
  auth = inject(AuthService);
  i18n = inject(I18nService);
  settings = inject(SettingsService);

  slides = SLIDES;
  idx = signal(0);
  slide = computed(() => {
    const s = this.slides[this.idx()];
    return {
      bg: s.bg,
      title: this.i18n.t(`slide.${s.n}.title`),
      sub: this.i18n.t(`slide.${s.n}.sub`, { days: this.settings.loanDays() }),
      art: this.i18n.t(`slide.${s.n}.art`),
    };
  });

  books = signal<Book[]>([]);
  error = signal(false);
  selected = signal('all');
  trackEl = viewChild<ElementRef<HTMLElement>>('trackEl');

  categories = computed(() => {
    const all = this.books();
    const names = new Set<string>();
    for (const b of all) if (b.category) names.add(b.category);
    return sortCategories([...names]).map((name) => ({
      key: name,
      ...categoryMeta(name),
      count: all.filter((b) => b.category === name).length,
    }));
  });

  filtered = computed(() => {
    const list = [...this.books()].sort((a, b) => b.id - a.id);
    const sel = this.selected();
    return sel === 'all' ? list : list.filter((b) => b.category === sel);
  });

  ngOnInit() {
    this.api.getPublicBooks().subscribe({
      next: (list) => this.books.set(list),
      error: () => this.error.set(true),
    });
    const timer = setInterval(() => this.next(), 6000);
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  next() {
    this.idx.set((this.idx() + 1) % this.slides.length);
  }

  prev() {
    this.idx.set((this.idx() - 1 + this.slides.length) % this.slides.length);
  }

  // dir 1 = towards the end of the list (left in Arabic, right in English)
  scroll(dir: 1 | -1) {
    const sign = this.i18n.isRtl() ? -1 : 1;
    this.trackEl()?.nativeElement.scrollBy({ left: sign * dir * 480, behavior: 'smooth' });
  }
}
