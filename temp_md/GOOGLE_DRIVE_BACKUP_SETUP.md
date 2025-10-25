# Google Drive Auto-Backup Setup Guide

This guide will help you set up automatic backup of AI debate audio files to Google Drive using n8n.

## Overview

When you generate audio from a debate, the app will:
1. Download the audio file to your computer (existing behavior)
2. Automatically send a copy to Google Drive via n8n webhook (new feature)
3. If backup fails, it fails silently and doesn't interrupt the download

## Prerequisites

- n8n instance (cloud or self-hosted)
- Google Drive account
- Google OAuth credentials set up in n8n

## Setup Instructions

### 1. Import n8n Workflow

1. Log in to your n8n instance
2. Go to **Workflows** → **Add workflow** → **Import from File**
3. Select the file `n8n-google-drive-backup-workflow.json`
4. The workflow will be imported with 4 nodes:
   - **Webhook** - receives POST requests from your app
   - **Convert Base64 to Binary** - converts the audio data
   - **Google Drive** - uploads to your Drive
   - **Respond to Webhook** - sends success response

### 2. Configure Google Drive Credentials

1. In the imported workflow, click on the **Google Drive** node
2. Click **Create New Credential** next to "Credential to connect with"
3. Follow the prompts to authenticate with Google:
   - You'll need to create OAuth credentials in Google Cloud Console
   - Or use n8n's pre-configured Google OAuth app
4. Choose the **folder** where you want audio files saved:
   - Click the folder dropdown
   - Select "Root folder" for top-level storage
   - Or create/select a specific folder like "AI Debates"

### 3. Activate the Workflow

1. Click **Save** in the top right
2. Toggle the workflow to **Active** (switch in top right)
3. Click on the **Webhook** node
4. Copy the **Production URL** - it will look like:
   ```
   https://your-n8n-instance.com/webhook/debate-backup
   ```

### 4. Configure Your Frontend App

1. Open `.env.local` in your project
2. Add your n8n webhook URL:
   ```bash
   VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/debate-backup
   ```
3. Save the file
4. Restart your development server:
   ```bash
   npm run dev
   ```

## Testing

1. Start a debate in your app
2. Generate audio by clicking the **Audio** button
3. Check the browser console for backup status:
   - Success: `"Audio successfully backed up to Google Drive"`
   - Failure: `"Failed to backup audio to Google Drive: ..."`
4. Check your Google Drive folder - the audio file should appear

## Troubleshooting

### Backup not working

1. **Check webhook URL**: Make sure `VITE_N8N_WEBHOOK_URL` is correctly set in `.env.local`
2. **Check workflow is active**: Toggle must be ON in n8n
3. **Check credentials**: Google Drive credentials must be properly authenticated
4. **Check browser console**: Look for error messages
5. **Check n8n execution log**: Go to Executions tab in n8n to see detailed errors

### File not appearing in Google Drive

1. **Check folder selection**: In Google Drive node, verify the correct folder is selected
2. **Check permissions**: Ensure the Google account has write access to the folder
3. **Check file size**: Very large files might timeout - check n8n's upload limits

### CORS errors

If you see CORS errors in the browser console:
1. In n8n, go to **Settings** → **Security**
2. Add your app's URL to allowed origins
3. Or use n8n cloud which handles CORS automatically

## Customization

### Change destination folder

1. Open the workflow in n8n
2. Click the **Google Drive** node
3. Change the **Folder** dropdown to your desired location
4. Save and re-activate the workflow

### Add file organization by date

Modify the **Convert Base64 to Binary** code node to create folders by date:

```javascript
const payload = $input.item.json;
const audioBase64 = payload.audioBase64;
const filename = payload.filename;
const metadata = payload.metadata;

// Create date-based folder name
const date = new Date(metadata.timestamp);
const folderName = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

// Convert base64 to binary
const binaryData = Buffer.from(audioBase64, 'base64');

return {
  json: {
    filename: filename,
    folderName: folderName,  // Add this
    topic: metadata.topic,
    language: metadata.language,
    rounds: metadata.numRounds,
    timestamp: metadata.timestamp,
    fileSize: metadata.fileSize
  },
  binary: {
    data: {
      data: binaryData.toString('base64'),
      mimeType: 'audio/wav',
      fileName: filename,
      fileExtension: 'wav'
    }
  }
};
```

Then add a node between **Convert Base64 to Binary** and **Google Drive** to create the folder if it doesn't exist.

### Disable backup

To temporarily disable backup without removing the webhook:
1. Set `VITE_N8N_WEBHOOK_URL=` (empty) in `.env.local`
2. Or deactivate the workflow in n8n

## Data Sent to n8n

For transparency, here's what data is sent to your n8n webhook:

```json
{
  "audioBase64": "UklGRi4gBABXQVZFZm10IBAA...",
  "filename": "ai-debate-pineapple-on-pizza.wav",
  "metadata": {
    "topic": "Is pineapple on pizza a culinary crime?",
    "language": "Hindi",
    "numRounds": 5,
    "timestamp": "2025-10-25T12:34:56.789Z",
    "fileSize": 4567890
  }
}
```

## Security Notes

- The `.env.local` file is gitignored and won't be committed
- Webhook URL should be kept private (treat like an API key)
- If your n8n instance is public, consider adding authentication
- Audio files may contain debate content - ensure your n8n/Google Drive setup complies with your privacy requirements

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Check n8n execution logs
3. Verify all credentials are properly set up
4. Try the n8n workflow manually with test data
