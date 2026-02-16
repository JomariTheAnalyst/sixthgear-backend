// Simple script to list recent orders
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.gxkuvicedxyynqhoksnl:3wvJsaSECoYD0982@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres'
});

async function listOrders() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    const result = await client.query(`
      SELECT id, display_id, email, created_at, total, currency_code
      FROM "order"
      WHERE id LIKE 'order_01KHJ%'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log('\n=== RECENT ORDERS ===');
    console.log(`Found ${result.rows.length} orders\n`);
    
    result.rows.forEach((order, index) => {
      console.log(`${index + 1}. Order ID: ${order.id}`);
      console.log(`   Display ID: ${order.display_id}`);
      console.log(`   Email: ${order.email}`);
      console.log(`   Total: ${order.total} ${order.currency_code}`);
      console.log(`   Created: ${order.created_at}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

listOrders();
