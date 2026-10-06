import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const localized = z.object({ tr: z.string(), en: z.string() });

const games = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/games' }),
  schema: ({ image }) =>
    z.object({
      title: localized,
      tagline: localized, // kartta görünen tek cümle
      description: localized, // oyun sayfası "Oyun hakkında" (paragraflar \n\n ile)
      controls: z
        .array(
          z.object({
            keys: z.array(z.string()), // ["←","→"] veya ["BOŞLUK"] / ["SPACE"]
            action: localized,
          }),
        )
        .default([]),
      cover: image(), // 16:10, en az 1280x800, PNG/JPG → otomatik WebP
      tags: z.array(z.string()).default([]),
      releaseDate: z.coerce.date(),
      featured: z.boolean().default(false),
      aspectRatio: z.string().default('16/9'), // oynatıcı oranı
      sizeMB: z.number().optional(),
      mobile: z.boolean().default(false),
      playUrl: z.string().optional(), // varsayılan /play/<slug>/index.html
      relatedPosts: z.array(z.string()).default([]),
      // v1.5/v2 — şimdiden şemada, opsiyonel
      achievements: z
        .array(
          z.object({
            id: z.string().regex(/^[a-z0-9-]+$/),
            title: localized,
            description: localized,
            icon: z.enum(['star', 'flag', 'bolt', 'clock', 'trophy', 'crown', 'heart', 'target']).default('star'),
            tier: z.enum(['common', 'rare', 'legendary']).default('common'),
            hidden: z.boolean().default(false),
          }),
        )
        .default([]),
      draft: z.boolean().default(false),
    }),
});

const devlog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/devlog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(), // liste satırındaki özet
    date: z.coerce.date(),
    game: z.string().optional(), // ilgili oyunun slug'ı
    cover: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { games, devlog };
