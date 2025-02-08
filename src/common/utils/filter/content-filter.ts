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
          mode: Prisma.QueryMode.insensitive,
        },
      }
    : {};

  const categoryFilter = category
    ? {
        category: {
          name: {
            equals: category,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      }
    : {};

  const genreFilter = genre
    ? {
        genre: {
          some: {
            name: {
              equals: genre,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        },
      }
    : {};

  const tagFilter = tag
    ? {
        tag: {
          some: {
            name: {
              equals: tag,
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
      mode: Prisma.QueryMode.insensitive,
    },
  };

  const categoryFilter = category
    ? {
        category: {
          name: {
            equals: category,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      }
    : {};

  const genreFilter = genre
    ? {
        genre: {
          some: {
            name: {
              equals: genre,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        },
      }
    : {};

  const tagFilter = tag
    ? {
        tag: {
          some: {
            name: {
              equals: tag,
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
