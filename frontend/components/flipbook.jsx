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
} from "@mui/material";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "../styles/flipbook.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

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

function Flipbook(props) {
  const { yearbookViewerPath, yearbookDownloadPath, page } = props;
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageInput, setPageInput] = useState("1");
  const [isEditingPage, setIsEditingPage] = useState(false);
  const flipBookRef = useRef();

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

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  const onFlip = useCallback((e) => {
    setCurrentPage(e.data);
    setPageInput(String(e.data + 1));
  }, []);

  const goToPage = useCallback(
    (pageNum) => {
      if (flipBookRef.current && pageNum >= 1 && pageNum <= numPages) {
        // react-pageflip uses 0-based indexing, so subtract 1
        flipBookRef.current.pageFlip().turnToPage(pageNum - 1);
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

  // Memoize canvas props to avoid recreation
  const canvasProps = useMemo(
    () => ({
      style: {
        maxWidth: "100%",
        height: "auto",
      },
    }),
    []
  );

  // Only render pages that are visible or nearby for performance
  const shouldRenderPage = useCallback(
    (pageIndex) => {
      if (!numPages) return false;
      // Render only a few neighboring pages for better performance
      const range = 5;
      return Math.abs(pageIndex - currentPage) <= range;
    },
    [currentPage, numPages]
  );

  function pagesList() {
    if (!numPages) return [];

    const pageWidth = isMobile ? 300 : 480;
    const pageHeight = isMobile ? 420 : 680;

    var pages = [];
    for (var i = 1; i <= numPages; i++) {
      pages.push(
        <FlipBookPage key={i} pageWidth={pageWidth} pageHeight={pageHeight}>
          {shouldRenderPage(i - 1) ? (
            <Page
              width={pageWidth}
              pageNumber={i}
              renderMode="canvas"
              loading={
                <div
                  style={{
                    ...pageStyles,
                    width: pageWidth,
                    height: pageHeight,
                  }}
                >
                  Loading page {i}...
                </div>
              }
              error={
                <div
                  style={{
                    ...pageStyles,
                    width: pageWidth,
                    height: pageHeight,
                  }}
                >
                  Failed to load page {i}
                </div>
              }
              canvasProps={canvasProps}
            />
          ) : (
            <div
              style={{
                ...pageStyles,
                width: pageWidth,
                height: pageHeight,
              }}
            >
              Page {i}
            </div>
          )}
        </FlipBookPage>
      );
    }
    return pages;
  }

  return (
    <Box
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
        loading={
          <Box
            sx={{ color: "#EAEAEA", textAlign: "center", paddingTop: "50vh" }}
          >
            <Typography variant="h6">Loading PDF...</Typography>
          </Box>
        }
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
                flippingTime={600}
                usePortrait={true}
                showCover={true}
                onFlip={onFlip}
                style={{
                  borderRadius: "10px",
                  margin: "0 auto",
                }}
              >
                {pagesList()}
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
                flippingTime={600}
                usePortrait={true}
                showCover={true}
                mobileScrollSupport={true}
                onFlip={onFlip}
                style={{
                  borderRadius: "8px",
                }}
              >
                {pagesList()}
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
      </Document>
    </Box>
  );
}

export default Flipbook;
