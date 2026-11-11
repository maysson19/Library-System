import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { I18nService } from './core/i18n';
import { NotificationService } from './core/notification.service';

interface NavLink {
  key: string; // translation key
  path: string;
  fragment?: string;
}

const PUBLIC_LINKS: NavLink[] = [
  { key: 'nav.home', path: '/' },
  { key: 'nav.browse', path: '/browse' },
  { key: 'nav.why', path: '/', fragment: 'why' },
  { key: 'nav.about', path: '/', fragment: 'about' },
];

const STUDENT_LINKS: NavLink[] = [
  { key: 'nav.home', path: '/' },
  { key: 'nav.browse', path: '/browse' },
  { key: 'nav.myLoans', path: '/account' },
  { key: 'nav.notifications', path: '/notifications' },
];

const STAFF_LINKS: NavLink[] = [
  { key: 'nav.dashboard', path: '/dashboard' },
  { key: 'nav.requests', path: '/requests' },
  { key: 'nav.books', path: '/books' },
  { key: 'nav.students', path: '/students' },
  { key: 'nav.loans', path: '/loans' },
  { key: 'nav.reports', path: '/reports' },
];

const ADMIN_LINKS: NavLink[] = [...STAFF_LINKS, { key: 'nav.users', path: '/users' }];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private router = inject(Router);

activeFragment = signal<string | null>(null);
currentPath = signal(this.router.url.split('#')[0]);

selectFragment(fragment: string) {
  this.activeFragment.set(fragment);
}

selectPage(path: string) {
  this.activeFragment.set(null);
  this.currentPath.set(path);
}


  auth = inject(AuthService);
  i18n = inject(I18nService);
  notif = inject(NotificationService);

  links = computed(() => {
    if (this.auth.isAdmin()) return ADMIN_LINKS;
    if (this.auth.isStaff()) return STAFF_LINKS;
    if (this.auth.isLoggedIn()) return STUDENT_LINKS;
    return PUBLIC_LINKS;
  });

  bellPath = computed(() => (this.auth.isStaff() ? '/requests' : '/notifications'));

  constructor() {
    // the bell number is refreshed every 20 seconds while somebody is logged in
    effect(() => {
      if (this.auth.isLoggedIn()) this.notif.start();
      else this.notif.stop();
    });
  }
}
