export async function fileToBase64(file: File): Promise<{ mimeType: string; data: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [prefix, base64Data] = result.split(',');
      const mimeTypeMatch = prefix.match(/:(.*?);/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : file.type;
      resolve({ mimeType, data: base64Data });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function translateText(text: string, fileData?: { mimeType: string; data: string }): Promise<string> {
  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      file: fileData,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Terjadi kesalahan pada server');
  }

  const data = await response.json();
  return data.result;
}
