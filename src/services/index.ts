import { isDemoMode } from '@/lib/firebase/config';
import type { DataService } from './dataService';
import { DemoDataService } from './demoService';
import { FirebaseDataService } from './firebaseService';

let _service: DataService | null = null;

/**
 * The single entry point the whole app uses to reach data. Picks the Firebase
 * or Demo implementation once, based on whether Firebase env vars are present.
 */
export function getDataService(): DataService {
  if (_service) return _service;
  _service = isDemoMode ? new DemoDataService() : new FirebaseDataService();
  return _service;
}

export { isDemoMode };
export type { DataService, CreateEventInput, AuthUser } from './dataService';
