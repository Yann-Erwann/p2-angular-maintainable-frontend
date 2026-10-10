import { DOCUMENT, Location } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';

/** Metadonnées qui doivent suivre la route réellement affichée. */
@Injectable({ providedIn: 'root' })
export class SeoService {
  /** Document dont les balises canoniques sont mises à jour. */
  private readonly document = inject(DOCUMENT);
  /** Localisation utilisée pour construire une URL publique. */
  private readonly location = inject(Location);
  /** Gestionnaire Angular des balises meta. */
  private readonly meta = inject(Meta);

  /** Synchronise le canonical et l’indexation avec une route affichée. */
  update(url: string, noindex = false): void {
    const path = this.normalizedPath(url);
    const isNotFound = noindex || path === '/not-found';

    if (isNotFound) {
      this.removeCanonical();
      this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
      return;
    }

    this.setCanonical(path);
    this.meta.removeTag('name="robots"');
  }

  /** Retire query, fragment et slash final pour obtenir un chemin stable. */
  private normalizedPath(url: string): string {
    const path = url.split(/[?#]/, 1)[0] || '/';
    if (path === '/') return path;
    return path.replace(/\/+$/, '') || '/';
  }

  /** Crée ou met à jour le lien canonical de la page. */
  private setCanonical(path: string): void {
    const canonicalUrl = new URL(this.location.prepareExternalUrl(path), this.document.baseURI);
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      this.document.head.append(link);
    }
    link.href = canonicalUrl.href;
  }

  /** Supprime le canonical lorsqu’une page ne doit pas être indexée. */
  private removeCanonical(): void {
    this.document.head.querySelector('link[rel="canonical"]')?.remove();
  }
}
