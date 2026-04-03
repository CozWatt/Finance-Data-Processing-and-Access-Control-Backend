require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const { User } = require('./models/User');

const PORT = process.env.PORT || 3000;

/**
 * Seeds an initial admin user if no users exist in the database.
 * This ensures the system is accessible right after setup.
 */
const seedAdminUser = async () => {
  const count = await User.countDocuments();
  if (count === 0) {
    await User.create({
      name: 'Super Admin',
      email: 'admin@finance.dev',
      password: 'Admin@123',
      role: 'admin',
      status: 'active',
    });
    logger.info('Seeded default admin user: admin@finance.dev / Admin@123');
    logger.warn('⚠️  Change the default admin password immediately in production!');
  }
};

const start = async () => {
  await connectDB();
  await seedAdminUser();

  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
  });
};

// Handle uncaught exceptions and promise rejections gracefully
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});

start();
