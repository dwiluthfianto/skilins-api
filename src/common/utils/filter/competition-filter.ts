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

  const filterStatus = status
    ? {
        end_date: {
          gte: new Date(),
        },
      }
    : {
        end_date: {
          lt: new Date(),
        },
      };

  return {
    ...filterTitle,
    ...filterType,
    ...filterStatus,
  };
}

export default competitionFilter;
