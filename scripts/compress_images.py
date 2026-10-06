#!/usr/bin/env python3
"""
SACC Image Compression Script

Compresses and optimizes images (JPEG, PNG) across the asset directories.
Downscales high-resolution images to web-optimized dimensions while preserving visual quality.

Usage:
    python3 scripts/compress_images.py [options]

Examples:
    # Compress all images in frontend/public/assets larger than 200 KB (default)
    python3 scripts/compress_images.py

    # Compress only a specific directory (e.g. a new batch of alumni)
    python3 scripts/compress_images.py --dir frontend/public/assets/images/2022

    # Dry run to see what would be compressed without making changes
    python3 scripts/compress_images.py --dry-run

    # Customize max dimension and quality
    python3 scripts/compress_images.py --max-dim 800 --quality 85 --threshold-kb 150
"""

import os
import sys
import argparse
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    print("\033[31mError: Pillow (PIL) is not installed.\033[0m")
    print("Please install it using: pip install Pillow")
    sys.exit(1)


# ANSI Colors for terminal output
GREEN = "\033[32m"
BLUE = "\033[34m"
YELLOW = "\033[33m"
RED = "\033[31m"
CYAN = "\033[36m"
BOLD = "\033[1m"
RESET = "\033[0m"

SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def format_size(bytes_val: float) -> str:
    """Format bytes into a human-readable string."""
    if bytes_val < 1024:
        return f"{bytes_val:.0f} B"
    elif bytes_val < 1024 * 1024:
        return f"{bytes_val / 1024:.1f} KB"
    else:
        return f"{bytes_val / (1024 * 1024):.2f} MB"


def compress_image(
    file_path: Path,
    max_dim: int = 800,
    quality: int = 85,
    threshold_bytes: int = 200 * 1024,
    dry_run: bool = False,
    force: bool = False
) -> tuple[bool, int, int]:
    """
    Compress a single image if it exceeds threshold_bytes or force is True.
    Returns: (was_compressed, original_size, new_size)
    """
    orig_size = file_path.stat().st_size
    if not force and orig_size <= threshold_bytes:
        return False, orig_size, orig_size

    try:
        with Image.open(file_path) as im:
            # Transpose according to EXIF orientation tag if present
            im = ImageOps.exif_transpose(im)
            width, height = im.size

            needs_resize = width > max_dim or height > max_dim

            if not needs_resize and orig_size <= threshold_bytes and not force:
                return False, orig_size, orig_size

            if dry_run:
                return True, orig_size, orig_size

            # Resize keeping aspect ratio
            if needs_resize:
                im.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

            ext = file_path.suffix.lower()

            if ext in (".jpg", ".jpeg"):
                if im.mode in ("RGBA", "P", "LA"):
                    im = im.convert("RGB")
                im.save(file_path, "JPEG", quality=quality, optimize=True)
            elif ext == ".png":
                # For PNG, preserve RGBA transparency if present
                im.save(file_path, "PNG", optimize=True)
            elif ext == ".webp":
                im.save(file_path, "WEBP", quality=quality, method=6)

            new_size = file_path.stat().st_size

            # If compression somehow increased file size, restore if needed
            # (rare, but can happen on already tiny compressed images)
            return True, orig_size, new_size

    except Exception as e:
        print(f"  {RED}Failed {file_path.name}: {e}{RESET}")
        return False, orig_size, orig_size


