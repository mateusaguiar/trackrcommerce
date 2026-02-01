import React, { useEffect, useState } from 'react';
import { createChat } from '@n8n/chat';
import '@n8n/chat/style.css';

/**
 * N8nChatbox Component
 * 
 * Integrates the n8n chat widget into the application.
 * This component loads the n8n chat client and configures it with your workflow.
 * 
 * Configuration:
 * - You need to set the VITE_N8N_WEBHOOK_URL environment variable pointing to your n8n workflow
 * - The workflow must use a Chat Trigger node
 * - The workflow should be active and publicly accessible via the webhook URL
 */
export default function N8nChatbox() {
  const [chatLoaded, setChatLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      // Get the n8n webhook URL from environment variables
      // Must start with VITE_ prefix for Vite to expose it
      const n8nWebhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;

      if (!n8nWebhookUrl) {
        setError('N8n webhook URL not configured');
        console.warn('N8n webhook URL not configured. Set VITE_N8N_WEBHOOK_URL environment variable.');
        return;
      }

      // Initialize the n8n chat widget
      createChat({
        // The URL of your n8n workflow webhook (Chat Trigger node)
        webhookUrl: n8nWebhookUrl,
        
        // Optional customization options:
        // You can uncomment and customize these options:
        // 
        button: {
          label: 'Fale Conosco',
          shape: 'square', // or 'rounded'
        },
        // 
        window: {
          title: 'SAC - TrackrCommerce',
          subtitle: 'Como podemos ajudar?',
          layout: 'windowed', // 'windowed' or 'fullscreen'
          theme: 'dark', // 'dark' or 'light'
        },
        // 
        initialMessages: ['Olá 👋! Como podemos te ajudar hoje?'],
        allowFileUploads: false,
        i18n: {
            en: {
                title: 'TrackrCommerce SAC 👋',
                subtitle: "Estamos 24h à sua disposição!",
                footer: '',
                getStarted: 'Nova Conversa',
                inputPlaceholder: 'Fale conosco...',
            },
	    },
      });

      setChatLoaded(true);
    } catch (err) {
      console.error('Failed to initialize n8n chat:', err);
      setError('Failed to initialize chat widget');
    }
  }, []);

  // If there's an error, we can optionally show a message (usually hidden in production)
  if (error && process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed bottom-4 right-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
        {error}
      </div>
    );
  }

  // The chat widget is loaded by the n8n chat client and will be injected into the DOM
  return null;
}
