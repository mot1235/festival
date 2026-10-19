import { NextRequest, NextResponse } from "next/server";
import { pool, initializeDatabase } from "@/lib/database";

// データベース初期化を確認
async function ensureInitialized() {
  await initializeDatabase();
}

// 注文一覧を取得
export async function GET() {
  try {
    await ensureInitialized();

    const client = await pool.connect();

    try {
      const result = await client.query(`
        SELECT * FROM orders 
        WHERE status IN ('pending', 'ready')
        AND deleted_at IS NULL
        ORDER BY created_at ASC
      `);

      // カラム名をキャメルケースに変換
      const formattedOrders = result.rows.map((order: any) => ({
        id: order.id,
        orderNumber: order.order_number,
        quantity: order.quantity,
        status: order.status,
        createdAt: order.created_at,
      }));

      return NextResponse.json(formattedOrders);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// 新しい注文を作成
export async function POST(request: NextRequest) {
  try {
    await ensureInitialized();

    const { quantity } = await request.json();

    if (!quantity || quantity < 1 || quantity > 5) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      // トランザクションを開始
      await client.query("BEGIN");

      // 注文番号を取得・更新
      const sequenceResult = await client.query(
        "SELECT current_number FROM order_sequence WHERE id = 1"
      );

      const currentSeq = sequenceResult.rows[0];
      const newOrderNumber = currentSeq.current_number + 1;

      await client.query(
        "UPDATE order_sequence SET current_number = $1 WHERE id = 1",
        [newOrderNumber]
      );

      // 注文を挿入
      const insertResult = await client.query(
        `
        INSERT INTO orders (order_number, quantity, status, created_at)
        VALUES ($1, $2, 'pending', CURRENT_TIMESTAMP)
        RETURNING id, created_at
      `,
        [newOrderNumber, quantity]
      );

      await client.query("COMMIT");

      const newOrder = insertResult.rows[0];

      return NextResponse.json({
        id: newOrder.id,
        orderNumber: newOrderNumber,
        quantity,
        status: "pending",
        createdAt: newOrder.created_at,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
