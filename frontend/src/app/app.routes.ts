import { Routes } from '@angular/router';
import { adminGuard, authGuard, staffGuard, studentGuard } from './core/auth.guard';
import { AccountPage } from './pages/account';
import { BooksPage } from './pages/books';
import { BrowsePage } from './pages/browse';
import { DashboardPage } from './pages/dashboard';
import { HomePage } from './pages/home';
import { LoansPage } from './pages/loans';
import { LoginPage } from './pages/login';
import { NotificationsPage } from './pages/notifications';
import { ReportsPage } from './pages/reports';
import { RequestsPage } from './pages/requests';
import { StudentsPage } from './pages/students';
import { UsersPage } from './pages/users';

export const routes: Routes = [
  // Public pages
  { path: '', component: HomePage },
  { path: 'browse', component: BrowsePage },
  { path: 'login', component: LoginPage },

  // Any logged-in user
  { path: 'account', component: AccountPage, canActivate: [authGuard] },
  { path: 'books', component: BooksPage, canActivate: [authGuard] },

  // Students
  { path: 'notifications', component: NotificationsPage, canActivate: [authGuard, studentGuard] },

  // Staff (Admin and Librarian)
  { path: 'dashboard', component: DashboardPage, canActivate: [authGuard, staffGuard] },
  { path: 'requests', component: RequestsPage, canActivate: [authGuard, staffGuard] },
  { path: 'students', component: StudentsPage, canActivate: [authGuard, staffGuard] },
  { path: 'loans', component: LoansPage, canActivate: [authGuard, staffGuard] },
  { path: 'reports', component: ReportsPage, canActivate: [authGuard, staffGuard] },

  // Admin only
  { path: 'users', component: UsersPage, canActivate: [authGuard, adminGuard] },

  { path: '**', redirectTo: '' },
];
