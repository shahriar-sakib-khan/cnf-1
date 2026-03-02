import { Modal, Button, Text, Icon } from '@gravity-ui/uikit';
import { ArrowDownToLine, Xmark } from '@gravity-ui/icons';

interface ReceiptViewModalProps {
  url: string | null;
  onClose: () => void;
}

export default function ReceiptViewModal({ url, onClose }: ReceiptViewModalProps) {
  if (!url) return null;

  const isPdf = url.toLowerCase().endsWith('.pdf') || url.includes('/pdf/');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = url.split('/').pop() || 'receipt';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal open={!!url} onClose={onClose}>
      <div className="flex flex-col w-[800px] max-w-[95vw] bg-[var(--g-color-base-background)] rounded-2xl overflow-hidden shadow-2xl h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--g-color-line-generic)] bg-[var(--g-color-base-generic)]">
          <div className="flex items-center gap-2">
            <Text variant="header-1">Receipt Preview</Text>
          </div>
          <div className="flex items-center gap-2">
            <Button view="action" size="l" onClick={handleDownload} title="Download File">
              <Icon data={ArrowDownToLine} size={16} className="mr-2" />
              Download
            </Button>
            <Button view="flat-secondary" size="l" onClick={onClose} title="Close">
              <Icon data={Xmark} size={20} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-gray-100/50 p-4 overflow-auto flex items-center justify-center">
          {isPdf ? (
            <iframe
              src={`${url}#toolbar=0&navpanes=0&scrollbar=0`}
              className="w-full h-full border-none rounded-lg shadow-sm bg-white"
              title="Receipt PDF"
            />
          ) : (
            <img
              src={url}
              alt="Receipt"
              className="max-w-full max-h-full object-contain cursor-zoom-in rounded-lg shadow-md"
              onClick={() => window.open(url, '_blank')}
            />
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-[var(--g-color-line-generic)] flex justify-center">
           <Text color="secondary" variant="caption-1">
             {isPdf ? 'PDF Document View' : 'Image View — Click to open original in new tab'}
           </Text>
        </div>
      </div>
    </Modal>
  );
}
