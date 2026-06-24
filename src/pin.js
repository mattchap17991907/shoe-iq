const STAFF_PIN = import.meta.env.VITE_STAFF_PIN || '';
const SESSION_KEY = 'shoeiq_pin_ok';

const overlay = document.getElementById('pinOverlay');
const input = document.getElementById('pinInput');
const error = document.getElementById('pinError');
const submitBtn = document.getElementById('pinSubmit');
const cancelBtn = document.getElementById('pinCancel');

let pendingResolve = null;

function isUnlocked() {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}

function openOverlay() {
  error.style.display = 'none';
  input.value = '';
  overlay.classList.add('open');
  input.focus();
}

function closeOverlay() {
  overlay.classList.remove('open');
}

submitBtn.addEventListener('click', () => {
  if (input.value === STAFF_PIN && STAFF_PIN) {
    sessionStorage.setItem(SESSION_KEY, '1');
    closeOverlay();
    if (pendingResolve) pendingResolve(true);
  } else {
    error.style.display = 'block';
  }
});

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') submitBtn.click();
});

cancelBtn.addEventListener('click', () => {
  closeOverlay();
  if (pendingResolve) pendingResolve(false);
});

// Resolves true if the staff PIN is (or becomes) unlocked for this session, false if cancelled.
export function requirePin() {
  if (isUnlocked()) return Promise.resolve(true);
  return new Promise((resolve) => {
    pendingResolve = resolve;
    openOverlay();
  });
}
