import { Component, input } from '@angular/core';

// Illustration used in the home page hero: a stack of books with an open book on top
@Component({
  selector: 'app-book-art',
  template: `
    <div class="art">
      <div class="calli">{{ text() }}</div>
      <svg class="art-svg" viewBox="0 0 320 280" role="img" aria-label="كتب">
        <ellipse cx="160" cy="264" rx="125" ry="14" fill="#000" opacity="0.2" />
        <rect x="40" y="205" width="240" height="48" rx="6" fill="#1f3558" />
        <rect x="64" y="227" width="92" height="5" rx="2.5" fill="#e8edf5" />
        <rect x="55" y="162" width="215" height="42" rx="6" fill="#f5b41a" />
        <rect x="76" y="180" width="70" height="5" rx="2.5" fill="#fff3d0" />
        <rect x="35" y="118" width="225" height="42" rx="6" fill="#c9533d" />
        <rect x="56" y="138" width="96" height="5" rx="2.5" fill="#ffe6df" />
        <rect x="70" y="84" width="190" height="32" rx="6" fill="#3f8f7e" />
        <path d="M85 80 L85 34 Q120 22 160 40 Q200 22 235 34 L235 80 Q200 68 160 84 Q120 68 85 80 Z"
              fill="#ffffff" stroke="#1f3558" stroke-width="7" stroke-linejoin="round" />
        <path d="M160 40 L160 84" stroke="#1f3558" stroke-width="6" />
      </svg>
    </div>
  `,
})
export class BookArt {
  text = input('');
}
