"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  FileText,
  Settings,
  CreditCard,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import gsap from "gsap";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Transactions", href: "/transactions", icon: CreditCard },
  { name: "Receipts", href: "/receipts", icon: Receipt },
  { name: "Reports", href: "/reports", icon: FileText },
];

const settings = [
  { name: "Bank Sync", href: "/settings/bank-sync", icon: Settings },
  { name: "Profile", href: "/settings/profile", icon: User },
];

export function AppSidebar() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, {
        opacity: 0,
        x: -20,
        duration: 0.6,
        ease: "power3.out",
      });

      gsap.from(navRef.current?.children || [], {
        opacity: 0,
        x: -20,
        duration: 0.5,
        stagger: 0.1,
        delay: 0.2,
        ease: "power3.out",
      });

      gsap.from(settingsRef.current?.querySelectorAll("button") || [], {
        opacity: 0,
        x: -20,
        duration: 0.5,
        stagger: 0.1,
        delay: 0.5,
        ease: "power3.out",
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="flex h-full w-64 flex-col border-r bg-white dark:bg-zinc-950 p-6">
      <div ref={headerRef} className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">TaxReady</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Expense Tracker</p>
      </div>

      <nav ref={navRef} className="flex-1 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center w-full px-4 py-2.5 rounded-lg h-11 font-medium transition-colors",
                "text-zinc-700 dark:text-zinc-300",
                "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                isActive && "bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-4" />

      <div ref={settingsRef} className="space-y-2 pb-4">
        {settings.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center w-full px-4 py-2.5 rounded-lg h-11 font-medium transition-colors",
                "text-zinc-700 dark:text-zinc-300",
                "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                isActive && "bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
