import React, { useEffect, useState, useCallback } from 'react';
import QRCode from 'qrcode';
import { useShop } from '../contexts/ShopContext';

interface QRCodeDisplayProps {
  fullscreen?: boolean;
  onClose?: () => void;
}

export function QRCodeDisplay({ fullscreen = false, onClose }: QRCodeDisplayProps) {
  const { shop, customer } = useShop();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Générer le QR code
  useEffect(() => {
    async function generateQR() {
      if (!customer || !shop) {
        setIsLoading(false);
        return;
      }

      try {
        // Encoder customer_id et shop_id en JSON base64
        const qrData = JSON.stringify({
          customer_id: customer.id,
          shop_id: shop.id
        });

        const dataUrl = await QRCode.toDataURL(qrData, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          },
          errorCorrectionLevel: 'M'
        });

        setQrDataUrl(dataUrl);
      } catch (error) {
        console.error('Erreur génération QR:', error);
      } finally {
        setIsLoading(false);
      }
    }

    generateQR();
  }, [customer, shop]);

  const handleClick = useCallback(() => {
    if (fullscreen && onClose) {
      onClose();
    }
  }, [fullscreen, onClose]);

  // Mode plein écran
  if (fullscreen) {
    return (
      <div
        className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center cursor-pointer"
        onClick={handleClick}
      >
        {/* Bouton retour discret */}
        <div className="absolute top-4 right-4 safe-top">
          <button
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            aria-label="Fermer"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenu */}
        <div className="flex flex-col items-center px-6">
          {isLoading ? (
            <div className="w-64 h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
              <span className="text-gray-400">Génération du QR...</span>
            </div>
          ) : qrDataUrl ? (
            <>
              <img
                src={qrDataUrl}
                alt="QR Code"
                className="w-64 h-64 md:w-80 md:h-80 object-contain"
              />
              <p className="mt-6 text-gray-800 font-medium text-lg">
                {customer?.first_name || customer?.last_name
                  ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
                  : 'Présentez ce QR code'}
              </p>
              <p className="mt-2 text-gray-500 text-sm">
                Appuyez pour fermer
              </p>
            </>
          ) : (
            <div className="text-center text-gray-400">
              <p>QR code non disponible</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Mode inline (bouton)
  return (
    <div className="w-full">
      {isLoading ? (
        <div className="w-full aspect-square bg-dark-100 rounded-xl animate-pulse flex items-center justify-center">
          <span className="text-gray-500 text-sm">Chargement...</span>
        </div>
      ) : qrDataUrl ? (
        <div className="w-full aspect-square bg-white rounded-xl p-4 flex items-center justify-center">
          <img
            src={qrDataUrl}
            alt="QR Code"
            className="w-full h-full object-contain"
          />
        </div>
      ) : (
        <div className="w-full aspect-square bg-dark-100 rounded-xl flex items-center justify-center">
          <span className="text-gray-500 text-sm">Non disponible</span>
        </div>
      )}
    </div>
  );
}
