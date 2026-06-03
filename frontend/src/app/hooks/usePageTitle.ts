import { useEffect } from 'react';

const APP_NAME = 'PingwinPost';

export function usePageTitle(title?: string | null) {
  useEffect(() => {
    document.title = title && title.trim().length > 0 ? `${title} | ${APP_NAME}` : APP_NAME;
  }, [title]);
}

