"use client";

import { Bell, Menu, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserButton } from "@clerk/nextjs";

interface AppHeaderProps {
  onMenuClick?: () => void;
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
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

        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "h-10 w-10"
            }
          }}
        />
      </div>
    </header>
  );
}
