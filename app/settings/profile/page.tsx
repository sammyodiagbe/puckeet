"use client";

import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Crown } from "lucide-react";
import { useUserStore } from "@/lib/stores/user-store";

export default function ProfilePage() {
  const { user } = useUserStore();

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
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Name</p>
                  <p className="text-lg font-medium">
                    {user?.name || "Not set"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email Address</p>
                  <p className="text-lg font-medium">
                    {user?.email || "Not set"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">User ID</p>
                  <p className="text-sm font-mono text-muted-foreground">
                    {user?.id}
                  </p>
                </div>
              </div>

              <Separator />

              <p className="text-sm text-muted-foreground">
                To update your email or password, contact support or use Supabase dashboard.
              </p>
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
                  <Badge className="capitalize">{user?.subscriptionTier}</Badge>
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
                  Supabase provides built-in security features including password management
                  and email verification.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Password Protection</p>
                      <p className="text-sm text-muted-foreground">
                        Managed by Supabase Auth
                      </p>
                    </div>
                    <Badge variant="outline">Active</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Email Verification</p>
                      <p className="text-sm text-muted-foreground">
                        Verified
                      </p>
                    </div>
                    <Badge variant="default">
                      Verified
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
