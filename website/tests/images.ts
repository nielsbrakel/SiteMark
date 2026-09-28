// Image size readers for tests on the generated screenshots: just enough of PNG and WebP headers.

export type Size = { width: number; height: number };

const PNG_SIGNATURE = '89504e470d0a1a0a';

/** The IHDR size of a PNG, or undefined when the bytes aren't a PNG. */
export function pngSize(bytes: Buffer): Size | undefined {
  if (bytes.subarray(0, 8).toString('hex') !== PNG_SIGNATURE) return undefined;
  if (bytes.subarray(12, 16).toString('latin1') !== 'IHDR') return undefined;
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

/** The canvas size of a WebP (lossy, lossless or extended), or undefined when it isn't one. */
export function webpSize(bytes: Buffer): Size | undefined {
  const riff = bytes.subarray(0, 4).toString('latin1');
  if (riff !== 'RIFF' || bytes.subarray(8, 12).toString('latin1') !== 'WEBP') return undefined;
  switch (bytes.subarray(12, 16).toString('latin1')) {
    case 'VP8 ':
      return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
    case 'VP8L': {
      const bits = bytes.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    case 'VP8X':
      return { width: bytes.readUIntLE(24, 3) + 1, height: bytes.readUIntLE(27, 3) + 1 };
    default:
      return undefined;
  }
}
