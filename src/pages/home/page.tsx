import Navbar from '@/components/feature/Navbar';
import HeroSection from './components/HeroSection';
import HowItWorks from './components/HowItWorks';
import Categories from './components/Categories';
import SecuritySection from './components/SecuritySection';
import WhyDFP from './components/WhyDFP';
import FAQPreview from './components/FAQPreview';
import Footer from './components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-dfp-stone-50">
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <Categories />
      <SecuritySection />
      <WhyDFP />
      <FAQPreview />
      <Footer />
    </main>
  );
}