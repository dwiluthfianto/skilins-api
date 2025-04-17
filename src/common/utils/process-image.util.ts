import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const BACKEND_URL = process.env.BACKEND_DOMAIN || 'http://localhost:8000';
export const CUSTOMER_DATA_PATH = path.join(process.cwd(), 'assets');
export const PUBLIC_UPLOAD_PATH = path.join(process.cwd(), 'uploads');

export async function processImage(
  sourcePath: string,
  category: string,
): Promise<string> {
  // Create hash for unique filename
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const newFileName = `${timestamp}-${randomString}${path.extname(sourcePath)}`;

  // Ensure public directory exists
  if (!fs.existsSync(PUBLIC_UPLOAD_PATH)) {
    fs.mkdirSync(PUBLIC_UPLOAD_PATH, { recursive: true });
  }

  // Copy file to public directory
  const destinationPath = path.join(PUBLIC_UPLOAD_PATH, newFileName);
  await fs.promises.copyFile(sourcePath, destinationPath);

  // Return public URL
  return `${BACKEND_URL}/public/${newFileName}`;
}

// Get random image from customer-data folder
export function getRandomImage(): string {
  const files = fs.readdirSync(CUSTOMER_DATA_PATH);
  const imageFiles = files.filter((file) =>
    /\.(jpg|jpeg|png|gif)$/i.test(file),
  );
  const randomImage = imageFiles[Math.floor(Math.random() * imageFiles.length)];
  return path.join(CUSTOMER_DATA_PATH, randomImage);
}
