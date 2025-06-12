# OneDrive Photo API

A Node.js API for uploading and retrieving photos from OneDrive, organized by date.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the root directory with the following content:

```
PORT=3000
ACCESS_TOKEN=your_onedrive_access_token_here
```

3. Get your OneDrive access token:
   - Register your application in the Azure Portal
   - Configure Microsoft Graph API permissions
   - Generate an access token with the following scopes:
     - Files.ReadWrite
     - Files.ReadWrite.All

## API Endpoints

### Upload Image

```
POST /upload
Content-Type: multipart/form-data

Parameters:
- image: The image file to upload
- date: (Optional) The date folder name (format: YYYY-MM-DD)
```

### Get Images by Date

```
GET /images/:date

Parameters:
- date: The date folder name (format: YYYY-MM-DD)
```

## Running the Application

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

The server will start on port 3000 by default (configurable via PORT environment variable).
