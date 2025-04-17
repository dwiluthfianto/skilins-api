import { PrismaClient, RoleType, SexType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import { CUSTOMER_DATA_PATH, processImage } from '@utils/process-image.util';
import { getRandomImage } from '@utils/process-image.util';

const prisma = new PrismaClient();

// Updated seed functions
async function seedRoles() {
  const roles = [
    { name: RoleType.admin },
    { name: RoleType.staff },
    { name: RoleType.user },
    { name: RoleType.judge },
    { name: RoleType.student },
  ];

  await Promise.all(
    roles.map((role) =>
      prisma.role.upsert({
        where: { name: role.name },
        update: {},
        create: role,
      }),
    ),
  );

  console.log('Roles seeded successfully');
}

async function seedMajors() {
  const majors = [
    { name: 'Pengembangan Perangkat Lunak dan Gim' },
    { name: 'Kimia Industri' },
    { name: 'Teknik Pengelasan' },
    { name: 'Teknik Pemesinan' },
    { name: 'Teknik Elektronika' },
  ];

  await Promise.all(
    majors.map(async (major) => {
      const imageUrl = await processImage(getRandomImage(), 'majors');
      const avatarUrl = await processImage(getRandomImage(), 'majors');

      return prisma.major.upsert({
        where: { name: major.name },
        update: {
          avatar: avatarUrl,
          image: imageUrl,
          name: major.name,
          description: 'No description available!',
        },
        create: {
          avatar: avatarUrl,
          image: imageUrl,
          name: major.name,
          description: 'No description available!',
        },
      });
    }),
  );

  console.log('Majors seeded successfully');
}

async function seedMetadata() {
  const categories = ['Fiction', 'Non-fiction'];
  const genres = [
    'Mystery',
    'Science Fiction',
    'Fantasy',
    'Romance',
    'Thriller',
    'Biography',
    'Self-Help',
    'Historical Fiction',
    'Young Adult',
    "Children's Literature",
    'Graphic Novel',
    'Poetry',
    'Cookbook',
    'Travel',
    'Memoir',
    'Classic',
    'Dystopian',
    'Adventure',
  ];

  const tags = [
    'Short Stories',
    'Indie Film',
    'Documentary Feature',
    'Short Film',
    'Podcast Series',
    'True Crime Podcast',
    'Exclusive Content',
    'Behind-the-Scenes Access',
  ];

  await Promise.all([
    ...categories.map(async (name) => {
      const avatarUrl = await processImage(getRandomImage(), 'categories');
      return prisma.category.upsert({
        where: { name },
        update: {
          avatar: avatarUrl,
          name,
          description: 'No description available!',
        },
        create: {
          avatar: avatarUrl,
          name,
          description: 'No description available!',
        },
      });
    }),
    ...genres.map(async (name) => {
      const avatarUrl = await processImage(getRandomImage(), 'genres');
      return prisma.genre.upsert({
        where: { name },
        update: {
          avatar: avatarUrl,
          name,
          description: 'No description available!',
        },
        create: {
          avatar: avatarUrl,
          name,
          description: 'No description available!',
        },
      });
    }),
    ...tags.map(async (name) => {
      const avatarUrl = await processImage(getRandomImage(), 'tags');
      return prisma.tag.upsert({
        where: { name },
        update: {
          avatar: avatarUrl,
          name,
          description: 'No description available!',
        },
        create: {
          avatar: avatarUrl,
          name,
          description: 'No description available!',
        },
      });
    }),
  ]);

  console.log('Metadata (Categories, Genres, Tags) seeded successfully');
}

async function seedUsers() {
  const adminPass = await bcrypt.hash('sIc1l1ns', 10);
  const staffPass = await bcrypt.hash('@staff.skilins106', 10);
  const studentPass = await bcrypt.hash('@student.skilins106', 10);

  const users = [
    {
      uuid: '33af070e-9cde-4024-8e90-fbfef6b39640',
      email: 'admin@skilins.com',
      full_name: 'admin Skilins',
      password: adminPass,
      role: RoleType.admin,
    },
    {
      uuid: '38ebdc87-dca6-441b-9acf-08dda606eef4',
      email: 'staff@skilins.com',
      full_name: 'staff Skilins',
      password: staffPass,
      role: RoleType.staff,
    },
    {
      uuid: '76301743-844a-4f11-85b7-a1ffa87784de',
      email: 'student@skilins.com',
      full_name: 'student Skilins',
      password: studentPass,
      role: RoleType.student,
    },
  ];

  await Promise.all(
    users.map(async (user) => {
      const profileUrl = await processImage(getRandomImage(), 'users');

      return prisma.user.upsert({
        where: { uuid: user.uuid },
        update: {
          profile: profileUrl,
        },
        create: {
          uuid: user.uuid,
          email: user.email,
          full_name: user.full_name,
          password: user.password,
          profile: profileUrl,
          email_verified: true,
          role: { connect: { name: user.role } },
        },
      });
    }),
  );

  console.log('Users seeded successfully');
}

async function seedStudents() {
  const student = {
    uuid: 'f9d5d6b8-6998-402b-9355-8040d715bf8e',
    nis: '0022413284',
    name: 'John Doe',
    birthdate: '2004-11-12',
    birthplace: 'Bogor',
    sex: SexType.male,
    userUuid: '76301743-844a-4f11-85b7-a1ffa87784de',
    majorName: 'Pengembangan Perangkat Lunak dan Gim',
  };

  await prisma.student.upsert({
    where: { uuid: student.uuid },
    update: {},
    create: {
      uuid: student.uuid,
      nis: student.nis,
      name: student.name,
      birthdate: new Date(student.birthdate),
      birthplace: student.birthplace,
      sex: student.sex,
      user: { connect: { uuid: student.userUuid } },
      major: { connect: { name: student.majorName } },
    },
  });

  console.log('Students seeded successfully');
}

// Main Function
async function main() {
  // Ensure customer-data directory exists and has images
  if (!fs.existsSync(CUSTOMER_DATA_PATH)) {
    throw new Error('customer-data directory not found!');
  }

  const imageFiles = fs
    .readdirSync(CUSTOMER_DATA_PATH)
    .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file));

  if (imageFiles.length === 0) {
    throw new Error('No images found in customer-data directory!');
  }

  await seedRoles();
  await seedUsers();
  await seedMajors();
  await seedStudents();
  await seedMetadata();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
