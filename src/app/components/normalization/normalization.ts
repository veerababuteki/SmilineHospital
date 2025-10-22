// doctor-name.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NormalizationService {

  private doctorMap: Record<string, string> = {
    'Akhila': 'Akhila (Prostho)',
    'Bhagyashree': 'Bhagyashree',
    'Keerthi': 'Keerthi Raj (Ortho)',
    'Sahitya': 'Sahitya (Endo)',
    'Ramakrishna': 'N.B. Ramakrishna',
    'Pranavi': 'N. Pranavi (Ortho)',
    'Yashaswini': 'Yashaswini (Ortho)',
    'Sravya': 'Sravya (Pedo)',
    'Amulya': 'Amulya (Ortho)',
    'Anuradha': 'Anuradha (Endo)',
    'Rekha': 'Rekha',
    'Bhargavi': 'Bhargavi (Prostho)',
    'Sailaja': 'Sailaja (Prostho)',
    'Sanjana': 'Sanjana (Prostho)',
    'Sunitha': 'Sunitha',
    'Preethi': 'Preethi Mariona',
    'Kranthi': 'Kranthi (Perio)',
    'Sonika': 'Sonika',
    'Swetha': 'Swetha Biradar',
    'Sezhian': 'Sezhian (Surgeon)',
    'Sushma': 'Sushma',
    'Krishnaveni': 'Krishnaveni (Prostho)',
    'Anisha': 'Anisha (Surgeon)',
    'Sindhu': 'Sindhu (Pedo)',
    'Jhansi': 'Jhansi',
    'Haripriya': 'Hari Priya (Perio)',
    'Yashawini': 'Yashawini Aluru',
    'Naresh': 'Naresh'
  };

  getDoctorDisplayName(rawName: string): string {
    if (!rawName) return '';

    let name = rawName.replace(/\b(dr\.?|Dr\.?)\b/gi, '').trim();
    name = name.replace(/^\.+|\.+$/g, '').trim();

    const tokens = name.split(/\s+/);
    const mainName = tokens.length > 1 ? tokens[tokens.length - 1] : tokens[0];

    const mappedName = this.doctorMap[mainName] || name;

    return mappedName.match(/^Dr\.?\s/i) ? mappedName : `Dr. ${mappedName}`;
  }

  formatDoctors(doctors: { name: string; user_id: any }[]): { name: string; user_id: any; displayName: string }[] {
    const seen = new Set<string>();
    return doctors
      .map(d => {
        const displayName = this.getDoctorDisplayName(d.name);
        return { ...d, displayName };
      })
      .filter(d => {
        if (seen.has(d.displayName)) return false;
        seen.add(d.displayName);
        return true;
      });
  }

  sortDoctorsAlphabetically(doctors: { name: string; user_id: any; displayName: string }[]): { name: string; user_id: any; displayName: string }[] {
  return doctors.sort((a, b) => {
    // Remove "Dr." prefix for sorting
    const nameA = a.displayName.replace(/^Dr\.?\s+/i, '');
    const nameB = b.displayName.replace(/^Dr\.?\s+/i, '');
    return nameA.localeCompare(nameB);
  });
}
}
