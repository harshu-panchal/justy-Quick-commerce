import cloudinary, { CLOUDINARY_FOLDERS } from "../config/cloudinary";
import { UploadApiErrorResponse } from "cloudinary";

export interface UploadResult {
  url: string;
  publicId: string;
  secureUrl: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

export interface UploadOptions {
  folder?: string;
  resourceType?: "image" | "raw" | "video" | "auto";
  transformation?: any[];
  overwrite?: boolean;
  invalidate?: boolean;
}

/**
 * Upload a single image to Cloudinary
 */
export async function uploadImage(
  filePath: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    const uploadOptions = {
      folder: options.folder || CLOUDINARY_FOLDERS.PRODUCTS,
      resource_type: options.resourceType || "image",
      transformation: options.transformation,
      overwrite: options.overwrite || false,
      invalidate: options.invalidate || true,
    };

    const result = await cloudinary.uploader.upload(filePath, uploadOptions);

    return {
      url: result.url,
      publicId: result.public_id,
      secureUrl: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error) {
    const uploadError = error as UploadApiErrorResponse;
    throw new Error(
      `Cloudinary upload failed: ${uploadError.message || "Unknown error"}`
    );
  }
}

/**
 * Upload multiple images to Cloudinary
 */
export async function uploadMultipleImages(
  filePaths: string[],
  options: UploadOptions = {}
): Promise<UploadResult[]> {
  try {
    const uploadPromises = filePaths.map((filePath) =>
      uploadImage(filePath, options)
    );
    return await Promise.all(uploadPromises);
  } catch (error) {
    throw new Error(`Failed to upload multiple images: ${error}`);
  }
}

/**
 * Upload a document (PDF, image, etc.) to Cloudinary
 */
export async function uploadDocument(
  filePath: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    const uploadOptions = {
      folder: options.folder || CLOUDINARY_FOLDERS.SELLER_DOCUMENTS,
      resource_type: options.resourceType || "raw",
      overwrite: options.overwrite || false,
      invalidate: options.invalidate || true,
    };

    const result = await cloudinary.uploader.upload(filePath, uploadOptions);

    return {
      url: result.url,
      publicId: result.public_id,
      secureUrl: result.secure_url,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error) {
    const uploadError = error as UploadApiErrorResponse;
    throw new Error(
      `Cloudinary document upload failed: ${uploadError.message || "Unknown error"
      }`
    );
  }
}

/**
 * Upload image from buffer (for multer)
 */
export async function uploadImageFromBuffer(
  buffer: Buffer,
  options: UploadOptions = {}
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || CLOUDINARY_FOLDERS.PRODUCTS,
      resource_type: options.resourceType || "image",
      transformation: options.transformation,
      overwrite: options.overwrite || false,
      invalidate: options.invalidate || true,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error: any, result: any) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else if (result) {
          resolve({
            url: result.url,
            publicId: result.public_id,
            secureUrl: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
          });
        } else {
          reject(new Error("Cloudinary upload returned no result"));
        }
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Upload document from buffer (for multer)
 */
export async function uploadDocumentFromBuffer(
  buffer: Buffer,
  options: UploadOptions = {}
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || CLOUDINARY_FOLDERS.SELLER_DOCUMENTS,
      resource_type: options.resourceType || "raw",
      overwrite: options.overwrite || false,
      invalidate: options.invalidate || true,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error: any, result: any) => {
        if (error) {
          reject(
            new Error(`Cloudinary document upload failed: ${error.message}`)
          );
        } else if (result) {
          resolve({
            url: result.url,
            publicId: result.public_id,
            secureUrl: result.secure_url,
            format: result.format,
            bytes: result.bytes,
          });
        } else {
          reject(new Error("Cloudinary document upload returned no result"));
        }
      }
    );

    uploadStream.end(buffer);
  });
}

export async function uploadProductImageAutoClean(
  buffer: Buffer,
  options: UploadOptions = {}
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    // Step 1: Upload the RAW image and trigger async Background Removal
    // We do NOT apply transformations yet, because background removal works best on original first
    const uploadOptions: any = {
      folder: options.folder || CLOUDINARY_FOLDERS.PRODUCTS,
      resource_type: "image",
      background_removal: "cloudinary_ai", // Ask Cloudinary to process AI background removal
      overwrite: options.overwrite || false,
      invalidate: options.invalidate || true,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      async (error: any, result: any) => {
        if (error) {
          return reject(new Error(`Cloudinary auto-clean upload failed: ${error.message}`));
        } else if (result) {
          
          try {
            // Step 2: Since Background Removal is Asynchronous, we poll the resource status
            // to wait until the AI is completely done removing the background.
            const publicId = result.public_id;
            // Poll up to 10 times, waiting 2 seconds each time (Max ~20 seconds wait)
            for (let i = 0; i < 10; i++) {
              const details = await cloudinary.api.resource(publicId);
              const bgStatus = details.info?.background_removal?.cloudinary_ai?.status;
              
              if (bgStatus === "complete") {
                break;
              } else if (bgStatus === "failed") {
                console.warn(`[Cloudinary] AI Bg removal failed for ${publicId}.`);
                break; // Continue but without background removed
              }
              // wait 2 seconds before polling again
              await new Promise(res => setTimeout(res, 2000));
            }

            // Step 3: Now generate the final transformed Delivery URL
            // We force it to be an 800x800 square, centered on the object, with a pure white padding.
            const transformedSecureUrl = cloudinary.url(publicId, {
              secure: true,
              transformation: options.transformation || [
                { width: 800, height: 800, crop: "pad", background: "white", gravity: "center" },
                { fetch_format: "auto", quality: "auto" }
              ]
            });

            resolve({
              url: transformedSecureUrl,
              publicId: publicId,
              secureUrl: transformedSecureUrl,
              width: 800,
              height: 800,
              format: result.format,
              bytes: result.bytes,
            });

          } catch (pollError: any) {
            console.error("Polling error:", pollError);
            // Fallback: Just return the original URL if polling API fails
            resolve({
              url: result.url,
              publicId: result.public_id,
              secureUrl: result.secure_url,
              format: result.format,
              bytes: result.bytes,
            });
          }

        } else {
          reject(new Error("Cloudinary auto-clean upload returned no result"));
        }
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Delete an image from Cloudinary by public_id
 */
export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    const deleteError = error as UploadApiErrorResponse;
    throw new Error(
      `Failed to delete image: ${deleteError.message || "Unknown error"}`
    );
  }
}

/**
 * Delete multiple images from Cloudinary
 */
export async function deleteMultipleImages(publicIds: string[]): Promise<void> {
  try {
    await cloudinary.api.delete_resources(publicIds);
  } catch (error) {
    throw new Error(`Failed to delete multiple images: ${error}`);
  }
}
