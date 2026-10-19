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
import { Plus } from "lucide-react";

interface NewOrderSectionProps {
  isLoading: boolean;
  onCreateOrderAction: (quantity: number) => void;
}

export default function NewOrderSection({
  isLoading,
  onCreateOrderAction,
}: NewOrderSectionProps) {
  const [quantity, setQuantity] = useState(1);

  const handleCreateOrder = () => {
    onCreateOrderAction(quantity);
  };
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="p-2 rounded-md bg-gray-100 text-gray-700">
          <Plus className="h-5 w-5" aria-hidden />
        </span>
        <h2 className="text-2xl font-semibold text-gray-800">新規注文</h2>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            商品
          </label>
          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 text-center">
            <span className="text-lg font-medium text-gray-800">担々麺</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            数量 (最大5杯)
          </label>
          <Select
            value={quantity.toString()}
            onValueChange={(value) => setQuantity(Number(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="数量を選択" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num}杯
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleCreateOrder}
          disabled/*={isLoading}*/
          className="w-full bg-black py-3 px-4 rounded-lg font-medium disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "注文中..." : "注文する"}
        </Button>
      </div>
    </div>
  );
}
