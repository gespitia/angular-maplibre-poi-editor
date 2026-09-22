type Language = 'en' | 'es';
type ThemeMode = 'inherit' | 'native';
type ThemeTokens = Record<string, string>;

type DemoMessage =
  | { source: 'gespitia-shell'; type: 'shell.init'; language: Language; theme: ThemeMode; tokens: ThemeTokens }
  | { source: 'gespitia-shell'; type: 'language.changed'; language: Language }
  | { source: 'gespitia-shell'; type: 'theme.changed'; theme: ThemeMode; tokens: ThemeTokens };

const allowedOrigin = window.location.origin;

window.addEventListener('message', event => {
  if (event.origin !== allowedOrigin) return;
  const message = event.data as DemoMessage;
  if (message?.source !== 'gespitia-shell') return;

  if (message.type === 'shell.init' || message.type === 'theme.changed') {
    document.documentElement.dataset['portfolioTheme'] = message.theme;
    if (message.theme === 'inherit') {
      for (const [name, value] of Object.entries(message.tokens)) {
        document.documentElement.style.setProperty(name, value);
      }
    }
  }

  if (message.type === 'language.changed') {
    document.documentElement.lang = message.language;
  }
});

window.parent.postMessage(
  { source: 'gespitia-demo', type: 'demo.ready', capabilities: ['language', 'theme'] },
  allowedOrigin,
);
