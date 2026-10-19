"use client";

import React from "react";
import {
  getBuildInfo,
  getGitHubCommitUrl,
  getGitHubRepositoryUrl,
} from "@/lib/build-info";
import { ExternalLink } from "lucide-react";

export default function Footer() {
  const buildInfo = getBuildInfo();

  const formatBuildTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      // モバイルでは短縮形式を使用
      return date.toLocaleString("ja-JP", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Tokyo",
      });
    } catch {
      return timestamp;
    }
  };

  return (
    <footer className="text-gray-700 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* ビルド情報（1行表示） */}
          <div className="flex items-center text-xs text-gray-600 gap-0.5 flex-wrap">
            <span className="bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">
              v{buildInfo.version}
            </span>
            <span className="mx-0.5">・</span>
            <span className="text-xs whitespace-nowrap">
              {formatBuildTime(buildInfo.buildTime)}
            </span>
            <span className="mx-0.5">・</span>
            <span className="bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">
              {buildInfo.branch}
            </span>
            <span className="mx-0.5">・</span>
            <a
              href={getGitHubCommitUrl(
                buildInfo.repository,
                buildInfo.commitHash
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono hover:bg-gray-300 transition-colors inline-flex items-center"
            >
              {buildInfo.shortCommitHash}
              <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
            </a>
          </div>

          {/* 右側のリンク */}
          <div className="flex items-center space-x-4 text-sm">
            <a
              href={getGitHubRepositoryUrl(buildInfo.repository)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
            >
              GitHub
              <ExternalLink className="h-4 w-4 ml-1" />
            </a>
            <span className="text-gray-400">|</span>
            <span className="text-gray-400 text-xs">
              Sakurai Lab - 学祭注文システム
            </span>
          </div>
        </div>

        {/* コピーライト */}
        <div className="mt-3 pt-3 border-t border-gray-300 text-center text-xs text-gray-400">
          <p>&copy; 2025 Sakurai Lab. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
