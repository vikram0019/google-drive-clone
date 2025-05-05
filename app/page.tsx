import { LandingHero } from '@/components/landing/hero';
import { LandingHeader } from '@/components/landing/header';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />
      <main className="flex-grow">
        <LandingHero />
      </main>
    </div>
  );
}