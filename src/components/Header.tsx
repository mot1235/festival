import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

export default function Header() {
  return (
    <header className="border-b bg-white px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <h1 className="text-xl font-bold text-center flex-1 md:text-left md:flex-initial">
          注文管理システム
        </h1>
        <div className="hidden md:flex gap-2">
          <Button asChild variant="outline">
            <Link href="/history">
              <Calendar className="w-4 h-4 mr-2" />
              注文履歴
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/display">呼び出し画面を開く</Link>
          </Button>
        </div>
      </div>
      {/* Mobile buttons */}
      <div className="mt-2 md:hidden space-y-2">
        <Button asChild variant="outline" className="w-full">
          <Link href="/history">
            <Calendar className="w-4 h-4 mr-2" />
            注文履歴
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/display">呼び出し画面を開く</Link>
        </Button>
      </div>
    </header>
  );
}
