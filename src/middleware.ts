import { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

const handleI18nRouting = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const response = handleI18nRouting(request);
  return updateSession(request, response);
}

export const config = {
  // Skip API routes, the auth callback, Next internals, and any file with an extension
  matcher: ["/((?!api|auth/callback|_next|_vercel|.*\\..*).*)"],
};
