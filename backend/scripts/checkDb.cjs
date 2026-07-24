const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const usersCount = await prisma.user.count();
    const jobsCount = await prisma.job.count();
    const reportsCount = await prisma.jobReport.count();

    console.log('Counts:');
    console.log({ usersCount, jobsCount, reportsCount });

    const users = await prisma.user.findMany({ take: 5, select: { id: true, name: true, email: true, role: true, createdAt: true } });
    const jobs = await prisma.job.findMany({ take: 5, select: { id: true, title: true, company: true, status: true, createdAt: true } });
    const reports = await prisma.jobReport.findMany({ take: 5, select: { id: true, jobId: true, reporterId: true, reason: true, status: true, createdAt: true } });

    console.log('\nSample users:');
    console.table(users);

    console.log('\nSample jobs:');
    console.table(jobs);

    console.log('\nSample reports:');
    console.table(reports);
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await prisma.$disconnect();
  }
})();
