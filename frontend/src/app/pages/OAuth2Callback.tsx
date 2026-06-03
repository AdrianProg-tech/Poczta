import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppStateContext } from '../state/AppStateContext';
import { getDashboardPath } from '../navigation';
import { usePageTitle } from '../hooks/usePageTitle';

export default function OAuth2Callback() {
  const { t } = useTranslation();
  usePageTitle(t('oauth2Callback.loggingIn'));
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAppStateContext();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error || !token) {
      navigate('/login?error=' + (error ?? 'oauth2_failed'), { replace: true });
      return;
    }

    loginWithToken(token)
      .then((role) => {
        navigate(getDashboardPath(role), { replace: true });
      })
      .catch(() => {
        navigate('/login?error=oauth2_failed', { replace: true });
      });
  }, [loginWithToken, navigate, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary to-primary/90">
      <div className="text-center text-white">
        <Package className="mx-auto mb-4 h-12 w-12 animate-pulse" />
        <p className="text-lg">{t('oauth2Callback.loggingIn')}</p>
      </div>
    </div>
  );
}
