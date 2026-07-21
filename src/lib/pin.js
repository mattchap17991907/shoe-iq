const STORAGE_KEY = 'shoeiq_pin_ok';

export function isPinUnlocked() {
  return sessionStorage.getItem(STORAGE_KEY) === 'true';
}

export function setPinUnlocked() {
  sessionStorage.setItem(STORAGE_KEY, 'true');
}

export function checkPin(input) {
  return String(input).trim() === String(import.meta.env.VITE_STAFF_PIN);
}
