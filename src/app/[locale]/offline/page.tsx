import { getTranslations, setRequestLocale } from "next-intl/server";
import { WifiOff } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "offline" });
  return { title: t("title") };
}

export default async function OfflinePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("offline");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <WifiOff className="h-10 w-10 text-muted-foreground" aria-hidden />
      </div>
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">{t("title")}</h1>
        <p className="mx-auto max-w-md text-muted-foreground">{t("subtitle")}</p>
      </header>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {/* href="" re-requests the current URL, retrying the page that failed */}
        <a href="" className={buttonVariants()}>
          {t("retry")}
        </a>
        <Link href="/matches" className={buttonVariants({ variant: "outline" })}>
          {t("schedule")}
        </Link>
      </div>
    </div>
  );
}
