import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import HTMLFlipBook from "react-pageflip";
import { Document, Page, pdfjs } from "react-pdf";
import {
  ChevronLeft,
  ChevronRight,
  FileDownload,
  FileDownloadOutlined,
  NavigateBefore,
  NavigateNext,
} from "@mui/icons-material";
import {
  Box,
  IconButton,
  TextField,
  Button,
  Typography,
  useMediaQuery,
  useTheme,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import yearbookAnnotations from "../lib/yearbook_annotations.json";

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Page component using React.forwardRef as required by react-pageflip
const FlipBookPage = React.forwardRef((props, ref) => {
  const { children, pageWidth, pageHeight } = props;
  return (
    <div
      className="page"
      ref={ref}
      style={{
        width: pageWidth,
        height: pageHeight,
        backgroundColor: "#2D1B2E",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {children}
    </div>
  );
});
FlipBookPage.displayName = "FlipBookPage";

const pageStyles = {
  width: 600,
  height: 850,
  backgroundColor: "#2D1B2E",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #444",
  fontSize: "14px",
  color: "#EAEAEA",
};

const canvasProps = {
  style: {
    maxWidth: "100%",
    height: "auto",
    display: "block",
  },
};

const FlipbookPageContext = React.createContext({
  currentPage: 0,
  isMobile: false,
});

const PageSkeleton = ({ pageWidth, pageHeight }) => (
  <div
    style={{
      width: pageWidth,
      height: pageHeight,
      backgroundColor: "#241525",
      backgroundImage:
        "radial-gradient(circle at 50% 40%, rgba(224, 170, 255, 0.08) 0%, rgba(36, 21, 37, 0.95) 70%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "16px",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      borderRadius: "4px",
      boxShadow: "inset 0 0 40px rgba(0, 0, 0, 0.5)",
      position: "relative",
      userSelect: "none",
    }}
  >
    <CircularProgress
      size={44}
      thickness={4}
      sx={{
        color: "#d8b4e2",
        filter: "drop-shadow(0 0 8px rgba(216, 180, 226, 0.4))",
      }}
    />
    <div style={{ textAlign: "center", padding: "0 24px", maxWidth: "90%" }}>
      <Typography
        sx={{
          color: "#e2d4e8",
          fontWeight: 600,
          fontSize: "15px",
          letterSpacing: "0.5px",
        }}
      >
        Rendering
      </Typography>
      <Typography
        sx={{
          color: "rgba(226, 212, 232, 0.55)",
          fontSize: "12px",
          marginTop: "6px",
          lineHeight: 1.4,
        }}
      >
        Flipbook is lower resolution for faster loading. Download the full PDF for high resolution.
      </Typography>
    </div>
  </div>
);

function ActivePdfPage({ pageNumber, pageWidth, pageHeight }) {
  const [isRendered, setIsRendered] = React.useState(false);

  return (
    <div
      style={{
        position: "relative",
        width: pageWidth,
        height: pageHeight,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 2,
          opacity: isRendered ? 0 : 1,
          pointerEvents: isRendered ? "none" : "auto",
          transition: "opacity 0.25s ease-out",
        }}
      >
        <PageSkeleton
          pageWidth={pageWidth}
          pageHeight={pageHeight}
        />
      </div>

      <Page
        width={pageWidth}
        pageNumber={pageNumber}
        renderMode="canvas"
        renderTextLayer={false}
        renderAnnotationLayer={true}
        onRenderSuccess={() => setIsRendered(true)}
        loading={
          <PageSkeleton
            pageWidth={pageWidth}
            pageHeight={pageHeight}
          />
        }
        error={
          <div
            style={{
              ...pageStyles,
              width: pageWidth,
              height: pageHeight,
            }}
          >
            Failed to load page {pageNumber}
          </div>
        }
        canvasProps={canvasProps}
      />
    </div>
  );
}

const DynamicPageContent = React.memo(function DynamicPageContent({
  pageNumber,
  pageWidth,
  pageHeight,
}) {
  const { currentPage, isMobile } = React.useContext(FlipbookPageContext);
  const pageIndex = pageNumber - 1;
  const range = isMobile ? 3 : 4;
  const isNearby = Math.abs(pageIndex - currentPage) <= range;

  if (!isNearby) {
    return (
      <div
        style={{
          width: pageWidth,
          height: pageHeight,
          backgroundColor: "#241525",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          fontSize: "14px",
          color: "rgba(234, 234, 234, 0.4)",
        }}
      >
        Page {pageNumber}
      </div>
    );
  }

  return (
    <ActivePdfPage
      pageNumber={pageNumber}
      pageWidth={pageWidth}
      pageHeight={pageHeight}
    />
  );
});
DynamicPageContent.displayName = "DynamicPageContent";

function Flipbook(props) {
  const { yearbookViewerPath, yearbookDownloadPath, page } = props;
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageInput, setPageInput] = useState("1");
  const [isEditingPage, setIsEditingPage] = useState(false);
  const flipBookRef = useRef();
  const containerRef = useRef(null);
  const pdfDocRef = useRef(null);

  const theme = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  // Check aspect ratio to determine mobile vs desktop view
  useEffect(() => {
    const checkAspectRatio = () => {
      const aspectRatio = window.innerWidth / window.innerHeight;
      // Switch to single page (mobile) view when aspect ratio is less than 1.2 (portrait or narrow landscape)
      setIsMobile(aspectRatio < 1.2);
    };

    checkAspectRatio();
    window.addEventListener("resize", checkAspectRatio);
    return () => window.removeEventListener("resize", checkAspectRatio);
  }, []);

  useEffect(() => {
    if (page && numPages) {
      const pageNum = parseInt(page, 10);

      if (pageNum >= 1 && pageNum <= numPages) {
        const intervalId = setInterval(() => {
          if (
            flipBookRef.current &&
            typeof flipBookRef.current.pageFlip === "function" &&
            flipBookRef.current.pageFlip()
          ) {
            flipBookRef.current.pageFlip().turnToPage(pageNum - 1);
            clearInterval(intervalId);
          }
        }, 100);

        return () => clearInterval(intervalId);
      }
    }
  }, [page, numPages]);

  // Navigation functions
  const goToPreviousPage = useCallback(() => {
    if (flipBookRef.current) {
      flipBookRef.current.pageFlip().flipPrev();
    }
  }, []);

  const goToNextPage = useCallback(() => {
    if (flipBookRef.current) {
      flipBookRef.current.pageFlip().flipNext();
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        goToPreviousPage();
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        goToNextPage();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [goToPreviousPage, goToNextPage]);

  function onDocumentLoadSuccess(pdf) {
    setNumPages(pdf.numPages);
    pdfDocRef.current = pdf;
  }

  const onFlip = useCallback((e) => {
    setCurrentPage(e.data);
    setPageInput(String(e.data + 1));
  }, []);

  const goToPage = useCallback(
    (pageNum) => {
      if (pageNum >= 1 && pageNum <= (numPages || 10000)) {
        const targetIndex = pageNum - 1;
        if (
          flipBookRef.current &&
          typeof flipBookRef.current.pageFlip === "function" &&
          flipBookRef.current.pageFlip()
        ) {
          flipBookRef.current.pageFlip().turnToPage(targetIndex);
        }
        setCurrentPage(targetIndex);
        setPageInput(String(pageNum));
      }
    },
    [numPages]
  );

  const handlePageInputChange = (e) => {
    setPageInput(e.target.value);
  };

  const handlePageInputSubmit = (e) => {
    e.preventDefault();
    const pageNum = parseInt(pageInput);
    if (pageNum >= 1 && pageNum <= numPages) {
      goToPage(pageNum);
    } else {
      setPageInput(String(currentPage + 1));
    }
    setIsEditingPage(false);
  };

  const handlePageDisplayClick = () => {
    setIsEditingPage(true);
    setPageInput(String(currentPage + 1));
  };

  const handlePageInputBlur = () => {
    setIsEditingPage(false);
    setPageInput(String(currentPage + 1));
  };

  const handlePageInputKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsEditingPage(false);
      setPageInput(String(currentPage + 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handlePageInputSubmit(e);
    }
  };

  // Function to download the complete PDF
  const downloadPdf = () => {
    if (yearbookDownloadPath) {
      // Create a link element
      const link = document.createElement("a");
      link.href = yearbookDownloadPath;

      // Extract filename from path or use a default name
      const filename = yearbookDownloadPath.split("/").pop() || "yearbook.pdf";
      link.download = filename;

      // Append to the document, click and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.error("Download path not provided");
      alert("Sorry, the PDF download is not available.");
    }
  };

  const downloadCurrentPage = async () => {
    try {
      if (!yearbookViewerPath || !numPages) {
        alert("PDF not loaded yet. Please wait for the document to load.");
        return;
      }

      // Load the PDF document directly for high-resolution rendering
      const loadingTask = pdfjs.getDocument(yearbookViewerPath);
      const pdf = await loadingTask.promise;

      // Calculate DPI scale factor (300 DPI = 4.17x scale from default 72 DPI)
      const scale = 300 / 72;

      if (isMobile) {
        // Mobile: download single page only
        const pageNum = currentPage + 1;
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        // Create a high-resolution canvas
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Render the page at high resolution
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        await page.render(renderContext).promise;

        // Download the high-resolution image
        const link = document.createElement("a");
        link.download = `yearbook-page-${pageNum}.png`;
        link.href = canvas.toDataURL("image/png");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Desktop: download visible pages with appropriate numbering
        const pagesToDownload = [];

        if (currentPage === 0) {
          // First page only
          pagesToDownload.push(1);
        } else {
          // Two pages: current and next (if exists)
          pagesToDownload.push(currentPage + 1);
          if (currentPage + 2 <= numPages) {
            pagesToDownload.push(currentPage + 2);
          }
        }

        for (let i = 0; i < pagesToDownload.length; i++) {
          const pageNum = pagesToDownload[i];
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale });

          // Create a high-resolution canvas
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          // Render the page at high resolution
          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };
          await page.render(renderContext).promise;

          // Download the high-resolution image
          const link = document.createElement("a");
          link.download = `yearbook-page-${pageNum}.png`;
          link.href = canvas.toDataURL("image/png");
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Add a small delay between downloads
          if (i < pagesToDownload.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }
      }
    } catch (error) {
      console.error("Error downloading page:", error);
      alert("Unable to download the current page. Please try again.");
    }
  };

  // Handle clicks on PDF outline/index links
  const handleItemClick = useCallback(
    ({ pageNumber, pageIndex }) => {
      const target = pageNumber || (pageIndex !== undefined ? pageIndex + 1 : null);
      if (target) {
        goToPage(target);
      }
    },
    [goToPage]
  );

  // Capture clicks on PDF link annotations to navigate flipbook and prevent default URL hash jump
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleAnnotationClick = async (e) => {
      const link = e.target.closest("a") || e.target.closest(".linkAnnotation");
      if (!link) return;

      const section =
        link.closest(".linkAnnotation") ||
        (link.classList.contains("linkAnnotation") ? link : null);
      const isAnnot =
        section !== null ||
        link.getAttribute("href") === "#" ||
        link.hasAttribute("data-element-id") ||
        link.closest(".annotationLayer") !== null;

      if (!isAnnot) return;

      // Prevent native anchor navigation and Next.js router from hijacking click
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const annotId =
        link.getAttribute("data-element-id") ||
        section?.getAttribute("data-annotation-id") ||
        link.getAttribute("data-annotation-id");

      let yearKey = "";
      if (yearbookViewerPath) {
        const match = yearbookViewerPath.match(/(2k\d+|Yearbook_2k\d+)/i);
        if (match) yearKey = match[1];
      }

      let targetPage = null;

      // 1. Fast lookup from precomputed JSON mapping (0ms instantaneous jump)
      if (yearKey && annotId && yearbookAnnotations[yearKey]) {
        targetPage = yearbookAnnotations[yearKey][annotId];
      }

      // 2. Dynamic fallback using PDFDocumentProxy
      if (!targetPage && pdfDocRef.current) {
        try {
          const pageDiv = link.closest(".react-pdf__Page");
          const pageNum = pageDiv
            ? parseInt(pageDiv.getAttribute("data-page-number"), 10)
            : currentPage + 1;
          const pageObj = await pdfDocRef.current.getPage(pageNum);
          const annotations = await pageObj.getAnnotations();
          const annot = annotations.find((a) => a.id === annotId);
          if (annot) {
            if (annot.url) {
              window.open(annot.url, "_blank", "noopener,noreferrer");
              return;
            }
            let dest = annot.dest;
            if (typeof dest === "string") {
              dest = await pdfDocRef.current.getDestination(dest);
            }
            if (Array.isArray(dest)) {
              const destRef = dest[0];
              if (typeof destRef === "object" && destRef !== null) {
                const pageIdx = await pdfDocRef.current.getPageIndex(destRef);
                targetPage = pageIdx + 1;
              } else if (typeof destRef === "number") {
                targetPage = destRef + 1;
              }
            }
          }
        } catch (err) {
          console.error("[Flipbook] Error resolving annotation link:", err);
        }
      }

      if (targetPage && targetPage >= 1) {
        goToPage(targetPage);
      }
    };

    container.addEventListener("click", handleAnnotationClick, true);
    return () => {
      container.removeEventListener("click", handleAnnotationClick, true);
    };
  }, [yearbookViewerPath, numPages, currentPage, goToPage]);

  const desktopPages = useMemo(() => {
    if (!numPages) return [];
    const pageWidth = 480;
    const pageHeight = 680;
    const pages = [];
    for (let i = 1; i <= numPages; i++) {
      pages.push(
        <FlipBookPage key={i} pageWidth={pageWidth} pageHeight={pageHeight}>
          <DynamicPageContent
            pageNumber={i}
            pageWidth={pageWidth}
            pageHeight={pageHeight}
          />
        </FlipBookPage>
      );
    }
    return pages;
  }, [numPages]);

  const mobilePages = useMemo(() => {
    if (!numPages) return [];
    const pageWidth = 300;
    const pageHeight = 420;
    const pages = [];
    for (let i = 1; i <= numPages; i++) {
      pages.push(
        <FlipBookPage key={i} pageWidth={pageWidth} pageHeight={pageHeight}>
          <DynamicPageContent
            pageNumber={i}
            pageWidth={pageWidth}
            pageHeight={pageHeight}
          />
        </FlipBookPage>
      );
    }
    return pages;
  }, [numPages]);

  return (
    <Box
      ref={containerRef}
      className="flipbook-container"
      sx={{
        backgroundColor: "#1D141A",
        minHeight: "calc(100vh - 30px)",
        padding: isMobile ? "20px 10px" : "20px",
        marginTop: "37px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Document
        file={yearbookViewerPath}
        onLoadSuccess={onDocumentLoadSuccess}
        onItemClick={handleItemClick}
        loading={
          <Box
            sx={{ color: "#EAEAEA", textAlign: "center", paddingTop: "50vh" }}
          >
            <Typography variant="h6">Loading PDF...</Typography>
          </Box>
        }
      >
        <FlipbookPageContext.Provider
          value={{ currentPage, isMobile, numPages }}
        >
          {/* Desktop Layout */}
          {!isMobile && (
            <div
              style={{
                position: "relative",
                width: "100%",
                margin: "0 auto",
                minHeight: "calc(100vh - 40px)",
              }}
            >
              {/* Left Navigation Button */}
              <IconButton
                onClick={goToPreviousPage}
                disabled={currentPage === 0}
                sx={{
                  position: "absolute",
                  left: "20px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 10,
                  color: "#dbc8d5",
                  backgroundColor: "#52424d",
                  border: "2px solid #b9a6b2",
                  width: 60,
                  height: 60,
                  "&:hover": {
                    backgroundColor: "#40383e",
                    transform: "translateY(-50%) scale(1.05)",
                  },
                  "&:disabled": {
                    color: "#52424d",
                    backgroundColor: "#2e262c",
                  },
                  transition: "all 0.3s ease",
                }}
              >
                <ChevronLeft sx={{ fontSize: 32 }} />
              </IconButton>
              <div
                style={{
                  position: "relative",
                  height: "100%",
                  paddingTop: "calc(50vh - 420px)",
                }}
              >
                <HTMLFlipBook
                  ref={flipBookRef}
                  width={480}
                  height={680}
                  minWidth={240}
                  maxWidth={480}
                  size="fixed"
                  flippingTime={450}
                  usePortrait={true}
                  showCover={true}
                  clickEventForward={true}
                  onFlip={onFlip}
                  style={{
                    borderRadius: "10px",
                    margin: "0 auto",
                  }}
                >
                  {desktopPages}
                </HTMLFlipBook>

              {/* Page Number Display */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  mt: 6,
                  gap: 2,
                }}
              >
                {/* Download Page Button */}
                <Tooltip title="Download Current Page" arrow>
                  <span>
                    <button className="button" onClick={downloadCurrentPage}>
                      <span className="svg">
                        <FileDownloadOutlined
                          sx={{ color: "white", width: "24px", height: "24px" }}
                        />
                      </span>
                      <span className="text">Current Page</span>
                    </button>
                  </span>
                </Tooltip>

                <Box
                  onClick={handlePageDisplayClick}
                  sx={{
                    backgroundColor: "#52424d11",
                    backdropFilter: "blur(20px)",
                    borderRadius: "20px",
                    padding: "12px 24px",
                    border: "1px solid #40383e",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "pointer",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      backgroundColor: "rgba(40, 30, 35, 0.95)",
                      boxShadow: "0 12px 40px rgba(0, 0, 0, 0.5)",
                      border: "1px solid #83727f",
                    },
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {isEditingPage ? (
                    <Box
                      component="form"
                      onSubmit={handlePageInputSubmit}
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      <TextField
                        value={pageInput}
                        onChange={handlePageInputChange}
                        onBlur={handlePageInputBlur}
                        onKeyDown={handlePageInputKeyDown}
                        type="number"
                        size="small"
                        autoFocus
                        inputProps={{
                          min: 1,
                          max: numPages || 1,
                          style: {
                            color: "#EAEAEA",
                            textAlign: "center",
                            width: "60px",
                            fontWeight: 700,
                            fontSize: "16px",
                            padding: "4px 8px",
                          },
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            height: "32px",
                            backgroundColor: "transparent",
                            borderRadius: "8px",
                            "& fieldset": {
                              borderColor: "rgba(255, 255, 255, 0.3)",
                              borderWidth: "1px",
                            },
                            "&:hover fieldset": {
                              borderColor: "rgba(255, 255, 255, 0.5)",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "#EAEAEA",
                              borderWidth: "2px",
                            },
                          },
                        }}
                      />
                      <Typography
                        sx={{
                          color: "#EAEAEA",
                          fontWeight: 700,
                          fontSize: "16px",
                          letterSpacing: "0.5px",
                        }}
                      >
                        of {numPages || 0}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography
                      variant="h6"
                      sx={{
                        color: "#EAEAEA",
                        fontWeight: 700,
                        textAlign: "center",
                        fontSize: "16px",
                        letterSpacing: "0.5px",
                        textShadow: "0 2px 8px rgba(0, 0, 0, 0.5)",
                        userSelect: "none",
                      }}
                    >
                      {isMobile
                        ? `Page ${currentPage + 1} of ${numPages || 0}`
                        : currentPage === 0
                        ? `Page 1 of ${numPages || 0}`
                        : `Pages ${currentPage + 1}-${Math.min(
                            currentPage + 2,
                            numPages || 0
                          )} of ${numPages || 0}`}
                    </Typography>
                  )}
                </Box>

                {/* Download PDF Button */}
                <Tooltip title="Download Full PDF" arrow>
                  <span>
                    <button className="button" onClick={downloadPdf}>
                      <span className="svg">
                        <FileDownload
                          sx={{ color: "white", width: "24px", height: "24px" }}
                        />
                      </span>
                      <span className="text">Full PDF</span>
                    </button>
                  </span>
                </Tooltip>
              </Box>
            </div>
            {/* </div> */}

            {/* Right Navigation Button */}
            <IconButton
              onClick={goToNextPage}
              disabled={!numPages || currentPage >= numPages - 1}
              sx={{
                position: "absolute",
                right: "20px",
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
                color: "#dbc8d5",
                backgroundColor: "#52424d",
                border: "2px solid #b9a6b2",
                width: 60,
                height: 60,
                "&:hover": {
                  backgroundColor: "#40383e",
                  transform: "translateY(-50%) scale(1.05)",
                },
                "&:disabled": {
                  color: "#52424d",
                  backgroundColor: "#2e262c",
                },
                transition: "all 0.3s ease",
              }}
            >
              <ChevronRight sx={{ fontSize: 32 }} />
            </IconButton>
          </div>
        )}

        {/* Mobile Layout */}
        {isMobile && (
          <div
            style={{
              width: "100%",
              textAlign: "center",
              paddingTop: "calc(50vh - 300px)",
            }}
          >
            <div style={{ display: "inline-block" }}>
              <HTMLFlipBook
                ref={flipBookRef}
                width={300}
                height={420}
                minWidth={200}
                maxWidth={300}
                size="fixed"
                flippingTime={450}
                usePortrait={true}
                showCover={true}
                clickEventForward={true}
                mobileScrollSupport={true}
                onFlip={onFlip}
                style={{
                  borderRadius: "8px",
                }}
              >
                {mobilePages}
              </HTMLFlipBook>
            </div>

            {/* Mobile Navigation and Page Number */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                mt: 3,
                width: "100%",
              }}
            >
              <IconButton
                onClick={goToPreviousPage}
                disabled={currentPage === 0}
                sx={{
                  color: "#dbc8d5",
                  backgroundColor: "#52424d",
                  border: "2px solid #b9a6b2",
                  width: 50,
                  height: 50,
                  "&:hover": {
                    backgroundColor: "#40383e",
                  },
                  "&:disabled": {
                    color: "#52424d",
                    backgroundColor: "#2e262c",
                  },
                }}
              >
                <NavigateBefore />
              </IconButton>

              <Box
                onClick={handlePageDisplayClick}
                sx={{
                  backgroundColor: "#52424d11",
                  backdropFilter: "blur(20px)",
                  borderRadius: "20px",
                  padding: "12px 24px",
                  border: "1px solid #40383e",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  cursor: "pointer",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    backgroundColor: "rgba(40, 30, 35, 0.95)",
                    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.5)",
                    border: "1px solid #83727f",
                  },
                }}
              >
                {isEditingPage ? (
                  <Box
                    component="form"
                    onSubmit={handlePageInputSubmit}
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <TextField
                      value={pageInput}
                      onChange={handlePageInputChange}
                      onBlur={handlePageInputBlur}
                      onKeyDown={handlePageInputKeyDown}
                      type="number"
                      size="small"
                      autoFocus
                      inputProps={{
                        min: 1,
                        max: numPages || 1,
                        style: {
                          color: "#EAEAEA",
                          textAlign: "center",
                          width: "40px",
                          fontWeight: 700,
                          fontSize: "16px",
                          padding: "4px 8px",
                        },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: "32px",
                          backgroundColor: "transparent",
                          borderRadius: "8px",
                          "& fieldset": {
                            borderColor: "rgba(255, 255, 255, 0.3)",
                            borderWidth: "1px",
                          },
                          "&:hover fieldset": {
                            borderColor: "rgba(255, 255, 255, 0.5)",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "#EAEAEA",
                            borderWidth: "2px",
                          },
                        },
                      }}
                    />
                    <Typography
                      sx={{
                        color: "#EAEAEA",
                        fontWeight: 700,
                        fontSize: "16px",
                        letterSpacing: "0.5px",
                      }}
                    >
                      / {numPages || 0}
                    </Typography>
                  </Box>
                ) : (
                  <Typography
                    variant="h6"
                    sx={{
                      color: "#EAEAEA",
                      fontWeight: 700,
                      textAlign: "center",
                      fontSize: "16px",
                      letterSpacing: "0.5px",
                      textShadow: "0 2px 8px rgba(0, 0, 0, 0.5)",
                      userSelect: "none",
                    }}
                  >
                    {currentPage + 1} / {numPages || 0}
                  </Typography>
                )}
              </Box>

              <IconButton
                onClick={goToNextPage}
                disabled={!numPages || currentPage >= numPages - 1}
                sx={{
                  color: "#dbc8d5",
                  backgroundColor: "#52424d",
                  border: "2px solid #b9a6b2",
                  width: 50,
                  height: 50,
                  "&:hover": {
                    backgroundColor: "#40383e",
                  },
                  "&:disabled": {
                    color: "#52424d",
                    backgroundColor: "#2e262c",
                  },
                }}
              >
                <NavigateNext />
              </IconButton>
            </Box>

            {/* Download Buttons for Mobile */}
            <Box
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                marginTop: "24px",
                gap: 2,
              }}
            >
              {/* Download Page Button */}
              <Tooltip title="Download Current Page" arrow>
                <span>
                  <button className="button" onClick={downloadCurrentPage}>
                    <span className="svg">
                      <FileDownloadOutlined
                        sx={{ color: "white", width: "24px", height: "24px" }}
                      />
                    </span>
                    <span className="text">Current Page</span>
                  </button>
                </span>
              </Tooltip>

              {/* Download PDF Button */}
              <Tooltip title="Download Full PDF" arrow>
                <span>
                  <button className="button" onClick={downloadPdf}>
                    <span className="svg">
                      <FileDownload
                        sx={{ color: "white", width: "24px", height: "24px" }}
                      />
                    </span>
                    <span className="text">Full PDF</span>
                  </button>
                </span>
              </Tooltip>
            </Box>
          </div>
        )}
        </FlipbookPageContext.Provider>
      </Document>
    </Box>
  );
}

export default Flipbook;
