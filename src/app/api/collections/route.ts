import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createCollection } from "@/lib/db/collections";
import { createCollectionSchema } from "@/lib/validations/collections";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createCollectionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const collection = await createCollection(session.user.id, {
    name: parsed.data.name,
    description: parsed.data.description || null,
  });

  return NextResponse.json({ success: true, data: collection }, { status: 201 });
}
