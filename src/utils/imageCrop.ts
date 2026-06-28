export interface CropToSquareOptions {
    /** Output square edge length in pixels. */
    size?: number;
    mimeType?: string;
    quality?: number;
}

/**
 * Center-crops an image file to a square and resizes it, returning a Blob.
 * Guarantees a square, bounded-size output regardless of the source aspect ratio,
 * so the upload is always a small square image.
 */
export async function cropImageToSquare(file: File, options: CropToSquareOptions = {}): Promise<Blob> {
    const size = options.size ?? 512;
    const mimeType = options.mimeType ?? "image/jpeg";
    const quality = options.quality ?? 0.9;

    const dataUrl = await readFileAsDataUrl(file);
    const image = await loadImage(dataUrl);

    const side = Math.min(image.naturalWidth, image.naturalHeight);
    if (!side) {
        throw new Error("The selected file is not a valid image.");
    }

    const sx = (image.naturalWidth - side) / 2;
    const sy = (image.naturalHeight - side) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("Unable to process the image.");
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, sx, sy, side, side, 0, 0, size, size);

    return await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error("Unable to process the image."));
                }
            },
            mimeType,
            quality
        );
    });
}

function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Unable to read the image."));
        reader.readAsDataURL(file);
    });
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Unable to load the image."));
        image.src = src;
    });
}
