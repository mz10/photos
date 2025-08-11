
import { useState, useEffect } from 'react';

// Tell TypeScript that the Jxl class is available globally,
// attached to the window object by the jxl.js script.
declare const Jxl: any;

/**
 * A hook to decode a JXL image URL.
 * It attempts to use the Jxl.js library to decode the image.
 * If decoding fails (e.g., because the URL points to a JPG/PNG or the JXL is corrupt),
 * it falls back to using the original URL.
 */
export const useJxlDecoder = (url: string) => {
  const [decodedUrl, setDecodedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setIsLoading(false);
      return;
    }

    let objectUrl: string | null = null;
    const decode = async () => {
      setIsLoading(true);
      setError(null);
      setDecodedUrl(null);

      if (typeof Jxl === 'undefined') {
        console.warn("JXL.js library not loaded. Falling back to direct URL.");
        setDecodedUrl(url);
        setIsLoading(false);
        return;
      }

      try {
        const jxl = new Jxl();
        // The library expects the URL to be passed to its decode method
        const result = await jxl.decode(url);
        if (result && result.blob) {
          objectUrl = URL.createObjectURL(result.blob);
          setDecodedUrl(objectUrl);
        } else {
          throw new Error('JXL decoding result is invalid.');
        }
      } catch (e) {
        console.error(`JXL decoding failed for ${url}, falling back to direct URL.`, e);
        // Fallback to loading the URL directly in case it's not a JXL or an error occurred.
        const img = new Image();
        img.src = url;
        img.onload = () => setDecodedUrl(url);
        img.onerror = () => setError('Nepodařilo se načíst obrázek.');
      } finally {
        setIsLoading(false);
      }
    };

    decode();

    // Cleanup function to revoke the object URL and prevent memory leaks.
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [url]);

  return { decodedUrl, isLoading, error };
};