// js/library.js
document.addEventListener('DOMContentLoaded', function() {

    // ===================================
    // ==  1. ELEMENT SELECTION
    // ===================================
    const tabsContainer = document.querySelector('.tabs-container');
    const tabContents = document.querySelectorAll('.tab-content');
    const archiveContent = document.getElementById('archive-content');

    // ===================================
    // ==  2. DATA & STATE
    // ===================================
    let conversations = [];

    function loadConversations() {
        const saved = localStorage.getItem('lunaris-conversations');
        if (saved) {
            conversations = JSON.parse(saved);
        }
    }

    function saveConversations() {
        localStorage.setItem('lunaris-conversations', JSON.stringify(conversations));
    }

    // ===================================
    // ==  3. RENDER FUNCTIONS
    // ===================================
    function renderArchivedConversations() {
        if (!archiveContent) return;
        
        archiveContent.innerHTML = ''; // مسح المحتوى القديم
        const archived = conversations.filter(c => c.isArchived);

        if (archived.length === 0) {
            archiveContent.innerHTML = `
                <div class="placeholder-content">
                    <h2>لا توجد محادثات مؤرشفة</h2>
                    <p>عندما تقوم بأرشفة محادثة، ستظهر هنا.</p>
                </div>
            `;
            return;
        }

        const list = document.createElement('div');
        list.className = 'library-list';

        archived.forEach(convo => {
            const item = document.createElement('div');
            item.className = 'library-item';
            item.innerHTML = `
                <span class="library-item-title">${convo.title}</span>
                <button class="unarchive-btn" data-id="${convo.id}">إلغاء الأرشفة</button>
            `;
            list.appendChild(item);
        });

        archiveContent.appendChild(list);
    }

    // ===================================
    // ==  4. CORE FUNCTIONS
    // ===================================
    function unarchiveConversation(convoId) {
        const conversation = conversations.find(c => c.id === convoId);
        if (conversation) {
            conversation.isArchived = false;
            saveConversations();
            renderArchivedConversations(); // إعادة عرض القائمة المحدثة
        }
    }

    // ===================================
    // ==  5. EVENT LISTENERS
    // ===================================
    if (tabsContainer) {
        tabsContainer.addEventListener('click', function(e) {
            if (e.target.matches('.tab-btn')) {
                // إزالة 'active' من كل الأزرار والمحتويات
                tabsContainer.querySelector('.active').classList.remove('active');
                document.querySelector('.tab-content.active').classList.remove('active');

                // إضافة 'active' للزر والمحتوى المستهدف
                e.target.classList.add('active');
                const tabId = e.target.dataset.tab;
                document.getElementById(tabId + '-content').classList.add('active');
            }
        });
    }

    // مستمع حدث لإلغاء الأرشفة (باستخدام تفويض الأحداث)
    if (archiveContent) {
        archiveContent.addEventListener('click', function(e) {
            if (e.target.matches('.unarchive-btn')) {
                const convoId = e.target.dataset.id;
                unarchiveConversation(convoId);
            }
        });
    }

    // ===================================
    // ==  6. INITIALIZATION
    // ===================================
    loadConversations();
    renderArchivedConversations();
});
