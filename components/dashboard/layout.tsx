'use client';

import { ReactNode, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { ModeToggle } from '@/components/mode-toggle';
import {
  FileIcon,
  LogOut,
  Menu,
  X,
  User,
  FolderIcon,
  Home,
  Settings,
  Star,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

export function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    toast({
      title: 'Signed out',
      description: 'You have been signed out successfully.',
    });
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const sidebarLinks = [
    { href: '/dashboard', icon: <Home className="h-5 w-5" />, label: 'Home' },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile sidebar toggle */}
      <Button
        variant="outline"
        size="icon"
        onClick={toggleSidebar}
        className="fixed left-4 top-4 z-50 md:hidden"
      >
        {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <div
        className={`${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-40 w-64 transform overflow-y-auto border-r bg-background transition-transform duration-200 ease-in-out md:relative md:translate-x-0`}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <FileIcon className="h-6 w-6 text-primary" />
            <span className="font-semibold text-xl">Drive Clone</span>
          </div>
          <ModeToggle />
        </div>
        <Separator />
        <ScrollArea className="flex-1 p-4">
          <nav className="space-y-2">
            {sidebarLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-2 rounded-md px-3 py-2 transition-colors hover:bg-muted ${
                  pathname === link.href
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'text-foreground hover:bg-background'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-8">
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">Storage</h3>
            <div className="mb-2 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">3.2GB of 10GB used</span>
                <span className="text-xs font-medium">32%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[32%] bg-primary" />
              </div>
            </div>
          </div>
        </ScrollArea>
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {session?.user?.name || 'User'}
              </span>
              <span className="text-xs text-muted-foreground">
                {session?.user?.email || 'user@example.com'}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            className="mt-4 w-full justify-start"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}