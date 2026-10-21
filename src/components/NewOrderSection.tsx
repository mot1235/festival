"use client";

import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ShoppingBag } from "lucide-react";

export interface OrderCartItem {
  productName: string;
  flavor?: string;
  quantity: number;
  price: number;
}

interface NewOrderSectionProps {
  isLoading: boolean;
  onCreateOrderAction: (cart: OrderCartItem[]) => void;
}

const PRODUCTS = [
  {
    name: "チュロス",
    price: 350,
    hasFlavors: true,
    flavors: ["シナモン", "シュガー", "チョコレート", "キャラメル"],
  },
  {
    name: "ソトックソトック",
    price: 400,
    hasFlavors: false,
    flavors: ["通常"],
  },
];

export default function NewOrderSection({
  isLoading,
  onCreateOrderAction,
}: NewOrderSectionProps) {
  // 選択中のフォーム状態
  const [selectedProduct, setSelectedProduct] = useState(PRODUCTS[0]);
  const [selectedFlavor, setSelectedFlavor] = useState(PRODUCTS[0].flavors[0]);
  const [quantity, setQuantity] = useState(1);

  // カート（選択済み明細のリスト）
  const [cart, setCart] = useState<OrderCartItem[]>([]);

  // 商品変更時のフレーバーリセット
  const handleProductChange = (productName: string) => {
    const prod = PRODUCTS.find((p) => p.name === productName) || PRODUCTS[0];
    setSelectedProduct(prod);
    setSelectedFlavor(prod.flavors[0]);
  };

  // カートに追加
  const handleAddToCart = () => {
    if (quantity <= 0) return;

    setCart((prev) => {
      // 既存の同じ商品・同じ味があれば数量を合算
      const existingIndex = prev.findIndex(
        (item) =>
          item.productName === selectedProduct.name &&
          item.flavor === selectedFlavor
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }

      return [
        ...prev,
        {
          productName: selectedProduct.name,
          flavor: selectedFlavor,
          quantity,
          price: selectedProduct.price,
        },
      ];
    });

    setQuantity(1);
  };

  // カートから削除
  const handleRemoveFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  // 注文送信
  const handleSubmitOrder = () => {
    if (cart.length > 0) {
      onCreateOrderAction(cart);
      setCart([]);
    }
  };

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div className="flex items-center gap-2 border-b pb-4">
        <span className="p-2 rounded-md bg-gray-100 text-gray-700">
          <Plus className="h-5 w-5" aria-hidden />
        </span>
        <h2 className="text-2xl font-semibold text-gray-800">新規注文</h2>
      </div>

      {/* 1. 商品追加フォーム */}
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 商品選択 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              商品
            </label>
            <Select
              value={selectedProduct.name}
              onValueChange={handleProductChange}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="商品を選択" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCTS.map((prod) => (
                  <SelectItem key={prod.name} value={prod.name}>
                    {prod.name} (¥{prod.price})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* フレーバー選択 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              フレーバー
            </label>
            <Select
              value={selectedFlavor}
              onValueChange={setSelectedFlavor}
              disabled={!selectedProduct.hasFlavors}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="味を選択" />
              </SelectTrigger>
              <SelectContent>
                {selectedProduct.flavors.map((flv) => (
                  <SelectItem key={flv} value={flv}>
                    {flv}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 数量選択 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              本数
            </label>
            <Select
              value={quantity.toString()}
              onValueChange={(v) => setQuantity(Number(v))}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="数量" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} 本
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleAddToCart}
          variant="outline"
          className="w-full bg-white hover:bg-gray-100 border-dashed border-gray-400 text-gray-700 font-medium"
        >
          <Plus className="h-4 w-4 mr-2" />
          注文リストに追加する
        </Button>
      </div>

      {/* 2. カート（追加済みアイテムリスト） */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-600 flex items-center gap-2">
          <ShoppingBag className="h-4 w-4" />
          選択中の商品 ({cart.length}件)
        </h3>

        {cart.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4 border border-dashed rounded-lg">
            商品を選択して「リストに追加する」を押してください
          </p>
        ) : (
          <div className="space-y-2">
            {cart.map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center bg-white border p-3 rounded-lg shadow-sm"
              >
                <div>
                  <span className="font-bold text-gray-800 mr-2">
                    {item.productName}
                  </span>
                  {item.flavor && item.flavor !== "通常" && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium mr-2">
                      {item.flavor}
                    </span>
                  )}
                  <span className="text-sm text-gray-600">
                    × {item.quantity}本
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900 text-sm">
                    ¥{(item.quantity * item.price).toLocaleString()}
                  </span>
                  <Button
                    onClick={() => handleRemoveFromCart(idx)}
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {/* 小計 */}
            <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg font-bold text-gray-800 text-base">
              <span>合計 ({totalQuantity}本)</span>
              <span>¥{totalPrice.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. 確定ボタン */}
      <Button
        onClick={handleSubmitOrder}
        disabled={isLoading || cart.length === 0}
        className="w-full bg-black hover:bg-gray-800 text-white py-3 px-4 rounded-lg font-medium disabled:cursor-not-allowed transition-colors text-base"
      >
        {isLoading
          ? "注文処理中..."
          : cart.length > 0
          ? `この内容で注文を確定する (¥${totalPrice.toLocaleString()})`
          : "商品をリストに追加してください"}
      </Button>
    </div>
  );
}