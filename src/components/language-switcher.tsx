"use client";

import { useLocale } from "next-intl";
import { Languages } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const other = locale === "en" ? "ar" : "en";

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={other === "ar" ? "التبديل إلى العربية" : "Switch to English"}
      onClick={() => router.replace(pathname, { locale: other })}
      className="gap-1.5 font-bold"
    >
      <Languages aria-hidden />
      <span>{other === "ar" ? "العربية" : "EN"}</span>
    </Button>
  );
}
