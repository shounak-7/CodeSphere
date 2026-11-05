import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadUserMedia, ALLOWED_MIME_TYPES } from "@/lib/server/storageQuota";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized. Please sign in to upload files." },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const fileType = (formData.get("type") as string) || "avatar";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (fileType !== "avatar" && fileType !== "post_media") {
      return NextResponse.json(
        { error: "Invalid upload type. Must be 'avatar' or 'post_media'." },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: "Unsupported image format. Allowed formats: JPEG, PNG, WebP, GIF." },
        { status: 415 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadUserMedia(
      user.id,
      buffer,
      file.name,
      file.type,
      fileType
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      publicUrl: result.publicUrl,
      storagePath: result.storagePath,
      fileSize: result.fileSize,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to process upload" },
      { status: 500 }
    );
  }
}
