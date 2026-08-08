import { existsSync } from 'node:fs';
import { join } from 'node:path';

import type { ComponentPropsWithoutRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import ProjectsShowcase from '@/components/projects/ProjectsShowcase';

/* eslint-disable @next/next/no-img-element */
vi.mock('next/image', () => ({
  default: ({ fill: _fill, priority: _priority, src, alt, ...rest }: ComponentPropsWithoutRef<'img'> & {
    fill?: boolean;
    priority?: boolean;
    src: string | { src: string };
  }) => (
    <img
      alt={alt}
      src={typeof src === 'string' ? src : src.src}
      {...rest}
    />
  ),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: ComponentPropsWithoutRef<'a'> & { href: string | URL }) => (
    <a href={href instanceof URL ? href.toString() : href} {...rest}>
      {children}
    </a>
  ),
}));

import ProjectDetailPage, { generateStaticParams } from '../[slug]/page';

function getHeroImageSrc(html: string) {
  const match = html.match(/alt="[^"]*hero visual[^"]*"[^>]*src="([^"]+)"/);

  return match?.[1];
}

describe('project case study assets', () => {
  it('renders public hero images for case-study pages', async () => {
    const params = await generateStaticParams();
    const slugs = params.map(({ slug }) => slug).filter((slug) => slug !== 'astoria-conquest');

    for (const slug of slugs) {
      const page = await ProjectDetailPage({ params: Promise.resolve({ slug }) });
      const html = renderToStaticMarkup(page);
      const heroImageSrc = getHeroImageSrc(html);

      expect(heroImageSrc, `missing hero image for ${slug}`).toBeDefined();
      expect(heroImageSrc?.startsWith('/images/previews_main/')).toBe(true);
      expect(existsSync(join(process.cwd(), 'public', heroImageSrc ?? ''))).toBe(true);
    }
  });

  it('renders the Astoria Conquest preview image', () => {
    const html = renderToStaticMarkup(<ProjectsShowcase currentPage="projects" />);

    expect(html).toContain('Astoria Conquest preview');
    expect(html).toContain('/images/previews_main/astoria_conquest.png');
    expect(existsSync(join(process.cwd(), 'public', 'images/previews_main/astoria_conquest.png'))).toBe(true);
  });
});
