import { useCallback, useEffect, useRef, useState } from "react";
import { message as antdMessage } from "antd";
import { Html5Qrcode } from "html5-qrcode";
import GIcon from "@/components/GIcon";
import {
  scanCompleteOrder,
  manualCompleteOrder,
} from "@/services/order.service";
import "@/styles/canteenOrders.css";

function formatVND(amount) {
  if (!amount) return "—";
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}

export default function QRScanScreen() {
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null); // { type: 'success' | 'error' | 'info', title, order, message }
  const [manualCode, setManualCode] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const scannerRef = useRef(null);
  const scannerContainerId = "co-qr-reader";
  const isProcessingRef = useRef(false);

  // Start camera scanner
  const startScanner = useCallback(async () => {
    setResult(null);
    isProcessingRef.current = false;

    try {
      const html5Qr = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5Qr;

      await html5Qr.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.333,
        },
        async (decodedText) => {
          // Prevent multiple scans while processing
          if (isProcessingRef.current) return;
          isProcessingRef.current = true;
          setProcessing(true);

          try {
            await handleQRScanned(decodedText);
          } finally {
            setProcessing(false);
            // Allow next scan after a delay
            setTimeout(() => {
              isProcessingRef.current = false;
            }, 3000);
          }
        },
        () => {
          // QR scan error (no code found) — ignore
        },
      );

      setScanning(true);
    } catch (err) {
      console.error("Camera error:", err);
      antdMessage.error(
        "Không thể mở camera. Vui lòng kiểm tra quyền truy cập.",
      );
    }
  }, []);

  // Stop camera scanner
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error("Stop scanner error:", err);
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Handle QR scanned result
  const handleQRScanned = async (qrToken) => {
    try {
      const res = await scanCompleteOrder(qrToken);
      const order = res?.data?.order;
      setResult({
        type: "success",
        title: res?.message || "Xác nhận trả hàng thành công",
        order,
      });
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || "Có lỗi xảy ra";

      if (status === 409) {
        setResult({
          type: "info",
          title: "Đã xử lý",
          message: msg,
        });
      } else {
        setResult({
          type: "error",
          title: "Thất bại",
          message: msg,
        });
      }
    }
  };

  // Handle manual submit
  const handleManualSubmit = async () => {
    let code = manualCode.trim();
    if (code.startsWith("#")) {
      code = code.substring(1).trim();
    }

    if (!code) {
      antdMessage.warning("Vui lòng nhập mã đơn hàng");
      return;
    }

    setManualLoading(true);
    setResult(null);

    try {
      const res = await manualCompleteOrder(code);
      const order = res?.data?.order;
      setResult({
        type: "success",
        title: res?.message || "Xác nhận trả hàng thành công",
        order,
      });
      setManualCode("");
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || "Có lỗi xảy ra";

      if (status === 409) {
        setResult({
          type: "info",
          title: "Đã xử lý",
          message: msg,
        });
      } else {
        setResult({
          type: "error",
          title: "Thất bại",
          message: msg,
        });
      }
    } finally {
      setManualLoading(false);
    }
  };

  const handleManualKeyDown = (e) => {
    if (e.key === "Enter") handleManualSubmit();
  };

  const clearResult = () => {
    setResult(null);
    isProcessingRef.current = false;
  };

  return (
    <div className="co-qr-page">
      {/* Header */}
      <div className="co-qr-header">
        <div className="co-qr-header__title">
          <GIcon name="qr_code_scanner" />
          Quét mã QR nhận hàng
        </div>
        <div className="co-qr-header__sub">
          Quét mã QR trên đơn hàng hoặc nhập mã đơn để xác nhận trả hàng cho
          sinh viên
        </div>
      </div>

      {/* Camera Scanner */}
      <div className="co-qr-scanner">
        <div
          id={scannerContainerId}
          style={{ width: "100%", height: "100%" }}
        />

        {!scanning && (
          <div className="co-qr-scanner__overlay">
            <div className="co-qr-placeholder">
              <div className="co-qr-placeholder__icon">
                <GIcon name="photo_camera" />
              </div>
              <div>Nhấn để bật camera quét QR</div>
              <button className="co-qr-btn-camera" onClick={startScanner}>
                <GIcon name="videocam" />
                Bật Camera
              </button>
            </div>
          </div>
        )}

        {scanning && (
          <div
            style={{
              position: "absolute",
              bottom: 16,
              left: 0,
              right: 0,
              textAlign: "center",
            }}
          >
            <button
              className="co-qr-btn-camera"
              onClick={stopScanner}
              style={{ background: "#dc2626" }}
            >
              <GIcon name="videocam_off" />
              Tắt Camera
            </button>
          </div>
        )}

        {processing && (
          <div className="co-loading-overlay">
            <div>
              <span className="co-spinner" style={{ width: 32, height: 32 }} />
              <div className="co-loading-overlay__text">Đang xử lý...</div>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="co-divider">hoặc</div>

      {/* Manual Input */}
      <div className="co-manual-input">
        <input
          className="co-manual-input__field"
          placeholder="Nhập mã đơn hàng: ORD-XXXXXXXX-XXXXXX"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value.toUpperCase())}
          onKeyDown={handleManualKeyDown}
        />
        <button
          className="co-manual-input__btn"
          disabled={manualLoading || !manualCode.trim()}
          onClick={handleManualSubmit}
        >
          {manualLoading ? (
            <span className="co-spinner" />
          ) : (
            <GIcon name="search" />
          )}
          Xác nhận
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className={`co-result co-result--${result.type}`}>
          <div className="co-result__header">
            <div className={`co-result__icon co-result__icon--${result.type}`}>
              <GIcon
                name={
                  result.type === "success"
                    ? "check_circle"
                    : result.type === "error"
                      ? "error"
                      : "info"
                }
              />
            </div>
            <div className="co-result__title">{result.title}</div>
          </div>

          <div className="co-result__body">
            {result.order && (
              <>
                <div className="co-result__row">
                  <span className="co-result__label">Mã đơn</span>
                  <span className="co-result__value">
                    #{result.order.orderNumber}
                  </span>
                </div>
                {result.order.userId?.fullName && (
                  <div className="co-result__row">
                    <span className="co-result__label">Khách hàng</span>
                    <span className="co-result__value">
                      {result.order.userId.fullName}
                    </span>
                  </div>
                )}
                {result.order.totalAmount && (
                  <div className="co-result__row">
                    <span className="co-result__label">Tổng tiền</span>
                    <span className="co-result__value">
                      {formatVND(result.order.totalAmount)}
                    </span>
                  </div>
                )}
                <div className="co-result__row">
                  <span className="co-result__label">Trạng thái</span>
                  <span className="co-result__value">
                    {result.order.status === "completed"
                      ? "✅ Đã hoàn thành"
                      : result.order.status}
                  </span>
                </div>
              </>
            )}
            {result.message && !result.order && (
              <div style={{ fontSize: 14 }}>{result.message}</div>
            )}
          </div>

          <button className="co-result__dismiss" onClick={clearResult}>
            Đóng & Quét tiếp
          </button>
        </div>
      )}
    </div>
  );
}
