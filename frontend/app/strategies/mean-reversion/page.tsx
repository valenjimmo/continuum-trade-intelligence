import { getMeanReversionTerminals } from "@/lib/api";
import { MeanReversionTerminal } from "@/components/mean-reversion-terminal";

export const dynamic = "force-dynamic";

type MeanReversionPageProps = {
  searchParams?: {
    symbols?: string;
  };
};

export default async function MeanReversionPage({ searchParams }: MeanReversionPageProps) {
  const symbols = searchParams?.symbols ?? "SPY,QQQ,IWM,AAPL,MSFT,NVDA,AMZN,META,GOOGL,TSLA";
  const snapshots = await getMeanReversionTerminals(symbols);

  return <MeanReversionTerminal snapshots={snapshots} />;
}
