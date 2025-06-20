// scripts/seed.js
const { faker } = require('@faker-js/faker');
const client = require('../lib/db');
require('dotenv').config();

async function seed() {
  try {
    await client.connect();

    for (let i = 0; i < 50; i++) {
      const name = faker.person.fullName();
      const email = faker.internet.email();
      await client.query(
        'INSERT INTO users (name, email) VALUES ($1, $2)',
        [name, email]
      );
    }

    console.log('✅ 50 fake users inserted');
  } catch (err) {
    console.error('❌ Error seeding data:', err);
  } finally {
    await client.end();
  }
}

seed();
