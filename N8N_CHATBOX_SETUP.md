# N8n Chatbox Integration Guide

## Overview
The TrackrCommerce application now includes an n8n chatbox integration that displays a chat widget on the homepage. This allows you to connect your n8n workflows to provide customer support and engagement directly on your website.

## Installation Status
✅ The `@n8n/chat` package has been installed and integrated.

## Setup Instructions

### Step 1: Create an N8n Workflow with Chat Trigger

**IMPORTANT:** You must use a **Chat Trigger** node, not a regular HTTP Webhook.

1. Go to [n8n.io](https://www.n8n.io) and open your workspace
2. Create a **new workflow**
3. Add a **Chat Trigger** node:
   - This is specifically designed for chat interactions
   - Click on the node and copy the **Webhook URL**
4. Add your domain to the **Allowed Origins (CORS)** field:
   - Add your production domain (e.g., `https://your-domain.com`)
   - Add localhost for development (e.g., `http://localhost:5173`)
5. Connect your processing nodes (AI, logic, database queries, etc.)
6. **Activate the workflow** (toggle in top-right corner)

### Step 2: Configure the Webhook URL

The webhook URL from your Chat Trigger node needs to be added to your environment:

#### For Local Development
Create or update `.env.local` in your project root:
```env
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-unique-path
```

Then restart your dev server:
```bash
npm run dev
```

#### For Production (Vercel)
1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your project
3. Navigate to **Settings → Environment Variables**
4. Add a new variable:
   - **Name:** `VITE_N8N_WEBHOOK_URL`
   - **Value:** `https://your-n8n-instance.com/webhook/your-unique-path`
5. Redeploy your application

### Step 3: Component Location
- **File:** `/src/components/N8nChatbox.jsx`
- **Usage:** Already integrated in `/src/app-simple.jsx` (homepage)
- **CSS:** Automatically imported from `@n8n/chat`

## Configuration Options

The `N8nChatbox` component in `/src/components/N8nChatbox.jsx` can be customized by modifying the `createChat` configuration object:

```javascript
createChat({
  webhookUrl: 'YOUR_WEBHOOK_URL',
  
  // Optional: Customize the button
  button: {
    label: 'Chat with us',      // Button text
    shape: 'rounded',             // 'rounded' or 'square'
  },
  
  // Optional: Customize the chat window
  window: {
    title: 'TrackrCommerce Support',
    subtitle: 'How can we help?',
    layout: 'windowed',           // 'windowed' or 'fullscreen'
    theme: 'dark',                // 'dark' or 'light'
  },
  
  // Optional: Other customizations
  initialMessages: ['Hello! How can we help?'],
  allowFileUploads: true,
  displayFullscreen: false,
});
```

## N8n Workflow Examples

### Example 1: Simple Echo Workflow

This is the simplest possible setup to test:

1. **Chat Trigger** node (trigger)
2. **Set** node to pass through the message
3. **Respond to Webhook** node with response

### Example 2: OpenAI AI Assistant Workflow

For an AI-powered chatbot:

1. **Chat Trigger** node (trigger)
2. **OpenAI** node for AI processing
3. **Respond to Webhook** node with AI response

## How the Chat Integration Works

### Request Format
When a user sends a message:
```json
{
  "chatInput": "User's message text",
  "sessionId": "unique-session-identifier",
  "action": "sendMessage"
}
```

### Response Format
Your n8n workflow should respond with:
```json
{
  "message": "Response text from your workflow"
}
```

## Features

✅ Auto-loads when `VITE_N8N_WEBHOOK_URL` is configured  
✅ Dark theme integrated with your site design  
✅ Fully responsive on mobile and desktop  
✅ Error handling and logging  
✅ Development-friendly (shows configuration warnings in dev mode)  
✅ Supports file uploads (optional)  
✅ Streaming responses (optional, in Chat Trigger settings)  

## Troubleshooting

### Chat widget not appearing?
1. ✅ Verify `VITE_N8N_WEBHOOK_URL` is set in your environment
2. ✅ Check browser console (F12 → Console) for errors
3. ✅ Ensure you're using a **Chat Trigger** node, not HTTP Webhook
4. ✅ Verify your n8n workflow is **Active**
5. ✅ Clear browser cache and reload

### Messages not being received?
1. ✅ Verify the **Chat Trigger** node is active in your workflow
2. ✅ Check n8n execution logs for errors
3. ✅ Ensure your domain is in **Allowed Origins (CORS)**

### CORS Issues?
- Add your domain to the **Allowed Origins** field in the Chat Trigger node
- For development: add `http://localhost:5173`
- For production: add your domain like `https://your-site.com`

## Documentation

For more information:
- [N8n Chat Documentation](https://www.npmjs.com/package/@n8n/chat)
- [N8n Chat Trigger Node](https://docs.n8n.io/integrations/builtin/trigger-nodes/n8n-nodes-base.chattrigger/)
- [N8n OpenAI Integration](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.openai/)

## Security

- ✅ The chatbox only sends data to your configured webhook URL
- ✅ No user data is stored in the browser
- ✅ All messages transmitted over HTTPS
- ✅ Add your domain to CORS whitelist in Chat Trigger

## Common Mistakes

❌ Using HTTP Webhook instead of **Chat Trigger**
- Must use **Chat Trigger** node specifically

❌ Forgetting to activate the workflow
- The workflow must be **Active** (toggle in top-right)

❌ Not adding domain to CORS
- Add your domain to **Allowed Origins** in Chat Trigger

❌ Webhook URL not set in environment
- Set `VITE_N8N_WEBHOOK_URL` environment variable
