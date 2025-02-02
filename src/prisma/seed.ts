import { PrismaClient, RoleType, SexType } from '@prisma/client';
const prisma = new PrismaClient();

// Constants
const DEFAULT_IMAGE_URL =
  'https://images.unsplash.com/photo-1494537176433-7a3c4ef2046f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

// Seed Roles
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

// Seed Users
async function seedUsers() {
  const users = [
    {
      uuid: '33af070e-9cde-4024-8e90-fbfef6b39640',
      email: 'admin@skilins.com',
      full_name: 'admin Skilins',
      password: '$2a$10$nKlySD74S5zVXiL9jGlpJOO4RQivq.q11R2tELbLeb38Y2wgfMHOG',
      role: RoleType.admin,
    },
    {
      uuid: '38ebdc87-dca6-441b-9acf-08dda606eef4',
      email: 'staff@skilins.com',
      full_name: 'staff Skilins',
      password: '$2a$10$ikS7HR5PmR4nhZ1YE2M3zeCSFmAXSaPdVjOqDuvR62TgfiYvmbes6',
      role: RoleType.staff,
    },
    {
      uuid: '76301743-844a-4f11-85b7-a1ffa87784de',
      email: 'student@skilins.com',
      full_name: 'student Skilins',
      password: '$2a$10$X4ynU9Zt9WDk58jkqQyiFepxlBUZ9GP3F6vITECa9MS3YS63kvoby',
      role: RoleType.student,
    },
  ];

  await Promise.all(
    users.map((user) =>
      prisma.user.upsert({
        where: { uuid: user.uuid },
        update: {},
        create: {
          uuid: user.uuid,
          email: user.email,
          full_name: user.full_name,
          password: user.password,
          email_verified: true,
          role: { connect: { name: user.role } },
        },
      }),
    ),
  );

  console.log('Users seeded successfully');
}

// Seed Majors
async function seedMajors() {
  const majors = [
    'Pengembangan Perangkat Lunak dan Gim',
    'Kimia Industri',
    'Teknik Pengelasan',
    'Teknik Pemesinan',
    'Teknik Elektronika',
  ];

  await Promise.all(
    majors.map((name) =>
      prisma.major.upsert({
        where: { name },
        update: {
          avatar: DEFAULT_IMAGE_URL,
          image: DEFAULT_IMAGE_URL,
          name,
          description: 'No description available!',
        },
        create: {
          avatar: DEFAULT_IMAGE_URL,
          image: DEFAULT_IMAGE_URL,
          name,
          description: 'No description available!',
        },
      }),
    ),
  );

  console.log('Majors seeded successfully');
}

// Seed Students
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

// Seed Categories, Genres, and Tags
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
    `Children's Literature`,
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
    ...categories.map((name) =>
      prisma.category.upsert({
        where: { name },
        update: {
          avatar: DEFAULT_IMAGE_URL,
          name,
          description: 'No description available!',
        },
        create: {
          avatar: DEFAULT_IMAGE_URL,
          name,
          description: 'No description available!',
        },
      }),
    ),
    ...genres.map((name) =>
      prisma.genre.upsert({
        where: { name },
        update: {
          avatar: DEFAULT_IMAGE_URL,
          name,
          description: 'No description available!',
        },
        create: {
          avatar: DEFAULT_IMAGE_URL,
          name,
          description: 'No description available!',
        },
      }),
    ),
    ...tags.map((name) =>
      prisma.tag.upsert({
        where: { name },
        update: {
          avatar: DEFAULT_IMAGE_URL,
          name,
          description: 'No description available!',
        },
        create: {
          avatar: DEFAULT_IMAGE_URL,
          name,
          description: 'No description available!',
        },
      }),
    ),
  ]);

  console.log('Metadata (Categories, Genres, Tags) seeded successfully');
}

// Main Function
async function main() {
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
