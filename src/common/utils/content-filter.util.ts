import { ContentStatus, Prisma } from '@prisma/client';
import { subMonths } from 'date-fns';

interface ContentFilter {
  search: string;
  latest: boolean;
  status?: ContentStatus | undefined;
  category?: string;
  genre?: string;
  tag?: string;
}

export function contentFilter({
  search,
  latest,
  status,
  category,
  genre,
  tag,
}: ContentFilter) {
  const currentDate = new Date();
  const twoMonthsAgo = subMonths(currentDate, 2);

  const latestFilter = latest
    ? {
        status: ContentStatus.approved,
        created_at: {
          gte: twoMonthsAgo,
          lte: currentDate,
        },
      }
    : {};

  const searchByTitle = search
    ? {
        title: {
          contains: search,
          mode: Prisma.QueryMode.insensitive,
        },
      }
    : {};

  const statusFilter = status
    ? {
        status: {
          equals: status,
        },
      }
    : {};

  const decodedCategory = decodeURIComponent(category);
  const categoryFilter = category
    ? {
        category: {
          name: {
            equals: decodedCategory,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      }
    : {};

  const decodedGenre = decodeURIComponent(genre);

  const genreFilter = genre
    ? {
        genre: {
          some: {
            name: {
              equals: decodedGenre,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        },
      }
    : {};

  const decodedTag = decodeURIComponent(tag);

  const tagFilter = tag
    ? {
        tag: {
          some: {
            name: {
              equals: decodedTag,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        },
      }
    : {};

  return {
    ...searchByTitle,
    ...latestFilter,
    ...statusFilter,
    ...categoryFilter,
    ...genreFilter,
    ...tagFilter,
  };
}

export function contentFilterByUser({
  search,
  latest,
  category,
  genre,
  tag,
}: ContentFilter) {
  const currentDate = new Date();
  const twoMonthsAgo = subMonths(currentDate, 2);

  const latestFilter = latest
    ? {
        status: ContentStatus.approved,
        created_at: {
          gte: twoMonthsAgo,
          lte: currentDate,
        },
      }
    : {};

  const searchByTitle = search
    ? {
        title: {
          contains: search,
          mode: Prisma.QueryMode.insensitive,
        },
      }
    : {};

  const statusFilter = {
    status: {
      equals: ContentStatus.approved,
    },
  };

  const decodedCategory = decodeURIComponent(category);

  const categoryFilter = category
    ? {
        category: {
          name: {
            equals: decodedCategory,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      }
    : {};

  const decodedGenre = decodeURIComponent(genre);

  const genreFilter = genre
    ? {
        genre: {
          some: {
            name: {
              equals: decodedGenre,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        },
      }
    : {};

  const decodedTag = decodeURIComponent(tag);

  const tagFilter = tag
    ? {
        tag: {
          some: {
            name: {
              equals: decodedTag,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        },
      }
    : {};

  return {
    ...searchByTitle,
    ...latestFilter,
    ...statusFilter,
    ...categoryFilter,
    ...genreFilter,
    ...tagFilter,
  };
}
