# N8n Chatbox Integration - Quick Reference Index

## 🎯 Start Here

**New to this integration?** Read these in order:

1. **[N8N_CHATBOX_README.md](N8N_CHATBOX_README.md)** ← START HERE
   - Overview of what's been implemented
   - Getting started in 3 easy steps
   - Architecture explanation

2. **[N8N_QUICK_START.md](N8N_QUICK_START.md)**
   - 5-minute setup guide
   - Essential steps only
   - Quick testing instructions

## 📚 Detailed Documentation

### Setup & Configuration
- **[N8N_CHATBOX_SETUP.md](N8N_CHATBOX_SETUP.md)** - Complete setup guide with examples
- **[N8N_INTEGRATION_COMPLETE.md](N8N_INTEGRATION_COMPLETE.md)** - What was implemented
- **[N8N_IMPLEMENTATION_CHECKLIST.md](N8N_IMPLEMENTATION_CHECKLIST.md)** - Deployment checklist

## 💻 Code Files

### Main Component
- **[src/components/N8nChatbox.jsx](src/components/N8nChatbox.jsx)** - The chatbox component
  - Initializes n8n chat widget
  - Handles environment configuration
  - Error handling included

### Modified Files
- **[src/app-simple.jsx](src/app-simple.jsx)** - Homepage (chatbox added)
- **[index.html](index.html)** - HTML head (stylesheet added)
- **[package.json](package.json)** - Dependencies (@n8n/chat added)

## 🚀 Quick Setup

```bash
# 1. Install dependencies (if first time)
npm install

# 2. Create .env.local with your webhook URL
echo "VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/path" > .env.local

# 3. Start development server
npm run dev

# 4. Open http://localhost:5173 and test the chatbox!
```

## 📋 Setup Checklist

- [ ] Create Chat Trigger workflow in n8n
- [ ] Add your domain to CORS in Chat Trigger
- [ ] Activate the workflow
- [ ] Copy webhook URL
- [ ] Create `.env.local` file
- [ ] Set `VITE_N8N_WEBHOOK_URL` environment variable
- [ ] Run `npm run dev`
- [ ] Test chatbox on homepage
- [ ] Deploy to Vercel

## 🔑 Key Information

### Environment Variable
```env
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-path
```

### Webhook Requirements
- Must use **Chat Trigger** node (not HTTP Webhook)
- Domain must be added to CORS allowlist
- Workflow must be **Active** (toggle ON)

### Message Format
- **Request**: `{chatInput: "user message", sessionId: "id"}`
- **Response**: `{message: "bot response"}`

## ⚠️ Important Notes

❌ **DO NOT** use HTTP Webhook - use Chat Trigger  
✅ **DO** add your domain to CORS  
✅ **DO** activate your workflow  
✅ **DO** set the environment variable  

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Chat not showing | Check `VITE_N8N_WEBHOOK_URL` in environment |
| No responses | Verify Chat Trigger is active and domain in CORS |
| CORS errors | Add your domain to Chat Trigger's Allowed Origins |
| Build errors | Run `npm install` to ensure dependencies installed |

## 📞 Support Resources

- 📖 [N8n Chat Documentation](https://www.npmjs.com/package/@n8n/chat)
- 💬 [N8n Community Forum](https://community.n8n.io)
- 🐛 [N8n GitHub Issues](https://github.com/n8n-io/n8n/issues)

## ✅ Implementation Status

| Task | Status |
|------|--------|
| Package Installation | ✅ Complete |
| Component Creation | ✅ Complete |
| Homepage Integration | ✅ Complete |
| Styling & Assets | ✅ Complete |
| Build & Testing | ✅ Complete |
| Documentation | ✅ Complete |

**Overall Status**: ✅ **READY TO DEPLOY**

## 📦 What's Installed

- `@n8n/chat` v1.4.0-exp.0
- All dependencies: ✅
- Build working: ✅
- Tests passing: ✅

## 🎉 Next Steps

1. Read **[N8N_CHATBOX_README.md](N8N_CHATBOX_README.md)** for detailed overview
2. Follow **[N8N_QUICK_START.md](N8N_QUICK_START.md)** to get started
3. Reference **[N8N_CHATBOX_SETUP.md](N8N_CHATBOX_SETUP.md)** for detailed setup
4. Use **[N8N_IMPLEMENTATION_CHECKLIST.md](N8N_IMPLEMENTATION_CHECKLIST.md)** for deployment

---

**Everything is ready!** 🚀 Just follow the quick setup section above to get your chatbox working.
