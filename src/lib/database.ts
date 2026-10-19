import { Pool } from "pg";

declare global {
  var pgPool: Pool | undefined;
}

// 接続設定の調整
export const pool =
  globalThis.pgPool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // SSL設定: 環境変数やクラウドサービスに応じて柔軟に適用
    ssl:
      process.env.NODE_ENV === "production" || process.env.DATABASE_URL?.includes("sslmode=require")
        ? { rejectUnauthorized: false }
        : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // ★ 2秒から10秒へ延長
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.pgPool = pool;
}

let isInitialized = false;

export async function initializeDatabase() {
  if (isInitialized) return;

  let retries = 3;

  while (retries > 0) {
    let client;
    try {
      // 接続を取得
      client = await pool.connect();

      try {
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

        await client.query(`
          ALTER TABLE orders 
          ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL
        `);

        await client.query(`
          CREATE TABLE IF NOT EXISTS order_sequence (
            id INTEGER PRIMARY KEY DEFAULT 1,
            current_number INTEGER NOT NULL DEFAULT 0
          )
        `);

        await client.query(`
          INSERT INTO order_sequence (id, current_number)
          VALUES (1, 0)
          ON CONFLICT (id) DO NOTHING;
        `);

        isInitialized = true;
        console.log("✅ Database initialized successfully");
        return;
      } finally {
        if (client) client.release(); // 確実に接続をプールに戻す
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

      // リトライ前に2秒待機
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

export default pool;