import { useEffect, useState } from 'react';
import { Star, Briefcase, ExternalLink } from 'lucide-react';

interface PromoItem {
  image: string;
  title: string;
  content: string;
  link: string;
  rating: number; // default 5
  active: boolean;
}

const PROMO_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1p4iOGiUaM7h8QpfUU281aKhqnW5KxzGbHidKgqN37Js/export?format=csv';

const SPONSOR_MAILTO =
  "mailto:codebyshareef@gmail.com?subject=Zip2Git%20Sponsor%20%2F%20Showcase%20Submission&body=Hi%20Shareef%2C%0A%0AI'd%20like%20to%20be%20featured.%0A%0ABrand%2FName%3A%20%0AWebsite%20Title%3A%20%0AShort%20Description%3A%20%0AWebsite%20URL%3A%20%0AScreenshot%2FImage%20(attached)%3A%20%0APayment%20Proof%20(attached)%3A%20%0A%0AThanks!";

function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentCell += '"';
        i++;
      } else if (char === '"') inQuotes = false;
      else currentCell += char;
    } else {
      if (char === '"') inQuotes = true;
      else if (char === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
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

function findColumn(headers: string[], candidates: string[]): number {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const c of candidates) {
    const i = lower.indexOf(c);
    if (i !== -1) return i;
  }
  return -1;
}

const Stars = ({ rating }: { rating: number }) => {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${r} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < r ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/25'
          }`}
        />
      ))}
    </div>
  );
};

const SponsorCard = ({ item, idx }: { item: PromoItem; idx: number }) => {
  const card = (
    <article
      className="group flex h-full w-full overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-card hover:shadow-lg"
      data-testid={`card-sponsor-${idx}`}
    >
      {/* LEFT — Image preview (fixed width, full height) */}
      <div className="relative w-28 sm:w-36 md:w-44 shrink-0 overflow-hidden bg-muted/40">
        {item.image ? (
          <img
            src={item.image}
            alt={item.title || 'Sponsor preview'}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-card to-accent/10">
            <Briefcase className="h-8 w-8 text-primary/50" />
          </div>
        )}
      </div>

      {/* RIGHT — Title + description + rating + CTA */}
      <div className="flex flex-1 flex-col justify-between gap-2 p-3 sm:p-4 min-w-0">
        <div className="space-y-1.5 min-w-0">
          {item.title && (
            <h3
              className="font-display text-sm sm:text-base font-bold leading-snug text-foreground line-clamp-2"
              data-testid={`text-sponsor-title-${idx}`}
              title={item.title}
            >
              {item.title}
            </h3>
          )}
          {item.content && (
            <p
              className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3"
              title={item.content}
            >
              {item.content}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <Stars rating={item.rating} />
          {item.link && (
            <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-primary opacity-90 group-hover:opacity-100">
              Visit <ExternalLink className="h-3 w-3" />
            </span>
          )}
        </div>
      </div>
    </article>
  );

  if (item.link) {
    return (
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer sponsored"
        data-testid={`link-sponsor-${idx}`}
        className="block h-full focus:outline-none focus:ring-2 focus:ring-primary rounded-xl"
      >
        {card}
      </a>
    );
  }
  return card;
};

const SponsorSkeleton = () => (
  <div className="flex h-full w-full overflow-hidden rounded-xl border border-border/40 bg-card/40 animate-pulse">
    <div className="w-28 sm:w-36 md:w-44 shrink-0 bg-muted/40" />
    <div className="flex flex-1 flex-col gap-2 p-4">
      <div className="h-3.5 w-3/4 rounded bg-muted/40" />
      <div className="h-2.5 w-full rounded bg-muted/30" />
      <div className="h-2.5 w-5/6 rounded bg-muted/30" />
      <div className="mt-auto h-3 w-24 rounded bg-muted/30" />
    </div>
  </div>
);

export const PromotionFeed = ({ className = '' }: { className?: string }) => {
  const [items, setItems] = useState<PromoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch(PROMO_SHEET_URL, { signal: controller.signal })
      .then((r) => r.text())
      .then((csv) => {
        const rows = parseCSV(csv);
        if (!rows.length) return;
        const headers = rows[0];
        const iImg = findColumn(headers, [
          'image',
          'preview',
          'preview image',
          'image_url',
          'img',
          'logo',
          'screenshot',
        ]);
        const iTitle = findColumn(headers, [
          'title',
          'name',
          'heading',
          'brand',
        ]);
        const iContent = findColumn(headers, [
          'content',
          'description',
          'body',
          'desc',
        ]);
        const iLink = findColumn(headers, [
          'link',
          'url',
          'click',
          'click action',
          'action',
          'cta',
          'website',
        ]);
        const iActive = findColumn(headers, [
          'status',
          'active',
          'position',
          'on/off',
          'state',
        ]);
        const iRating = findColumn(headers, ['rating', 'stars', 'score']);

        const parsed: PromoItem[] = rows
          .slice(1)
          .map((vals) => {
            const active =
              iActive === -1
                ? true
                : ['on', 'true', 'yes', '1', 'active'].includes(
                    (vals[iActive] || '').toLowerCase().trim(),
                  );
            const ratingRaw =
              iRating === -1 ? '5' : (vals[iRating] || '5').trim();
            const rating = Number.isFinite(parseFloat(ratingRaw))
              ? parseFloat(ratingRaw)
              : 5;
            return {
              image: iImg === -1 ? '' : (vals[iImg] || '').trim(),
              title: iTitle === -1 ? '' : (vals[iTitle] || '').trim(),
              content: iContent === -1 ? '' : (vals[iContent] || '').trim(),
              link: iLink === -1 ? '' : (vals[iLink] || '').trim(),
              rating,
              active,
            };
          })
          .filter((p) => p.active && (p.title || p.content || p.image));

        setItems(parsed);
      })
      .catch((err) => {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error fetching promotions:', err);
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  // Hide the whole section when there's nothing to show after loading
  if (!loading && !items.length) return null;

  return (
    <section
      className={`border-t border-border/40 bg-transparent py-8 sm:py-12 ${className}`}
      data-testid="section-supporters-showcase"
    >
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        {/* Header */}
        <div className="text-center space-y-2 mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary">
            <Star className="h-3.5 w-3.5 fill-primary" /> Supporters Showcase
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            Featured <span className="text-gradient">Sponsors</span>
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Businesses and creators keeping Zip2Git free for everyone.{' '}
            <a
              href={SPONSOR_MAILTO}
              className="font-semibold text-primary hover:underline whitespace-nowrap"
              data-testid="link-become-sponsor"
            >
              Become a sponsor →
            </a>
          </p>
        </div>

        {/* Horizontal cards — image LEFT, content RIGHT.
            One column on phones, two columns on tablet+ to keep
            cards wide enough that the title/description never gets cut off. */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <SponsorSkeleton key={`s-${i}`} />
              ))
            : items.map((item, i) => (
                <SponsorCard key={i} item={item} idx={i} />
              ))}
        </div>
      </div>
    </section>
  );
};
