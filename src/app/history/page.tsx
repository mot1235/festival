"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import {
  ChevronLeft,
  Calendar,
  Clock,
  Package,
  Trash2,
  TrendingUp,
  Download,
  ShoppingBag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, Line, LineChart, Area, AreaChart, YAxis } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as XLSX from "xlsx";

interface OrderItem {
  id?: number;
  productName?: string;
  product_name?: string;
  quantity: number;
  price?: number;
  flavor?: string;
}

interface Order {
  id: number;
  orderNumber: number;
  quantity: number;
  totalPrice?: number;
  status: string;
  createdAt: string;
  deletedAt?: string;
  items?: OrderItem[];
}

export default function HistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [chartType, setChartType] = useState<string>("bar");

  // 注文データから選択可能な日付を自動生成
  const availableDates = useMemo(() => {
    const datesSet = new Set<string>();

    orders.forEach((order) => {
      if (!order.createdAt) return;
      const utcDate = new Date(
        order.createdAt + (order.createdAt.includes("Z") ? "" : "Z")
      );
      const jstFormatter = new Intl.DateTimeFormat("ja-JP", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const formattedDate = jstFormatter.format(utcDate).replace(/\//g, "-");
      datesSet.add(formattedDate);
    });

    const uniqueDates = Array.from(datesSet).sort().reverse();

    return [
      { value: "all", label: "全期間" },
      ...uniqueDates.map((d) => {
        const [y, m, day] = d.split("-");
        return { value: d, label: `${parseInt(m)}月${parseInt(day)}日` };
      }),
    ];
  }, [orders]);

  const chartTypes = [
    { value: "bar", label: "Bar" },
    { value: "line", label: "Line" },
    { value: "area", label: "Area" },
  ];

  const filteredOrders = useMemo(() => {
    if (selectedDate === "all") {
      return orders;
    }

    return orders.filter((order) => {
      if (!order.createdAt) return false;
      const utcDate = new Date(
        order.createdAt + (order.createdAt.includes("Z") ? "" : "Z")
      );
      const jstFormatter = new Intl.DateTimeFormat("ja-JP", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const orderDateString = jstFormatter.format(utcDate).replace(/\//g, "-");
      const parts = orderDateString.split("-");
      const formattedDate = `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
      return formattedDate === selectedDate;
    });
  }, [orders, selectedDate]);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders/history");
      if (response.ok) {
        const data = await response.json();
        console.log("🔍 DBから取得した注文履歴データ:", data);
        setOrders(data);
      }
    } catch (error) {
      console.error("Error fetching order history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusBadge = (status: string, deletedAt?: string) => {
    if (deletedAt) {
      return (
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
          <span className="text-xs text-red-700 font-medium">取消済み</span>
        </div>
      );
    }

    switch (status) {
      case "pending":
        return (
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
            <span className="text-xs text-amber-700 font-medium">調理中</span>
          </div>
        );
      case "ready":
        return (
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
            <span className="text-xs text-blue-700 font-medium">呼出中</span>
          </div>
        );
      case "completed":
        return (
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
            <span className="text-xs text-green-700 font-medium">完了</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-400"></div>
            <span className="text-xs text-gray-700">{status}</span>
          </div>
        );
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return { date: "-", time: "-" };
    const utcDate = new Date(
      dateString + (dateString.includes("Z") ? "" : "Z")
    );

    const jstFormatter = new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const jstTimeFormatter = new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    return {
      date: jstFormatter.format(utcDate),
      time: jstTimeFormatter.format(utcDate),
    };
  };

  const activeOrders = useMemo(
    () => filteredOrders.filter((o) => !o.deletedAt),
    [filteredOrders]
  );

  const getTotalOrders = () => filteredOrders.length;
  const getCompletedOrders = () =>
    filteredOrders.filter((order) => order.status === "completed").length;
  const getCancelledOrders = () =>
    filteredOrders.filter((order) => order.deletedAt).length;
  const getTotalQuantity = () =>
    activeOrders.reduce((sum, order) => sum + order.quantity, 0);

  const getTotalSales = () =>
    activeOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

  // ★ チュロスとソトックソトックを完全に分別する厳集計ロジック
  const itemizedSummary = useMemo(() => {
    let churrosQuantity = 0;
    let churrosSales = 0;
    const churrosFlavors: Record<string, number> = {};

    let sotockQuantity = 0;
    let sotockSales = 0;

    activeOrders.forEach((order) => {
      if (order.items && Array.isArray(order.items) && order.items.length > 0) {
        order.items.forEach((item: any) => {
          const rawName = String(item.productName || item.product_name || "").toLowerCase();
          const qty = Number(item.quantity || 0);
          const flavor = String(item.flavor || "通常");

          // 1. ソトックソトックの判定（優先的にチェック）
          const isSotock =
            rawName.includes("ソトック") ||
            rawName.includes("sotock") ||
            rawName.includes("ソトク");

          // 2. チュロスの判定
          const isChurros =
            rawName.includes("チュロス") ||
            rawName.includes("churros");

          if (isSotock) {
            const price = Number(item.price || 400);
            sotockQuantity += qty;
            sotockSales += qty * price;
          } else if (isChurros) {
            const price = Number(item.price || 350);
            churrosQuantity += qty;
            churrosSales += qty * price;
            churrosFlavors[flavor] = (churrosFlavors[flavor] || 0) + qty;
          }
          // 明細名が一致しない不明なデータはチュロスへ合算せず無視（0本カウント）
        });
      }
    });

    return {
      churros: {
        quantity: churrosQuantity,
        sales: churrosSales,
        flavors: churrosFlavors,
      },
      sotock: {
        quantity: sotockQuantity,
        sales: sotockSales,
      },
    };
  }, [activeOrders]);

  const prepareExportData = () => {
    return filteredOrders.map((order) => {
      const { date, time } = formatDateTime(order.createdAt);
      let status = "";
      if (order.deletedAt) {
        status = "取消済み";
      } else {
        switch (order.status) {
          case "pending":
            status = "調理中";
            break;
          case "ready":
            status = "呼び出し中";
            break;
          case "completed":
            status = "完了";
            break;
          default:
            status = order.status;
        }
      }

      const itemsText =
        order.items && order.items.length > 0
          ? order.items
              .map(
                (i: any) =>
                  `${i.productName || i.product_name || "商品"}${
                    i.flavor && i.flavor !== "通常" ? `(${i.flavor})` : ""
                  }×${i.quantity}`
              )
              .join(" / ")
          : `計 ${order.quantity}本`;

      return {
        注文番号: `#${order.orderNumber}`,
        注文明細: itemsText,
        合計本数: order.quantity,
        合計金額: order.deletedAt ? 0 : order.totalPrice || 0,
        ステータス: status,
        注文日: date,
        注文時刻: time,
      };
    });
  };

  const exportToCSV = () => {
    const data = prepareExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);

    const periodLabel =
      selectedDate === "all"
        ? "全期間"
        : availableDates.find((d) => d.value === selectedDate)?.label ||
          selectedDate;
    const filename = `注文履歴_${periodLabel}_${
      new Date().toISOString().split("T")[0]
    }.csv`;

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    const data = prepareExportData();
    const ws = XLSX.utils.json_to_sheet(data);

    const colWidths = [
      { wch: 10 },
      { wch: 32 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
    ];
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "注文履歴");

    const periodLabel =
      selectedDate === "all"
        ? "全期間"
        : availableDates.find((d) => d.value === selectedDate)?.label ||
          selectedDate;
    const filename = `注文履歴_${periodLabel}_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;

    XLSX.writeFile(wb, filename);
  };

  const hourlyOrderData = useMemo(() => {
    const hourlyStats = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour.toString().padStart(2, "0")}:00`,
      orders: 0,
      quantity: 0,
      sales: 0,
    }));

    activeOrders.forEach((order) => {
      if (!order.createdAt) return;
      const utcDate = new Date(
        order.createdAt + (order.createdAt.includes("Z") ? "" : "Z")
      );
      const jstTimeFormatter = new Intl.DateTimeFormat("ja-JP", {
        timeZone: "Asia/Tokyo",
        hour: "numeric",
        hour12: false,
      });
      const hour = parseInt(jstTimeFormatter.format(utcDate));

      if (hour >= 0 && hour < 24) {
        hourlyStats[hour].orders += 1;
        hourlyStats[hour].quantity += order.quantity;
        hourlyStats[hour].sales += order.totalPrice || 0;
      }
    });

    return hourlyStats.filter((stat) => stat.orders > 0);
  }, [activeOrders]);

  const chartConfig = {
    orders: {
      label: "注文数",
      color: "hsl(215, 80%, 50%)",
    },
    quantity: {
      label: "提供本数",
      color: "hsl(280, 65%, 60%)",
    },
  } satisfies ChartConfig;

  const renderChart = () => {
    const commonProps = {
      accessibilityLayer: true,
      data: hourlyOrderData,
    };

    switch (chartType) {
      case "line":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="hour" tickLine={false} tickMargin={10} axisLine={false} />
            <YAxis label={{ value: "数量", angle: -90, position: "insideLeft" }} />
            <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
            <Line
              dataKey="orders"
              stroke="var(--color-orders)"
              strokeWidth={3}
              dot={{ fill: "var(--color-orders)", strokeWidth: 2, r: 4 }}
              name="注文数"
              type="monotone"
            />
            <Line
              dataKey="quantity"
              stroke="var(--color-quantity)"
              strokeWidth={3}
              dot={{ fill: "var(--color-quantity)", strokeWidth: 2, r: 4 }}
              name="提供本数"
              type="monotone"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </LineChart>
        );

      case "area":
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="hour" tickLine={false} tickMargin={10} axisLine={false} />
            <YAxis label={{ value: "数量", angle: -90, position: "insideLeft" }} />
            <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
            <Area
              dataKey="orders"
              fill="var(--color-orders)"
              stroke="var(--color-orders)"
              strokeWidth={2}
              fillOpacity={0.3}
              name="注文数"
              type="monotone"
            />
            <Area
              dataKey="quantity"
              fill="var(--color-quantity)"
              stroke="var(--color-quantity)"
              strokeWidth={2}
              fillOpacity={0.3}
              name="提供本数"
              type="monotone"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        );

      default:
        return (
          <BarChart {...commonProps}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="hour" tickLine={false} tickMargin={10} axisLine={false} />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
            <Bar dataKey="orders" fill="var(--color-orders)" radius={4} name="注文数" />
            <Bar dataKey="quantity" fill="var(--color-quantity)" radius={4} name="提供本数" />
            <ChartLegend content={<ChartLegendContent />} />
          </BarChart>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-5">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="w-4 h-4 mr-2" />
                管理画面に戻る
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <Calendar className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">売上・注文履歴分析</h1>
            <div className="ml-auto">
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="日付を選択" />
                </SelectTrigger>
                <SelectContent>
                  {availableDates.map((date) => (
                    <SelectItem key={date.value} value={date.value}>
                      {date.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 全体統計カード */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-4 rounded-lg shadow">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-extrabold text-lg">
                  ¥
                </div>
                <div>
                  <p className="text-xs text-amber-100 font-medium">総売上金額</p>
                  <p className="text-2xl font-black">
                    ¥{getTotalSales().toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-purple-500" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">総提供本数</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {getTotalQuantity()} <span className="text-xs text-gray-500 font-normal">本</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-6 h-6 text-blue-500" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">総注文数</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {getTotalOrders()} <span className="text-xs text-gray-500 font-normal">件</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-green-500" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">完了済み</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {getCompletedOrders()} <span className="text-xs text-gray-500 font-normal">件</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
              <div className="flex items-center gap-3">
                <Trash2 className="w-6 h-6 text-red-500" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">取消件数</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {getCancelledOrders()} <span className="text-xs text-gray-500 font-normal">件</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 商品別専用集計（チュロス / ソトックソトック） */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className="border-l-4 border-amber-500 bg-amber-50/30">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-bold text-amber-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-600" />
                    チュロス 集計
                  </CardTitle>
                  <span className="text-sm font-semibold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                    単価: ¥350
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-baseline border-b pb-3">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">販売累計本数</p>
                    <p className="text-3xl font-extrabold text-gray-900">
                      {itemizedSummary.churros.quantity}{" "}
                      <span className="text-sm text-gray-500 font-normal">本</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 font-medium">売上合計</p>
                    <p className="text-2xl font-bold text-amber-700">
                      ¥{itemizedSummary.churros.sales.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">フレーバー内訳</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(itemizedSummary.churros.flavors).length > 0 ? (
                      Object.entries(itemizedSummary.churros.flavors).map(([flavor, count]) => (
                        <div
                          key={flavor}
                          className="flex items-center bg-white border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-800 shadow-sm"
                        >
                          <span className="text-amber-700 font-bold mr-1.5">{flavor}:</span>
                          <span className="text-gray-900 font-extrabold">{count}本</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">データなし</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-orange-500 bg-orange-50/30">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-bold text-orange-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-orange-600" />
                    ソトックソトック 集計
                  </CardTitle>
                  <span className="text-sm font-semibold text-orange-700 bg-orange-100 px-3 py-1 rounded-full">
                    単価: ¥400
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-baseline border-b pb-3">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">販売累計本数</p>
                    <p className="text-3xl font-extrabold text-gray-900">
                      {itemizedSummary.sotock.quantity}{" "}
                      <span className="text-sm text-gray-500 font-normal">本</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 font-medium">売上合計</p>
                    <p className="text-2xl font-bold text-orange-700">
                      ¥{itemizedSummary.sotock.sales.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">フレーバー内訳</p>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center bg-white border border-orange-200 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-800 shadow-sm">
                      <span className="text-orange-700 font-bold mr-1.5">通常:</span>
                      <span className="text-gray-900 font-extrabold">{itemizedSummary.sotock.quantity}本</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 時間帯別グラフ */}
          {filteredOrders.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <TrendingUp className="w-5 h-5" />
                      <span>
                        時間帯別注文状況
                        {selectedDate !== "all" && (
                          <span className="ml-2 text-sm font-normal text-gray-500">
                            ({availableDates.find((d) => d.value === selectedDate)?.label})
                          </span>
                        )}
                      </span>
                    </CardTitle>
                    <CardDescription className="mt-1 text-sm">
                      時間帯ごとの注文数と提供本数の推移です
                    </CardDescription>
                  </div>
                  <div className="flex justify-end lg:justify-start">
                    <Select value={chartType} onValueChange={setChartType}>
                      <SelectTrigger className="w-full lg:w-[150px]">
                        <SelectValue placeholder="チャート種類" />
                      </SelectTrigger>
                      <SelectContent>
                        {chartTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <ChartContainer config={chartConfig}>
                  {renderChart()}
                </ChartContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 注文履歴テーブル */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedDate === "all"
                  ? "全期間の注文履歴"
                  : `${
                      availableDates.find((d) => d.value === selectedDate)?.label
                    } の注文履歴`}
              </h2>

              {filteredOrders.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    onClick={exportToCSV}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    CSV
                  </Button>
                  <Button
                    onClick={exportToExcel}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    XLSX
                  </Button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">読み込み中...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {selectedDate === "all"
                    ? "注文履歴がありません"
                    : "選択した日付の注文履歴がありません"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">整理番号</TableHead>
                    <TableHead>注文商品・味の内訳</TableHead>
                    <TableHead className="text-right">合計本数</TableHead>
                    <TableHead className="text-right">小計金額</TableHead>
                    <TableHead>状況</TableHead>
                    <TableHead>注文日時</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const { date, time } = formatDateTime(order.createdAt);
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-bold text-base">
                          #{order.orderNumber.toString().padStart(3, "0")}
                        </TableCell>

                        <TableCell>
                          {order.items && order.items.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {order.items.map((item: any, idx) => {
                                const name = item.productName || item.product_name || "商品";
                                return (
                                  <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="text-xs bg-gray-100 border text-gray-800"
                                  >
                                    {name}
                                    {item.flavor && item.flavor !== "通常" && (
                                      <span className="text-amber-700 ml-1 font-semibold">
                                        ({item.flavor})
                                      </span>
                                    )}
                                    <span className="ml-1 font-bold">
                                      ×{item.quantity}
                                    </span>
                                  </Badge>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-600">
                              合計 {order.quantity} 本
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="text-right font-medium">
                          {order.quantity} 本
                        </TableCell>

                        <TableCell className="text-right font-bold text-gray-900">
                          {order.deletedAt
                            ? "¥0"
                            : `¥${(order.totalPrice || 0).toLocaleString()}`}
                        </TableCell>

                        <TableCell>
                          {getStatusBadge(order.status, order.deletedAt)}
                        </TableCell>

                        <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                          {date} {time}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}