import { pool } from "./database";

export async function testConnection() {
  try {
    const client = await pool.connect();
    console.log("✅ Database connection successful");

    // 簡単なクエリでテスト
    const result = await client.query("SELECT NOW()");
    console.log("✅ Database query successful:", result.rows[0]);

    client.release();
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

export async function closePool() {
  await pool.end();
}
