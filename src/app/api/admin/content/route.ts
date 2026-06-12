import { NextRequest, NextResponse } from "next/server";
import { logAdminAction } from "@/lib/api/admin-log";
import { jsonError, requireAdminContext } from "@/lib/api/admin";
import {
  listContentArticles,
  SuperAdminValidationError,
  toJsonDetail,
  upsertContentArticle,
} from "@/lib/admin/super-dashboard";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function GET() {
  const admin = await requireAdminContext();
  if (!admin.ok) return admin.response;

  try {
    const articles = await listContentArticles(createServiceRoleClient());
    return NextResponse.json({ articles });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to load content.", 500);
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdminContext();
  if (!admin.ok) return admin.response;

  const payload = await req.json().catch(() => null);
  const supabase = createServiceRoleClient();

  try {
    const article = await upsertContentArticle(supabase, admin.user.id, payload);
    await logAdminAction(supabase, admin.user.id, "super_admin_content_upsert", {
      articleId: article.id,
      payload: toJsonDetail(payload),
    });
    return NextResponse.json({ article });
  } catch (error) {
    if (error instanceof SuperAdminValidationError) {
      return NextResponse.json({ issues: error.issues }, { status: 400 });
    }
    return jsonError(error instanceof Error ? error.message : "Failed to save content.", 500);
  }
}
