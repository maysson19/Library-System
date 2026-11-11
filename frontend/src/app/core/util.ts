import { HttpErrorResponse } from '@angular/common/http';

// Turns an HTTP error into a readable message in the current language.
// Messages that come from the backend are already translated by the server.
export function errMsg(e: unknown): string {
  const en = document.documentElement.lang === 'en';
  const err = e as HttpErrorResponse;
  if (err?.status === 0) {
    return en
      ? 'Could not connect to the server. Make sure the backend is running.'
      : 'تعذر الاتصال بالسيرفر. تأكد أن الـ Backend شغال.';
  }
  if (err?.status === 403) {
    return en ? 'You do not have permission to do this' : 'ليس لديك صلاحية لتنفيذ هذه العملية';
  }
  return err?.error?.message ?? (en ? 'Unexpected error' : 'حدث خطأ غير متوقع');
}
