import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? {
          rejectUnauthorized: false,
        }
      : false,
  max: 10, // 最大接続数
  idleTimeoutMillis: 30000, // アイドルタイムアウト
  connectionTimeoutMillis: 2000, // 接続タイムアウト
});

// データベースの初期化関数
export async function initializeDatabase() {
  let retries = 3;

  while (retries > 0) {
    try {
      const client = await pool.connect();

      try {
        // テーブルが存在しない場合は作成
        await client.query(`
          CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            order_number INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP NULL
          )
        `);

        // 既存のテーブルにdeleted_atカラムを追加（存在しない場合）
        await client.query(`
          ALTER TABLE orders 
          ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL
        `);
        // orders テーブルに total_price カラムを追加（存在しない場合）
        await client.query(`
          ALTER TABLE orders 
          ADD COLUMN IF NOT EXISTS total_price INTEGER NOT NULL DEFAULT 0
        `);

        // 2. 子テーブル (order_items) の作成（商品ごとの集計用）
        await client.query(`
          CREATE TABLE IF NOT EXISTS order_items (
            id SERIAL PRIMARY KEY,
            order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            product_name VARCHAR(100) NOT NULL,
            quantity INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // 集計・検索用インデックスの作成
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
          CREATE INDEX IF NOT EXISTS idx_order_items_product_name ON order_items(product_name);
        `);
        
        
        // order_items テーブルに price カラムを追加（存在しない場合）
        await client.query(`
          ALTER TABLE order_items 
          ADD COLUMN IF NOT EXISTS price INTEGER NOT NULL DEFAULT 0
        `);

        // order_items テーブルに flavor カラムを追加（存在しない場合）
        await client.query(`
          ALTER TABLE order_items 
          ADD COLUMN IF NOT EXISTS flavor VARCHAR(50) DEFAULT 'シナモン'
        `);
        // 注文番号のシーケンスを管理するテーブル
        await client.query(`
          CREATE TABLE IF NOT EXISTS order_sequence (
            id INTEGER PRIMARY KEY DEFAULT 1,
            current_number INTEGER NOT NULL DEFAULT 0
          )
        `);

        // 初期データがない場合は挿入
        const sequenceResult = await client.query(
          "SELECT COUNT(*) as count FROM order_sequence"
        );
        const sequenceCount = parseInt(sequenceResult.rows[0].count);

        if (sequenceCount === 0) {
          await client.query(
            "INSERT INTO order_sequence (id, current_number) VALUES (1, 0)"
          );
        }

        console.log("✅ Database initialized successfully");
        return;
      } finally {
        client.release();
      }
    } catch (error) {
      retries--;
      console.error(
        `❌ Database initialization failed. Retries left: ${retries}`,
        error
      );

      if (retries === 0) {
        throw error;
      }

      // 1秒待ってリトライ
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

export { pool };
export default pool;
