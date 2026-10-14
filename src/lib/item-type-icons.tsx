import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  Link as LinkIcon,
  File,
  Image as ImageIcon,
  Box,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

export const itemTypeIconMap: Record<string, LucideIcon> = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  Link: LinkIcon,
  File,
  Image: ImageIcon,
};

// Falls back to a generic icon for item types (e.g. future custom Pro types)
// that don't have a mapped icon name, instead of rendering `undefined` as a
// component and crashing.
export function getItemTypeIcon(icon: string): LucideIcon {
  return itemTypeIconMap[icon] ?? Box;
}

// For rendering an item type's icon directly. Calling getItemTypeIcon at the
// top of a component trips the React Compiler's static-components lint rule.
export function ItemTypeIcon({ icon, ...props }: { icon: string } & LucideProps) {
  const Icon = itemTypeIconMap[icon] ?? Box;
  return <Icon {...props} />;
}
