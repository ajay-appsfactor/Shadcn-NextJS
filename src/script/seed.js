// scripts/seed.js
import pool from "../lib/db.js";
import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";

// CONFIGURATION
const TOTAL_USERS = 10000;
const BATCH_SIZE = 1000;

// Generate batch of fake users and customers
function generateBatch(batchSize) {
  const users = [];
  const customers = [];

  for (let i = 0; i < batchSize; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName });

    users.push({
      email,
      password: faker.internet.password({ length: 10 }),
      first_name: firstName,
      last_name: lastName,
    });

    customers.push({
      first_name: firstName,
      last_name: lastName,
      email,
      company: faker.company.name(),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zip: faker.location.zipCode("#####"),
      country: faker.location.country(),
      phone: faker.phone.number("(###) ###-####"),
      mobile: faker.phone.number("(###) ###-####"),

      shipping_firstname: firstName,
      shipping_lastname: lastName,
      shipping_company: faker.company.name(),
      shipping_address: faker.location.streetAddress(),
      shipping_city: faker.location.city(),
      shipping_state: faker.location.state(),
      shipping_zip: faker.location.zipCode("#####"),
      shipping_country: faker.location.country(),
      shipping_phone: faker.phone.number("(###) ###-####"),
      shipping_mobile: faker.phone.number("(###) ###-####"),

      sendinvoice: faker.datatype.boolean(),
      conformance: faker.lorem.word(),
      terms: faker.lorem.words(2),
      freight: faker.finance.amount(),
      note: faker.lorem.sentence(),
      about: faker.lorem.paragraph(),
      sort_order: i + 1,
    });
  }

  return { users, customers };
}

// Main seed function
async function seed() {
  const client = await pool.connect();

  try {
    console.time("⏱️ Total seeding time");
    await client.query("BEGIN");

    console.log("🧹 Clearing old data...");
    await client.query("TRUNCATE TABLE customers CASCADE");
    await client.query("TRUNCATE TABLE users CASCADE");

    let inserted = 0;
    const totalBatches = Math.ceil(TOTAL_USERS / BATCH_SIZE);

    for (let batch = 0; batch < totalBatches; batch++) {
      const currentBatchSize = Math.min(BATCH_SIZE, TOTAL_USERS - inserted);
      console.log(
        `\n🔄 Batch ${
          batch + 1
        }/${totalBatches} - Inserting ${currentBatchSize} users/customers...`
      );

      const { users, customers } = generateBatch(currentBatchSize);

      // Insert users and get back their IDs
      const userInsertPromises = users.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        return client.query(
          `INSERT INTO users (email, password, first_name, last_name)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [user.email, hashedPassword, user.first_name, user.last_name]
        );
      });

      const userResults = await Promise.all(userInsertPromises);
      const userIds = userResults.map((res) => res.rows[0].id);

      // Insert customers
      const customerInsertPromises = customers.map((customer, i) => {
        return client.query(
          `INSERT INTO customers (
            user_id, first_name, last_name, email, company, address,
            city, state, zip, country, phone, mobile,
            shipping_firstname, shipping_lastname, shipping_company, shipping_address,
            shipping_city, shipping_state, shipping_zip, shipping_country, shipping_phone, shipping_mobile,
            sendinvoice, conformance, terms, freight, note, about, sort_order
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11, $12,
            $13, $14, $15, $16,
            $17, $18, $19, $20, $21, $22,
            $23, $24, $25, $26, $27, $28, $29
          )`,
          [
            userIds[i],
            customer.first_name,
            customer.last_name,
            customer.email,
            customer.company,
            customer.address,
            customer.city,
            customer.state,
            customer.zip,
            customer.country,
            customer.phone,
            customer.mobile,

            customer.shipping_firstname,
            customer.shipping_lastname,
            customer.shipping_company,
            customer.shipping_address,
            customer.shipping_city,
            customer.shipping_state,
            customer.shipping_zip,
            customer.shipping_country,
            customer.shipping_phone,
            customer.shipping_mobile,

            customer.sendinvoice,
            customer.conformance,
            customer.terms,
            customer.freight,
            customer.note,
            customer.about,
            customer.sort_order,
          ]
        );
      });

      await Promise.all(customerInsertPromises);
      inserted += currentBatchSize;
      console.log(`✅ Inserted ${inserted}/${TOTAL_USERS}`);
    }

    await client.query("COMMIT");
    console.timeEnd("⏱️ Total seeding time");
    console.log("🎉 Seeding complete!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error during seeding:", err);
  } finally {
    client.release();
    await pool.end();
    process.exit();
  }
}

seed();
