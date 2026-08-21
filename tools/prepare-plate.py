#!/usr/bin/env python3
"""
Image processing tool for game level backgrounds.
Handles cropping and color correction for level plate images.
"""

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image, ImageEnhance
except ImportError:
    print("Error: Pillow is required. Install with: pip install Pillow", file=sys.stderr)
    sys.exit(1)


class ImageProcessor:
    """Process level background images with cropping and color correction."""

    # Design spec color band: Luminance 85-110, Saturation 0.30-0.45
    TARGET_LUMINANCE = (85, 110)
    TARGET_SATURATION = (0.30, 0.45)
    ASPECT_RATIO = 16 / 9  # Game resolution aspect ratio

    def __init__(self, verbose=False):
        self.verbose = verbose

    def log(self, message):
        """Print log message if verbose."""
        if self.verbose:
            print(f"[prepare-plate] {message}")

    def load_image(self, input_path):
        """Load image from disk."""
        try:
            img = Image.open(input_path)
            self.log(f"Loaded: {input_path} ({img.width}×{img.height}, {img.mode})")
            return img
        except Exception as e:
            print(f"Error loading image: {e}", file=sys.stderr)
            sys.exit(1)

    def crop_image(self, img, crop_percent=50):
        """
        Crop image to target aspect ratio.
        crop_percent: percentage of width to keep from center (50-100)
        """
        crop_percent = max(50, min(100, crop_percent))

        # Calculate target dimensions maintaining aspect ratio
        target_width = int(img.width * crop_percent / 100)
        target_height = int(target_width / self.ASPECT_RATIO)

        # Ensure dimensions don't exceed original
        if target_height > img.height:
            target_height = img.height
            target_width = int(target_height * self.ASPECT_RATIO)

        # Center crop
        left = (img.width - target_width) // 2
        top = (img.height - target_height) // 2
        right = left + target_width
        bottom = top + target_height

        cropped = img.crop((left, top, right, bottom))
        self.log(f"Cropped: {crop_percent}% → {cropped.width}×{cropped.height}")
        return cropped

    def analyze_luminance(self, img):
        """Analyze average luminance of image."""
        # Convert to grayscale for luminance analysis
        gray = img.convert("L")
        pixels = list(gray.getdata())
        avg_luminance = sum(pixels) / len(pixels)
        return avg_luminance

    def correct_colors(self, img, target_luminance=None, target_saturation=None):
        """
        Apply color correction to match design spec.
        Adjusts brightness and saturation.
        """
        if target_luminance is None:
            target_luminance = sum(self.TARGET_LUMINANCE) / 2
        if target_saturation is None:
            target_saturation = sum(self.TARGET_SATURATION) / 2

        # Analyze current state
        current_luminance = self.analyze_luminance(img)

        # Brightness correction (luminance target: 85-110, center at ~97)
        brightness_factor = target_luminance / max(current_luminance, 1)
        brightness_factor = max(0.5, min(2.0, brightness_factor))  # Clamp to reasonable range

        enhancer = ImageEnhance.Brightness(img)
        img = enhancer.enhance(brightness_factor)
        self.log(
            f"Brightness: {current_luminance:.1f} → {target_luminance:.1f} (factor: {brightness_factor:.2f})"
        )

        # Saturation correction (saturation target: 0.30-0.45, center at ~0.375)
        enhancer = ImageEnhance.Color(img)
        img = enhancer.enhance(target_saturation)
        self.log(f"Saturation: {target_saturation:.2f}")

        # Optional: contrast boost for visual clarity
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(1.05)

        return img

    def save_image(self, img, output_path, quality=85):
        """Save processed image."""
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        try:
            # Convert to RGB if necessary (for JPEG)
            if img.mode == "RGBA":
                rgb_img = Image.new("RGB", img.size, (255, 255, 255))
                rgb_img.paste(img, mask=img.split()[3])
                img = rgb_img

            img.save(output_path, "JPEG", quality=quality, optimize=True)
            self.log(f"Saved: {output_path} ({img.width}×{img.height}, quality={quality})")
            return str(output_path)
        except Exception as e:
            print(f"Error saving image: {e}", file=sys.stderr)
            sys.exit(1)

    def process(
        self, input_path, output_path, scale=None, crop_percent=50, color_correct=True
    ):
        """
        Full processing pipeline.

        Args:
            input_path: Input image path
            output_path: Output image path
            scale: Scale factor (0.0-1.0), e.g., 0.5 for half resolution
            crop_percent: Percentage of image width to keep (50-100)
            color_correct: Apply color correction
        """
        # Load
        img = self.load_image(input_path)

        # Crop
        img = self.crop_image(img, crop_percent=crop_percent)

        # Color correct
        if color_correct:
            img = self.correct_colors(img)

        # Scale
        if scale and scale < 1.0:
            new_width = int(img.width * scale)
            new_height = int(img.height * scale)
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            self.log(f"Scaled: {scale}x → {img.width}×{img.height}")

        # Save
        self.save_image(img, output_path)

        self.log("Processing complete ✓")
        return output_path


def main():
    parser = argparse.ArgumentParser(
        description="Process level background images for Lovec Vltavínů"
    )
    parser.add_argument("--input", required=True, help="Input image path")
    parser.add_argument("--output", required=True, help="Output image path")
    parser.add_argument(
        "--crop", type=int, default=50, help="Crop percentage (50-100, default 50)"
    )
    parser.add_argument(
        "--scale", type=float, default=None, help="Scale factor (0.0-1.0, e.g., 0.5)"
    )
    parser.add_argument(
        "--color-correct",
        action="store_true",
        default=True,
        help="Apply color correction (default: True)",
    )
    parser.add_argument(
        "--no-color-correct", action="store_false", dest="color_correct", help="Skip color correction"
    )
    parser.add_argument("--verbose", action="store_true", help="Verbose output")

    args = parser.parse_args()

    processor = ImageProcessor(verbose=args.verbose)
    processor.process(
        input_path=args.input,
        output_path=args.output,
        scale=args.scale,
        crop_percent=args.crop,
        color_correct=args.color_correct,
    )


if __name__ == "__main__":
    main()
