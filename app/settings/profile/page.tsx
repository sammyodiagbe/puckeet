"use client";

import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Crown } from "lucide-react";
import { useUserStore } from "@/lib/stores/user-store";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function ProfilePage() {
  const { user: localUser } = useUserStore();
  const { user: clerkUser } = useUser();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center mb-4">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-primary-foreground text-3xl font-bold">
                  {clerkUser?.firstName?.charAt(0) || localUser?.name?.charAt(0) || "U"}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Full Name</p>
                  <p className="text-lg font-medium">
                    {clerkUser?.firstName} {clerkUser?.lastName}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email Address</p>
                  <p className="text-lg font-medium">
                    {clerkUser?.primaryEmailAddress?.emailAddress}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">User ID</p>
                  <p className="text-sm font-mono text-muted-foreground">
                    {clerkUser?.id}
                  </p>
                </div>
              </div>

              <Separator />

              <p className="text-sm text-muted-foreground">
                To update your name, email, or password, use the Clerk user management.
              </p>

              <Link href="https://clerk.com/docs/users/overview" target="_blank">
                <Button variant="outline" className="w-full">
                  Manage Account with Clerk
                </Button>
              </Link>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-yellow-500" />
                    <span className="font-semibold">Current Plan</span>
                  </div>
                  <Badge className="capitalize">{localUser?.subscriptionTier}</Badge>
                </div>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Unlimited transactions
                    </span>
                    <span className="text-green-500">✓</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Receipt management
                    </span>
                    <span className="text-green-500">✓</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Bank sync (Plaid)
                    </span>
                    <span className="text-green-500">✓</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Export reports
                    </span>
                    <span className="text-green-500">✓</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Priority support
                    </span>
                    <span className="text-green-500">✓</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  Manage Subscription
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Clerk provides built-in security features including password management
                  and two-factor authentication.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Password Protection</p>
                      <p className="text-sm text-muted-foreground">
                        Managed by Clerk
                      </p>
                    </div>
                    <Badge variant="outline">Active</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Email Verification</p>
                      <p className="text-sm text-muted-foreground">
                        {clerkUser?.primaryEmailAddress?.verification?.status || "Unknown"}
                      </p>
                    </div>
                    <Badge variant={clerkUser?.primaryEmailAddress?.verification?.status === "verified" ? "default" : "outline"}>
                      {clerkUser?.primaryEmailAddress?.verification?.status === "verified" ? "Verified" : "Pending"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold mb-1">Delete Account</h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <Button variant="destructive">Delete Account</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
