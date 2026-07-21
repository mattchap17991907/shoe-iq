import { useState, useEffect, useRef } from 'react';
import { checkPin, setPinUnlocked } from '../lib/pin.js';

export default function PinModal({ onResult }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function handleSubmit() {
    if (checkPin(value)) {
      setPinUnlocked();
      onResult(true);
    } else {
      setError(true);
      setValue('');
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') onResult(false);
  }

  return (
    <div className="pin-overlay">
      <div className="pin-box">
        <h4>Staff PIN required</h4>
        <p>Enter the staff PIN to add shoes or edit matching rules.</p>
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          placeholder="••••"
          value={value}
          onChange={e => { setValue(e.target.value); setError(false); }}
          onKeyDown={handleKeyDown}
        />
        <div className="actions">
          <button className="btn secondary" onClick={() => onResult(false)}>Cancel</button>
          <button className="btn" onClick={handleSubmit}>Unlock</button>
        </div>
        {error && <p className="pin-error">Incorrect PIN — try again.</p>}
      </div>
    </div>
  );
}
