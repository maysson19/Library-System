export type Role = 'ADMIN' | 'LIBRARIAN' | 'STUDENT';

export interface LoginResponse {
  token: string;
  username: string;
  fullName: string;
  role: Role;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  category?: string | null;
  totalCopies: number;
  availableCopies: number;
  publishYear?: number | null;
  description?: string | null;
  coverUrl?: string | null;
}

export interface BookRequest {
  title: string;
  author: string;
  isbn: string;
  category: string;
  totalCopies: number;
  publishYear: number | null;
  description: string;
  coverUrl: string;
}

export interface Student {
  id: number;
  studentCode: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
}

export interface StudentRequest {
  studentCode: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface Loan {
  id: number;
  studentId: number;
  studentCode: string;
  studentName: string;
  bookId: number;
  bookTitle: string;
  isbn: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string | null;
  status: 'BORROWED' | 'RETURNED';
  overdue: boolean;
  daysOverdue: number;
  issuedBy?: string | null;
  renewCount: number;
  canRenew: boolean;
}

export interface UserAccount {
  id: number;
  username: string;
  fullName: string;
  role: Role;
  studentId?: number | null;
  studentName?: string | null;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  fullName: string;
  role: Role;
  studentId: number | null;
}

export interface Summary {
  totalBooks: number;
  totalCopies: number;
  availableCopies: number;
  totalStudents: number;
  activeLoans: number;
  overdueLoans: number;
}

export interface PublicSettings {
  loanDays: number;
  maxActiveLoans: number;
  renewDays: number;
  maxRenewals: number;
}

export type RequestType = 'BORROW' | 'RETURN';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Standing {
  activeLoans: number;
  maxLoans: number;
  overdueLoans: number;
  availableCopies: number;
  eligible: boolean;
}

export interface LoanRequest {
  id: number;
  type: RequestType;
  status: RequestStatus;
  studentId: number;
  studentCode: string;
  studentName: string;
  bookId: number;
  bookTitle: string;
  isbn: string;
  loanId?: number | null;
  createdAt: string;
  decidedAt?: string | null;
  decidedBy?: string | null;
  reason?: string | null;
  unread: boolean;
  standing?: Standing | null;
}

export interface CountResponse {
  count: number;
}

export interface CreatedAccount {
  studentName: string;
  studentCode: string;
  username: string;
  password: string;
}
