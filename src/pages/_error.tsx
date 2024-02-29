import Link from 'next/link';
import { GetStaticProps } from 'next/types';
import { useEffect } from 'react';

export default function CustomErrorPage() {
  useEffect(() => {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });

    caches.keys().then((keys) => {
      keys.forEach((key) => {
        caches.delete(key);
      });
    });
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100vw',
        minHeight: '100vh',
      }}
    >
      <div>
        <h1 style={{ fontSize: '1rem' }}>Symbol Community Web</h1>
        <p style={{ fontSize: '1rem' }}>
          An unexpected error has occurred. Please reset your browser cache or reload your browser.
        </p>
        <p style={{ fontSize: '1rem' }}>
          予期しないエラーが発生しました。ブラウザのキャッシュをリセットするか、ブラウザをリロードして下さい。
        </p>
        <Link href={'/'}>HOME</Link>
      </div>
    </div>
  );
}

export const getStaticProps: GetStaticProps<{}> = async () => {
  return {
    props: {},
  };
};
