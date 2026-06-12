import { useTranslations } from "next-intl";

export function SiteFooter() {
  const t = useTranslations("footer");
  return (
    <footer className="mb-16 border-t py-8 md:mb-0">
      <div className="mx-auto max-w-7xl space-y-2 px-4 text-sm text-muted-foreground">
        <p className="font-medium">{t("tagline")}</p>
        <p>{t("disclaimer")}</p>
      </div>
    </footer>
  );
}
