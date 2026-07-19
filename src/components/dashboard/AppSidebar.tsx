import Link from "next/link";
import { ArrowRight, Box, LayoutDashboard, Star, Clock } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getItemTypeIcon } from "@/lib/item-type-icons";
import { getCollectionsWithStats } from "@/lib/db/collections";
import { getSystemItemTypes } from "@/lib/db/items";
import { getCurrentUser } from "@/lib/db/user";

const proItemTypeNames = new Set(["File", "Image"]);

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Favorites", url: "/favorites", icon: Star },
  { title: "Recent", url: "/recent", icon: Clock },
];

export async function AppSidebar() {
  const [itemTypes, collections, currentUser] = await Promise.all([
    getSystemItemTypes(),
    getCollectionsWithStats(),
    getCurrentUser(),
  ]);

  const favoriteCollections = collections.filter((c) => c.isFavorite);
  const recentCollections = collections.filter((c) => !c.isFavorite).slice(0, 4);

  const initials = currentUser.name
    .split(" ")
    .map((part) => part[0])
    .join("");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
          <Box className="size-5 shrink-0" />
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-semibold">DevStash</span>
            <span className="text-xs text-muted-foreground">
              {currentUser.isPro ? "Pro plan" : "Free plan"}
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton tooltip={item.title} render={<Link href={item.url} />}>
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Item Types</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {itemTypes.map((type) => {
                const Icon = getItemTypeIcon(type.icon);
                const slug = `${type.name.toLowerCase()}s`;
                const isPro = proItemTypeNames.has(type.name) && !currentUser.isPro;
                return (
                  <SidebarMenuItem key={type.id}>
                    <SidebarMenuButton
                      tooltip={`${type.name}s`}
                      render={<Link href={`/items/${slug}`} />}
                    >
                      <Icon style={{ color: type.color }} />
                      <span>{type.name}s</span>
                      {isPro && (
                        <Badge variant="secondary" className="ml-auto">
                          PRO
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Favorites</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {favoriteCollections.map((collection) => (
                <SidebarMenuItem key={collection.id}>
                  <SidebarMenuButton
                    tooltip={collection.name}
                    render={<Link href={`/collections/${collection.id}`} />}
                  >
                    <Star className="text-yellow-400" />
                    <span>{collection.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Recent</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {recentCollections.map((collection) => (
                <SidebarMenuItem key={collection.id}>
                  <SidebarMenuButton
                    tooltip={collection.name}
                    render={<Link href={`/collections/${collection.id}`} />}
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: collection.dominantColor ?? "#6b7280" }}
                    />
                    <span>{collection.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="View all collections"
                  render={<Link href="/collections" />}
                >
                  <ArrowRight />
                  <span className="text-muted-foreground">View all collections</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {!currentUser.isPro && (
          <Button size="sm" className="w-full group-data-[collapsible=icon]:hidden">
            Upgrade to Pro
          </Button>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip={currentUser.name}>
              <Avatar className="size-6">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span>{currentUser.name}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
