"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import { ChevronLeft, Calendar, Clock, Package, Trash2, TrendingUp, Download } from "lucide-react";
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
import * as XLSX from 'xlsx';

interface Order {
  id: number;
  orderNumber: number;
  quantity: number;
  status: string;
  createdAt: string;
  deletedAt?: string;
}

export default function HistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [chartType, setChartType] = useState<string>("bar");

  // 利用可能な日付リスト
  const availableDates = [
    { value: "all", label: "全期間" },
    { value: "2025-10-25", label: "10月25日" },
    { value: "2025-10-26", label: "10月26日" },
  ];

  // チャートタイプのオプション
  const chartTypes = [
    { value: "bar", label: "Bar" },
    { value: "line", label: "Line" },
    { value: "area", label: "Area" },
  ];

  // 日付でフィルターされた注文データ
  const filteredOrders = useMemo(() => {
    if (selectedDate === "all") {
      return orders;
    }
    
    return orders.filter(order => {
      // UTCとして解釈し、JSTタイムゾーンで日付を取得
      const utcDate = new Date(order.createdAt + (order.createdAt.includes('Z') ? '' : 'Z'));
      const jstFormatter = new Intl.DateTimeFormat("ja-JP", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const orderDateString = jstFormatter.format(utcDate).replace(/\//g, '-');
      // YYYY-MM-DD形式に変換
      const parts = orderDateString.split('-');
      const formattedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      return formattedDate === selectedDate;
    });
  }, [orders, selectedDate]);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders/history");
      if (response.ok) {
        const data = await response.json();
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
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-red-700"></span>
        </div>
      );
    }
    
    switch (status) {
      case "pending":
        return (
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <span className="text-gray-700"></span>
          </div>
        );
      case "ready":
        return (
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-blue-700"></span>
          </div>
        );
      case "completed":
        return (
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-green-700"></span>
          </div>
        );
      default:
        return (
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <span className="text-gray-700">{status}</span>
          </div>
        );
    }
  };

  const formatDateTime = (dateString: string) => {
    // UTCとして解釈し、JSTに変換
    const utcDate = new Date(dateString + (dateString.includes('Z') ? '' : 'Z'));
    
    // Intl.DateTimeFormatを使用してJST時間を正確に取得
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

  const getTotalOrders = () => filteredOrders.length;
  const getCompletedOrders = () => filteredOrders.filter(order => order.status === "completed").length;
  const getCancelledOrders = () => filteredOrders.filter(order => order.deletedAt).length;
  const getTotalQuantity = () => filteredOrders
    .filter(order => !order.deletedAt) // 取り消されていない注文のみ
    .reduce((sum, order) => sum + order.quantity, 0);

  // エクスポート用のデータを準備
  const prepareExportData = () => {
    return filteredOrders.map(order => {
      const { date, time } = formatDateTime(order.createdAt);
      let status = "";
      if (order.deletedAt) {
        status = "取消済み";
      } else {
        switch (order.status) {
          case "pending": status = "調理中"; break;
          case "ready": status = "呼び出し中"; break;
          case "completed": status = "完了"; break;
          default: status = order.status;
        }
      }
      
      return {
        "注文番号": `#${order.orderNumber}`,
        "数量": order.quantity,
        "ステータス": status,
        "注文日": date,
        "注文時刻": time,
      };
    });
  };

  // CSVエクスポート
  const exportToCSV = () => {
    const data = prepareExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    
    const periodLabel = selectedDate === "all" ? "全期間" : availableDates.find(d => d.value === selectedDate)?.label || selectedDate;
    const filename = `注文履歴_${periodLabel}_${new Date().toISOString().split('T')[0]}.csv`;
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Excelエクスポート
  const exportToExcel = () => {
    const data = prepareExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    
    // 列幅を調整
    const colWidths = [
      { wch: 12 }, // 注文番号
      { wch: 8 },  // 数量
      { wch: 12 }, // ステータス
      { wch: 12 }, // 注文日
      { wch: 10 }, // 注文時刻
    ];
    ws['!cols'] = colWidths;
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '注文履歴');
    
    const periodLabel = selectedDate === "all" ? "全期間" : availableDates.find(d => d.value === selectedDate)?.label || selectedDate;
    const filename = `注文履歴_${periodLabel}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    XLSX.writeFile(wb, filename);
  };

  // 時間帯別の注文データを生成
  const hourlyOrderData = useMemo(() => {
    const hourlyStats = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      orders: 0,
      quantity: 0,
    }));

    filteredOrders.forEach(order => {
      if (!order.deletedAt) { // 削除された注文は除外
        // UTCとして解釈し、JSTタイムゾーンで時間を取得
        const utcDate = new Date(order.createdAt + (order.createdAt.includes('Z') ? '' : 'Z'));
        const jstTimeFormatter = new Intl.DateTimeFormat("ja-JP", {
          timeZone: "Asia/Tokyo",
          hour: "numeric",
          hour12: false,
        });
        const hour = parseInt(jstTimeFormatter.format(utcDate));
        
        hourlyStats[hour].orders += 1;
        hourlyStats[hour].quantity += order.quantity;
      }
    });

    return hourlyStats.filter(stat => stat.orders > 0); // 注文がある時間帯のみ表示
  }, [filteredOrders]);

  const chartConfig = {
    orders: {
      label: "注文数",
      color: "hsl(0, 0%, 20%)", // ダークグレー
    },
    quantity: {
      label: "提供数",
      color: "hsl(0, 0%, 50%)", // ミディアムグレー
    },
  } satisfies ChartConfig;

  // チャートタイプに応じてレンダリング
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
            <XAxis
              dataKey="hour"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value}
            />
            <YAxis 
              label={{ value: '件数', angle: -90, position: 'insideLeft' }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
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
              name="提供数"
              type="monotone"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </LineChart>
        );

      case "area":
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="hour"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value}
            />
            <YAxis 
              label={{ value: '件数', angle: -90, position: 'insideLeft' }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
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
              name="提供数"
              type="monotone"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        );

      default: // bar
        return (
          <BarChart {...commonProps}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="hour"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar 
              dataKey="orders" 
              fill="var(--color-orders)" 
              radius={4}
              name="注文数"
            />
            <Bar 
              dataKey="quantity" 
              fill="var(--color-quantity)" 
              radius={4}
              name="提供数"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </BarChart>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-5">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
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
            <h1 className="text-3xl font-bold text-gray-900">注文履歴</h1>
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

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">総注文数</p>
                  <p className="text-2xl font-bold text-gray-900">{getTotalOrders()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">完了済み</p>
                  <p className="text-2xl font-bold text-gray-900">{getCompletedOrders()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center gap-3">
                <Trash2 className="w-6 h-6 text-red-500" />
                <div>
                  <p className="text-sm text-gray-600">取消済み</p>
                  <p className="text-2xl font-bold text-gray-900">{getCancelledOrders()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">総提供数</p>
                  <p className="text-2xl font-bold text-gray-900">{getTotalQuantity()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          {filteredOrders.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <TrendingUp className="w-5 h-5" />
                      <span className="break-words">
                        時間帯別注文状況 
                        {selectedDate !== "all" && (
                          <span className="block sm:inline">
                            ({availableDates.find(d => d.value === selectedDate)?.label})
                          </span>
                        )}
                      </span>
                    </CardTitle>
                    <CardDescription className="mt-2 text-sm">
                      {selectedDate === "all" 
                        ? "全期間の注文パターンを時間帯別に表示しています"
                        : "選択した日付の注文パターンを時間帯別に表示しています"
                      }
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

        {/* Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedDate === "all" 
                  ? "全期間の注文履歴" 
                  : `${availableDates.find(d => d.value === selectedDate)?.label} の注文履歴`
                }
              </h2>
              
              {/* エクスポートボタン */}
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
                    : "選択した日付の注文履歴がありません"
                  }
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>番号</TableHead>
                    <TableHead>数量</TableHead>
                    <TableHead>状況</TableHead>
                    <TableHead>日時</TableHead>
                    <TableHead>時刻</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const { date, time } = formatDateTime(order.createdAt);
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          #{order.orderNumber}
                        </TableCell>
                        <TableCell>{order.quantity}</TableCell>
                        <TableCell>
                          {getStatusBadge(order.status, order.deletedAt)}
                        </TableCell>
                        <TableCell>{date}</TableCell>
                        <TableCell>{time}</TableCell>
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