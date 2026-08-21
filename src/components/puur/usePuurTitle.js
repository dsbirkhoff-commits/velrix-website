import { useEffect } from "react";

/**
 * React 18 heeft geen native <title>-in-JSX-ondersteuning (dat is een
 * React 19-feature) — dit project draait op React 18. index.html bevat
 * al de sitebrede meta-description/keywords/OG-tags (zelfde patroon als
 * de rest van de publieke VELRIX-site, die ook geen per-pagina meta
 * gebruikt) — hier uitsluitend de documenttitel per PUUR-pagina.
 */
export default function usePuurTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => { document.title = previous; };
  }, [title]);
}
