import { ContentType, Prisma } from '@prisma/client';

interface CompetitionFilter {
  title: string;
  status?: boolean;
  type?: string;
}

function competitionFilter({ title, status, type }: CompetitionFilter) {
  const filterTitle = title
    ? {
        title: {
          contains: title,
          mode: Prisma.QueryMode.insensitive,
        },
      }
    : {};

  const filterType = type
    ? {
        type: {
          equals: type as ContentType,
        },
      }
    : {};

  return {
    ...filterTitle,
    ...filterType,
  };
}

export default competitionFilter;
