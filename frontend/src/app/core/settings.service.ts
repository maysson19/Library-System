import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';

// Library rules (loan days, max books...) read from the backend so the texts always match it
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private api = inject(ApiService);

  readonly loanDays = signal(14);
  readonly maxLoans = signal(3);
  readonly renewDays = signal(7);
  readonly maxRenewals = signal(1);

  constructor() {
    this.api.getSettings().subscribe({
      next: (s) => {
        this.loanDays.set(s.loanDays);
        this.maxLoans.set(s.maxActiveLoans);
        this.renewDays.set(s.renewDays);
        this.maxRenewals.set(s.maxRenewals);
      },
      error: () => {
        // keep the default values if the backend is not reachable
      },
    });
  }
}
