import createEmotionCache from '@/services/createEmotionCache';
import theme from '@/services/theme';
import { CacheProvider, EmotionCache } from '@emotion/react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { AppProps } from 'next/app';
import Head from 'next/head';
import { GoogleAnalytics } from 'nextjs-google-analytics';

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
}

if (
  !process.env.NEXT_PUBLIC_API_URL ||
  !process.env.NEXT_PUBLIC_HOSTING_URL ||
  !process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
) {
  throw new Error('Environment variable is not set');
}

export default function MyApp(props: MyAppProps) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;

  // // キャッシュ削除を強制したいとき
  // useEffect(() => {
  //   navigator.serviceWorker.getRegistrations().then((registrations) => {
  //     for (const registration of registrations) {
  //       registration.unregister();
  //     }
  //   });

  //   caches.keys().then((keys) => {
  //     keys.forEach((key) => {
  //       caches.delete(key);
  //     });
  //   });
  // }, []);

  return (
    <CacheProvider value={emotionCache}>
      <GoogleAnalytics trackPageViews gaMeasurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
      <Head>
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:site' content='@faunsu19000' />
        <meta name='twitter:image' content={`${process.env.NEXT_PUBLIC_HOSTING_URL || ''}/twitter-card.png`} />
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Component {...pageProps} />
      </ThemeProvider>
    </CacheProvider>
  );
}
