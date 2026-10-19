#!/usr/bin/env node

const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");

try {
  // Git情報を取得
  const commitHash = execSync("git rev-parse HEAD", {
    encoding: "utf8",
  }).trim();
  const shortCommitHash = execSync("git rev-parse --short HEAD", {
    encoding: "utf8",
  }).trim();
  const branch = execSync("git rev-parse --abbrev-ref HEAD", {
    encoding: "utf8",
  }).trim();

  // package.jsonからバージョンを取得
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const version = packageJson.version;

  // ビルド時刻
  const buildTime = new Date().toISOString();

  // ビルド情報オブジェクト
  const buildInfo = {
    version,
    commitHash,
    shortCommitHash,
    branch,
    buildTime,
    repository: "sakurai-lab-07/OrderManager2",
  };

  // ビルド情報をファイルに保存
  const outputDir = path.join(process.cwd(), "src", "lib");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "build-info.json");
  fs.writeFileSync(outputPath, JSON.stringify(buildInfo, null, 2));

  console.log("Build info generated:", buildInfo);
} catch (error) {
  console.error("Error generating build info:", error.message);

  // フォールバック用のダミーデータ
  const fallbackInfo = {
    version: "0.1.0",
    commitHash: "unknown",
    shortCommitHash: "unknown",
    branch: "unknown",
    buildTime: new Date().toISOString(),
    repository: "sakurai-lab-07/OrderManager2",
  };

  const outputDir = path.join(process.cwd(), "src", "lib");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "build-info.json");
  fs.writeFileSync(outputPath, JSON.stringify(fallbackInfo, null, 2));

  console.log("Fallback build info generated");
}
