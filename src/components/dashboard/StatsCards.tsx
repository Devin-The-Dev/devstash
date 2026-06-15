import { Boxes, FolderKanban, Star, FolderHeart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type StatsCardsProps = {
  totalItems: number;
  totalCollections: number;
  favoriteItems: number;
  favoriteCollections: number;
};

export function StatsCards({
  totalItems,
  totalCollections,
  favoriteItems,
  favoriteCollections,
}: StatsCardsProps) {
  const stats = [
    { label: "Items", value: totalItems, icon: Boxes },
    { label: "Collections", value: totalCollections, icon: FolderKanban },
    { label: "Favorite items", value: favoriteItems, icon: Star },
    { label: "Favorite collections", value: favoriteCollections, icon: FolderHeart },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              {stat.label}
            </CardTitle>
            <stat.icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{stat.value}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
