import { createRoot } from 'react-dom/client';
import App from './App';
import { AppProvider } from './context/AppProvider';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(
  <AppProvider>
    <App />
  </AppProvider>,
);
