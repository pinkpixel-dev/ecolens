// ByteBox - R2 upload script (one-shot, not committed with credentials)
// Usage:
//   R2_ACCOUNT_ID=... R2_BUCKET=... R2_ACCESS_KEY=... R2_SECRET_KEY=... node scripts/upload-r2.mjs <file>
//   or put those values in .env.local / .env and run: node scripts/upload-r2.mjs <file>

import { createReadStream, existsSync, readFileSync, statSync } from 'fs';
import { basename } from 'path';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

loadLocalEnvFiles();

const { R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY, R2_SECRET_KEY } = process.env;
const filePath = process.argv[2];

function loadLocalEnvFiles() {
  for (const fileName of ['.env.local', '.env']) {
    if (!existsSync(fileName)) {
      continue;
    }

    const contents = readFileSync(fileName, 'utf8');

    for (const rawLine of contents.split(/\r?\n/)) {
      const line = rawLine.trim();

      if (!line || line.startsWith('#')) {
        continue;
      }

      const separatorIndex = line.indexOf('=');
      if (separatorIndex === -1) {
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      let value = line.slice(separatorIndex + 1).trim();

      if (!key || process.env[key]) {
        continue;
      }

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
  }
}

if (!R2_ACCOUNT_ID || !R2_BUCKET || !R2_ACCESS_KEY || !R2_SECRET_KEY) {
  console.error('Missing required env vars: R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY, R2_SECRET_KEY');
  process.exit(1);
}
if (!filePath) {
  console.error('Usage: node scripts/upload-r2.mjs <file-path>');
  process.exit(1);
}
if (!/^[a-f0-9]{32}$/i.test(R2_ACCOUNT_ID)) {
  console.error(
    'R2_ACCOUNT_ID should be Cloudflare Account ID (32 hex chars), not the R2 secret key or API token.'
  );
  process.exit(1);
}

const fileSize = statSync(filePath).size;
const fileName = basename(filePath);
const mb = (fileSize / 1024 / 1024).toFixed(1);

console.log(`Uploading ${fileName} (${mb} MB) → r2://${R2_BUCKET}/${fileName}`);

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY,
  },
});

const upload = new Upload({
  client,
  params: {
    Bucket: R2_BUCKET,
    Key: fileName,
    Body: createReadStream(filePath),
    ContentType: 'application/octet-stream',
  },
  queueSize: 4,       // parallel part uploads
  partSize: 64 * 1024 * 1024, // 64 MB parts
});

upload.on('httpUploadProgress', ({ loaded, total }) => {
  if (loaded && total) {
    const pct = ((loaded / total) * 100).toFixed(1);
    process.stdout.write(`\r  Progress: ${pct}% (${(loaded / 1024 / 1024).toFixed(1)} / ${(total / 1024 / 1024).toFixed(1)} MB)`);
  }
});

try {
  const result = await upload.done();
  console.log(`\n✓ Done: ${result.Location ?? `${R2_BUCKET}/${fileName}`}`);
} catch (err) {
  console.error('\n✗ Upload failed:', err.message);
  process.exit(1);
}
