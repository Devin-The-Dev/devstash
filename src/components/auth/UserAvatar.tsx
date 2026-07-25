import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/format";

export function UserAvatar({
  name,
  image,
  className,
  size,
}: {
  name: string;
  image?: string | null;
  className?: string;
  size?: "default" | "sm" | "lg";
}) {
  return (
    <Avatar className={className} size={size}>
      {image && <AvatarImage src={image} alt={name} />}
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
}
