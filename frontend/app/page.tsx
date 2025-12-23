import { TopNav } from "@/components/TopNav";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { NegotiationTable } from "@/components/NegotiationTable";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-page text-foreground">
      <TopNav />
      <div className="h-16" />
      <Hero />
      <HowItWorks />
      <NegotiationTable />
      <Footer />
    </div>
  );
}
