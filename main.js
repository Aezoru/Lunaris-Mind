// js/main.js (النسخة الكاملة والمحدثة)
document.addEventListener('DOMContentLoaded', function() {

  // =======================================================
  // ==  0. GLOBAL THEME APPLICATION
  // =======================================================
  const savedTheme = localStorage.getItem('lunaris-theme') || 'dark';
  if (savedTheme === 'light') document.body.classList.add('light-theme');

  // ===================================
  // ==  1. DATA STRUCTURE & STATE
  // ===================================
  let conversations = [];
  let activeConversationId = null;
  let activeProjectId = null;

  // ===================================
  // ==  2. ELEMENT SELECTION
  // ===================================
  const openSidebarBtn = document.getElementById('open-sidebar-btn');
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('main-content');
  const welcomeScreen = document.getElementById('welcome-screen');
  const chatArea = document.getElementById('chat-area');
  const messageInput = document.getElementById('message-input');
  const sendBtn = document.getElementById('mic-or-send-btn');
  const chatHistoryList = document.getElementById('chat-history-list');

  const headerNewChatBtn = document.getElementById('header-new-chat-btn');
  const sidebarNewChatBtn = document.getElementById('sidebar-new-chat-btn');
  const menuNewChatBtn = document.getElementById('menu-new-chat-btn');

  const optionsMenuContainer = document.getElementById('options-menu-container');
  const optionsMenuBtn = document.getElementById('options-menu-btn');
  const optionsDropdown = document.getElementById('options-dropdown');

  const themeSwitchCheckbox = document.getElementById('theme-switch-checkbox');

  const dropdownChatTitle = document.querySelector('.chat-title-display');
  const dropdownRenameBtn = document.querySelector('.dropdown-item.rename-btn');
  const dropdownDeleteBtn = document.querySelector('.dropdown-item.delete-btn');
  const dropdownShareBtn = document.querySelector('.dropdown-item.share-btn');
  const dropdownArchiveBtn = document.querySelector('.dropdown-item.archive-btn');
  const dropdownReportBtn = document.querySelector('.dropdown-item.report-btn');

  const suggestionPillsContainer = document.querySelector('.suggestion-pills');

  // ===================================
  // ==  3. CORE FUNCTIONS
  // ===================================
  async function sendMessage() {
      if (!messageInput) return;
      const messageText = messageInput.value.trim();
      if (messageText === '') return;

      const userMessage = messageText;
      messageInput.value = '';
      updateSendButton();

      let isFirstMessage = (activeConversationId === null);

      if (isFirstMessage) {
          createNewConversation(userMessage);
      } else {
          addMessageToConversation(activeConversationId, 'user', userMessage);
      }

      renderMessage('user', userMessage);

      // ✅ مؤشر التحميل
      const loadingIndicator = document.createElement('div');
      loadingIndicator.id = 'loading-indicator';
      loadingIndicator.className = 'message-container ai-message';
      loadingIndicator.innerHTML = `
          <div class="message-bubble">
              <div class="typing-indicator">
                  <span></span><span></span><span></span>
              </div>
          </div>
      `;
      chatArea.appendChild(loadingIndicator);
      chatArea.scrollTop = chatArea.scrollHeight;

      try {
          const conversation = conversations.find(c => c.id === activeConversationId);
          if (!conversation) throw new Error("لم يتم العثور على المحادثة النشطة");

          const geminiHistory = conversation.messages.map(msg => ({
              role: msg.sender === 'user' ? 'user' : 'model',
              parts: [{ text: msg.text }]
          }));

          const serverUrl = 'https://f245876d-5823-4cbc-84eb-278b20c2ea2c-00-17ob8at287sb5.riker.replit.dev/chat';

          const response = await fetch(serverUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ history: geminiHistory })
          });

          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.reply || `HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          const aiReply = data.reply;

          loadingIndicator.remove();

          addMessageToConversation(activeConversationId, 'ai', aiReply);
          renderMessage('ai', aiReply);

      } catch (error) {
          console.error("فشل الاتصال بالخادم أو معالجة الرد:", error);
          const errorMessage = `عذراً، حدث خطأ: ${error.message}`;
          loadingIndicator.remove();
          addMessageToConversation(activeConversationId, 'ai', errorMessage);
          renderMessage('ai', errorMessage);
      }
  }

  function createNewConversation(firstMessage) {
      const newId = 'chat-' + Date.now();
      const newTitle = firstMessage.split(' ').slice(0, 4).join(' ');
      const projectId = new URLSearchParams(window.location.search).get('project_id');

      const newConversation = {
          id: newId,
          title: newTitle,
          messages: [],
          isArchived: false,
          projectId: projectId
      };

      conversations.unshift(newConversation);
      activeConversationId = newId;
      addMessageToConversation(newId, 'user', firstMessage);
      saveConversations();
      renderChatHistory();
      renderChatArea(newId);
  }

  function addMessageToConversation(convoId, sender, text) {
      const conversation = conversations.find(c => c.id === convoId);
      if (conversation) {
          conversation.messages.push({ sender, text });
          saveConversations();
      }
  }

  function renderMessage(sender, text) {
      if (!chatArea) return;
      const messageContainer = document.createElement('div');
      messageContainer.className = `message-container ${sender}-message`;
      const messageBubble = document.createElement('div');
      messageBubble.className = 'message-bubble';
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      messageBubble.appendChild(paragraph);
      messageContainer.appendChild(messageBubble);
      chatArea.appendChild(messageContainer);
      chatArea.scrollTop = chatArea.scrollHeight;
  }

  function renderChatArea(convoId) {
      if (!chatArea || !welcomeScreen) return;
      const conversation = conversations.find(c => c.id === convoId);
      if (conversation) {
          welcomeScreen.style.display = 'none';
          chatArea.style.display = 'flex';
          chatArea.innerHTML = '';
          switchToChatViewHeader(conversation.title);
          conversation.messages.forEach(msg => renderMessage(msg.sender, msg.text));
      } else {
          welcomeScreen.style.display = 'flex';
          chatArea.style.display = 'none';
          switchToWelcomeViewHeader();
      }
  }

  function renderChatHistory() {
      if (!chatHistoryList) return;
      chatHistoryList.innerHTML = '';
      const conversationsToDisplay = conversations.filter(c => !c.projectId);
      conversationsToDisplay.forEach(convo => {
          const chatLink = document.createElement('a');
          chatLink.href = `index.html?conversation_id=${convo.id}`;
          chatLink.textContent = convo.title;
          chatLink.dataset.conversationId = convo.id;
          if (convo.id === activeConversationId) chatLink.classList.add('active-chat-link');
          chatHistoryList.appendChild(chatLink);
      });
  }

  function updateSendButton() {
      const micIcon = document.getElementById('mic-icon');
      const sendIcon = document.getElementById('send-icon');
      if (!messageInput || !micIcon || !sendIcon) return;
      if (messageInput.value.trim() !== '') {
          micIcon.classList.remove('active-icon');
          sendIcon.classList.add('active-icon');
      } else {
          sendIcon.classList.remove('active-icon');
          micIcon.classList.add('active-icon');
      }
  }

  function showToast(message) {
      const toast = document.getElementById('toast-notification');
      if (!toast) return;
      toast.textContent = message;
      toast.classList.add('show');
      setTimeout(() => { toast.classList.remove('show'); }, 3000);
  }

  function resetToNewChat(e) {
      if (e) e.preventDefault();
      if (activeConversationId === null) {
          showToast('أنت بالفعل في محادثة جديدة');
          return;
      }
      activeConversationId = null;
      renderChatArea(null);
      renderChatHistory();
      if (sidebar && sidebar.classList.contains('is-open')) sidebar.classList.remove('is-open');
  }

  function deleteActiveConversation() {
      if (!activeConversationId) return;
      if (confirm('هل أنت متأكد من أنك تريد حذف هذه المحادثة؟')) {
          conversations = conversations.filter(c => c.id !== activeConversationId);
          saveConversations();
          resetToNewChat();
          showToast('تم حذف المحادثة بنجاح');
      }
  }

  function renameActiveConversation() {
      if (!activeConversationId) return;
      const conversation = conversations.find(c => c.id === activeConversationId);
      if (!conversation) return;
      const newTitle = prompt('أدخل الاسم الجديد للمحادثة:', conversation.title);
      if (newTitle && newTitle.trim() !== '') {
          conversation.title = newTitle.trim();
          saveConversations();
          renderChatHistory();
          switchToChatViewHeader(conversation.title);
          showToast('تمت إعادة التسمية بنجاح');
      }
  }

  function shareActiveConversation() {
      if (!activeConversationId) return;
      const conversation = conversations.find(c => c.id === activeConversationId);
      if (!conversation) return;
      let shareText = `محادثة: ${conversation.title}\n\n`;
      conversation.messages.forEach(msg => {
          const sender = msg.sender === 'ai' ? 'Lunaris Mind' : 'المستخدم';
          shareText += `${sender}: ${msg.text}\n`;
      });
      shareText += `\n---\nتمت المشاركة من تطبيق Lunaris Mind`;

      navigator.clipboard.writeText(shareText)
          .then(() => showToast('تم نسخ المحادثة إلى الحافظة!'))
          .catch(() => showToast('عذراً، حدث خطأ أثناء النسخ.'));
  }

  function archiveActiveConversation() {
      if (!activeConversationId) return;
      const conversation = conversations.find(c => c.id === activeConversationId);
      if (!conversation) return;
      conversation.isArchived = true;
      saveConversations();
      resetToNewChat();
      showToast('تمت أرشفة المحادثة');
  }

  function reportActiveConversation() {
      if (!activeConversationId) return;
      showToast('شكراً لك، تم استلام بلاغك.');
  }

  function switchToChatViewHeader(title) {
      const mainHeader = document.getElementById('main-header');
      const newChatHeader = document.getElementById('new-chat-header');
      const activeChatHeader = document.getElementById('active-chat-header');
      if (mainHeader && newChatHeader && activeChatHeader) {
          mainHeader.classList.add('in-chat');
          newChatHeader.classList.remove('active-view');
          activeChatHeader.classList.add('active-view');
          activeChatHeader.querySelector('h3').textContent = title;
          if (dropdownChatTitle) dropdownChatTitle.textContent = title;
      }
  }

  function switchToWelcomeViewHeader() {
      const mainHeader = document.getElementById('main-header');
      const newChatHeader = document.getElementById('new-chat-header');
      const activeChatHeader = document.getElementById('active-chat-header');
      if (mainHeader && newChatHeader && activeChatHeader) {
          mainHeader.classList.remove('in-chat');
          newChatHeader.classList.add('active-view');
          activeChatHeader.classList.remove('active-view');
      }
  }

  function saveConversations() {
      localStorage.setItem('lunaris-conversations', JSON.stringify(conversations));
  }

  function loadConversations() {
      const savedConversations = localStorage.getItem('lunaris-conversations');
      if (savedConversations) conversations = JSON.parse(savedConversations);
  }

  function getQueryParam(param) {
      return new URLSearchParams(window.location.search).get(param);
  }

  // ===================================
  // == 6. EVENT LISTENERS
  // ===================================
  if (openSidebarBtn) openSidebarBtn.addEventListener('click', e => { e.stopPropagation(); sidebar.classList.toggle('is-open'); });
  if (mainContent) mainContent.addEventListener('click', () => sidebar.classList.remove('is-open'));
  if (sidebar) sidebar.addEventListener('click', e => e.stopPropagation());

  if (chatHistoryList) chatHistoryList.addEventListener('click', e => {
      e.preventDefault();
      const clickedLink = e.target.closest('a');
      if (clickedLink && clickedLink.dataset.conversationId) {
          const convoId = clickedLink.dataset.conversationId;
          activeConversationId = convoId;
          renderChatArea(convoId);
          renderChatHistory();
          sidebar.classList.remove('is-open');
      }
  });

  if (headerNewChatBtn) headerNewChatBtn.addEventListener('click', resetToNewChat);
  if (sidebarNewChatBtn) sidebarNewChatBtn.addEventListener('click', resetToNewChat);
  if (menuNewChatBtn) menuNewChatBtn.addEventListener('click', resetToNewChat);

  if (messageInput && sendBtn) {
      sendBtn.addEventListener('click', sendMessage);
      messageInput.addEventListener('keypress', e => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } });
      messageInput.addEventListener('input', updateSendButton);
  }

  if (optionsMenuBtn && optionsDropdown) {
      optionsMenuBtn.addEventListener('click', e => { e.stopPropagation(); optionsDropdown.classList.toggle('show'); });
      document.addEventListener('click', () => { if (optionsDropdown.classList.contains('show')) optionsDropdown.classList.remove('show'); });
  }

  if (themeSwitchCheckbox) {
      themeSwitchCheckbox.checked = !document.body.classList.contains('light-theme');
      themeSwitchCheckbox.addEventListener('change', function() {
          if (!this.checked) {
              document.body.classList.add('light-theme');
              localStorage.setItem('lunaris-theme', 'light');
          } else {
              document.body.classList.remove('light-theme');
              localStorage.setItem('lunaris-theme', 'dark');
          }
      });
  }

  if (dropdownRenameBtn) dropdownRenameBtn.addEventListener('click', e => { e.preventDefault(); renameActiveConversation(); optionsDropdown.classList.remove('show'); });
  if (dropdownDeleteBtn) dropdownDeleteBtn.addEventListener('click', e => { e.preventDefault(); deleteActiveConversation(); optionsDropdown.classList.remove('show'); });
  if (dropdownShareBtn) dropdownShareBtn.addEventListener('click', e => { e.preventDefault(); shareActiveConversation(); optionsDropdown.classList.remove('show'); });
  if (dropdownArchiveBtn) dropdownArchiveBtn.addEventListener('click', e => { e.preventDefault(); archiveActiveConversation(); optionsDropdown.classList.remove('show'); });
  if (dropdownReportBtn) dropdownReportBtn.addEventListener('click', e => { e.preventDefault(); reportActiveConversation(); optionsDropdown.classList.remove('show'); });

  if (suggestionPillsContainer) {
      suggestionPillsContainer.addEventListener('click', e => {
          const clickedPill = e.target.closest('.pill');
          if (clickedPill) {
              const pillText = clickedPill.querySelector('.pill-text').textContent;
              createNewConversation(pillText);
          }
      });
  }

  // ===================================
  // == 7. INITIALIZATION
  // ===================================
  function initializeApp() {
      if (document.getElementById('chat-area')) {
          loadConversations();

          const conversationIdFromUrl = getQueryParam('conversation_id');
          const projectIdFromUrl = getQueryParam('project_id');

          if (conversationIdFromUrl) {
              activeConversationId = conversationIdFromUrl;
              renderChatArea(activeConversationId);
          } else if (projectIdFromUrl) {
              activeProjectId = projectIdFromUrl;
              renderChatArea(null);
          } else {
              renderChatArea(null);
          }

          renderChatHistory();
      }
  }

  initializeApp();

});