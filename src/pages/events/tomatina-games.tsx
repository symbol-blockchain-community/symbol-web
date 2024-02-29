import CosignatureBattleGameImage from '@/assets/events/tomatina/cosignature-battle-game.webp';
import MikunTomatoToken from '@/assets/events/tomatina/mikun-tomato-token.webp';
import TomatinaMosaicCenterImage from '@/assets/events/tomatina/mosaic-center.webp';
import PasomiTomatoImage from '@/assets/events/tomatina/pasomi-tomato.webp';
import TomatinaTwitterHeader from '@/assets/events/tomatina/symbol-tomatina-header.png';
import TomatinaGraphImage from '@/assets/events/tomatina/tomatina-graph.webp';
import TomatinaHirobaImage from '@/assets/events/tomatina/tomatina-hiroba.webp';
import TomatinaOpeningLine from '@/assets/events/tomatina/tomatina-opening-line.webp';
import ThrowTomatoImage from '@/assets/events/tomatina/tomato-icon.webp';
import TomatoVsPotato from '@/assets/events/tomatina/tomato-vs-potato.webp';
import TomatoImage from '@/assets/events/tomatina/tomato.png';
import TreasureImage from '@/assets/events/tomatina/treasure.webp';
import WellcomeToSymbolTomatina from '@/assets/events/tomatina/wellcome-to-symbol-tomatina.webp';
import InViewAnimation from '@/components/atom/InViewAnimation';
import Footer from '@/components/moleculs/Footer';
import Header from '@/components/moleculs/Header';
import MediaCard from '@/components/moleculs/MediaCard';
import { lang, langSelecter } from '@/languages';
import styled from '@emotion/styled';
import ButtonBase from '@mui/material/ButtonBase';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { GetStaticProps, NextPage } from 'next/types';
import { useState } from 'react';

interface Props {
  i18n: lang['index'];
}

const FancyTomato = styled('div')({
  animation: '10s linear 10s infinite alternate fancy_tomato',
  overflow: 'hidden',
  zIndex: -1,
  opacity: 0,
  '@keyframes fancy_tomato': {
    '0%': {
      transform: 'translateX(4000px)',
      opacity: 0,
    },
    '40%': {
      transform: 'translateX(4000px)',
      opacity: 1,
    },
    '60%': {
      transform: 'translateX(-4000px)',
      opacity: 1,
    },
    '100%': {
      transform: 'translateX(-4000px)',
      opacity: 0,
    },
  },
});

function ThrowTomato(props: { num: number }) {
  return (
    <FancyTomato
      style={{
        rotate: `${[10, 23, 25, 40, 60, 70, 88][props.num] * 10 * 10}deg`,
        animationDelay: `${[1, 2.3, 2.5, 4.0, 6.0, 7.0, 8.8][props.num] * 10}s`,
      }}
    >
      <Image style={{ zIndex: -1 }} src={ThrowTomatoImage.src} alt='throw tomato' width={200} height={200} />
    </FancyTomato>
  );
}

