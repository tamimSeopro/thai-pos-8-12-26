// Ensure global window.fetch is settable across window, globalThis, self, and Window.prototype
(function() {
  function forceSettable(obj: any, prop: string) {
    if (!obj) return;
    try {
      let val = obj[prop];
      try {
        if (typeof val === 'function') {
          val = val.bind(obj);
        }
      } catch (_) {}

      const descriptor = {
        get: () => val,
        set: (newVal: any) => {
          val = newVal;
        },
        configurable: true,
        enumerable: true,
      };

      try {
        Object.defineProperty(obj, prop, descriptor);
      } catch (_e1) {
        try {
          const proto = Object.getPrototypeOf(obj);
          if (proto) {
            Object.defineProperty(proto, prop, descriptor);
          }
        } catch (_e2) {}
      }
    } catch (_e) {}
  }

  const targets = [
    typeof window !== 'undefined' ? window : null,
    typeof globalThis !== 'undefined' ? globalThis : null,
    typeof self !== 'undefined' ? self : null,
    typeof Window !== 'undefined' && (Window as any).prototype ? (Window as any).prototype : null,
  ];

  const props = ['fetch', 'FormData', 'Headers', 'Request', 'Response', 'XMLHttpRequest', 'sendBeacon'];
  for (let i = 0; i < targets.length; i++) {
    if (!targets[i]) continue;
    for (let j = 0; j < props.length; j++) {
      forceSettable(targets[i], props[j]);
    }
  }
})();

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
