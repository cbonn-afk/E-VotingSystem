import type { Area } from "react-easy-crop";

const OUTPUT_SIZE = 512; // square avatar output, keeps files small

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();

    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () =>
      reject(new Error("Could not load the selected image.")),
    );
    image.src = url;
  });

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/**
 * Bounding box of an image of the given size after rotating it by `rotation`.
 */
const rotatedSize = (width: number, height: number, rotation: number) => {
  const rad = toRadians(rotation);

  return {
    width: Math.abs(Math.cos(rad) * width) + Math.abs(Math.sin(rad) * height),
    height: Math.abs(Math.sin(rad) * width) + Math.abs(Math.cos(rad) * height),
  };
};

/**
 * Produces a square, cropped avatar file from the source image and the crop
 * area reported by react-easy-crop. Honours rotation and outputs a JPEG
 * capped at 512x512.
 */
export const getCroppedAvatarFile = async (
  imageSrc: string,
  croppedAreaPixels: Area,
  rotation = 0,
  fileName = "avatar.jpg",
): Promise<File> => {
  const image = await loadImage(imageSrc);

  // 1) Render the (rotated) image onto an intermediate canvas sized to its
  //    rotated bounding box, so the crop coordinates line up with what the
  //    cropper showed the user.
  const { width: bBoxWidth, height: bBoxHeight } = rotatedSize(
    image.width,
    image.height,
    rotation,
  );

  const source = document.createElement("canvas");
  source.width = bBoxWidth;
  source.height = bBoxHeight;

  const sourceCtx = source.getContext("2d");

  if (!sourceCtx) {
    throw new Error("Image cropping is not supported in this browser.");
  }

  sourceCtx.translate(bBoxWidth / 2, bBoxHeight / 2);
  sourceCtx.rotate(toRadians(rotation));
  sourceCtx.drawImage(image, -image.width / 2, -image.height / 2);

  // 2) Extract the crop area and scale it into the square output canvas.
  const output = document.createElement("canvas");
  output.width = OUTPUT_SIZE;
  output.height = OUTPUT_SIZE;

  const outputCtx = output.getContext("2d");

  if (!outputCtx) {
    throw new Error("Image cropping is not supported in this browser.");
  }

  outputCtx.drawImage(
    source,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  );

  const blob = await new Promise<Blob | null>((resolve) => {
    output.toBlob((result) => resolve(result), "image/jpeg", 0.9);
  });

  if (!blob) {
    throw new Error("Could not process the cropped image.");
  }

  return new File([blob], fileName, { type: "image/jpeg" });
};
