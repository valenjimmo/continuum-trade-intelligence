import { create } from "zustand";

type MarketStore = {
  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;
};

export const useMarketStore = create<MarketStore>((set) => ({
  selectedSymbol: "SPY",
  setSelectedSymbol: (selectedSymbol) => set({ selectedSymbol })
}));
