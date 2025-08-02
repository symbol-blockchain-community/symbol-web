/*

  コミュニティの情報を表示するページ（ページインデックスの表示ページ）

*/
import IconCommunity from '@/assets/icon/community.svg';
import IconPoll from '@/assets/icon/selection.svg';
import MainBackground from '@/components/atom/MainBackground';
import { PageTitle, SectionTitle } from '@/components/atom/Titles';
import AvatarLinkList from '@/components/moleculs/AvatarLinkList';
import Footer from '@/components/moleculs/Footer';
import Header from '@/components/moleculs/Header';
import MediaCard from '@/components/moleculs/MediaCard';
import { lang, langSelecter } from '@/languages';
import { findCommunityRelease, findSpaceRelease } from '@/services/StrapiService';
import { switchCommunityPlatformToLogo } from '@/services/UtilService';
import { NAVIGATIONS } from '@/types/navigations';
import { CommunityReleaseFindResponse, SpaceFindResponse } from '@/types/StrapiModel';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material/styles';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { GetServerSideProps, NextPage } from 'next/types';
import { useState } from 'react';

interface Props {
  i18n: lang['community'];
  communityReleases: CommunityReleaseFindResponse['data'];
  spaces: SpaceFindResponse['data'];
  locale: string;
}

const Community: NextPage<Props> = ({ i18n, communityReleases, spaces, locale }) => {
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.between('xs', 'md'));
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [docs, setDocs] = useState<CommunityReleaseFindResponse['data']>(communityReleases);
  const [lastPage, setLastPage] = useState<boolean>(false);

  const handleAddDocuments = () => {
    const _currentPage = currentPage + 1;
    findCommunityRelease(locale, { isIncludeMedia: true, page: _currentPage }).then((articles) => {
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
      <div style={{ marginBottom: '5vh' }}>
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
                <Image height={200} width={200} src={IconCommunity} alt='community icon' />
              </div>
            </Grid>
          </Grid>
          {/* List of chat room */}
          <SectionTitle>{i18n.community_introduce_section1}</SectionTitle>
          <AvatarLinkList
            items={spaces
              .filter((e) => e.attributes.category === 'chat')
              .map((e) => {
                return {
                  avatar: switchCommunityPlatformToLogo(e.attributes.platform),
                  avatarAlt: e.attributes.title,
                  title: e.attributes.title,
                  body: e.attributes.body,
                  url: e.attributes.url,
                };
              })}
          />
          {/* List of twitter */}
          <SectionTitle style={{ marginTop: '2rem' }}>{i18n.community_introduce_section2}</SectionTitle>
          <AvatarLinkList
            items={spaces
              .filter((e) => e.attributes.category === 'sns')
              .map((e) => {
                return {
                  avatar: switchCommunityPlatformToLogo(e.attributes.platform),
                  avatarAlt: e.attributes.title,
                  title: e.attributes.title,
                  body: e.attributes.body,
                  url: e.attributes.url,
                };
              })}
          />
          {/* List of blog & forum */}
          <SectionTitle style={{ marginTop: '2rem' }}>{i18n.community_introduce_section3}</SectionTitle>
          <AvatarLinkList
            items={spaces
              .filter((e) => e.attributes.category === 'blog')
              .map((e) => {
                return {
                  avatar: switchCommunityPlatformToLogo(e.attributes.platform),
                  avatarAlt: e.attributes.title,
                  title: e.attributes.title,
                  body: e.attributes.body,
                  url: e.attributes.url,
                };
              })}
          />
          {/* Symbol poll */}
          <SectionTitle style={{ marginTop: '2rem' }}>Symbol Importance Poll</SectionTitle>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={12} md={6}>
              <div style={{ minHeight: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Button
                  LinkComponent={Link}
                  href={NAVIGATIONS.SYMBOL_POLL.INDEX}
                  style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
                >
                  Go to poll page
                </Button>
              </div>
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <div style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                <Image height={150} width={150} src={IconPoll} alt='poll icon' />
              </div>
            </Grid>
          </Grid>
          {/* community release list */}
          <PageTitle>{i18n.section_title_release}</PageTitle>
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
                  image={
                    item.attributes.headerImage?.data?.attributes?.url
                      ? `${process.env.NEXT_PUBLIC_API_URL}${item.attributes.headerImage.data.attributes.url}`
                      : undefined
                  }
                  tweetLink={`${process.env.NEXT_PUBLIC_HOSTING_URL}${NAVIGATIONS.COMMUNITY}/${item.id}`}
                  link={`${NAVIGATIONS.COMMUNITY}/${item.id}`}
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
      </div>
    </>
  );
};

const getServerSideProps: GetServerSideProps<Props> = async ({ locale, defaultLocale }) => {
  const articles = await findCommunityRelease(locale, { isIncludeMedia: true, page: 1 });
  articles.data = articles.data.map((article) => {
    article.attributes.body = 'deleted';
    article.attributes.localizations.data = [];
    return article;
  });
  const spaceArticles = await findSpaceRelease(locale, { isIncludeMedia: true });
  const spaces = [...spaceArticles.data].reverse();
  return {
    props: {
      locale: locale || defaultLocale || 'en',
      i18n: langSelecter(locale).community,
      communityReleases: articles.data,
      spaces: spaces,
    },
  };
};

export { getServerSideProps };
export default Community;
