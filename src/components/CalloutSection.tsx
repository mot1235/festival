"use client";

import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { X, Megaphone, Ellipsis, FilePenLine, Undo2, Info } from "lucide-react";
import { Order } from "@/types/order";

interface CalloutSectionProps {
  orders: Order[];
  isLoading: boolean;
  onDeleteOrderAction: (orderId: number, orderNumber: number) => void;
  onUpdateOrderStatusAction: (orderId: number, status: Order["status"]) => void;
  onUpdateOrderQuantity?: (orderId: number, quantity: number) => void;
}

export default function CalloutSection({
  orders,
  isLoading,
  onDeleteOrderAction,
  onUpdateOrderStatusAction,
  onUpdateOrderQuantity,
}: CalloutSectionProps) {
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(1);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const readyOrders = orders.filter((order) => order.status === "ready");

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setEditQuantity(order.quantity);
    setIsEditDialogOpen(true);
  };

  const handleViewOrder = (order: Order) => {
    setViewingOrder(order);
    setIsViewDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (
      editingOrder &&
      onUpdateOrderQuantity &&
      editQuantity >= 1 &&
      editQuantity <= 5
    ) {
      onUpdateOrderQuantity(editingOrder.id, editQuantity);
      setIsEditDialogOpen(false);
      setEditingOrder(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="p-2 rounded-md bg-gray-100 text-gray-700">
          <Megaphone className="h-5 w-5" aria-hidden />
        </span>
        <h2 className="text-2xl font-semibold text-gray-800">呼び出し中</h2>
      </div>

      {readyOrders.length > 0 ? (
        <div className="space-y-4">
          {readyOrders.map((order) => (
            <div
              key={order.id}
              className="border border-green-200 bg-green-50 rounded-lg p-4"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xl font-bold text-green-800">
                    {order.orderNumber ? `#${order.orderNumber}` : "---"}
                  </div>
                  <div className="text-green-700">{order.quantity}杯</div>
                  <div className="text-sm text-green-600">
                    {order.createdAt
                      ? (() => {
                          const date = new Date(order.createdAt);
                          return date.toLocaleTimeString("ja-JP", {
                            timeZone: "Asia/Tokyo",
                            hour12: false,
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          });
                        })()
                      : "--:--:--"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <AlertDialog>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button variant="outline" className="px-2 py-1">
                          <Ellipsis />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-36">
                        <DropdownMenuLabel>操作</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() => handleViewOrder(order)}
                        >
                          <Info />
                          詳細表示
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            onUpdateOrderStatusAction(order.id, "pending")
                          }
                        >
                          <Undo2 />
                          調理中へ戻す
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => handleEditOrder(order)}
                        >
                          <FilePenLine />
                          編集
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem>
                            <X />
                            取消
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          注文を取り消しますか？
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          注文番号 #{order.orderNumber} を取り消します。
                          <br />
                          この操作は取り消せません。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            onDeleteOrderAction(order.id, order.orderNumber)
                          }
                          className="bg-red-600 hover:bg-red-700"
                        >
                          はい
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button
                    onClick={() =>
                      onUpdateOrderStatusAction(order.id, "completed")
                    }
                    disabled={isLoading}
                    className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-lg disabled:cursor-not-allowed transition-colors"
                  >
                    受け取り完了
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          呼び出し中の注文はありません
        </div>
      )}

      {/* 編集用ダイアログ */}
      <AlertDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>注文を編集</AlertDialogTitle>
            <AlertDialogDescription>
              注文番号 #{editingOrder?.orderNumber} の個数を変更できます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="edit-quantity" className="text-sm font-medium">
              個数
            </Label>
            <Input
              id="edit-quantity"
              type="number"
              min="1"
              max="5"
              value={editQuantity}
              onChange={(e) => setEditQuantity(Number(e.target.value))}
              className="mt-2"
            />
            <p className="text-sm text-gray-500 mt-1">
              1〜5の範囲で指定してください
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsEditDialogOpen(false)}>
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSaveEdit}
              disabled={editQuantity < 1 || editQuantity > 5}
              className="bg-blue-600 hover:bg-blue-700"
            >
              保存
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 詳細表示用ダイアログ */}
      <AlertDialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>注文詳細</AlertDialogTitle>
            <AlertDialogDescription>
              注文番号 #{viewingOrder?.orderNumber} の詳細情報
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">項目</TableHead>
                  <TableHead>値</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">注文ID</TableCell>
                  <TableCell>{viewingOrder?.id}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">注文番号</TableCell>
                  <TableCell>#{viewingOrder?.orderNumber}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">個数</TableCell>
                  <TableCell>{viewingOrder?.quantity}杯</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">ステータス</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      呼び出し中
                    </span>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">注文時刻</TableCell>
                  <TableCell>
                    {viewingOrder?.createdAt
                      ? new Date(viewingOrder.createdAt).toLocaleString(
                          "ja-JP",
                          {
                            timeZone: "Asia/Tokyo",
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          }
                        )
                      : "不明"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsViewDialogOpen(false)}>
              閉じる
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
