import { axiosAuth } from './axios';

export async function uploadToCloudinary(
  file: File,
  folder: string = 'tramhon_uploads'
): Promise<string> {
  
  const { data: signData } = await axiosAuth.post('/sign-cloudinary-upload/', { folder });
  console.log("Dữ liệu Backend trả về:", signData);

  const url = `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`;
  const formData = new FormData();
  
  formData.append('file', file);
  formData.append('api_key', signData.apiKey);
  formData.append('timestamp', signData.timestamp.toString());
  formData.append('signature', signData.signature);
  formData.append('folder', signData.folder);


  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cloudinary API Error:', errorData);
      throw new Error(`Cloudinary upload failed: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.secure_url;

  } catch (err) {
    console.error('Lỗi khi gọi Cloudinary:', err);
    throw new Error('Không thể kết nối hoặc upload lên Cloudinary.');
  }
}