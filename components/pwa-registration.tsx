'use client';

import { useEffect } from 'react';

export function PWARegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration);
        })
        .catch((error) => {
          console.log('SW registration failed:', error);
        });
    }
  }, []);

  return null;
}

export function InstallPrompt() {
  useEffect(() => {
    let deferredPrompt: any;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      
      // Show install button
      const installButton = document.getElementById('install-button');
      if (installButton) {
        installButton.style.display = 'block';
        installButton.addEventListener('click', () => {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((choiceResult: any) => {
            if (choiceResult.outcome === 'accepted') {
              console.log('User accepted the install prompt');
            }
            deferredPrompt = null;
          });
        });
      }
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
    });
  }, []);

  return (
    <button 
      id="install-button"
      className="fixed bottom-20 right-4 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg shadow-lg hidden z-50"
    >
      📱 Install App
    </button>
  );
}
