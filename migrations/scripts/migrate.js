const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.log('⚠️  لم يتم تعيين DATABASE_URL');
    return;
  }

  const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔧 جاري الاتصال بقاعدة البيانات...');
    const client = await pool.connect();
    
    // التحقق من وجود الجداول أولاً
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'categories'
      );
    `);
    
    if (!result.rows[0].exists) {
      console.log('🔧 جاري تشغيل migrations...');
      const migrationSql = fs.readFileSync(path.join(__dirname, '../migrations/001_init.sql'), 'utf8');
      await client.query('BEGIN');
      await client.query(migrationSql);
      await client.query('COMMIT');
      console.log('✅ تم تشغيل migrations بنجاح');
    } else {
      console.log('✅ الجداول موجودة بالفعل، تخطي migrations');
    }
    
    client.release();
  } catch (error) {
    console.error('❌ فشل تشغيل migrations:', error.message);
  } finally {
    await pool.end();
  }
}

runMigrations();