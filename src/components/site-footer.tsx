import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function SiteFooter() {
  const t = useTranslations("footer");
  return (
    <footer className="mb-16 border-t py-8 md:mb-0">
      <div className="mx-auto max-w-7xl space-y-3 px-4 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">{t("tagline")}</p>
        <p>{t("about")}</p>
        <p>{t("disclaimer")}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs">
          <span>
            {t("builtBy")}{" "}
            <a
              href="https://github.com/nidaldarwishee-arch"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline-offset-2 hover:underline"
            >
              Nidal
            </a>
          </span>
          <Link href="/en" className="hover:text-foreground hover:underline underline-offset-2">
            English
          </Link>
          <Link href="/ar" className="hover:text-foreground hover:underline underline-offset-2">
            العربية
          </Link>
        </div>
      </div>
    </footer>
  );
}
