import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileIcon, FolderIcon, ShieldCheckIcon } from 'lucide-react';

export function LandingHero() {
  return (
    <section className="px-4 py-16 md:py-24 lg:py-32 overflow-hidden">
      <div className="container flex flex-col items-center justify-center space-y-4 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
            Your Files, <span className="text-primary">Secure & Organized</span>
          </h1>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
            Store, manage, and access your files from anywhere with our secure cloud storage solution.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          
          <Button asChild size="lg" variant="outline">
          <Link href="/login">Login</Link>
          </Button>
          <Button asChild size="lg" className="animate-fade-in">
            <Link href="/register">Sign Up</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}