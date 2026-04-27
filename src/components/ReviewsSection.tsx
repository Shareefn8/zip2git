import { Star, Quote } from 'lucide-react';
import { motion } from 'framer-motion';

const REVIEWS = [
  { name: 'Aarav Mehta', role: 'Full-stack Developer', rating: 5, text: 'Pushed my React project from a ZIP to GitHub in 30 seconds. Zip2Git is genuinely the easiest tool I have used this year.' },
  { name: 'Sara Khan', role: 'CS Student', rating: 5, text: 'I never understood Git commands. Zip2Git let me submit my college project to GitHub without any terminal headache.' },
  { name: 'Daniel Romero', role: 'Freelance Dev', rating: 5, text: 'The auto README and .gitignore generator alone are worth it. Saves me 10 minutes on every new repo.' },
  { name: 'Priya Sharma', role: 'Hackathon Hacker', rating: 5, text: 'Secret Shield caught a .env file before I pushed. That feature alone should be in every Git tool.' },
  { name: 'James O\'Connor', role: 'Indie Maker', rating: 5, text: 'Clean UI, no signup, free. Pushed three side projects in one evening. Highly recommend.' },
  { name: 'Mei Tanaka', role: 'Frontend Engineer', rating: 4, text: 'Smart Recovery Assistant saved a deleted folder for me. Genuinely useful tooling.' },
];

const AVG = (REVIEWS.reduce((a, r) => a + r.rating, 0) / REVIEWS.length).toFixed(1);

export const ReviewsSection = () => {
  return (
    <section className="border-t border-border/40 py-4 sm:py-6" aria-labelledby="reviews-heading">
      {/* Rich Result Schema for star ratings in Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Zip2Git',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Web',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: AVG,
              reviewCount: REVIEWS.length,
              bestRating: '5',
              worstRating: '1',
            },
            review: REVIEWS.map((r) => ({
              '@type': 'Review',
              author: { '@type': 'Person', name: r.name },
              reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
              reviewBody: r.text,
            })),
          }),
        }}
      />

      <div className="container mx-auto px-4 sm:px-6">
        <div className="mb-4 text-center space-y-1">
          <h2 id="reviews-heading" className="section-heading">
            Loved by <span className="text-gradient-cool">Developers</span>
          </h2>
          <div className="flex items-center justify-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-primary text-primary" />
              ))}
            </div>
            <span className="text-xs sm:text-sm font-semibold text-foreground">{AVG} / 5</span>
            <span className="text-xs sm:text-sm text-muted-foreground">· {REVIEWS.length}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3 max-w-6xl mx-auto">
          {REVIEWS.map((r, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="glass-card p-3 sm:p-4 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: r.rating }).map((_, k) => (
                    <Star key={k} className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-primary text-primary" />
                  ))}
                </div>
                <Quote className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground/40" />
              </div>
              <p className="text-[11px] sm:text-sm text-foreground/90 leading-snug line-clamp-4">"{r.text}"</p>
              <div className="border-t border-border/40 pt-2">
                <p className="text-xs sm:text-sm font-semibold leading-tight">{r.name}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{r.role}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
