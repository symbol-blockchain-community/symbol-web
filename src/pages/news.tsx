/*

  Symbol関連の情報のうち、公的な情報の取り扱いページ（インデックス側のページ）

*/
import news from '@/assets/icon/news.svg';
import MainBackground from '@/components/atom/MainBackground';
import { PageTitle } from '@/components/atom/Titles';
import Footer from '@/components/moleculs/Footer';
import Header from '@/components/moleculs/Header';
import MediaCard from '@/components/moleculs/MediaCard';
import { lang, langSelecter } from '@/languages';
import { findNewsRelease } from '@/services/StrapiService';
import { NewsReleaseFindResponse } from '@/types/StrapiModel';
import { NAVIGATIONS } from '@/types/navigations';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Head from 'next/head';
import Image from 'next/image';
import { GetServerSideProps, NextPage } from 'next/types';
import { useState } from 'react';

interface Props {
  i18n: lang['news'];
  newsReleases: NewsReleaseFindResponse['data'];
  locale: string;
}

const News: NextPage<Props> = ({ i18n, newsReleases, locale }) => {
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.between('xs', 'md'));
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [docs, setDocs] = useState<NewsReleaseFindResponse['data']>(newsReleases);
  const [lastPage, setLastPage] = useState<boolean>(false);

  const handleAddDocuments = () => {
    const _currentPage = currentPage + 1;
    findNewsRelease(locale, { isIncludeMedia: true, page: _currentPage }).then((articles) => {
      articles.data = articles.data.map((article) => {
        article.attributes.body = 'deleted';
        article.attributes.localizations.data = [];
        return article;
      });

      setCurrentPage(_currentPage);
      setDocs([...docs, ...articles.data]);
      if (articles.meta.pagination.pageCount === articles.meta.pagination.page) {
        setLastPage(true);
      }
    });
  };

  return (
    <>
      <Head>
        <title>{i18n.meta_page_title}</title>
        <meta name='description' content={i18n.meta_page_description} />
        <meta name='twitter:title' content={i18n.meta_page_title} />
        <meta name='twitter:description' content={i18n.meta_page_description} />
      </Head>
      <Header />
      <Toolbar style={{ marginTop: '20px' }} />
      <Container maxWidth='lg'>
        <MainBackground />
        <Grid container spacing={1} style={{ height: '70vh' }}>
          <Grid item xs={12} sm={12} md={1}></Grid>
          <Grid item xs={12} sm={12} md={6}>
            <div style={{ display: 'flex', height: '100%', flexDirection: 'column', justifyContent: 'center' }}>
              <PageTitle style={{ textAlign: matches ? 'center' : 'left' }}>{i18n.page_title}</PageTitle>
              <Typography variant='body1' style={{ textAlign: matches ? 'center' : 'left' }}>
                {i18n.page_title_description}
              </Typography>
            </div>
          </Grid>
          <Grid item xs={12} sm={12} md={4}>
            <div style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
              <Image height={200} width={200} src={news} alt='news page icon' />
            </div>
          </Grid>
        </Grid>
        <Grid container spacing={5} style={{ marginTop: '5vh' }}>
          {docs.length === 0 && (
            <Grid item xs={12}>
              <Typography align='left'>{i18n.no_articles}</Typography>
            </Grid>
          )}
          {docs.map((item, index) => (
            <Grid item key={index} xs={12} sm={6} md={4}>
              <MediaCard
                title={item.attributes.title}
                description={item.attributes.description}
                date={item.attributes.publishedAt}
                locale={locale}
                image={`${process.env.NEXT_PUBLIC_API_URL}${item.attributes.headerImage?.data.attributes.url}`}
                tweetLink={`${process.env.NEXT_PUBLIC_HOSTING_URL}${NAVIGATIONS.NEWS}/${item.id}`}
                link={`${NAVIGATIONS.NEWS}/${item.id}`}
                style={{ height: '100%' }}
              />
            </Grid>
          ))}
          {!lastPage && (
            <Grid item xs={12}>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <Button onClick={handleAddDocuments} fullWidth variant='outlined' style={{ maxWidth: '600px' }}>
                  Next
                </Button>
              </div>
            </Grid>
          )}
        </Grid>
        <Footer />
      </Container>
    </>
  );
};

const getServerSideProps: GetServerSideProps<Props> = async ({ locale, defaultLocale }) => {
  const articles = await findNewsRelease(locale, { isIncludeMedia: true, page: 1 });
  articles.data = articles.data.map((article) => {
    article.attributes.body = 'deleted';
    article.attributes.localizations.data = [];
    return article;
  });
  return {
    props: {
      locale: locale || defaultLocale || 'en',
      i18n: langSelecter(locale).news,
      newsReleases: articles.data,
    },
  };
};

export { getServerSideProps };
export default News;
