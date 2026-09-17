import React, { useEffect, useState, useRef } from 'react';
import { Modal, Spin, Select } from 'antd';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface BarcodeScannerModalProps {
  open: boolean;
  onCancel: () => void;
  onScan: (decodedText: string) => void;
}

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ open, onCancel, onScan }) => {
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null);
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const isProcessing = useRef(false);

  useEffect(() => {
    if (open) {
      setError('');
      Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length) {
          setCameras(devices);
          // Auto select the first back camera if available, else first camera
          const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('sau'));
          const initialCameraId = backCamera ? backCamera.id : devices[0].id;
          setSelectedCamera(initialCameraId);
        } else {
          setError('Không tìm thấy camera nào trên thiết bị của bạn.');
        }
      }).catch(err => {
        setError(`Lỗi truy cập camera: ${err.message || err}`);
      });
    } else {
      stopScanning();
    }
    
    return () => {
      stopScanning();
    };
  }, [open]);

  useEffect(() => {
    if (open && selectedCamera && !scanning) {
      startScanning(selectedCamera);
    }
  }, [selectedCamera, open]);

  const startScanning = async (cameraId: string) => {
    try {
      if (html5QrCode) {
        await stopScanning();
      }
      
      const newScanner = new Html5Qrcode("reader", {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.ITF
        ],
        useBarCodeDetectorIfSupported: true,
        verbose: false
      });
      setHtml5QrCode(newScanner);
      setScanning(true);
      
      isProcessing.current = false;
      await newScanner.start(
        cameraId,
        {
          fps: 15, // Tăng fps lên 15 để nhận diện nhanh hơn
          qrbox: { width: 300, height: 120 }, // Chỉnh khung quét dài hơn, hẹp hơn phù hợp với mã vạch 1D
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Success callback
          // Prevent multiple fires
          if (!isProcessing.current) {
            isProcessing.current = true;
            newScanner.stop().then(() => {
              setScanning(false);
              onScan(decodedText);
              onCancel();
            }).catch(() => {
              // Fallback
              setScanning(false);
              onScan(decodedText);
              onCancel();
            });
          }
        },
        () => {
          // Ignore parse errors as they just mean no barcode is currently in view
        }
      );
    } catch (err: any) {
      setScanning(false);
      setError(`Không thể bắt đầu camera: ${err.message || err}`);
    }
  };

  const stopScanning = async () => {
    if (html5QrCode && html5QrCode.isScanning) {
      try {
        await html5QrCode.stop();
        html5QrCode.clear();
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
    setScanning(false);
    setHtml5QrCode(null);
  };

  const handleCancel = async () => {
    await stopScanning();
    onCancel();
  };

  const handleCameraChange = (value: string) => {
    setSelectedCamera(value);
  };

  return (
    <Modal
      title="Quét Mã Vạch"
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
      width={400}
    >
      <div className="flex flex-col items-center">
        {error ? (
          <div className="text-red-500 mb-4 p-4 bg-red-50 rounded-md text-center">{error}</div>
        ) : (
          <>
            {cameras.length > 1 && (
              <Select 
                className="w-full mb-4" 
                value={selectedCamera} 
                onChange={handleCameraChange}
                options={cameras.map(c => ({ value: c.id, label: c.label || `Camera ${c.id.substring(0, 5)}` }))}
              />
            )}
            
            <div className="w-full relative bg-black rounded-lg overflow-hidden flex items-center justify-center min-h-[250px]">
              <div id="reader" className="w-full" />
              {!scanning && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Spin size="large" />
                </div>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-4 text-center">
              Hướng camera về phía mã vạch để quét. Hãy đảm bảo cung cấp đủ ánh sáng.
            </p>
          </>
        )}
      </div>
    </Modal>
  );
};

export default BarcodeScannerModal;
