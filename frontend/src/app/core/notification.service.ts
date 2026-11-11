import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

// The red number on the bell: waiting requests for the librarian, unread answers for the student
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  readonly count = signal(0);
  private timer: ReturnType<typeof setInterval> | null = null;

  start() {
    if (this.timer !== null) return;
    this.refresh();
    this.timer = setInterval(() => this.refresh(), 20000);
  }

  stop() {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
    this.count.set(0);
  }

  refresh() {
    if (!this.auth.isLoggedIn()) return;
    const call = this.auth.isStaff() ? this.api.getPendingCount() : this.api.getUnreadCount();
    call.subscribe({
      next: (c) => this.count.set(c.count),
      error: () => {
        // ignore: the number is refreshed again after 20 seconds
      },
    });
  }
}
