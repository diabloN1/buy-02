import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Pipe({ name: 'safeUrl', standalone: true })
export class SafeUrlPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);
  transform(url: string | null | undefined): SafeUrl | string {
    if (!url) return '';

    // Used when communicating to none certified backend
    // if (url.startsWith('http://')) return this.sanitizer.bypassSecurityTrustUrl(url); 
    
    return url;
    
  }
}
