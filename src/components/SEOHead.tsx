import { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  path: string;
  image?: string;
}

export const SEOHead = ({ title, description, path, image = 'https://i.ibb.co/35h609k7/1-zip2git.png' }: SEOHeadProps) => {
  useEffect(() => {
    const base = 'https://zip2git.online';
    const imgUrl = /^https?:\/\//i.test(image) ? image : `${base}${image}`;
    document.title = title;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement;
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.content = content;
    };

    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', `${base}${path}`);
    setMeta('property', 'og:image', imgUrl);
    setMeta('property', 'og:image:alt', title);
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', imgUrl);

    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
    link.href = `${base}${path}`;
  }, [title, description, path, image]);

  return null;
};
