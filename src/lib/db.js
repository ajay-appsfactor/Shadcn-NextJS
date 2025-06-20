import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'my_next_app',
  password: 'ajay@321',
  port: 5432,
});


// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   // ssl: {
//   //   rejectUnauthorized: false,
//   // },
// });

pool.connect()
  .then(() => {
    console.log('Connected to PostgreSQL database');
  })
  .catch((err) => {
    console.error('PostgreSQL connection error:', err);
  });

export default pool;



