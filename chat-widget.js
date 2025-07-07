(function() {
    // ... [styles and font loading code remain unchanged] ...

    // Merge user config with defaults
    const config = window.ChatWidgetConfig ? 
        {
            webhook: { ...defaultConfig.webhook, ...window.ChatWidgetConfig.webhook },
            branding: { ...defaultConfig.branding, ...window.ChatWidgetConfig.branding },
            style: { ...defaultConfig.style, ...window.ChatWidgetConfig.style }
        } : defaultConfig;

    if (window.N8NChatWidgetInitialized) return;
    window.N8NChatWidgetInitialized = true;

    let currentSessionId = '';

    // Create widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'n8n-chat-widget';
    widgetContainer.style.setProperty('--n8n-chat-primary-color', config.style.primaryColor);
    widgetContainer.style.setProperty('--n8n-chat-secondary-color', config.style.secondaryColor);
    widgetContainer.style.setProperty('--n8n-chat-background-color', config.style.backgroundColor);
    widgetContainer.style.setProperty('--n8n-chat-font-color', config.style.fontColor);

    const chatContainer = document.createElement('div');
    chatContainer.className = `chat-container${config.style.position === 'left' ? ' position-left' : ''}`;

    // Brand header with explicit logo sizing in HTML
    const headerHTML = `
        <div class="brand-header">
            <img src="${config.branding.logo}" alt="${config.branding.name}" width="120" height="48" style="width:100%;height:48px;object-fit:contain;display:block;" />
            <span>${config.branding.name}</span>
            <button class="close-button">×</button>
        </div>
    `;

    // --- REMOVE newConversationHTML and related logic ---

    const chatInterfaceHTML = `
        <div class="chat-interface active">
            ${headerHTML}
            <div class="chat-messages"></div>
            <div class="chat-input">
                <textarea placeholder="Type your message here..." rows="1"></textarea>
                <button type="submit">Send</button>
            </div>
        </div>
    `;

    // Only use the chat interface (no overlays)
    chatContainer.innerHTML = chatInterfaceHTML;

    // --- REMOVE toggleButton and related logic ---
    widgetContainer.appendChild(chatContainer);
    document.body.appendChild(widgetContainer);

    // Get references
    const chatInterface = chatContainer.querySelector('.chat-interface');
    const messagesContainer = chatContainer.querySelector('.chat-messages');
    const textarea = chatContainer.querySelector('textarea');
    const sendButton = chatContainer.querySelector('button[type="submit"]');

    function generateUUID() {
        return crypto.randomUUID();
    }

    async function startNewConversation() {
        currentSessionId = generateUUID();
        const data = [{
            action: "loadPreviousSession",
            sessionId: currentSessionId,
            route: config.webhook.route,
            metadata: { userId: "" }
        }];

        try {
            const response = await fetch(config.webhook.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const responseData = await response.json();

            // Bot message with avatar (HTML attributes for size)
            const botMessageDiv = document.createElement('div');
            botMessageDiv.className = 'chat-message bot';
            botMessageDiv.innerHTML = `
                <img class="agent-avatar" src="${config.branding.agentAvatar}" alt="Agent" width="100" height="100" style="width:100px;height:100px;border-radius:50%;object-fit:cover;display:block;" />
                <span>${Array.isArray(responseData) ? responseData[0].output : responseData.output}</span>
            `;
            messagesContainer.appendChild(botMessageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } catch (error) {
            console.error('Error:', error);
        }
    }

    async function sendMessage(message) {
        const messageData = {
            action: "sendMessage",
            sessionId: currentSessionId,
            route: config.webhook.route,
            chatInput: message,
            metadata: { userId: "" }
        };

        const userMessageDiv = document.createElement('div');
        userMessageDiv.className = 'chat-message user';
        userMessageDiv.textContent = message;
        messagesContainer.appendChild(userMessageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        try {
            const response = await fetch(config.webhook.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messageData)
            });

            const data = await response.json();

            // Bot message with avatar (HTML attributes for size)
            const botMessageDiv = document.createElement('div');
            botMessageDiv.className = 'chat-message bot';
            botMessageDiv.innerHTML = `
                <img class="agent-avatar" src="${config.branding.agentAvatar}" alt="Agent" width="40" height="40" style="width:40px;height:40px;border-radius:50%;object-fit:cover;display:block;" />
                <span>${Array.isArray(data) ? data[0].output : data.output}</span>
            `;
            messagesContainer.appendChild(botMessageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // --- REMOVE newChatBtn and related logic ---

    sendButton.addEventListener('click', () => {
        const message = textarea.value.trim();
        if (message) {
            sendMessage(message);
            textarea.value = '';
        }
    });

    textarea.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const message = textarea.value.trim();
            if (message) {
                sendMessage(message);
                textarea.value = '';
            }
        }
    });

    // Add close button handlers
    const closeButtons = chatContainer.querySelectorAll('.close-button');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            chatContainer.style.display = 'none';
        });
    });

    // --- SHOW CHAT INTERFACE AND START SESSION IMMEDIATELY ---
    chatInterface.classList.add('active');
    startNewConversation();
})();
