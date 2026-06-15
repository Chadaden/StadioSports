import { useState } from 'react';
import { useRole } from '../contexts/RoleContext.jsx';
import SpectrumBar from './SpectrumBar.jsx';

const PIN_LENGTH = 4;

export default function PinGate() {
  const { submitPin, showPin } = useRole();
  const [digits, setDigits] = useState([]);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  if (!showPin) return null;

  async function pressKey(key) {
    if (checking) return;
    if (key === 'del') {
      setDigits((d) => d.slice(0, -1));
      setError('');
      return;
    }
    const next = [...digits, key];
    setDigits(next);
    setError('');

    if (next.length === PIN_LENGTH) {
      setChecking(true);
      const pin = next.join('');
      const ok = await submitPin(pin);
      if (!ok) {
        setError('Incorrect PIN. Try again.');
        setDigits([]);
      }
      setChecking(false);
    }
  }

  const keys = ['1','2','3','4','5','6','7','8','9','','0','del'];

  return (
    <div className="pin-overlay">
      <SpectrumBar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="pin-logo">STADIO</div>
        <div className="pin-title">Enter PIN</div>
        <div className="pin-subtitle">
          {checking ? 'Verifying…' : 'Enter your access PIN to continue'}
        </div>

        <div className="pin-dots">
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div key={i} className={`pin-dot${i < digits.length ? ' filled' : ''}`} />
          ))}
        </div>

        <div className="pin-keypad">
          {keys.map((k, i) =>
            k === '' ? (
              <div key={i} />
            ) : (
              <button
                key={i}
                className={`pin-key${k === 'del' ? ' del' : ''}`}
                onClick={() => pressKey(k)}
                disabled={checking}
                aria-label={k === 'del' ? 'Delete' : k}
              >
                {k === 'del' ? '⌫' : k}
              </button>
            )
          )}
        </div>

        <div className="pin-error">{error}</div>
      </div>
    </div>
  );
}
