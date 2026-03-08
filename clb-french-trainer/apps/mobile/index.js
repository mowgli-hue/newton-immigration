import { registerRootComponent } from 'expo';

const hasWebDom = typeof globalThis !== 'undefined' && !!globalThis.document;

function renderWebCrash(title, detail) {
  if (!hasWebDom) return;
  const webDocument = globalThis.document;
  try {
    if (!webDocument) return;
    const root = webDocument.createElement('pre');
    root.style.whiteSpace = 'pre-wrap';
    root.style.padding = '16px';
    root.style.margin = '0';
    root.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, monospace';
    root.style.fontSize = '13px';
    root.style.lineHeight = '1.4';
    root.style.color = '#7f1d1d';
    root.style.background = '#fef2f2';
    root.textContent = `${title}\n\n${String(detail ?? 'Unknown startup error')}`;
    webDocument.body.innerHTML = '';
    webDocument.body.appendChild(root);
  } catch {
    // noop
  }
}

if (hasWebDom) {
  const webWindow = globalThis.window;

  if (webWindow && typeof webWindow.addEventListener === 'function') {
    webWindow.addEventListener('error', (event) => {
      renderWebCrash('Web startup error', event?.error?.stack || event?.message);
    });

    webWindow.addEventListener('unhandledrejection', (event) => {
      renderWebCrash('Unhandled promise rejection', event?.reason?.stack || event?.reason);
    });
  }
}

try {
  const safeWebMode =
    hasWebDom &&
    typeof globalThis.location?.search === 'string' &&
    globalThis.location.search.includes('safeweb=1');

  if (safeWebMode) {
    // Emergency render path to isolate web runtime vs app runtime issues.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const React = require('react');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { View, Text } = require('react-native');
    const SafeApp = () =>
      React.createElement(
        View,
        { style: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' } },
        React.createElement(Text, { style: { fontSize: 20, color: '#0f172a', fontWeight: '700' } }, 'Franco Web Safe Mode'),
        React.createElement(
          Text,
          { style: { marginTop: 8, fontSize: 14, color: '#334155' } },
          'Web runtime is OK. App runtime needs targeted fix.'
        )
      );
    registerRootComponent(SafeApp);
  } else {
  // Lazy require lets us catch module-load crashes in App and dependencies.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const App = require('./src/App').default;
  registerRootComponent(App);
  }
} catch (error) {
  renderWebCrash('App import failed', error?.stack || error);
}
