"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditCollectionDialog } from "@/components/collections/EditCollectionDialog";
import { DeleteCollectionDialog } from "@/components/collections/DeleteCollectionDialog";
import { toggleCollectionFavorite } from "@/actions/collections";
import { useFavoriteToggle } from "@/hooks/use-favorite-toggle";

type DetailCollection = {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
};

export function CollectionDetailActions({ collection }: { collection: DetailCollection }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { isFavorite, toggle: toggleFavorite } = useFavoriteToggle(collection.isFavorite, () =>
    toggleCollectionFavorite(collection.id),
  );

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        aria-label="Favorite"
        aria-pressed={isFavorite}
        onClick={toggleFavorite}
      >
        <Star className={isFavorite ? "fill-yellow-400 text-yellow-400" : undefined} />
      </Button>
      <Button variant="outline" size="icon" aria-label="Edit collection" onClick={() => setEditOpen(true)}>
        <Pencil />
      </Button>
      <Button
        variant="destructive"
        size="icon"
        aria-label="Delete collection"
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2 />
      </Button>

      <EditCollectionDialog collection={collection} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteCollectionDialog
        collectionId={collection.id}
        collectionName={collection.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => router.push("/collections")}
      />
    </div>
  );
}
