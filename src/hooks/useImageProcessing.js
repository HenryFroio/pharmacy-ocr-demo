// src/hooks/useImageProcessing.js
import { useState } from 'react';

export const useImageProcessing = (AZURE_ENDPOINT, AZURE_API_KEY) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const processImage = async (file) => {
    setIsProcessing(true);
    try {
      const base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });

      const apiUrl = `${AZURE_ENDPOINT}computervision/imageanalysis:analyze?api-version=2024-02-01&features=caption,read&model-version=latest&language=en`;
      
      const binaryString = window.atob(base64Image);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Ocp-Apim-Subscription-Key': AZURE_API_KEY
        },
        body: bytes
      });

      if (!response.ok) {
        throw new Error(`Falha na análise: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      
      if (responseData.readResult?.blocks?.[0]?.lines) {
        const lines = responseData.readResult.blocks[0].lines;
        const extractedText = lines.map(line => line.text).join('\n');
        return extractedText;
      }
      return '';
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return { processImage, isProcessing };
};