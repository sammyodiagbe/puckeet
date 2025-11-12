# 📱 QR Code Receipt Upload - User Guide

## Overview

The QR Code upload feature allows users to easily upload receipts from their mobile phones by scanning a QR code displayed on their desktop/laptop. No app installation required!

---

## ✨ Features

- **🔒 Secure Sessions**: 15-minute temporary sessions with unique tokens
- **📸 Camera & Gallery**: Upload from phone camera or photo gallery
- **🔄 Real-time Sync**: Desktop shows uploads instantly (2-second polling)
- **🤖 Auto OCR**: AI extracts receipt data automatically
- **📊 Upload Tracking**: See receipt count and processing status
- **🔐 Auto Cleanup**: Sessions are destroyed when QR dialog is closed
- **⏱️ Time Limits**: 10 receipts max per session, 15-minute expiry

---

## 🚀 How It Works

### Desktop Flow:
1. Go to Receipts page
2. Click "Upload from Phone" button
3. QR code appears in a dialog
4. Keep dialog open while uploading
5. See receipts appear in real-time
6. Click "Done" when finished

### Mobile Flow:
1. Open phone camera app
2. Point at QR code on desktop
3. Tap notification to open upload page
4. Choose "Take Photo" or "From Gallery"
5. Upload multiple receipts
6. Watch processing status

---

## 🌐 Setting Up for Mobile Access

### Issue: Localhost doesn't work on mobile

When running locally (`http://localhost:3000`), your phone can't access the app because localhost only works on your computer.

### Solution: Use your local network IP

#### Step 1: Find Your Local IP Address

**Option A - Quick Script (Recommended):**
```bash
npm run ip
```

**Option B - Manual:**

**Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" under your active network adapter (WiFi/Ethernet)

**Mac/Linux:**
```bash
ifconfig
# or
ip addr show
```
Look for "inet" address (e.g., 192.168.1.100)

#### Step 2: Update Environment Variable

Open `.env.local` and update:
```bash
# Change from:
NEXT_PUBLIC_APP_URL=http://localhost:3000

# To (use YOUR IP):
NEXT_PUBLIC_APP_URL=http://192.168.1.100:3000
```

#### Step 3: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

#### Step 4: Ensure Same Network

Make sure your phone and computer are on the **same WiFi network**.

#### Step 5: Test!

1. Click "Upload from Phone"
2. The warning should disappear
3. Scan QR code with your phone
4. Upload should work! 🎉

---

## 📋 API Endpoints

### Create Upload Session
```http
POST /api/upload-sessions
```

**Response:**
```json
{
  "success": true,
  "data": {
    "session_id": "uuid",
    "session_token": "uuid",
    "upload_url": "http://192.168.1.100:3000/mobile-upload/token",
    "expires_at": "2025-01-11T12:30:00Z",
    "expires_in_minutes": 15,
    "max_receipts": 10
  }
}
```

### Get Session Receipts (Polling)
```http
GET /api/upload-sessions?session_id=xxx
```

**Response:**
```json
{
  "success": true,
  "data": {
    "session_id": "uuid",
    "receipt_count": 3,
    "max_receipts": 10,
    "is_active": true,
    "expires_at": "2025-01-11T12:30:00Z",
    "receipts": [
      {
        "id": "uuid",
        "file_name": "receipt.jpg",
        "ocr_status": "completed",
        "created_at": "2025-01-11T12:18:00Z"
      }
    ]
  }
}
```

### Upload Receipt (Mobile)
```http
POST /api/upload-sessions/[token]/upload
```

**Body:**
```
FormData with 'file' field
```

### Cancel Session
```http
DELETE /api/upload-sessions?session_id=xxx
```

---

## 🔒 Security Features

### Session Security:
- ✅ Unique random tokens (crypto.randomUUID)
- ✅ 15-minute expiry
- ✅ User-specific sessions (can't access others' sessions)
- ✅ Auto-deactivation on dialog close
- ✅ Receipt count limits (10 per session)
- ✅ File size limits (10MB max)
- ✅ File type validation (images + PDF only)

