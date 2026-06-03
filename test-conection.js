const { Client } = require('pg');

const client = new Client({
  host: '127.0.0.1',
  port: 5433,
  database: 'polla_mundial',
  user: 'postgres',
  password: String('polla_mundial_password'),
});

client.connect()
  .then(() => {
    console.log('✅ Conexión exitosa!');
    return client.end();
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
  });