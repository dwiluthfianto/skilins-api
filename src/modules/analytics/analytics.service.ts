import { Injectable } from '@nestjs/common';
import {
  endOfDay,
  endOfMonth,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // Statistik Pengguna
  async getUserStats() {
    const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
    const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));

    const totalUsers = await this.prisma.user.count();
    const activeUsersMonthly = await this.prisma.user.count({
      where: {
        updated_at: {
          gte: subMonths(new Date(), 1),
        },
      },
    });
    const activeUsersDaily = await this.prisma.user.count({
      where: {
        updated_at: {
          gte: subDays(new Date(), 1),
        },
      },
    });

    const lastMonthActiveUsers = await this.prisma.user.count({
      where: {
        updated_at: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
    });

    const yesterdayStart = startOfDay(subDays(new Date(), 1));
    const yesterdayEnd = endOfDay(subDays(new Date(), 1));

    const lastDailyActiveUsers = await this.prisma.user.count({
      where: {
        updated_at: {
          gte: yesterdayStart, // Greater than or equal (>=) tanggal mulai kemarin
          lte: yesterdayEnd, // Less than or equal (<=) tanggal akhir kemarin
        },
      },
    });

    return {
      total_users: totalUsers,
      active_users_monthly: activeUsersMonthly,
      active_users_daily: activeUsersDaily,
      last_month_active_users: lastMonthActiveUsers,
      last_daily_active_users: lastDailyActiveUsers,
    };
  }

  async getContentStats() {
    const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
    const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));

    const totalContents = await this.prisma.content.count();

    // Mendapatkan konten terpopuler berdasarkan rata-rata rating
    const popularContent = await this.prisma.rating.groupBy({
      by: ['content_id'],
      _avg: {
        rating_value: true,
      },
      orderBy: {
        _avg: {
          rating_value: 'desc',
        },
      },
      take: 5, // Ambil 5 konten dengan rata-rata rating tertinggi
    });

    const monthlyContentCreate = await this.prisma.content.count({
      where: {
        created_at: {
          gte: subMonths(new Date(), 1),
        },
      },
    });

    const lastMonthContentCreate = await this.prisma.content.count({
      where: {
        created_at: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
    });

    return {
      total_contents: totalContents,
      popular_content: popularContent,
      monthly_stats: {
        current_month_created: monthlyContentCreate,
        last_month_created: lastMonthContentCreate,
      },
    };
  }

  async getContentTypeStats() {
    const currentSixMonths = subMonths(new Date(), 6); // 6 bulan terakhir
    const previousSixMonths = subMonths(currentSixMonths, 6); // 6 bulan sebelum 6 bulan terakhir
    const contentType = {
      ebook: await this.prisma.content.count({
        where: {
          type: 'ebook',
          created_at: {
            gte: currentSixMonths,
          },
        },
      }),
      story: await this.prisma.content.count({
        where: {
          type: 'story',
          created_at: {
            gte: currentSixMonths,
          },
        },
      }),
      audio: await this.prisma.content.count({
        where: {
          type: 'audio',
          created_at: {
            gte: currentSixMonths,
          },
        },
      }),
      prakerin: await this.prisma.content.count({
        where: {
          type: 'prakerin',
          created_at: {
            gte: currentSixMonths,
          },
        },
      }),
      video: await this.prisma.content.count({
        where: {
          type: 'video',
          created_at: {
            gte: currentSixMonths,
          },
        },
      }),
      blog: await this.prisma.content.count({
        where: {
          type: 'blog',
          created_at: {
            gte: currentSixMonths,
          },
        },
      }),
    };

    const contentTypeCurrent = await this.prisma.content.count({
      where: {
        created_at: {
          gte: currentSixMonths,
        },
      },
    });

    const contentTypePrevious = await this.prisma.content.count({
      where: {
        created_at: {
          gte: previousSixMonths,
          lt: currentSixMonths,
        },
      },
    });

    // Hitung persentase perubahan
    const calculatePercentageChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0; // Jika sebelumnya 0 dan sekarang lebih besar, 100%
      return ((current - previous) / previous) * 100;
    };

    const trendingStat = calculatePercentageChange(
      contentTypeCurrent,
      contentTypePrevious,
    );

    return {
      content_types: contentType,
      trending_stat: trendingStat,
    };
  }

  async getPrakerinStats() {
    const currentDate = new Date();

    // Dapatkan tanggal 6 bulan yang lalu
    const sixMonthsAgo = subMonths(currentDate, 5); // 5 bulan + bulan ini = 6 bulan

    // Menggunakan groupBy untuk mengelompokkan data berdasarkan bulan
    const monthlyReports = await this.prisma.content.groupBy({
      by: ['created_at'],
      where: {
        type: 'story',
        created_at: {
          gte: startOfMonth(sixMonthsAgo), // Mulai dari awal 6 bulan yang lalu
          lte: endOfMonth(currentDate), // Hingga akhir bulan ini
        },
      },
      _count: {
        _all: true,
      },
    });

    // Mengubah hasil groupBy untuk memformat data per bulan
    const monthlyStats = [];
    for (let i = 0; i < 6; i++) {
      const targetMonth = subMonths(currentDate, i);
      const startOfTargetMonth = startOfMonth(targetMonth);
      const endOfTargetMonth = endOfMonth(targetMonth);

      // Temukan laporan di bulan target
      const reportsInMonth = monthlyReports.filter((report) => {
        const reportDate = new Date(report.created_at);
        return (
          reportDate >= startOfTargetMonth && reportDate <= endOfTargetMonth
        );
      });

      // Hitung jumlah laporan di bulan tersebut
      const reportCount = reportsInMonth.reduce(
        (acc, report) => acc + report._count._all,
        0,
      );

      // Masukkan data ke dalam array
      monthlyStats.unshift({
        month: targetMonth.toLocaleString('default', { month: 'long' }),
        count: reportCount,
      });
    }

    return {
      last_six_months_reports: monthlyStats,
    };
  }

  async getFeedbackStats() {
    const currentDate = new Date();

    const commentTotal = await this.prisma.comment.count();
    const ratingTotal = await this.prisma.rating.count();

    // Mendapatkan data rating untuk periode 3 bulan terakhir
    const ratingsData = await this.prisma.rating.groupBy({
      by: ['created_at'],
      _avg: {
        rating_value: true,
      },
      _count: true,
      where: {
        created_at: {
          gte: subDays(currentDate, 90),
          lte: currentDate,
        },
      },
    });

    // Buat map untuk agregasi berdasarkan tanggal
    const commentMap = new Map();
    const ratingMap = new Map();

    // Agregasi comments berdasarkan tanggal
    const commentsData = await this.prisma.comment.groupBy({
      by: ['created_at'],
      _count: true,
      where: {
        created_at: {
          gte: subDays(currentDate, 90),
          lte: currentDate,
        },
      },
    });

    commentsData.forEach((comment) => {
      const date = comment.created_at.toISOString().split('T')[0];
      const currentCount = commentMap.get(date) || 0;
      commentMap.set(date, currentCount + comment._count);
    });

    // Agregasi rating berdasarkan tanggal
    ratingsData.forEach((rating) => {
      const date = rating.created_at.toISOString().split('T')[0];
      const currentCount = ratingMap.get(date) || 0;
      ratingMap.set(date, {
        count: currentCount + rating._count,
        avg: rating._avg.rating_value,
      });
    });

    // Format hasil akhir sebagai array untuk frontend
    const dailyCommentStats = Array.from(commentMap.entries()).map(
      ([date, count]) => ({
        date,
        count,
      }),
    );

    const dailyRatingStats = Array.from(ratingMap.entries()).map(
      ([date, data]) => ({
        date,
        count: data.count,
        averageRating: data.avg,
      }),
    );

    return {
      last_three_months_comments: dailyCommentStats,
      last_three_months_ratings: dailyRatingStats,
      comment_total: commentTotal,
      rating_total: ratingTotal,
    };
  }
}
