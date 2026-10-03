"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createCheckoutSession, createPortalSession } from "@/actions/billing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FREE_COLLECTION_LIMIT, FREE_ITEM_LIMIT, PRO_PRICING } from "@/lib/plans";

type BillingInterval = "monthly" | "yearly";

interface BillingCardProps {
  isPro: boolean;
  hasBillingAccount: boolean;
  checkoutStatus?: "success" | "canceled";
}

export function BillingCard({ isPro, hasBillingAccount, checkoutStatus }: BillingCardProps) {
  const router = useRouter();
  const [interval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [pending, startTransition] = useTransition();
  const toastedRef = useRef(false);

  useEffect(() => {
    if (!checkoutStatus || toastedRef.current) return;
    toastedRef.current = true;
    if (checkoutStatus === "success") {
      toast.success("Welcome to Pro!");
    } else {
      toast.info("Checkout canceled. You're still on the Free plan.");
    }
    // Drop the query params so a refresh doesn't re-toast.
    router.replace("/settings#billing", { scroll: false });
  }, [checkoutStatus, router]);

  function redirectTo(action: () => ReturnType<typeof createPortalSession>) {
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      window.location.assign(result.data.url);
    });
  }

  if (isPro) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Billing <Badge variant="secondary">PRO</Badge>
          </CardTitle>
          <CardDescription>You&apos;re on DevStash Pro with unlimited items, collections, and file uploads.</CardDescription>
        </CardHeader>
        {hasBillingAccount && (
          <CardContent>
            <Button variant="outline" disabled={pending} onClick={() => redirectTo(createPortalSession)}>
              {pending ? "Opening..." : "Manage subscription"}
            </Button>
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing</CardTitle>
        <CardDescription>
          You&apos;re on the Free plan: {FREE_ITEM_LIMIT} items · {FREE_COLLECTION_LIMIT} collections.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-medium">DevStash Pro</h3>
          <p className="text-sm text-muted-foreground">
            Unlimited items and collections, file and image uploads, and AI features.
          </p>
        </div>

        <Tabs value={interval} onValueChange={(value) => setBillingInterval(value as BillingInterval)}>
          <TabsList aria-label="Billing interval">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>
        </Tabs>

        <p className="text-sm">
          {interval === "monthly" ? (
            <>
              <span className="text-2xl font-semibold">{PRO_PRICING.monthly}</span>
              <span className="text-muted-foreground">/month</span>
            </>
          ) : (
            <>
              <span className="text-2xl font-semibold">{PRO_PRICING.yearly}</span>
              <span className="text-muted-foreground">/year — save 25%</span>
            </>
          )}
        </p>

        <Button disabled={pending} onClick={() => redirectTo(() => createCheckoutSession(interval))}>
          {pending ? "Redirecting..." : "Upgrade to Pro"}
        </Button>
      </CardContent>
    </Card>
  );
}
