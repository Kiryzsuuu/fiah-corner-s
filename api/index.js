const app = require('../src/app');

const PORT = process.env.PORT || 3000;

// Only bind port when running locally (not on Vercel)
if (process.env.VERCEL !== '1' && require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n☕  Fiah Corner API running on http://localhost:${PORT}/api`);
    console.log(`    Health: http://localhost:${PORT}/api/health\n`);
  });
}

module.exports = app;
