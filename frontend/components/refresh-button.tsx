"use client";

import { RefreshCw } from "lucide-react";

export function RefreshButton() {
  return (
    <button
      className="grid h-9 w-9 place-items-center rounded-md border border-line bg-panel hover:bg-white"
      title="Refresh dashboard"
      onClick={() => window.location.reload()}
    >
      <RefreshCw className="h-4 w-4" />
    </button>
  );
}
