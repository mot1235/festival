import { NextRequest, NextResponse } from "next/server";
import { pool, initializeDatabase } from "@/lib/database";

async function ensureInitialized() {
  await initializeDatabase();
}

interface OrderItemInput {
  productName: string;
  flavor?: string;
  quantity: number;
  price: number;
}

// 注文一覧の取得 (GET)
export async function GET() {
  try {
    await ensureInitialized();
    const client = await pool.connect();

    try {
      const result = await client.query(`
        SELECT 
          o.id,
          o.order_number,
          o.quantity,
          o.total_price,
          o.status,
          o.created_at,
          COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', oi.id,
                'productName', oi.product_name,
                'quantity', oi.quantity,
                'price', oi.price,
                'flavor', oi.flavor
              )
            ) FILTER (WHERE oi.id IS NOT NULL),
            '[]'
          ) AS items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.status IN ('pending', 'ready')
        AND o.deleted_at IS NULL
        GROUP BY o.id
        ORDER BY o.created_at ASC
      `);

      const formattedOrders = result.rows.map((order: any) => ({
        id: order.id,
        orderNumber: order.order_number,
        quantity: order.quantity,
        totalPrice: order.total_price,
        status: order.status,
        createdAt: order.created_at,
        items: order.items,
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

// 新規注文の登録 (POST)
export async function POST(request: NextRequest) {
  try {
    await ensureInitialized();
    const body = await request.json();

    // 1. カート形式（items配列）または従来の個数指定形式の吸収
    let items: OrderItemInput[] = [];

    if (Array.isArray(body.items) && body.items.length > 0) {
      // カート形式のリクエスト
      items = body.items.map((item: any) => ({
        productName: item.productName,
        flavor: item.flavor || "通常",
        quantity: Number(item.quantity || 0),
        price: Number(item.price || 0),
      }));
    } else {
      // 従来の固定プロパティ形式のリクエスト（フォールバック）
      const churros1 = Number(body.churros1 || 0);
      const churros1Flavor = body.churros1Flavor || "シナモン";
      const churros2 = Number(body.churros2 || 0);

      if (churros1 > 0) {
        items.push({
          productName: "チュロス",
          flavor: churros1Flavor,
          quantity: churros1,
          price: 350,
        });
      }
      if (churros2 > 0) {
        items.push({
          productName: "ソトックソトック",
          flavor: "通常",
          quantity: churros2,
          price: 400,
        });
      }
    }

    // バリデーション
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    if (!totalQuantity || totalQuantity < 1) {
      return NextResponse.json(
        { error: "1点以上商品を選択してください" },
        { status: 400 }
      );
    }

    const totalPrice = items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 2. 注文番号の発行 (order_sequence)
      const sequenceResult = await client.query(
        "SELECT current_number FROM order_sequence WHERE id = 1"
      );
      const newOrderNumber = sequenceResult.rows[0].current_number + 1;

      await client.query(
        "UPDATE order_sequence SET current_number = $1 WHERE id = 1",
        [newOrderNumber]
      );

      // 3. 親テーブル (orders) に注文情報を挿入
      const insertOrderResult = await client.query(
        `
        INSERT INTO orders (order_number, quantity, total_price, status, created_at)
        VALUES ($1, $2, $3, 'pending', CURRENT_TIMESTAMP)
        RETURNING id, created_at
      `,
        [newOrderNumber, totalQuantity, totalPrice]
      );

      const orderId = insertOrderResult.rows[0].id;
      const createdAt = insertOrderResult.rows[0].created_at;

      // 4. 子テーブル (order_items) に商品明細を保存
      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_name, quantity, price, flavor) VALUES ($1, $2, $3, $4, $5)`,
          [orderId, item.productName, item.quantity, item.price, item.flavor]
        );
      }

      await client.query("COMMIT");

      return NextResponse.json({
        id: orderId,
        orderNumber: newOrderNumber,
        quantity: totalQuantity,
        totalPrice,
        items,
        status: "pending",
        createdAt,
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