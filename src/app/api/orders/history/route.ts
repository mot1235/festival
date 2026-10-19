import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? {
          rejectUnauthorized: false,
        }
      : false,
});

export async function GET() {
  try {
    const client = await pool.connect();
    
    try {
      // 全ての注文履歴を取得（削除済みも含む）
      // 新しい順に並べ替え
      const result = await client.query(`
        SELECT 
          id,
          order_number as "orderNumber",
          quantity,
          status,
          created_at as "createdAt",
          deleted_at as "deletedAt"
        FROM orders 
        ORDER BY created_at DESC
      `);

      return NextResponse.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "注文履歴の取得に失敗しました" },
      { status: 500 }
    );
  }
}