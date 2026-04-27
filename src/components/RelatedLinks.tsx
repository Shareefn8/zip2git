import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface RelatedLink {
  to: string;
  title: string;
  description: string;
}

interface RelatedLinksProps {
  links: RelatedLink[];
  heading?: string;
}

export const RelatedLinks = ({ links, heading = 'Explore More' }: RelatedLinksProps) => (
  <section className="mt-16 border-t border-border/40 pt-10">
    <h2 className="font-display text-2xl font-bold mb-6">{heading}</h2>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {links.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className="glass-card p-5 group hover:border-primary/40 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h3 className="font-display font-semibold text-base group-hover:text-primary transition-colors">
                {link.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{link.description}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
          </div>
        </Link>
      ))}
    </div>
  </section>
);
