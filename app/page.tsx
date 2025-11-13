"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/utils/supabase/client";
import { signOut } from "./actions/auth";
import { User } from "@supabase/supabase-js";
import {
  Receipt,
  CreditCard,
  FileText,
  BarChart3,
  CheckCircle,
  Zap,
  Shield,
  ArrowRight,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pricing } from "@/components/ui/pricing";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const pricingPlans = [
  {
    name: "STARTER",
    price: "0",
    yearlyPrice: "0",
    period: "per month",
    features: [
      "Up to 50 transactions/month",
      "Basic receipt scanning",
      "CSV export",
      "Email support",
      "1 bank connection",
    ],
    description: "Perfect for individuals starting their tax journey",
    buttonText: "Start Free",
    href: "/sign-up",
    isPopular: false,
  },
  {
    name: "PROFESSIONAL",
    price: "19",
    yearlyPrice: "15",
    period: "per month",
    features: [
      "Unlimited transactions",
      "Advanced OCR receipt scanning",
      "Multiple export formats",
      "Priority support",
      "Up to 5 bank connections",
      "Expense categorization",
      "Custom tax reports",
    ],
    description: "Ideal for freelancers and small business owners",
    buttonText: "Get Started",
    href: "/sign-up",
    isPopular: true,
  },
  {
    name: "ENTERPRISE",
    price: "49",
    yearlyPrice: "39",
    period: "per month",
    features: [
      "Everything in Professional",
      "Unlimited bank connections",
      "Dedicated account manager",
      "Phone support",
      "Custom integrations",
      "Multi-user access",
      "API access",
      "Accountant collaboration",
    ],
    description: "For businesses with advanced tax preparation needs",
    buttonText: "Contact Sales",
    href: "/sign-up",
    isPopular: false,
  },
];

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const benefitsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Hero animations
    const ctx = gsap.context(() => {
      gsap.from(badgeRef.current, {
        opacity: 0,
        y: -20,
        duration: 0.6,
        ease: "power3.out",
      });

      gsap.from(titleRef.current, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        delay: 0.2,
        ease: "power3.out",
      });

      gsap.from(subtitleRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.8,
        delay: 0.4,
        ease: "power3.out",
      });

      gsap.from(buttonsRef.current?.children || [], {
        opacity: 0,
        y: 20,
        duration: 0.6,
        delay: 0.6,
        stagger: 0.1,
        ease: "power3.out",
      });

      // Feature cards animation
      gsap.from(featuresRef.current?.querySelectorAll(".feature-card") || [], {
        scrollTrigger: {
          trigger: featuresRef.current,
          start: "top 80%",
        },
        opacity: 0,
        y: 50,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out",
      });

      // Benefits animation
      gsap.from(benefitsRef.current?.querySelectorAll(".benefit-card") || [], {
        scrollTrigger: {
          trigger: benefitsRef.current,
          start: "top 80%",
        },
        opacity: 0,
        scale: 0.9,
        duration: 0.8,
        stagger: 0.2,
        ease: "back.out(1.7)",
      });
    });

    return () => ctx.revert();
  }, []);

  async function handleSignOut() {
    await signOut();
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full  bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">TaxReady</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {loading ? (
              <div className="h-10 w-20 animate-pulse rounded-md bg-muted" />
            ) : user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
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
              </>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/sign-up">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section ref={heroRef} className="container flex flex-col items-center gap-8 py-20 text-center md:py-32">
        <div className="flex flex-col items-center gap-4">
          <div ref={badgeRef} className="inline-flex items-center rounded-full border px-3 py-1 text-sm">
            <Zap className="mr-2 h-4 w-4 text-yellow-500" />
            Professional Expense Tracking for Tax Season
          </div>
          <h1 ref={titleRef} className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Simplify Your Tax Prep with{" "}
            <span className="text-primary">TaxReady</span>
          </h1>
          <p ref={subtitleRef} className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Track expenses, manage receipts, and export tax-ready reports with
            ease. Connect your bank accounts and let us handle the heavy
            lifting.
          </p>
        </div>
        <div ref={buttonsRef} className="flex flex-col gap-4 sm:flex-row">
          {user ? (
            <Link href="/dashboard">
              <Button size="lg" className="gap-2">
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Link href="/sign-up">
              <Button size="lg" className="gap-2">
                Start Tracking Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <Button size="lg" variant="outline">
            Watch Demo
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="container py-20">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Everything You Need for Tax Season
          </h2>
          <p className="text-lg text-muted-foreground">
            All the tools to organize your expenses and prepare for filing
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="feature-card">
            <CardContent className="pt-6">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">
                Transaction Tracking
              </h3>
              <p className="text-muted-foreground">
                Automatically import and categorize transactions from your bank
                accounts
              </p>
            </CardContent>
          </Card>
          <Card className="feature-card">
            <CardContent className="pt-6">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Receipt className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Receipt Management</h3>
              <p className="text-muted-foreground">
                Upload, organize, and link receipt images to transactions with
                ease
              </p>
            </CardContent>
          </Card>
          <Card className="feature-card">
            <CardContent className="pt-6">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">
                Tax-Ready Reports
              </h3>
              <p className="text-muted-foreground">
                Export your expenses in CSV, JSON, or PDF format for your
                accountant
              </p>
            </CardContent>
          </Card>
          <Card className="feature-card">
            <CardContent className="pt-6">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">
                Expense Analytics
              </h3>
              <p className="text-muted-foreground">
                Get insights into your spending patterns and tax-deductible
                expenses
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section ref={benefitsRef} className="border-t bg-muted/50 py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Why Choose TaxReady?
            </h2>
            <p className="text-lg text-muted-foreground">
              Built for freelancers, small businesses, and anyone who wants
              stress-free tax prep
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="benefit-card flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Easy to Use</h3>
              <p className="text-muted-foreground">
                Intuitive interface that requires no accounting knowledge.
                Start tracking in minutes.
              </p>
            </div>
            <div className="benefit-card flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
                <Zap className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Bank Sync</h3>
              <p className="text-muted-foreground">
                Connect to 10,000+ banks via Plaid for automatic transaction
                imports.
              </p>
            </div>
            <div className="benefit-card flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10">
                <Shield className="h-8 w-8 text-purple-500" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Secure & Private</h3>
              <p className="text-muted-foreground">
                Bank-level encryption and security. Your data is always safe
                and private.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <Pricing
          plans={pricingPlans}
          title="Simple, Transparent Pricing"
          description="Choose the plan that works for you&#10;All plans include secure data storage, automatic backups, and easy tax export features."
        />
      </section>

      {/* CTA Section */}
      <section className="container py-20">
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="flex flex-col items-center gap-6 py-12 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Ready to Get Tax-Ready?
            </h2>
            <p className="max-w-xl text-lg text-muted-foreground">
              Join thousands of users who have simplified their expense
              tracking and tax preparation with TaxReady.
            </p>
            {user ? (
              <Link href="/dashboard">
                <Button size="lg" className="gap-2">
                  Go to Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/sign-up">
                <Button size="lg" className="gap-2">
                  Start Your Free Trial <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            <span className="font-semibold">TaxReady</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 TaxReady. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
