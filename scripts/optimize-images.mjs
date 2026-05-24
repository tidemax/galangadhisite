import { mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = new URL("..", import.meta.url).pathname;
const outputRoot = path.join(root, "src/optimized");

const jobs = [
  {
    input: path.join(root, "src/content/work"),
    output: path.join(outputRoot, "work"),
    width: 1400,
    quality: 78,
  },
  {
    input: path.join(root, "src/archivework"),
    output: path.join(outputRoot, "archivework"),
    width: 900,
    quality: 76,
  },
  {
    input: path.join(root, "src/content/speak"),
    output: path.join(outputRoot, "speak"),
    width: 1400,
    quality: 78,
  },
];

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;

    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(absolutePath)));
    } else if (imageExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(absolutePath);
    }
  }

  return files;
}

await rm(outputRoot, { recursive: true, force: true });

let totalBefore = 0;
let totalAfter = 0;
let totalFiles = 0;

for (const job of jobs) {
  const files = await walk(job.input);

  for (const file of files) {
    const relative = path.relative(job.input, file);
    const parsed = path.parse(relative);
    const outputFile = path.join(job.output, parsed.dir, `${parsed.name}.webp`);

    await mkdir(path.dirname(outputFile), { recursive: true });

    const input = sharp(file, { animated: false });
    const metadata = await input.metadata();
    const shouldResize = metadata.width && metadata.width > job.width;

    await input
      .rotate()
      .resize({
        width: shouldResize ? job.width : undefined,
        withoutEnlargement: true,
      })
      .webp({
        quality: job.quality,
        effort: 5,
      })
      .toFile(outputFile);

    totalBefore += (await stat(file)).size;
    totalAfter += (await stat(outputFile)).size;
    totalFiles += 1;
  }
}

const saved = totalBefore > 0 ? Math.round((1 - totalAfter / totalBefore) * 100) : 0;
console.log(`Optimized ${totalFiles} images into src/optimized`);
console.log(`Estimated image payload: ${(totalBefore / 1024 / 1024).toFixed(1)}MB -> ${(totalAfter / 1024 / 1024).toFixed(1)}MB (${saved}% smaller)`);
