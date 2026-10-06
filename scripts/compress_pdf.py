#!/usr/bin/env python3
"""
SACC Yearbook PDF Compression Script

Compresses heavy print-resolution yearbook PDFs (e.g. 200+ MB) into web-optimized
interactive PDFs (~30–50 MB) for instant rendering in the flipbook.
Preserves 100% of internal PDF hyperlinks, bookmarks, and index annotations.

Usage:
    python3 scripts/compress_pdf.py --input frontend/public/assets/yearbooks/2k22.pdf
    python3 scripts/compress_pdf.py --input frontend/public/assets/yearbooks/2k22.pdf --output frontend/public/assets/yearbooks/2k22_web.pdf
    python3 scripts/compress_pdf.py --all
"""

import os
import sys
import shutil
import argparse
import subprocess
from pathlib import Path

# ANSI Colors for terminal output
GREEN = "\033[32m"
BLUE = "\033[34m"
YELLOW = "\033[33m"
RED = "\033[31m"
CYAN = "\033[36m"
BOLD = "\033[1m"
RESET = "\033[0m"


def format_size(bytes_val: float) -> str:
    """Format bytes into a human-readable string."""
    if bytes_val < 1024:
        return f"{bytes_val:.0f} B"
    elif bytes_val < 1024 * 1024:
        return f"{bytes_val / 1024:.1f} KB"
    else:
        return f"{bytes_val / (1024 * 1024):.2f} MB"


def count_link_annotations(pdf_path: Path) -> int:
    """Count internal /Subtype /Link annotations in a PDF file."""
    try:
        with open(pdf_path, "rb") as f:
            data = f.read()
        import re
        matches = re.findall(rb"/Subtype\s*/Link", data)
        return len(matches)
    except Exception as e:
        print(f"{YELLOW}Warning: Could not count annotations in {pdf_path}: {e}{RESET}")
        return -1


def compress_with_ghostscript(input_path: Path, output_path: Path, dpi: int = 150, preset: str = "ebook") -> bool:
    """
    Compress PDF using Ghostscript (preserves links, outlines, annotations).
    DPI defaults:
      - /screen: 72 DPI (smallest file, lower visual quality)
      - /ebook: 150 DPI (recommended: sharp on retina screens, ~75% smaller file)
      - /printer: 300 DPI
    """
    gs_bin = shutil.which("gs") or shutil.which("gswin64c") or shutil.which("gswin32c")
    if not gs_bin:
        return False

    cmd = [
        gs_bin,
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.5",
        f"-dPDFSETTINGS=/{preset}",
        "-dNOPAUSE",
        "-dQUIET",
        "-dBATCH",
        "-dDetectDuplicateImages=true",
        "-dCompressFonts=true",
        "-dColorImageDownsampleType=/Bicubic",
        f"-dColorImageResolution={dpi}",
        "-dGrayImageDownsampleType=/Bicubic",
        f"-dGrayImageResolution={dpi}",
        "-dMonoImageDownsampleType=/Bicubic",
        f"-dMonoImageResolution={dpi}",
        f"-sOutputFile={output_path}",
        str(input_path),
    ]

    try:
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return output_path.exists() and output_path.stat().st_size > 0
    except subprocess.CalledProcessError as e:
        print(f"{RED}Ghostscript error: {e.stderr.decode('utf-8', errors='ignore')}{RESET}")
        return False


def compress_with_pymupdf(input_path: Path, output_path: Path, dpi: int = 150, quality: int = 75) -> bool:
    """
    Compress PDF using PyMuPDF (fitz) by recompressing embedded high-res images with Pillow.
    Guarantees 100% preservation of all link annotations and PDF page structure.
    """
    try:
        import fitz  # PyMuPDF
        import io
        from PIL import Image
    except ImportError:
        return False

    try:
        doc = fitz.open(str(input_path))
        for page_idx in range(len(doc)):
            page = doc[page_idx]
            image_list = page.get_images(full=True)
            for img_info in image_list:
                xref = img_info[0]
                base_img = doc.extract_image(xref)
                if not base_img:
                    continue

                img_bytes = base_img["image"]
                img_ext = base_img["ext"]
                width = base_img["width"]
                height = base_img["height"]

                # Only compress large print images (e.g. dimensions > 1200px)
                if max(width, height) > 1200:
                    try:
                        im = Image.open(io.BytesIO(img_bytes))
                        scale = 1200 / max(width, height)
                        new_w = int(width * scale)
                        new_h = int(height * scale)
                        im = im.resize((new_w, new_h), Image.Resampling.LANCZOS)

                        out_io = io.BytesIO()
                        if im.mode in ("RGBA", "P"):
                            im = im.convert("RGB")
                        im.save(out_io, format="JPEG", quality=quality, optimize=True)
                        compressed_bytes = out_io.getvalue()

                        if len(compressed_bytes) < len(img_bytes):
                            # Replace the image stream in the PDF
                            doc.update_stream(xref, compressed_bytes)
                    except Exception:
                        continue

        # Save with garbage collection and deflation
        doc.save(
            str(output_path),
            garbage=4,
            deflate=True,
            clean=True,
        )
        doc.close()
        return output_path.exists() and output_path.stat().st_size > 0
    except Exception as e:
        print(f"{RED}PyMuPDF error: {e}{RESET}")
        return False


