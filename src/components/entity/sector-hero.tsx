// src/components/entity/sector-hero.tsx

import { EntityHero } from "./entity-hero";
import type { Sector } from "@/lib/queries/entities";

export function SectorHero({ sector }: { sector: Sector }) {
  return (
    <EntityHero
      kicker="Sector"
      headline={sector.name}
      body={sector.description}
    />
  );
}
