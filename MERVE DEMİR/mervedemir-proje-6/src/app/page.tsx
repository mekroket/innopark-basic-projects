import Navbar from "@/components/Navbar/Navbar";
import Hero from "@/components/Hero/Hero";
import SocialBar from "@/components/SocialBar/SocialBar";
import PortfolioSections from "@/components/Sections/PortfolioSections";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <SocialBar />
      <PortfolioSections />
    </main>
  );
}