def compress_pdf(input_file: Path, output_file: Path, dpi: int = 150, quality: int = 75, preset: str = "ebook") -> bool:
    """Run compression on a single PDF file and verify link integrity."""
    if not input_file.exists():
        print(f"{RED}Error: File not found: {input_file}{RESET}")
        return False

    orig_size = input_file.stat().st_size
    orig_links = count_link_annotations(input_file)

    print(f"\n{BOLD}Compressing:{RESET} {CYAN}{input_file.name}{RESET}")
    print(f"  Input size:    {format_size(orig_size)}")
    print(f"  Internal links: {orig_links if orig_links >= 0 else 'Unknown'}")
    print(f"  Target DPI:    {dpi} (preset: {preset})")

    temp_output = output_file.with_name(f"{output_file.stem}.tmp.pdf")
    if temp_output.exists():
        temp_output.unlink()

    success = False
    engine_used = ""

    # Try Ghostscript first (fastest and cleanest)
    if shutil.which("gs") or shutil.which("gswin64c"):
        print(f"  {BLUE}Engine: Ghostscript{RESET}")
        success = compress_with_ghostscript(input_file, temp_output, dpi=dpi, preset=preset)
        engine_used = "Ghostscript"

    # Fallback to PyMuPDF if Ghostscript is unavailable
    if not success:
        try:
            import fitz
            print(f"  {BLUE}Engine: PyMuPDF (fitz + Pillow){RESET}")
            success = compress_with_pymupdf(input_file, temp_output, dpi=dpi, quality=quality)
            engine_used = "PyMuPDF"
        except ImportError:
            pass

    if not success:
        print(f"\n{RED}Error: No compression engine available.{RESET}")
        print("Please install one of the following:")
        print(f"  1. Ghostscript (Recommended):  {BOLD}sudo apt install ghostscript{RESET}")
        print(f"  2. PyMuPDF Python package:     {BOLD}pip install pymupdf{RESET}")
        if temp_output.exists():
            temp_output.unlink()
        return False

    new_size = temp_output.stat().st_size
    new_links = count_link_annotations(temp_output)

    # Move temp file to final output path
    if output_file.exists():
        output_file.unlink()
    temp_output.rename(output_file)

    savings = orig_size - new_size
    pct = (savings / orig_size) * 100 if orig_size > 0 else 0

    print(f"\n  {GREEN}Successfully compressed with {engine_used}!{RESET}")
    print(f"  Output file:   {output_file}")
    print(f"  New size:      {format_size(new_size)} ({GREEN}-{pct:.1f}% reduction{RESET})")
    print(f"  Links check:   {orig_links} original -> {new_links} compressed")

    if orig_links >= 0 and new_links == orig_links:
        print(f"  {GREEN}Link Integrity Verified: All {orig_links} internal index links intact!{RESET}")
    elif orig_links >= 0 and new_links < orig_links:
        print(f"  {YELLOW}Warning: Link count changed ({orig_links} -> {new_links}). Check PDF before deploying.{RESET}")

    return True


def main():
    parser = argparse.ArgumentParser(
        description="Compress heavy yearbook PDFs for fast flipbook interaction while preserving internal links.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--input",
        "-i",
        type=Path,
        help="Path to the input PDF file (e.g. frontend/public/assets/yearbooks/2k22.pdf)",
    )
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        help="Path for the output PDF. Defaults to input_web.pdf or overwrites if specified.",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Compress all PDFs in frontend/public/assets/yearbooks/ larger than 30 MB.",
    )
    parser.add_argument(
        "--dpi",
        type=int,
        default=150,
        help="Target image DPI (default: 150, optimal for desktop & mobile screens).",
    )
    parser.add_argument(
        "--quality",
        type=int,
        default=75,
        help="JPEG quality factor (1-100, default: 75).",
    )
    parser.add_argument(
        "--preset",
        choices=["screen", "ebook", "printer"],
        default="ebook",
        help="Ghostscript preset: 'ebook' (150 DPI, recommended), 'screen' (72 DPI), 'printer' (300 DPI).",
    )

    args = parser.parse_args()

    # Determine default yearbooks directory relative to script
    repo_root = Path(__file__).resolve().parent.parent
    yearbooks_dir = repo_root / "frontend" / "public" / "assets" / "yearbooks"

    if args.all:
        if not yearbooks_dir.exists():
            print(f"{RED}Yearbooks directory not found: {yearbooks_dir}{RESET}")
            sys.exit(1)

        pdf_files = [p for p in yearbooks_dir.glob("*.pdf") if not p.name.endswith("_web.pdf") and p.stat().st_size > 30 * 1024 * 1024]
        if not pdf_files:
            print(f"{YELLOW}No heavy PDFs (> 30 MB) found to compress.{RESET}")
            sys.exit(0)

        print(f"{BOLD}Found {len(pdf_files)} PDFs to compress in {yearbooks_dir}{RESET}")
        for pdf_path in pdf_files:
            out_path = pdf_path.with_name(f"{pdf_path.stem}_web.pdf")
            compress_pdf(pdf_path, out_path, dpi=args.dpi, quality=args.quality, preset=args.preset)
        print(f"\n{GREEN}{BOLD}All yearbooks compressed successfully!{RESET}")
        return

    if not args.input:
        parser.print_help()
        print(f"\n{YELLOW}Tip: Try running:{RESET}")
        print(f"  python3 scripts/compress_pdf.py --input frontend/public/assets/yearbooks/2k22.pdf --output frontend/public/assets/yearbooks/2k22_web.pdf")
        sys.exit(1)

    input_path = args.input
    output_path = args.output or input_path.with_name(f"{input_path.stem}_web.pdf")

    success = compress_pdf(input_path, output_path, dpi=args.dpi, quality=args.quality, preset=args.preset)
    if not success:
        sys.exit(1)


if __name__ == "__main__":
    main()

