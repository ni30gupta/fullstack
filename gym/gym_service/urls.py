"""
URL configuration for gym_service project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('user.urls')),
    path('api/', include('gym.urls')),
]

# Serve uploaded media files in development (DEBUG=True only)
# In production, a proper web server (nginx/S3) would handle /media/ instead
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
