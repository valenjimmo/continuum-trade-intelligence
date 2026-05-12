"use client";

import { useEffect, useState } from "react";

export function LocalTime({ value }: { value: string }) {
  const [localized, setLocalized] = useState(value);

  useEffect(() => {
    setLocalized(
      new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "medium"
      }).format(new Date(value))
    );
  }, [value]);

  return <span suppressHydrationWarning>{localized}</span>;
}
