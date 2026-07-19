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
