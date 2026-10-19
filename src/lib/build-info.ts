export interface BuildInfo {
  version: string;
  commitHash: string;
  shortCommitHash: string;
  branch: string;
  buildTime: string;
  repository: string;
}

// npm run generate-build-info
export function getBuildInfo(): BuildInfo {
  try {
    // 開発環境では動的にインポート
    const buildInfoData = require("./build-info.json");
    return buildInfoData as BuildInfo;
  } catch (error) {
    // フォールバック
    return {
      version: "0.1.0",
      commitHash: "development",
      shortCommitHash: "dev",
      branch: "development",
      buildTime: new Date().toISOString(),
      repository: "Hamaryo226/OderManager2",
    };
  }
}

export function getGitHubCommitUrl(
  repository: string,
  commitHash: string
): string {
  return `https://github.com/${repository}/commit/${commitHash}`;
}

export function getGitHubRepositoryUrl(repository: string): string {
  return `https://github.com/${repository}`;
}
