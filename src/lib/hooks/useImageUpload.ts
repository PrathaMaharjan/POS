import { useState } from "react";
import { uploadConfig } from "../cloudinary/storage";
import axios from "axios";

interface UploadResult {
  publicId: string;
  width: number;
  height: number;
}

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadImage(file: File): Promise<UploadResult | null> {
    const config = uploadConfig.cloudinary;

    if (!config.allowedTypes!.includes(file.type)) {
      setError("Only JPG, PNG, and WebP images are allowed");
      return null;
    }

    const maxBytes = config.maxSizeMB! * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`Image must be under ${config.maxSizeMB}MB`);
      return null;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", config.uploadPreset!);
      formData.append("folder", config.folder!);

      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
        formData
      );

      const data = res.data; // ✅ axios already parses JSON

      return {
        publicId: data.public_id,
        width: data.width,
        height: data.height,
      };
    } catch (err: any) {
      const message =
        err.response?.data?.error?.message ?? err.message ?? "Upload failed";
      setError(message);
      return null;
    } finally {
      setUploading(false); // ✅ stop spinner, not clear error
    }
  }

  function clearError() {
    setError(null);
  }

  // ✅ return at hook level, not inside uploadImage
  return { uploadImage, uploading, error, clearError };
};