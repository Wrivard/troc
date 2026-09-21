import { DesignSystemBrowser } from './preview/DesignSystemBrowser';
import { PreferencesProvider } from './hooks/use-preferences';

function App() {
  return <PreferencesProvider><DesignSystemBrowser /></PreferencesProvider>;
}

export default App;
