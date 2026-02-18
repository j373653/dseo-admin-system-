const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.DB_HOST || '80.225.188.223',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: false,
  connectionTimeoutMillis: 5000, // 5 segundos timeout
  idleTimeoutMillis: 30000,
  max: 10, // máximo de conexiones
})

// Test de conexión
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})

async function testConnection() {
  console.log('🔄 Probando conexión a PostgreSQL...')
  console.log('Host:', process.env.DB_HOST || '80.225.188.223')
  console.log('Port:', process.env.DB_PORT || '5432')
  console.log('Database:', process.env.DB_NAME || 'postgres')
  console.log('User:', process.env.DB_USER || 'postgres')
  
  try {
    const client = await pool.connect()
    const result = await client.query('SELECT NOW()')
    console.log('✅ Conexión exitosa!')
    console.log('Server time:', result.rows[0].now)
    client.release()
    await pool.end()
  } catch (err) {
    console.error('❌ Error de conexión:', err.message)
    console.error('Código:', err.code)
    process.exit(1)
  }
}

testConnection()
