# N8n Chatbox Quick Start

## 1. Environment Setup (5 minutes)

### Option A: Local Development
Create a `.env.local` file in the project root:
```env
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/chat
```

Then restart the dev server:
```bash
npm run dev
```

### Option B: Vercel Deployment
1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com)
3. Select your project
4. Go to **Settings → Environment Variables**
5. Add: `VITE_N8N_WEBHOOK_URL` = `https://your-n8n-instance.com/webhook/chat`
6. Redeploy

## 2. Create Your First N8n Workflow (10 minutes)

### Step 1: Set up the Webhook Trigger
1. Open n8n.io in your browser
2. Create a **new workflow**
3. Add **HTTP Request** trigger node:
   - Method: POST
   - Path: `/chat`
   - The full URL will be displayed

### Step 2: Add a Response Node
1. Add a **Respond to Webhook** node
2. Connect it to your trigger
3. In the response, click **JSON** and enter:
```json
{
  "message": "Hello! I received your message.",
  "sessionId": "{{ $json.chatId }}"
}
```

### Step 3: Test and Deploy
1. Click **Save**
2. Click **Test Workflow**
3. The workflow will give you a webhook URL
4. Copy this URL to `VITE_N8N_WEBHOOK_URL` in your environment

## 3. Run Your Application

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# The chatbox will appear at the bottom-right of the homepage
```

## 4. Advanced: AI-Powered Chat with OpenAI

### Setup Instructions
1. Get an OpenAI API key from [openai.com](https://openai.com)
2. In your n8n workflow:
   - Add **OpenAI** node
   - Connect HTTP Trigger → OpenAI → Respond to Webhook
   - Configure your prompt and model

Example configuration:
```
Prompt: "You are a helpful support agent for TrackrCommerce. Respond to customer inquiries."
Input: "{{ $json.message }}"
```

## 5. Troubleshooting

| Issue | Solution |
|-------|----------|
| Chat widget not visible | Verify `VITE_N8N_WEBHOOK_URL` is set |
| Messages not received | Check n8n workflow execution logs |
| No response from bot | Ensure webhook is active in n8n |
| CORS errors | Add CORS headers in n8n response node |

## File Structure

```
src/
  components/
    N8nChatbox.jsx          ← Main chatbox component
  app-simple.jsx            ← Homepage (includes chatbox)
N8N_CHATBOX_SETUP.md        ← Detailed documentation
N8N_QUICK_START.md          ← This file
```

## Next Steps

- ✅ Configure your n8n webhook URL
- 📝 Create your n8n workflow
- 🚀 Test the chatbox on your homepage
- 🔧 Customize styling and behavior in `N8nChatbox.jsx`
- 📊 Add AI capabilities with OpenAI integration

## Support

- [N8n Documentation](https://docs.n8n.io)
- [N8n Chat Package](https://www.npmjs.com/package/@n8n/chat)
- [OpenAI Integration Guide](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.openai/)