const TomatinaEvent: NextPage<Props> = ({ i18n }) => {
  const [draggedElement, setDraggedElement] = useState<string>('');
  return (
    <>
      <Head>
        <title>{`Tomatina Games | ${i18n.meta_page_title}`}</title>
        <meta name='description' content={'Symbol トマティーナで用意されたゲーム一覧です'} />
        <meta name='twitter:title' content={`Tomatina | ${i18n.meta_page_title}`} />
        <meta name='twitter:description' content={'Symbol トマティーナで用意されたゲーム一覧です'} />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:image' content={`${process.env.NEXT_PUBLIC_HOSTING_URL}${TomatinaTwitterHeader.src}`} />
      </Head>
      <Header />
      <Toolbar style={{ marginTop: '20px' }} />
      <div style={{ position: 'fixed', zIndex: -2 }}>
        {new Array(6).fill(0).map((_, i) => (
          <ThrowTomato num={i} key={i} />
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 0,
          height: '100svh',
          width: '100%',
          zIndex: -1,
          backgroundImage: `url(${TomatoImage.src})`,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          filter: 'brightness(40%)',
          backgroundPosition: 'center bottom',
        }}
      />
      <Container maxWidth='lg' style={{ marginBottom: '5vh', marginTop: '5vh' }}>
        <Typography variant='h4' fontWeight={'bold'} gutterBottom>
          ゲーム楽しもう
        </Typography>
        <Typography variant='body1' style={{ marginBottom: '1rem' }}>
          現在公開されているゲームを掲載しております。プレイ方法、ルールなどは各ゲームのページをご覧ください。
        </Typography>
        <Grid container spacing={3} alignItems={'stretch'}>
          {[
            {
              title: 'とまとめぐり',
              description:
                'まちめぐりアプリを使って日本全国にある道の駅を巡る事で、8/30 に投げる事ができる限定トマトNFTを取得できます！',
              date: '2023/07/30',
              locale: 'ja',
              image: TomatinaOpeningLine.src,
              link: 'https://machimeguri.app/tomato',
            },
            {
              title: 'pasomi🍅tomato',
              description: 'トマティーナで使えるトマトを貰えます',
              date: '2023/07/30',
              locale: 'ja',
              image: PasomiTomatoImage.src,
              link: 'http://pasomi.net:100/',
            },
            {
              title: 'mikun🍅tomato',
              description: 'トマティーナで使えるトマトを貰えます',
              date: '2023/07/30',
              locale: 'ja',
              image: MikunTomatoToken.src,
              link: 'https://twitter.com/mikunnem/status/1688856900266516480?s=61&t=0B83C_Wk16DPWwLi3DDo1Q',
            },
            {
              title: 'mosaic viewer',
              description: '受け取ったモザイクの画像を楽しめます',
              date: '2023/07/30',
              locale: 'ja',
              image: TomatoImage.src,
              link: 'https://ventus-wallet.tk/Mosaic_Viewer',
            },
            {
              title: 'Wellcome to Symbol Tomatina',
              description: 'オリジナルのトマトを作ることができます',
              date: '2023/07/30',
              locale: 'ja',
              image: WellcomeToSymbolTomatina.src,
              link: 'https://symbol-tomatia.netlify.app/',
            },
            {
              title: 'Tomatina Monitor',
              description: 'トマティーナの状況をリアルタイムで確認できます',
              date: '2023/07/30',
              locale: 'ja',
              image: TomatinaGraphImage.src,
              link: 'https://ishidad2.github.io/tomatina/',
            },
            {
              title: 'MOSAIC CENTER',
              description: 'Symbol 上のあらゆる MOSAIC を確認できます',
              date: '2023/07/30',
              locale: 'ja',
              image: TomatinaMosaicCenterImage.src,
              link: 'https://mosaic-center.tk/',
            },
            {
              title: '転XYM 連署でトマトを投げつけよう！',
              description: 'ブロックチェーンでマルチシグを組んで協働でモンスターを倒そう！協力型ゲーム',
              date: '2023/07/30',
              locale: 'ja',
              image: CosignatureBattleGameImage.src,
              link: 'https://twitter.com/subarumansp/status/1693477209124839919?s=61&t=0B83C_Wk16DPWwLi3DDo1Q',
            },
            {
              title: 'トマティーナ広場',
              description: '（注意：本ゲームはメインネット版です）2022年の名作。トマトを投げて投げて投げまくるゲーム',
              date: '2023/07/30',
              locale: 'ja',
              image: TomatinaHirobaImage.src,
              link: 'http://feiton.xsrv.jp/Tomato/',
            },
          ].map((item, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <InViewAnimation direction='up' threshold={0.2} style={{ height: '100%' }}>
                <MediaCard
                  title={item.title}
                  date={item.date}
                  description={item.description}
                  locale={item.locale}
                  image={item.image}
                  link={item.link}
                  tweetLink={item.link}
                  style={{ height: '100%' }}
                />
              </InViewAnimation>
            </Grid>
          ))}
        </Grid>
        <div style={{ height: '5svh' }} />
        <InViewAnimation style={{ width: '100%' }}>
          <Typography variant='h4' fontWeight={'bold'} gutterBottom>
            Side Event
          </Typography>
          <div style={{ marginTop: '3rem', marginBottom: '3rem' }}>
            <Typography variant='h6' fontWeight={'bold'} gutterBottom>
              Tomatina vs Potatina
            </Typography>
            <Typography variant='body1' style={{ marginBottom: '1rem' }}>
              Symbol Tomatina へあの人々が遊びに来る！？ どちらの陣営が多くのトランザクションを発生させるのか...
              勝負だ！！
            </Typography>
            <Stack alignItems='center' justifyContent='center' style={{ height: '60vh' }}>
              <ButtonBase
                LinkComponent={Link}
                href='/events/potatina'
                style={{ width: '90%', height: '55vh', transition: 'all 0.5s ease' }}
                onMouseOver={(e) => {
                  e.currentTarget.style.width = '100%';
                  e.currentTarget.style.height = '60vh';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.width = '90%';
                  e.currentTarget.style.height = '55vh';
                }}
              >
                <Image
                  fill
                  priority={false}
                  sizes='100%'
                  alt={'side event tomatina vs potatina'}
                  src={TomatoVsPotato.src}
                  style={{ objectFit: 'cover', borderRadius: '10px' }}
                />
              </ButtonBase>
            </Stack>
          </div>
          <div style={{ marginTop: '3rem', marginBottom: '3rem' }}>
            <Typography variant='h6' fontWeight={'bold'} gutterBottom>
              隠しトマトを見つけよう
            </Typography>
            <Typography variant='body1' style={{ marginBottom: '1rem' }}>
              このページに私はトマトを隠しました。見つける事ができるかな？
            </Typography>
            <Stack justifyContent={'center'} alignItems={'center'}>
              <Image
                onDrop={() => {
                  if (draggedElement === 'j2dj1ka') {
                    alert('ヨク... ミツケタネ？...');
                    window.open('/treasure-mp.jpeg');
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
                alt='treasure image'
                src={TreasureImage}
                height={250}
                width={250}
              />
            </Stack>
          </div>
        </InViewAnimation>
      </Container>
      <section style={{ marginTop: '100px' }}>
        <Container maxWidth={'lg'}>
          <Footer />
        </Container>
      </section>
    </>
  );
};

const getStaticProps: GetStaticProps<Props> = async ({ locale, defaultLocale }) => {
  return {
    props: {
      i18n: langSelecter(locale).index,
    },
  };
};

export { getStaticProps };
export default TomatinaEvent;
