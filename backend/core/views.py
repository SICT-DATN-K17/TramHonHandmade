import os
import time
import cloudinary.utils
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

class SignatureAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        api_secret = os.getenv('CLOUDINARY_API_SECRET')
        api_key = os.getenv('CLOUDINARY_API_KEY')
        cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')

        if not all([api_secret, api_key, cloud_name]):
            return Response(
                {'error': 'Thiếu cấu hình biến môi trường Cloudinary (Secret, Key, Cloud Name).'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        timestamp = int(time.time())
        
        folder = request.data.get('folder', 'tramhon_uploads')

        params_to_sign = {
            'timestamp': timestamp,
            'folder': folder
        }

        try:
            signature = cloudinary.utils.api_sign_request(params_to_sign, api_secret)
        except Exception as e:
            return Response({'error': f'Lỗi tạo chữ ký: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'signature': signature,
            'api_key': api_key,
            'cloud_name': cloud_name,
            'timestamp': timestamp,
            'folder': folder
        }, status=status.HTTP_200_OK)