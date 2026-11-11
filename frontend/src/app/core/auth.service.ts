import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { API_URL } from './config';
import { LoginResponse } from './models';

const STORAGE_KEY = 'library_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  readonly user = signal<LoginResponse | null>(this.readStored());
  readonly isLoggedIn = computed(() => this.user() !== null);
  readonly role = computed(() => this.user()?.role ?? null);
  readonly isStaff = computed(() => this.role() === 'ADMIN' || this.role() === 'LIBRARIAN');
  readonly isAdmin = computed(() => this.role() === 'ADMIN');

  get token(): string | null {
    return this.user()?.token ?? null;
  }

  // Sign in
  login(username: string, password: string) {
    return this.http.post<LoginResponse>(`${API_URL}/auth/login`, { username, password }).pipe(
      tap((res) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(res));
        this.user.set(res);
      })
    );
  }

  // Sign out (JWT is stateless, so we just forget the token)
  logout() {
    localStorage.removeItem(STORAGE_KEY);
    this.user.set(null);
    this.router.navigate(['/login']);
  }

  private readStored(): LoginResponse | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as LoginResponse) : null;
    } catch {
      return null;
    }
  }
}
