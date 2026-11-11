// The website always calls the backend through the same address it was opened from.
// The Angular dev server forwards everything under /api to the Spring Boot backend (see proxy.conf.json),
// so it works on the laptop, on a phone on the same Wi-Fi, and through a public tunnel link.
export const API_URL = '/api';
