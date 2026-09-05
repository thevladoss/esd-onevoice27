import { SkipLink } from "./components/layout/SkipLink";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { Hero } from "./components/hero/Hero";
import { MapSection } from "./components/map/MapSection";
import { LightForm } from "./components/form/LightForm";
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
      <main id="main">
        <Hero />
        <MapSection />
        <LightForm />
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
