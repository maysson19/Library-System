import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from './config';
import {
  Book, BookRequest, CountResponse, CreateUserRequest, CreatedAccount, Loan, LoanRequest, PublicSettings,
  Student, StudentRequest, Summary, UserAccount,
} from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  // Public (no login needed)
  getPublicBooks() {
    return this.http.get<Book[]>(`${API_URL}/public/books`);
  }
  getSettings() {
    return this.http.get<PublicSettings>(`${API_URL}/public/settings`);
  }

  // Books
  getBooks(q = '') {
    let params = new HttpParams();
    if (q.trim()) params = params.set('q', q.trim());
    return this.http.get<Book[]>(`${API_URL}/books`, { params });
  }
  createBook(b: BookRequest) {
    return this.http.post<Book>(`${API_URL}/books`, b);
  }
  updateBook(id: number, b: BookRequest) {
    return this.http.put<Book>(`${API_URL}/books/${id}`, b);
  }
  deleteBook(id: number) {
    return this.http.delete<void>(`${API_URL}/books/${id}`);
  }

  // Students
  getStudents() {
    return this.http.get<Student[]>(`${API_URL}/students`);
  }
  createStudent(s: StudentRequest) {
    return this.http.post<Student>(`${API_URL}/students`, s);
  }
  updateStudent(id: number, s: StudentRequest) {
    return this.http.put<Student>(`${API_URL}/students/${id}`, s);
  }
  deleteStudent(id: number) {
    return this.http.delete<void>(`${API_URL}/students/${id}`);
  }
  getStudentLoans(id: number) {
    return this.http.get<Loan[]>(`${API_URL}/students/${id}/loans`);
  }

  // Loans
  getLoans() {
    return this.http.get<Loan[]>(`${API_URL}/loans`);
  }
  borrow(studentId: number, bookId: number) {
    return this.http.post<Loan>(`${API_URL}/loans/borrow`, { studentId, bookId });
  }
  returnLoan(id: number) {
    return this.http.post<Loan>(`${API_URL}/loans/${id}/return`, {});
  }
  renewLoan(id: number) {
    return this.http.post<Loan>(`${API_URL}/loans/${id}/renew`, {});
  }

  // Reports
  getSummary() {
    return this.http.get<Summary>(`${API_URL}/reports/summary`);
  }
  getBorrowedReport() {
    return this.http.get<Loan[]>(`${API_URL}/reports/borrowed`);
  }
  getOverdueReport() {
    return this.http.get<Loan[]>(`${API_URL}/reports/overdue`);
  }
  searchLoans(from: string, to: string, status: string) {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    if (status) params = params.set('status', status);
    return this.http.get<Loan[]>(`${API_URL}/reports/loans`, { params });
  }

  // Users (admin)
  getUsers() {
    return this.http.get<UserAccount[]>(`${API_URL}/users`);
  }
  createUser(u: CreateUserRequest) {
    return this.http.post<UserAccount>(`${API_URL}/users`, u);
  }
  resetPassword(id: number, newPassword: string) {
    return this.http.put<void>(`${API_URL}/users/${id}/password`, { newPassword });
  }
  deleteUser(id: number) {
    return this.http.delete<void>(`${API_URL}/users/${id}`);
  }

  // Account
  changePassword(oldPassword: string, newPassword: string) {
    return this.http.put<void>(`${API_URL}/auth/password`, { oldPassword, newPassword });
  }
  getMyLoans() {
    return this.http.get<Loan[]>(`${API_URL}/me/loans`);
  }
  // Students: requests to the librarian and notifications
  getMyRequests() {
    return this.http.get<LoanRequest[]>(`${API_URL}/me/requests`);
  }
  requestBorrow(bookId: number) {
    return this.http.post<LoanRequest>(`${API_URL}/me/requests/borrow`, { bookId });
  }
  requestReturn(loanId: number) {
    return this.http.post<LoanRequest>(`${API_URL}/me/requests/return`, { loanId });
  }
  getUnreadCount() {
    return this.http.get<CountResponse>(`${API_URL}/me/notifications/unread-count`);
  }
  markNotificationsRead() {
    return this.http.post<void>(`${API_URL}/me/notifications/read`, {});
  }

  // Librarian: decide on the requests
  getPendingRequests() {
    return this.http.get<LoanRequest[]>(`${API_URL}/requests/pending`);
  }
  getPendingCount() {
    return this.http.get<CountResponse>(`${API_URL}/requests/pending/count`);
  }
  getRequestHistory() {
    return this.http.get<LoanRequest[]>(`${API_URL}/requests/history`);
  }
  approveRequest(id: number, reason: string) {
    return this.http.post<LoanRequest>(`${API_URL}/requests/${id}/approve`, { reason });
  }
  rejectRequest(id: number, reason: string) {
    return this.http.post<LoanRequest>(`${API_URL}/requests/${id}/reject`, { reason });
  }

  // Admin: accounts for students that have none
  createStudentAccounts() {
    return this.http.post<CreatedAccount[]>(`${API_URL}/users/student-accounts`, {});
  }
}