### No Authentication Required on Mobile:
- Mobile upload endpoint uses session token only
- No login required - improves UX
- Token is temporary and expires quickly
- Session tied to original user

---

## 🎨 User Experience

### Desktop States:
- **Loading**: Spinner while creating session
- **QR Code**: Display with instructions
- **Localhost Warning**: Orange alert if using localhost
- **Upload List**: Real-time receipt updates
- **Processing Status**: Shows OCR progress
- **Timer**: Countdown showing time remaining
- **Done Button**: Only enabled when receipts uploaded

### Mobile States:
- **Upload Page**: Clean, mobile-optimized layout
- **Camera Button**: Large, easy to tap
- **Gallery Button**: Alternative upload method
- **Upload Progress**: Shows current uploads
- **Success List**: Displays uploaded receipts
- **Session Expired**: Clear error message
- **Tips Section**: Helpful upload guidelines

---

## 🧪 Testing

### Local Testing (Same WiFi):

1. Get your local IP:
   ```bash
   npm run ip
   ```

2. Update `.env.local`:
   ```bash
   NEXT_PUBLIC_APP_URL=http://YOUR_IP:3000
   ```

3. Restart dev server

4. Test flow:
   - Desktop: Click "Upload from Phone"
   - Mobile: Scan QR code
   - Mobile: Upload test receipt
   - Desktop: Verify it appears instantly

### Production Testing:

Deploy to Vercel/Netlify and test with public URL. No special configuration needed!

---

## 🐛 Troubleshooting

### "Session expired" error on mobile
**Cause**: Session older than 15 minutes
**Fix**: Generate new QR code on desktop

### QR code shows localhost warning
**Cause**: Using localhost in NEXT_PUBLIC_APP_URL
**Fix**: Update to local network IP (see setup section)

### Mobile can't access upload page
**Cause**: Phone and computer on different networks
**Fix**: Connect both to same WiFi network

### Receipts not appearing on desktop
**Cause**: Polling might be stopped
**Fix**: Click refresh button or close/reopen dialog

### Upload fails with "Invalid file type"
**Cause**: Unsupported file format
**Fix**: Only images (jpg, png, webp) and PDFs are allowed

---

## 📊 Database Schema

### upload_sessions table:
```sql
CREATE TABLE upload_sessions (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  receipt_count INTEGER DEFAULT 0,
  max_receipts INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Key Fields:
- `session_token`: Unique token for QR code URL
- `expires_at`: 15 minutes from creation
- `is_active`: Set to false when dialog closes
- `receipt_count`: Incremented on each upload
- `max_receipts`: Limit to prevent abuse

---

## 💡 Best Practices

### For Users:
1. Keep desktop dialog open while uploading
2. Ensure good lighting for receipt photos
3. Upload receipts immediately after receiving them
4. Check processing status before closing dialog
5. Use same WiFi network for testing locally

### For Developers:
1. Always use local IP (not localhost) for mobile testing
2. Test session expiry edge cases
3. Verify file size limits work
4. Check RLS policies on receipts table
5. Monitor Supabase storage usage
6. Test with different network conditions

---

## 🎯 Future Improvements

Potential enhancements:
- [ ] Batch OCR processing
- [ ] Push notifications when processing completes
- [ ] Session persistence (resume later)
- [ ] Multiple device support
- [ ] Receipt preview thumbnails in real-time
- [ ] Progressive Web App (PWA) for mobile
- [ ] Offline queue for uploads

---

## 📚 Related Documentation

- [OCR Setup Guide](./OCR_SETUP_GUIDE.md)
- [Backend Implementation](./BACKEND_IMPLEMENTATION.md)
- [Feature Inventory](./FEATURE_INVENTORY.md)

---

**Last Updated:** January 2025
**Feature Status:** ✅ Production Ready
