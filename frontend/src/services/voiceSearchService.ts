import { MedicineInfo } from '../types';

export interface SearchResultItem {
  type: 'destination' | 'medicine' | 'log';
  title: string;
  detail: string;
}

export class VoiceSearchService {
  search(query: string, medicines: MedicineInfo[]): SearchResultItem[] {
    const q = query.toLowerCase();
    const results: SearchResultItem[] = [];

    // 1. Search Medicines
    medicines.forEach((m) => {
      if (m.name.toLowerCase().includes(q) || m.prescribedFor.toLowerCase().includes(q)) {
        results.push({
          type: 'medicine',
          title: m.name,
          detail: `${m.dosage} • ${m.instructions}`
        });
      }
    });

    // 2. Search Destinations
    if (q.includes('pharmacy') || q.includes('metro') || q.includes('store')) {
      results.push({
        type: 'destination',
        title: 'Metro Pharmacy',
        detail: '45 meters away on Oak Lane'
      });
    }

    // 3. Search Logs
    results.push({
      type: 'log',
      title: 'Lisinopril 10mg Prescription',
      detail: 'OCR Scan • Saved Today at 8:00 AM'
    });

    return results;
  }
}

export const voiceSearchService = new VoiceSearchService();
