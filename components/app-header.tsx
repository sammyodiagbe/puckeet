"use client";

import { Bell, Menu, Search, Plus, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { signOut } from "@/app/actions/auth";
import { User } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppHeaderProps {
  onMenuClick?: () => void;
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await signOut();
  }

  return (
    <header className="flex h-20 items-center gap-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-8">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search or type a command"
            className="w-full bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 pl-10 h-11 rounded-lg focus-visible:ring-blue-500"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded bg-zinc-100 dark:bg-zinc-800 px-2 font-mono text-xs text-zinc-600 dark:text-zinc-400">
            ⌘ F
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-10 px-4">
          <Plus className="mr-2 h-4 w-4" />
          New Transaction
        </Button>

        <ThemeToggle />

        <Button variant="ghost" size="icon" className="relative rounded-lg">
          <Bell className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
        </Button>

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
                <UserIcon className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">My Account</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
