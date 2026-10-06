# SACC Official Website

Student Alumni Connect Cell (SACC) official web portal and alumni directory for IIIT Hyderabad.

---

## Architecture Overview

* **Frontend**: Next.js 14 (Pages Router) + React + Material-UI + SCSS + TailwindCSS
* **Backend**: FastAPI (Python 3.12) + SQLAlchemy + Pydantic
* **Database**: PostgreSQL 16
* **Reverse Proxy**: Nginx (handling static routing, Gzip compression, and API proxying)

---

## Quick Start (Development with Docker)

### 1. Environment Setup
Initialize your `.env` configuration:
```bash
./setup.sh
```
*(Or copy manually: `cp .env.example .env`)*

### 2. Run the Development Containers
```bash
# Using Makefile
make dev

# Or using Docker Compose directly
docker compose up --build
```

### 3. Access Services
* **Frontend**: [http://localhost](http://localhost)
* **Backend API**: [http://localhost/api](http://localhost/api)
* **API Documentation (Swagger UI)**: [http://localhost/api/docs](http://localhost/api/docs)
* **PostgreSQL**: `localhost:5432` (`sacc_user` / `sacc_password` / `sacc_db`)

---

## Makefile Commands

| Command | Description |
| :--- | :--- |
| `make dev` | Start development environment |
| `make up` | Start containers in detached mode |
| `make down` | Stop and remove running containers |
| `make restart` | Restart all containers |
| `make logs` | View combined container logs |
| `make status` | Check container statuses |
| `make health` | Test service health & PostgreSQL connectivity |
| `make build` | Rebuild containers without cache |
| `make compress-images` | Run image optimization on static assets |
| `make compress-pdf` | Compress yearbook PDFs for fast flipbook interaction |
| `make db-backup` | Create a compressed PostgreSQL backup |
| `make db-restore` | Restore from a backup file |

---

## Image Optimization Script

Whenever you add new alumni batches, team photos, or static assets to `frontend/public/assets/images`, run the optimization script to automatically downscale high-resolution files to web-optimized dimensions.

### Usage

```bash
# 1. Optimize all assets exceeding 200 KB (default)
make compress-images

# 2. Optimize a specific directory (e.g. a newly added batch)
make compress-images DIR=frontend/public/assets/images/2022

# 3. Using Python directly:
python3 scripts/compress_images.py [options]
```

### Python Script Options

```bash
# Preview changes without modifying files (Dry Run)
python3 scripts/compress_images.py --dry-run

# Compress a specific directory
python3 scripts/compress_images.py --dir frontend/public/assets/images/2022

# Customize dimensions, quality, and threshold
python3 scripts/compress_images.py --max-dim 800 --quality 85 --threshold-kb 150

# Force compression on all files regardless of size
python3 scripts/compress_images.py --force
```

| Flag | Default | Description |
| :--- | :--- | :--- |
| `--dir`, `-d` | `frontend/public/assets` | Target directory to recursively scan |
| `--max-dim`, `-m` | `800` | Maximum width or height in pixels |
| `--quality`, `-q` | `85` | JPEG/WEBP output quality (1–100) |
| `--threshold-kb`, `-t` | `200` | Only compress files larger than this size in KB |
| `--dry-run` | `False` | Preview what would be compressed without modifying files |
| `--force`, `-f` | `False` | Force compression on all files regardless of size |

---

## Adding New Alumni Batches

See the detailed guide in [frontend/pages/alumni/README.md](frontend/pages/alumni/README.md).

Summary:
1. Add `frontend/public/alumni_YYYY.json`
2. Add batch images to `frontend/public/assets/images/YYYY/`
3. Run `make compress-images DIR=frontend/public/assets/images/YYYY`
4. The system automatically creates batch listing and individual profile pages with infinite scrolling.

---

## Yearbook Flipbook & PDF Compression Pipeline

The yearbook feature provides an interactive 3D digital flipbook (`react-pageflip` + `react-pdf`) supporting high-resolution multi-hundred-page graduating batch yearbooks.

### Dual PDF Strategy (Viewer vs. Download)

To balance snappy browser rendering with print-grade archival quality, yearbooks use a two-tier storage model defined in [`frontend/pages/yearbook.jsx`](frontend/pages/yearbook.jsx):

* **Web-Optimized Viewer PDF** (`frontend/public/assets/yearbooks/2kXX.pdf`): Downsampled to web resolution (150 DPI), compressed to ~30–50 MB. Loaded inside the interactive flipbook viewer for instantaneous page flips and low RAM footprint.
* **Archival Print PDF** (`frontend/public/assets/yearbooks/Yearbook_2kXX.pdf`): Full original resolution (200–500+ MB). Served when users click the **"Download PDF"** button.

### Flipbook Architecture & Optimizations

The flipbook component is located at [`frontend/components/flipbook.jsx`](frontend/components/flipbook.jsx) and incorporates several core optimizations:

1. **Internal Hyperlink Interception**:
   * Yearbook index pages contain hundreds of internal `/Subtype /Link` GoTo annotations (e.g., student name $\rightarrow$ profile page).
   * Default PDF.js renders these as `<a href="#">` with vertical scroll targets, which would trigger Next.js page re-renders and break flipbook state.
   * Clicks on `.linkAnnotation a` are intercepted in the **DOM capture phase** (`stopPropagation` and `stopImmediatePropagation`), preventing native anchor jumps.
   * Target pages are resolved in **0ms** using the pre-compiled lookup dictionary [`frontend/lib/yearbook_annotations.json`](frontend/lib/yearbook_annotations.json), with a dynamic PDF.js destination fallback.

2. **Decoupled DOM & Context Architecture**:
   * Instead of recreating page wrapper DOM nodes on every flip (which forced `HTMLFlipBook` to call `updateFromHtml` and aborted canvas workers midway with `RenderingCancelledException`), page container arrays are statically memoized.
   * Active page state is passed down via `FlipbookPageContext`. Only the windowed range of pages around the active spread (`currentPage ± 4` on desktop, `± 3` on mobile) renders heavy PDF canvas layers; all other pages remain lightweight placeholder divs.

3. **Bidirectional Loading Skeleton (`PageSkeleton`)**:
   * Heavy spreads display a custom loading skeleton with a glowing violet circular progress spinner, dark radial backdrop, and a clean *"Rendering"* status indicator.
   * Active rendering lifecycle state is encapsulated inside `<ActivePdfPage>` so that skeletons cleanly display when flipping **forward and backward**.

---

## Yearbook PDF Compression Script

Raw print PDFs exported from InDesign / Illustrator often exceed 200–500 MB with 300+ DPI uncompressed image assets. Standard PDF compressors often destroy internal GoTo hyperlinks. 

The dedicated Python script [`scripts/compress_pdf.py`](scripts/compress_pdf.py) preserves **100% of internal hyperlinks, bookmarks, and index annotations** while reducing file size by 70–85%.

### Prerequisites

The script supports two compression engines:
* **Ghostscript** (*Recommended & Fastest*):
  ```bash
  sudo apt-get install ghostscript
  ```
* **PyMuPDF + Pillow** (*Pure-Python Fallback*):
  ```bash
  pip install pymupdf pillow
  ```

### Usage

```bash
# 1. Compress all yearbooks in the public directory
make compress-pdf

# 2. Or run via npm / yarn
cd frontend && npm run compress-pdf

# 3. Compress a single specific file with custom output
python3 scripts/compress_pdf.py \
  --input frontend/public/assets/yearbooks/Yearbook_2k22.pdf \
  --output frontend/public/assets/yearbooks/2k22.pdf

# 4. Dry-run preview without modifying files
python3 scripts/compress_pdf.py --all --dry-run
```

### Script CLI Options

| Flag | Default | Description |
| :--- | :--- | :--- |
| `--input`, `-i` | — | Path to the source uncompressed PDF |
| `--output`, `-o` | — | Path to output web-optimized PDF (defaults to `_web.pdf` or replaces `2kXX.pdf`) |
| `--all`, `-a` | `False` | Scan `frontend/public/assets/yearbooks/` and compress all yearbooks |
| `--dpi` | `150` | Target raster resolution for embedded graphics (150 DPI is retina-crisp) |
| `--quality`, `-q` | `75` | JPEG recompression quality for PyMuPDF mode (1–100) |
| `--preset` | `ebook` | Ghostscript preset (`screen` = 72 DPI, `ebook` = 150 DPI, `printer` = 300 DPI) |
| `--dry-run` | `False` | Preview estimated savings and verify links without modifying disk |
| `--force`, `-f` | `False` | Overwrite target output even if it already exists |

> [!NOTE]
> The compression script automatically checks the count of `/Subtype /Link` annotations before and after compression to guarantee that no student profile jumps are lost.

---

### Adding a New Yearbook Batch (e.g. 2k23)

1. Place the full-resolution print PDF in:
   ```
   frontend/public/assets/yearbooks/Yearbook_2k23.pdf
   ```
2. Generate the web-optimized flipbook version:
   ```bash
   python3 scripts/compress_pdf.py \
     -i frontend/public/assets/yearbooks/Yearbook_2k23.pdf \
     -o frontend/public/assets/yearbooks/2k23.pdf
   ```
3. Register the year in [`frontend/pages/yearbook.jsx`](frontend/pages/yearbook.jsx):
   ```javascript
   const viewerPdfMapping = {
     "2k23": "./assets/yearbooks/2k23.pdf",
     "2k22": "./assets/yearbooks/2k22.pdf",
     ...
   };

   const downloadPdfMapping = {
     "2k23": "./assets/yearbooks/Yearbook_2k23.pdf",
     "2k22": "./assets/yearbooks/Yearbook_2k22.pdf",
     ...
   };
   ```
4. Access the new batch at `http://localhost/yearbook?year=2k23`.
