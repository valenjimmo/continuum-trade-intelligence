import { getMeanReversionTerminals } from "@/lib/api";
import { MeanReversionTerminal } from "@/components/mean-reversion-terminal";

export const dynamic = "force-dynamic";

type MeanReversionPageProps = {
  searchParams?: {
    data_mode?: string;
    symbols?: string;
  };
};

function selectedDataMode(value?: string) {
  return value === "alpaca" ? "alpaca" : value === "mock" ? "mock" : undefined;
}

export default async function MeanReversionPage({ searchParams }: MeanReversionPageProps) {
  const symbols = searchParams?.symbols ?? "SPY,QQQ,IWM,AAPL,MSFT,NVDA,AMZN,META,GOOGL,TSLA";
  const dataMode = selectedDataMode(searchParams?.data_mode);
  const snapshots = await getMeanReversionTerminals(symbols, dataMode);
  const activeDataMode = dataMode ?? snapshots[0]?.data_mode ?? "mock";

  return <MeanReversionTerminal snapshots={snapshots} activeDataMode={activeDataMode} />;
}
