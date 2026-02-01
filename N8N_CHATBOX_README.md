# N8n Chatbox Implementation Overview

## ✅ Implementation Status: COMPLETE

Your TrackrCommerce website now has a fully functional n8n chatbox integration ready to use.

## What You Get

A **chat widget** that appears on your website homepage and connects to your n8n workflows for:
- 💬 Customer support conversations
- 🤖 AI-powered responses (with OpenAI, etc.)
- 📊 Lead capture and qualification
- 🔄 Workflow automation triggering
- 📁 File uploads and processing

## Installation Summary

| Component | Status | Location |
|-----------|--------|----------|
| Package | ✅ Installed | `package.json` |
| Component | ✅ Created | `src/components/N8nChatbox.jsx` |
| Homepage | ✅ Integrated | `src/app-simple.jsx` |
| Styling | ✅ Added | `index.html` |
| Build | ✅ Working | Tested with `npm run build` |

## Getting Started (3 Easy Steps)

### Step 1️⃣: Create Your N8n Workflow

Go to [n8n.io](https://n8n.io) and create a workflow:

1. Click **Create new workflow**
2. Add a **Chat Trigger** node (not HTTP Webhook!)
3. Copy the webhook URL that appears
4. Add your domain to the "Allowed Origins (CORS)" field:
   - For development: `http://localhost:5173`
   - For production: `https://your-domain.com`
5. Add your processing logic (AI, database, integrations, etc.)
6. Click the toggle to **Activate** the workflow

### Step 2️⃣: Configure Your Environment

Create `.env.local` in your project root:

```env
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-unique-path
```

Restart your dev server:
```bash
npm run dev
```

### Step 3️⃣: Test It!

Open `http://localhost:5173` in your browser.

Look for the **chat icon** at the bottom-right of the page 👉

Click it and start chatting! 🎉

## Architecture

```
┌─────────────────────┐
│   Your Website      │
│  (TrackrCommerce)   │
│                     │
│  ┌───────────────┐  │
│  │   Chatbox     │  │
│  │   Component   │  │
│  └───────┬───────┘  │
└──────────┼──────────┘
           │
           │ webhookUrl
           ↓
┌─────────────────────┐
│    N8n Instance     │
│                     │
│  ┌───────────────┐  │
│  │Chat Trigger   │  │
│  └───────┬───────┘  │
│          │          │
│  ┌───────▼───────┐  │
│  │  Your Logic   │  │
│  │  (AI, DB...)  │  │
│  └───────┬───────┘  │
│          │          │
│  ┌───────▼───────┐  │
│  │   Respond     │  │
│  └───────────────┘  │
└─────────────────────┘
```

## File Structure

```
trackrcommerce/
├── src/
│   ├── components/
│   │   ├── N8nChatbox.jsx          ← New chatbox component
│   │   ├── Modal.jsx
│   │   ├── Button.jsx
│   │   └── ...
│   ├── app-simple.jsx              ← Modified (added N8nChatbox)
│   └── ...
├── index.html                      ← Modified (added n8n styles)
├── package.json                    ← Modified (added @n8n/chat)
├── N8N_CHATBOX_SETUP.md            ← Documentation
├── N8N_QUICK_START.md              ← Quick start guide
└── ...
```

## Configuration Examples

### Basic Setup (Current)
```javascript
createChat({
  webhookUrl: 'YOUR_WEBHOOK_URL'
});
```

### With Custom Styling
```javascript
createChat({
  webhookUrl: 'YOUR_WEBHOOK_URL',
  button: {
    label: 'Chat with us',
    shape: 'rounded'
  },
  window: {
    title: 'TrackrCommerce Support',
    subtitle: 'How can we help?',
    layout: 'windowed',
    theme: 'dark'
  }
});
```

### With AI Integration
Edit `/src/components/N8nChatbox.jsx` and uncomment the options, then add an **OpenAI** node to your n8n workflow.

## N8n Workflow Examples

### Example 1: Simple Echo
```
Chat Trigger
    ↓
Respond to Webhook (return: {message: "Echo: $json.chatInput"})
```

### Example 2: OpenAI Assistant
```
Chat Trigger
    ↓
OpenAI (prompt: "You are a helpful assistant")
    ↓
Respond to Webhook (return: {message: $json.data.output})
```

### Example 3: Lead Capture
```
Chat Trigger
    ↓
Database (save conversation)
    ↓
Respond to Webhook (send thank you message)
```

## Important Notes

⚠️ **Use Chat Trigger, Not HTTP Webhook**
- The chatbox is designed for n8n's **Chat Trigger** node
- Using a regular HTTP Webhook won't work properly
- Chat Trigger handles session management automatically

✅ **Add Your Domain to CORS**
- Go to Chat Trigger settings
- Add your domain under "Allowed Origins (CORS)"
- Both development (`localhost`) and production domains

✅ **Activate Your Workflow**
- Toggle must be ON (blue) for the workflow to receive messages
- Workflow won't work if it's deactivated

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Chat not showing | Check `VITE_N8N_WEBHOOK_URL` in environment |
| No responses | Ensure workflow is Active and domain in CORS |
| Build errors | Already tested ✅ `npm run build` works |
| CORS errors | Add your domain to Chat Trigger's Allowed Origins |

## Documentation

- 📖 **Setup Guide**: `N8N_CHATBOX_SETUP.md` - Full documentation with examples
- ⚡ **Quick Start**: `N8N_QUICK_START.md` - Get started in 5 minutes
- 🎯 **This File**: Overview and architecture

## Production Deployment

### Vercel Deployment

1. Push code to GitHub (already done automatically)
2. Go to [Vercel Dashboard](https://vercel.com)
3. Select your project
4. Go to **Settings → Environment Variables**
5. Add: `VITE_N8N_WEBHOOK_URL` = `https://your-n8n-instance.com/webhook/your-path`
6. Redeploy

That's it! Your chatbox will be live. 🚀

## Features

✨ **What Works Out of the Box**
- ✅ Auto-loads with webhook URL
- ✅ Dark theme (matches your site)
- ✅ Mobile responsive
- ✅ Error handling
- ✅ Development logging
- ✅ File uploads (optional)
- ✅ Streaming responses (optional)
- ✅ Session management
- ✅ Message history

## Next Steps

1. ✅ Read `N8N_CHATBOX_SETUP.md` for detailed setup
2. ✅ Create your n8n Chat Trigger workflow
3. ✅ Get the webhook URL
4. ✅ Add to environment variables
5. ✅ Test locally with `npm run dev`
6. ✅ Deploy to production
7. ✅ Monitor and customize as needed

## Support

- 📚 [N8n Documentation](https://docs.n8n.io/)
- 💬 [N8n Community Forum](https://community.n8n.io/)
- 📦 [N8n Chat Package](https://www.npmjs.com/package/@n8n/chat)

---

**Status**: ✅ Ready to deploy  
**Build Status**: ✅ Passing  
**Documentation**: ✅ Complete  

**You're all set!** 🎉 Your chatbox is ready for your n8n workflows.
