
interface useBase64CompressionReturn {
  compressedData: string | null,
  compressedFileSize: number | null,
  originalFileSize: number | null
}

const useBase64Compression = () => {


  const compressBase64 = (base64String: string): Promise<useBase64CompressionReturn> => {

    const fileSizeInMegabytes = base64String.length * 0.000001; // Estimate file size in megabytes (1 char ≈ 0.000001 MB in base64)

    return new Promise((resolve) => {
      try {
        const img = new Image();
        img.onerror = () => {
          resolve({
            compressedData: null,
            compressedFileSize : null,
            originalFileSize: fileSizeInMegabytes
          });
        }
        img.onload = () => {
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Get the compressed image as a base64-encoded string
          const quality = calculateQuality(fileSizeInMegabytes);
          
          canvas.width = img.width;
          canvas.height = img.height;

          ctx?.drawImage(img, 0, 0, img.width, img.height);

          // Convert the compressed image to base64
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          
          const compressedFileSize = compressedBase64?.length * 0.000001;

          resolve({
            compressedData: compressedBase64,
            compressedFileSize,
            originalFileSize: fileSizeInMegabytes
          });
          
          return {
            compressedData: compressedBase64,
            compressedFileSize,
            originalFileSize: fileSizeInMegabytes
          }
        };

        img.src = base64String;

      } catch (error) {

      

        const fileSizeInMegabytes = base64String.length * 0.000001;

        resolve({
          compressedData: null,
          compressedFileSize: null,
          originalFileSize: fileSizeInMegabytes
        });

      }
    });
  };

  const calculateQuality = (fileSizeInMegabytes: number) => {
    if (fileSizeInMegabytes > 5 && fileSizeInMegabytes <= 20) {
      return 0.3;
    } else if (fileSizeInMegabytes > 1 && fileSizeInMegabytes <= 5) {
      return 0.5;
    } else {
      return 0.9; // Default quality
    }
  };

  return {
    compressBase64
  };
};

export default useBase64Compression;