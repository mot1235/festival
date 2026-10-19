"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import NewOrderSection from "@/components/NewOrderSection";
import CookingSection from "@/components/CookingSection";
import CalloutSection from "@/components/CalloutSection";
import { Order } from "@/types/order";

export default function Home() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 注文一覧を取得
  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  };

  // 新しい注文を作成
  const createOrder = async (quantity: number) => {
    if (quantity < 1 || quantity > 5) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity }),
      });

      if (response.ok) {
        const newOrder = await response.json();
        fetchOrders();

        // Toast通知で注文完了を表示
        toast.success("注文が完了しました！", {
          description: `番号: ${newOrder.orderNumber
            .toString()
            .padStart(3, "0")} (${quantity}杯)`,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Failed to create order:", error);
      toast.error("注文に失敗しました", {
        description: "もう一度お試しください",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 注文ステータスを更新
  const updateOrderStatus = async (
    orderId: number,
    status: Order["status"]
  ) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchOrders();

        // ステータス変更の通知
        if (status === "ready") {
          toast.success("調理完了しました！", {
            description: "お客様をお呼びしてください",
          });
        } else if (status === "completed") {
          toast.success("注文が完了しました", {
            description: "ありがとうございました",
          });
        } else if (status === "pending") {
          toast.success("調理中に戻しました", {
            description: "注文ステータスを変更しました",
          });
        }
      } else {
        throw new Error("Status update failed");
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
      toast.error("ステータス更新に失敗しました", {
        description: "もう一度お試しください",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 注文個数を更新
  const updateOrderQuantity = async (orderId: number, quantity: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity }),
      });

      if (response.ok) {
        fetchOrders();
        toast.success("注文個数を更新しました", {
          description: `新しい個数: ${quantity}杯`,
        });
      } else {
        throw new Error("Quantity update failed");
      }
    } catch (error) {
      console.error("Failed to update order quantity:", error);
      toast.error("個数更新に失敗しました", {
        description: "もう一度お試しください",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 注文を削除（取消し）
  const deleteOrder = async (orderId: number, orderNumber: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchOrders();
        toast.success("注文を取り消しました", {
          description: `番号: ${orderNumber.toString().padStart(3, "0")}`,
          duration: 3000,
        });
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      console.error("Failed to delete order:", error);
      toast.error("注文の取り消しに失敗しました", {
        description: "もう一度お試しください",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 自動更新
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // 5秒ごとに更新
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      {/* メインコンテンツエリア */}
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <NewOrderSection
              isLoading={isLoading}
              onCreateOrderAction={(quantity: number) => createOrder(quantity)}
            />
            <CookingSection
              orders={orders}
              isLoading={isLoading}
              onDeleteOrderAction={deleteOrder}
              onUpdateOrderStatusAction={updateOrderStatus}
              onUpdateOrderQuantity={updateOrderQuantity}
            />
            <CalloutSection
              orders={orders}
              isLoading={isLoading}
              onDeleteOrderAction={deleteOrder}
              onUpdateOrderStatusAction={updateOrderStatus}
              onUpdateOrderQuantity={updateOrderQuantity}
            />
          </div>
        </div>
        {/* メインコンテンツエリア終了 */}
      </div>

      <Footer />
    </div>
  );
}
