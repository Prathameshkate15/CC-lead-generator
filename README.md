<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1o923A-Kc7rVMrLA8T2EQGUiRhsU5zyQH

## Features

This lead generator uses a **hybrid approach** combining:
- **Gemini AI**: Generates channel name suggestions based on your criteria
- **YouTube Data API v3**: Verifies channels exist, fetches real subscriber counts, and checks for recent uploads (last 30 days)

### Why YouTube API Integration?

- ✅ **Real-time Data**: Get accurate, up-to-date subscriber counts
- ✅ **Activity Verification**: Only shows channels that posted videos in the last 30 days
- ✅ **Channel Validation**: Confirms suggested channels actually exist on YouTube
- ✅ **Direct Links**: Click to visit channels directly from the results

## Run Locally

**Prerequisites:**  Node.js

### 1. Install dependencies
```bash
npm install
```

### 2. Set up API Keys

You need two API keys to run this application:

#### Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env.local` file:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

#### YouTube Data API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Enable the **YouTube Data API v3**:
   - Navigate to "APIs & Services" → "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"
4. Create credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the generated API key
5. Add it to your `.env.local` file:
   ```
   YOUTUBE_API_KEY=your_youtube_api_key_here
   ```

**Your `.env.local` file should look like:**
```
GEMINI_API_KEY=your_gemini_api_key_here
YOUTUBE_API_KEY=your_youtube_api_key_here
```

### 3. Run the app
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Deployment (Vercel)

When deploying to Vercel, add both environment variables in your project settings:

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add:
   - `GEMINI_API_KEY` with your Gemini API key
   - `YOUTUBE_API_KEY` with your YouTube API key
4. Deploy your application

## YouTube API Quotas

The YouTube Data API has quota limits (10,000 units/day by default):
- Each channel search costs **100 units**
- Each channel details request costs **1 unit**
- Checking recent uploads costs **100 units**

**Per channel verification**: ~201 units (search + details + recent uploads)

With default quota:
- You can verify approximately **49 channels per day**
- The app requests 10 channels from Gemini, so you can run ~5 searches per day

### If you exceed the quota:

1. The app will gracefully fall back to unverified Gemini data
2. You can request a quota increase in Google Cloud Console
3. Or wait 24 hours for the quota to reset

## How It Works

1. **User Input**: Select category, subscriber range, and enter a search query (topic or channel name)
2. **Gemini AI**: Generates 10 channel suggestions matching your criteria
3. **YouTube Verification**: For each suggested channel:
   - Searches YouTube to confirm the channel exists
   - Fetches real subscriber count
   - Checks if they posted a video in the last 30 days
   - If verification fails, the channel is filtered out
4. **Results**: Only verified, active channels are shown with:
   - ✓ Verification badge
   - Real subscriber count
   - Last upload date
   - Direct link to channel

## Notes

- Without a YouTube API key, the app will still work but show unverified Gemini data
- Channels that haven't posted in 30 days are automatically filtered out
- The app includes a 100ms delay between API calls to respect rate limits
