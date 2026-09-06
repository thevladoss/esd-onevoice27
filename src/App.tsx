import { SkipLink } from "./components/layout/SkipLink";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { Hero } from "./components/hero/Hero";
import { MapBand } from "./components/map/MapBand";
import { About } from "./components/about/About";
import { Involve } from "./components/involve/Involve";
import { News } from "./components/news/News";
import { Resources } from "./components/resources/Resources";
import { Quote } from "./components/quote/Quote";

function App() {
  return (
    <>
      <SkipLink />
      <Header />
      {/* tabIndex={-1}: без него Safari и Firefox не переводят фокус на цель
          ссылки пропуска, и следующий Tab уходит обратно в шапку. */}
      <main id="main" tabIndex={-1}>
        <Hero />
        <MapBand />
        <About />
        <Involve />
        <News />
        <Resources />
        <Quote />
      </main>
      <Footer />
    </>
  );
}

export default App;
