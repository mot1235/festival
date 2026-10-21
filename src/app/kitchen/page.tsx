"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Order } from "@/types/order";
import { Button } from "@/components/ui/button";
import { Check, Clock, RefreshCw } from "lucide-react";

// 味（フレーバー）に応じた色バッジを定義
const getFlavorBadgeStyle = (flavor?: string) => {
  switch (flavor) {
    case "シナモン":
      return "bg-amber-900/60 text-amber-200 border-amber-700/50";
    case "シュガー":
      return "bg-slate-800 text-slate-200 border-slate-600";
    case "チョコレート":
      return "bg-yellow-950 text-amber-500 border-amber-900";
    case "キャラメル":
      return "bg-orange-950 text-orange-300 border-orange-800";
    default:
      return "bg-gray-800 text-gray-300 border-gray-700";
  }
};

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 注文データの取得
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 10秒ごとに自動更新（KDS自動同期）
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // ステータス更新（調理中 ↔ 準備完了 ↔ 完了）
  const handleUpdateStatus = async (
    orderId: number,
    status: Order["status"]
  ) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        fetchOrders();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* ヘッダー */}
      <header className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-wide text-amber-400">
            厨房ディスプレイ (KDS)
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            調理中 / お渡し待ち: {orders.length} 件
          </p>
        </div>
        <Button
          onClick={fetchOrders}
          variant="outline"
          className="bg-gray-900 border-gray-700 hover:bg-gray-800 text-white"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          手動更新
        </Button>
      </header>

      {/* 注文カード一覧 */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Clock className="h-16 w-16 mb-4 opacity-40" />
          <p className="text-xl">現在、待ちの注文はありません</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {orders.map((order) => {
            const isReady = order.status === "ready";

            return (
              <div
                key={order.id}
                className={`flex flex-col justify-between rounded-xl p-5 border-2 transition-all shadow-lg ${
                  isReady
                    ? "bg-emerald-950/30 border-emerald-500/80"
                    : "bg-gray-900 border-amber-500/80"
                }`}
              >
                <div>
                  {/* カードヘッダー：整理番号とステータス */}
                  <div className="flex justify-between items-center border-b border-gray-800 pb-3 mb-4">
                    <span className="text-3xl font-black tracking-wider text-white">
                      #{order.orderNumber.toString().padStart(3, "0")}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        isReady
                          ? "bg-emerald-500 text-emerald-950"
                          : "bg-amber-500 text-amber-950"
                      }`}
                    >
                      {isReady ? "準備完了" : "調理中"}
                    </span>
                  </div>

                  {/* 明細リスト（味と本数を強調） */}
                  <div className="space-y-3 my-2">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center bg-gray-950 p-3 rounded-lg border border-gray-800"
                        >
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-lg font-bold text-gray-100">
                              {item.productName}
                            </span>
                            {item.flavor && item.flavor !== "通常" && (
                              <span
                                className={`text-xs px-2 py-0.5 rounded border font-semibold ${getFlavorBadgeStyle(
                                  item.flavor
                                )}`}
                              >
                                {item.flavor}
                              </span>
                            )}
                          </div>
                          <span className="text-3xl font-black text-amber-400">
                            {item.quantity}{" "}
                            <span className="text-xs text-gray-400 font-normal">
                              本
                            </span>
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="flex justify-between items-center bg-gray-950 p-3 rounded-lg border border-gray-800">
                        <span className="text-lg text-gray-200">合計本数</span>
                        <span className="text-3xl font-black text-amber-400">
                          {order.quantity} 本
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* アクションボタン */}
                <div className="mt-6 pt-3 border-t border-gray-800 flex gap-2">
                  {!isReady ? (
                    <Button
                      onClick={() => handleUpdateStatus(order.id, "ready")}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-6 text-lg rounded-lg shadow-md transition-colors"
                    >
                      <Check className="h-6 w-6 mr-2" />
                      出来上がり
                    </Button>
                  ) : (
                    <div className="flex gap-2 w-full">
                      <Button
                        onClick={() => handleUpdateStatus(order.id, "pending")}
                        variant="outline"
                        className="w-1/3 border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
                      >
                        戻す
                      </Button>
                      <Button
                        onClick={() => handleUpdateStatus(order.id, "completed")}
                        className="w-2/3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-base rounded-lg"
                      >
                        お渡し完了
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}