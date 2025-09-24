import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DoctorNameService {
  formatDoctorName(name: string | null | undefined): string {
    if (!name) return '';
    const trimmed = name.trim();
    // Avoid double prefix
    return trimmed.toLowerCase().startsWith('dr.') || trimmed.toLowerCase().startsWith('dr ')
      ? trimmed
      : `Dr. ${trimmed}`;
  }

  // Accepts list items that either have `name` or `first_name`/`last_name`.
  // Returns a NEW sorted array by formatted name; does not mutate the original.
  formatDoctorsList<T extends { name?: string; first_name?: string; last_name?: string }>(doctors: T[] | null | undefined): (T & { name: string })[] {
    if (!doctors || doctors.length === 0) return [];

    const withNames = doctors.map((doc) => {
      const baseName = doc.name ?? `${doc.first_name ?? ''} ${doc.last_name ?? ''}`.trim();
      const formatted = this.formatDoctorName(baseName);
      return { ...doc, name: formatted } as T & { name: string };
    });

    return withNames.sort((a, b) => a.name.localeCompare(b.name));
  }
}
