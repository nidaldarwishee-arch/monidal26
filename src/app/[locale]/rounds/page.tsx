import { setRequestLocale, getTranslations } from "next-intl/server";
import { RoundsExplorer } from "@/components/rounds-explorer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "rounds" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function RoundsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("rounds");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">{t("title")}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{t("subtitle")}</p>
      </header>
      <RoundsExplorer />
    </div>
  );
}
