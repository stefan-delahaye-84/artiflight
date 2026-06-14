"use client";

import { createContext, useContext } from "react";
import type { ArtlightConfig } from "./config";
import { defaultConfig } from "./config";

const ConfigContext = createContext<ArtlightConfig>(defaultConfig);

export function ArtlightProvider({
  config,
  children,
}: {
  config?: Partial<ArtlightConfig>;
  children: React.ReactNode;
}) {
  return (
    <ConfigContext.Provider value={{ ...defaultConfig, ...config }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useArtlightConfig(): ArtlightConfig {
  return useContext(ConfigContext);
}
