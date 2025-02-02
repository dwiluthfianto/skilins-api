import { Injectable } from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, RoleType } from '@prisma/client';
import { FindStudentDto } from './dto/find-student.dto';

@Injectable()
export class StudentService {
  constructor(private prismaService: PrismaService) {}
  async create(createStudentDto: CreateStudentDto) {
    const { nis, name, major, birthplace, birthdate, sex, user_uuid } =
      createStudentDto;

    const res = await this.prismaService.$transaction(async (prisma) => {
      await prisma.student.create({
        data: {
          nis,
          name,
          birthdate,
          birthplace,
          sex,
          user: { connect: { uuid: user_uuid } },
          major: { connect: { name: major } },
        },
      });

      return {
        status: 'success',
        message: 'student succesfully added!',
      };
    });

    return res;
  }

  async findAllStudent(query: FindStudentDto) {
    const { page, limit, nis, name, major, status } = query;

    const nisFilter = {
      nis: {
        contains: nis,
        mode: Prisma.QueryMode.insensitive,
      },
    };

    const nameFilter = {
      name: {
        contains: name,
        mode: Prisma.QueryMode.insensitive,
      },
    };

    const majorFilter = major
      ? {
          major: {
            name: {
              equals: major,
              mode: Prisma.QueryMode.insensitive,
            },
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

    const filter = {
      ...nisFilter,
      ...nameFilter,
      ...majorFilter,
      ...statusFilter,
    };

    const student = await this.prismaService.student.findMany({
      ...(page && limit ? { skip: (page - 1) * limit, take: limit } : {}),
      where: { ...filter },
      include: { major: true },
    });

    const total = await this.prismaService.student.count({
      where: { ...filter },
    });

    return {
      status: 'success',
      data: student.map((student) => ({
        uuid: student.uuid,
        nis: student.nis,
        name: student.name,
        birthplace: student.birthplace,
        birthdate: student.birthdate,
        sex: student.sex,
        major: student.major.name,
        status: student.status,
      })),
      pagination: {
        page,
        limit,
        total,
        last_page: limit ? Math.ceil(total / limit) : 1,
      },
    };
  }

  async findOne(uuid: string) {
    const student = await this.prismaService.student.findUniqueOrThrow({
      where: { uuid },
      include: { major: true },
    });

    return {
      status: 'success',
      data: {
        uuid: student.uuid,
        nis: student.nis,
        name: student.name,
        birthplace: student.birthplace,
        birthdate: student.birthdate,
        sex: student.sex,
        major: student.major.name,
        status: student.status,
      },
    };
  }

  async update(uuid: string, updateStudentDto: UpdateStudentDto) {
    const { nis, name, major, birthplace, birthdate, sex } = updateStudentDto;

    const res = await this.prismaService.$transaction(async (prisma) => {
      await prisma.major.findUniqueOrThrow({
        where: { name: major },
      });
      await prisma.student.findUniqueOrThrow({ where: { uuid } });

      await prisma.student.update({
        where: { uuid },
        data: {
          nis,
          name,
          birthdate,
          birthplace,
          sex,
          major: { connect: { name: major } },
        },
      });

      return {
        status: 'success',
        message: 'student succesfully updated!',
      };
    });

    return res;
  }

  async remove(uuid: string) {
    await this.prismaService.student.findUniqueOrThrow({
      where: { uuid },
    });
    await this.prismaService.student.delete({
      where: { uuid },
    });

    return {
      status: 'success',
      message: 'student succesfully deleted',
    };
  }

  async verifiedStudent(uuid: string) {
    const res = await this.prismaService.$transaction(async (prisma) => {
      const student = await prisma.student.findUniqueOrThrow({
        where: { uuid },
      });

      await prisma.student.update({
        where: { uuid: student.uuid },
        data: {
          status: true,
        },
      });

      await prisma.user.update({
        where: {
          id: student.user_id,
        },
        data: {
          role: { connect: { name: RoleType.student } },
        },
      });

      return {
        status: 'success',
        message: 'student verified!',
      };
    });

    return res;
  }
}
