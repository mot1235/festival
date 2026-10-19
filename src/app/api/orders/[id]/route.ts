import { NextRequest, NextResponse } from "next/server";
import { pool, initializeDatabase } from "@/lib/database";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();

    const body = await request.json();
    const { id } = await params;
    const orderId = parseInt(id);

    if (!orderId) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      // statusの更新
      if (body.status) {
        if (!["pending", "ready", "completed"].includes(body.status)) {
          return NextResponse.json(
            { error: "Invalid status" },
            { status: 400 }
          );
        }

        const result = await client.query(
          `
          UPDATE orders 
          SET status = $1 
          WHERE id = $2 AND deleted_at IS NULL
        `,
          [body.status, orderId]
        );

        if (result.rowCount === 0) {
          return NextResponse.json(
            { error: "Order not found" },
            { status: 404 }
          );
        }
      }

      // quantityの更新
      if (body.quantity !== undefined) {
        const quantity = parseInt(body.quantity);

        if (!quantity || quantity < 1 || quantity > 5) {
          return NextResponse.json(
            { error: "Invalid quantity. Must be between 1 and 5" },
            { status: 400 }
          );
        }

        const result = await client.query(
          `
          UPDATE orders 
          SET quantity = $1 
          WHERE id = $2 AND deleted_at IS NULL
        `,
          [quantity, orderId]
        );

        if (result.rowCount === 0) {
          return NextResponse.json(
            { error: "Order not found" },
            { status: 404 }
          );
        }
      }

      return NextResponse.json({ success: true });
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

// 注文削除用のDELETEエンドポイント（論理削除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();

    const { id } = await params;
    const orderId = parseInt(id);

    if (!orderId) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      // 論理削除：deleted_atに現在時刻を設定
      const result = await client.query(
        `
        UPDATE orders 
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND deleted_at IS NULL
      `,
        [orderId]
      );

      if (result.rowCount === 0) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true });
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
