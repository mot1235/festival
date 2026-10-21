import { NextResponse } from "next/server";
import { pool, initializeDatabase } from "@/lib/database";

export async function GET() {
  try {
    // データベース接続・テーブル初期化の確認
    await initializeDatabase();

    const client = await pool.connect();

    try {
      // orders（注文）と order_items（明細）を結合して取得
      // 販売時点の単価（oi.price）と数量（oi.quantity）をそのまま使用します
      const result = await client.query(`
        SELECT 
          o.id,
          o.order_number AS "orderNumber",
          o.quantity,
          o.status,
          o.created_at AS "createdAt",
          o.deleted_at AS "deletedAt",
          -- 販売時点の単価（oi.price）× 数量（oi.quantity）で合計金額を動的算出
          COALESCE(
            (
              SELECT SUM(oi.quantity * oi.price)
              FROM order_items oi
              WHERE oi.order_id = o.id
            ),
            o.total_price,
            0
          ) AS "totalPrice",
          -- 商品明細データを JSON 配列として取得
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', oi.id,
                  'productName', oi.product_name,
                  'product_name', oi.product_name,
                  'quantity', oi.quantity,
                  'price', oi.price, -- 購入時点の単価を保持
                  'flavor', oi.flavor
                )
              )
              FROM order_items oi
              WHERE oi.order_id = o.id
            ),
            '[]'::json
          ) AS items
        FROM orders o
        ORDER BY o.created_at DESC
      `);

      return NextResponse.json(result.rows, {
        headers: {
          "Cache-Control": "no-store, max-age=0", // 新規注文が即座に反映されるようキャッシュを無効化
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Database error in GET /api/orders/history:", error);
    return NextResponse.json(
      { error: "注文履歴の取得に失敗しました" },
      { status: 500 }
    );
  }
}