def scan_and_compress(
    target_dirs: list[Path],
    max_dim: int,
    quality: int,
    threshold_kb: int,
    dry_run: bool,
    force: bool
):
    threshold_bytes = threshold_kb * 1024
    total_scanned = 0
    total_compressed = 0
    total_orig_bytes = 0
    total_new_bytes = 0

    print(f"\n{BOLD}{CYAN}=== SACC Image Optimizer ==={RESET}")
    print(f"Directories : {[str(d) for d in target_dirs]}")
    print(f"Max Dimension: {max_dim}px | Quality: {quality} | Threshold: >{threshold_kb} KB")
    if dry_run:
        print(f"{YELLOW}[DRY RUN MODE - No files will be modified]{RESET}")
    print("-" * 60)

    for target_dir in target_dirs:
        if not target_dir.exists():
            print(f"{YELLOW}Skipping missing directory: {target_dir}{RESET}")
            continue

        for root, _, files in os.walk(target_dir):
            for file_name in sorted(files):
                file_path = Path(root) / file_name
                if file_path.suffix.lower() not in SUPPORTED_EXTENSIONS:
                    continue

                total_scanned += 1
                compressed, orig_sz, new_sz = compress_image(
                    file_path=file_path,
                    max_dim=max_dim,
                    quality=quality,
                    threshold_bytes=threshold_bytes,
                    dry_run=dry_run,
                    force=force
                )

                if compressed:
                    total_compressed += 1
                    total_orig_bytes += orig_sz
                    total_new_bytes += new_sz
                    rel_path = file_path.as_posix()
                    if dry_run:
                        print(f"{YELLOW}[WOULD COMPRESS]{RESET} {rel_path} ({format_size(orig_sz)})")
                    else:
                        saved = orig_sz - new_sz
                        pct = (saved / orig_sz * 100) if orig_sz > 0 else 0
                        print(
                            f"{GREEN}[OK]{RESET} {rel_path}: "
                            f"{format_size(orig_sz)} -> {format_size(new_sz)} "
                            f"({pct:.1f}% saved)"
                        )

    print("-" * 60)
    print(f"{BOLD}Summary:{RESET}")
    print(f"  Files Scanned    : {total_scanned}")
    print(f"  Files Compressed : {total_compressed}")
    if total_compressed > 0 and not dry_run:
        saved_bytes = total_orig_bytes - total_new_bytes
        pct = (saved_bytes / total_orig_bytes * 100) if total_orig_bytes > 0 else 0
        print(f"  Original Size    : {format_size(total_orig_bytes)}")
        print(f"  Optimized Size   : {format_size(total_new_bytes)}")
        print(f"  {GREEN}{BOLD}Total Saved      : {format_size(saved_bytes)} ({pct:.1f}% reduction){RESET}")
    elif dry_run:
        print(f"  {YELLOW}Dry run completed. Run without --dry-run to apply changes.{RESET}")
    else:
        print(f"  {GREEN}All scanned images are already optimized!{RESET}")
    print()


def main():
    parser = argparse.ArgumentParser(
        description="Compress and optimize static images in the SACC website repository."
    )
    parser.add_argument(
        "--dir", "-d",
        type=str,
        default="frontend/public/assets",
        help="Target directory to scan for images (default: frontend/public/assets)"
    )
    parser.add_argument(
        "--max-dim", "-m",
        type=int,
        default=800,
        help="Maximum width or height in pixels (default: 800)"
    )
    parser.add_argument(
        "--quality", "-q",
        type=int,
        default=85,
        help="JPEG/WEBP output quality (1-100, default: 85)"
    )
    parser.add_argument(
        "--threshold-kb", "-t",
        type=int,
        default=200,
        help="Only compress images larger than this size in KB (default: 200)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview which files would be compressed without modifying them"
    )
    parser.add_argument(
        "--force", "-f",
        action="store_true",
        help="Force compression on all images regardless of size threshold"
    )

    args = parser.parse_args()

    # Determine workspace base directory
    base_dir = Path(__file__).resolve().parent.parent
    target_path = Path(args.dir)
    if not target_path.is_absolute():
        target_path = base_dir / target_path

    scan_and_compress(
        target_dirs=[target_path],
        max_dim=args.max_dim,
        quality=args.quality,
        threshold_kb=args.threshold_kb,
        dry_run=args.dry_run,
        force=args.force
    )


if __name__ == "__main__":
    main()

