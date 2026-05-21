import { RouterProvider } from 'react-router';
import { ThemeProvider } from 'next-themes';
import { router } from './routes';
import { AppStateProvider } from './state/AppStateContext';
import '../i18n/config';

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AppStateProvider>
        <RouterProvider router={router} />
      </AppStateProvider>
    </ThemeProvider>
  );
}
