import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const outputDir = path.join(projectRoot, "xserver-static");
const builtPublicDir = path.join(projectRoot, "dist", "public");
const assetRoot = "/home/ubuntu/webdev-static-assets";
const staticAssetDir = path.join(outputDir, "assets", "site");

const assetMap = {
  "/manus-storage/3BCF6477-5B38-4B76-8DB8-73822B64BF25(16)_a7f7d9be.png": [
    "tsumitate-penguin-formal.png",
    "penguin.png",
  ],
  "/manus-storage/07_family_b2662bac.png": ["hero-decor/family.png", "family.png"],
  "/manus-storage/08_graph_da2b1368.png": ["hero-decor/chart.png", "chart.png"],
  "/manus-storage/09_house_7a2ef6b7.png": ["hero-decor/house.png", "house.png"],
  "/manus-storage/10_yen_0ff05e07.png": ["hero-decor/yen.png", "yen.png"],
  "/manus-storage/01_yellow_star_4664eedb.png": ["material-decor/sparkle.png", "yellow-star.png"],
  "/manus-storage/02_pink_star_f20fd6d8.png": ["hero-decor/sparkles.png", "pink-star.png"],
  "/manus-storage/03_mint_plus_e2a6cd90.png": ["hero-decor/plus.png", "mint-plus.png"],
  "/manus-storage/04_yellow_dots_dd29dbae.png": ["material-decor/yellow-burst.png", "yellow-dots.png"],
  "/manus-storage/05_yellow_marks_ed2d81a5.png": ["material-decor/yellow-burst.png", "yellow-marks.png"],
  "/manus-storage/06_yellow_dot_4e0ded55.png": ["material-decor/sparkle.png", "yellow-dot.png"],
  "/manus-storage/education_0880faf1.png": ["material-icons-clean/education.png", "education.png"],
  "/manus-storage/housing_d87c99a1.png": ["material-icons-clean/housing.png", "housing.png"],
  "/manus-storage/retirement_bd8ef11b.png": ["material-icons-clean/retirement.png", "retirement.png"],
  "/manus-storage/statistics_256b62d1.png": ["material-icons-clean/statistics.png", "statistics.png"],
  "/manus-storage/retirement-fund_d4791d18.png": ["material-icons-clean/retirement-fund.png", "retirement-fund.png"],
  "/manus-storage/contribution_feb14823.png": ["material-icons-clean/contribution.png", "contribution.png"],
};

async function resolveSource(candidates) {
  for (const candidate of candidates) {
    const source = path.join(assetRoot, candidate);
    try {
      await readFile(source);
      return source;
    } catch {
      // Try the next known asset location.
    }
  }
  throw new Error(`Missing static source asset: ${candidates.join(", ")}`);
}

await rm(outputDir, { recursive: true, force: true });
await cp(builtPublicDir, outputDir, { recursive: true });
await mkdir(staticAssetDir, { recursive: true });

for (const [manusPath, [sourceCandidate, outputName]] of Object.entries(assetMap)) {
  const source = await resolveSource([sourceCandidate]);
  const destination = path.join(staticAssetDir, outputName);
  await cp(source, destination);

  const staticPath = `/assets/site/${outputName}`;
  const files = await import("node:fs/promises").then(({ readdir }) => readdir(outputDir, { recursive: true }));
  for (const relative of files) {
    if (!relative.endsWith(".js") && !relative.endsWith(".css") && !relative.endsWith(".html")) continue;
    const filePath = path.join(outputDir, relative);
    const content = await readFile(filePath, "utf8");
    if (content.includes(manusPath)) {
      await writeFile(filePath, content.split(manusPath).join(staticPath));
    }
  }
}

await writeFile(
  path.join(outputDir, ".htaccess"),
  "RewriteEngine On\nRewriteBase /\nRewriteCond %{REQUEST_FILENAME} !-f\nRewriteCond %{REQUEST_FILENAME} !-d\nRewriteRule ^ index.html [L]\n",
);

console.log(`Prepared ${outputDir}`);
console.log(`Copied ${Object.keys(assetMap).length} image mappings into ${staticAssetDir}`);
