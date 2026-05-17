import { getMeanReversionTerminal } from "@/lib/api";
import { MeanReversionTerminal } from "@/components/mean-reversion-terminal";

export const dynamic = "force-dynamic";

type MeanReversionPageProps = {
  searchParams?: {
    symbol?: string;
  };
};

export default async function MeanReversionPage({ searchParams }: MeanReversionPageProps) {
  const symbol = searchParams?.symbol ?? "SPY";
  const snapshot = await getMeanReversionTerminal(symbol);

  return <MeanReversionTerminal snapshot={snapshot} />;
}
