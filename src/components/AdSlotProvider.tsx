import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';

interface AdRow {
  slot: string;
  position: string;
  html_code: string;
}

interface AdContextType {
  rows: AdRow[];
  loading: boolean;
  registerSlot: (slotNumber: number) => boolean;
}

const AdContext = createContext<AdContextType>({
  rows: [],
  loading: true,
  registerSlot: () => false,
});

const GOOGLE_SHEETS_URL =
  'https://docs.google.com/spreadsheets/d/1GZPs1TQ5EfPYuOhiN7NBieH30MQOlFoMSVSzIhrKros/export?format=csv';

export const MAX_AD_SLOTS = 10;

function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    if (inQuotes) {
      if (char === '"' && nextChar === '"') { currentCell += '"'; i++; }
      else if (char === '"') inQuotes = false;
      else currentCell += char;
    } else {
      if (char === '"') inQuotes = true;
      else if (char === ',') { currentRow.push(currentCell.trim()); currentCell = ''; }
      else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
        if (char === '\r') i++;
      } else currentCell += char;
    }
  }
  if (currentRow.length > 0 || currentCell !== '') {
    currentRow.push(currentCell.trim());
    rows.push(currentRow);
  }
  return rows;
}

export const AdSlotProvider = ({ children }: { children: ReactNode }) => {
  const [rows, setRows] = useState<AdRow[]>([]);
  const [loading, setLoading] = useState(true);
  const renderedSlots = useRef<Set<number>>(new Set());

  useEffect(() => {
    fetch(GOOGLE_SHEETS_URL)
      .then((r) => r.text())
      .then((csv) => {
        const parsedRows = parseCSV(csv);
        const parsed = parsedRows
          .slice(1)
          .map((vals) => ({
            slot: (vals[0] || '').trim(),
            position: (vals[1] || '').trim(),
            html_code: vals[2] || '',
          }))
          .filter((r) => r.slot && r.html_code);
        setRows(parsed);
      })
      .catch((err) => console.error('Error fetching ads:', err))
      .finally(() => setLoading(false));
  }, []);

  // On every navigation/render cycle, allow slots to claim themselves again.
  useEffect(() => {
    renderedSlots.current.clear();
  });

  const registerSlot = (slotNumber: number) => {
    if (renderedSlots.current.has(slotNumber)) return false;
    renderedSlots.current.add(slotNumber);
    return true;
  };

  return (
    <AdContext.Provider value={{ rows, loading, registerSlot }}>
      {children}
    </AdContext.Provider>
  );
};

export const useAdSlots = () => useContext(AdContext);

/**
 * Numbered ad slot (1–10). Each slot renders only once per page even if
 * referenced multiple times. Looks up the matching row by exact slot number
 * and only renders when that row's position is "on".
 *
 * Backward-compat: a `position` string prop is still accepted and falls back
 * to the legacy name-based lookup when no numeric `slot` is provided.
 */
export const AdSlot = ({
  slot,
  position,
  className = '',
}: {
  slot?: number;
  position?: string;
  className?: string;
}) => {
  const { rows, registerSlot } = useAdSlots();
  const containerRef = useRef<HTMLDivElement>(null);
  const claimedRef = useRef<boolean | null>(null);

  let row: AdRow | undefined;

  if (typeof slot === 'number' && slot >= 1 && slot <= MAX_AD_SLOTS) {
    if (claimedRef.current === null) claimedRef.current = registerSlot(slot);
    if (!claimedRef.current) return null;
    // Match rows whose slot label contains the slot number (e.g. "[ Ad #1", "Ad 1", "1").
    row = rows.find((r) => {
      if (r.position.toLowerCase() !== 'on') return false;
      const nums = r.slot.match(/\d+/g);
      return nums ? nums.includes(String(slot)) : false;
    });
  } else if (position) {
    const active = rows.filter((r) => r.position.toLowerCase() === 'on');
    row = active.find((r) => r.slot.toLowerCase().includes(position.toLowerCase()));
  }

  useEffect(() => {
    if (row?.html_code && containerRef.current) {
      const container = containerRef.current;
      container.innerHTML = '';
      const range = document.createRange();
      try {
        const fragment = range.createContextualFragment(row.html_code);
        container.appendChild(fragment);
        const scripts = container.querySelectorAll('script');
        scripts.forEach((oldScript) => {
          const newScript = document.createElement('script');
          Array.from(oldScript.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
          if (oldScript.innerHTML) newScript.innerHTML = oldScript.innerHTML;
          oldScript.parentNode?.replaceChild(newScript, oldScript);
        });
      } catch (e) {
        console.error('Error rendering ad HTML:', e);
        container.innerHTML = row.html_code;
      }
    }
  }, [row]);

  if (!row?.html_code) return null;

  return (
    <div
      ref={containerRef}
      className={`ad-slot-container w-full overflow-hidden flex justify-center items-center min-h-[60px] my-3 ${className}`}
    />
  );
};
