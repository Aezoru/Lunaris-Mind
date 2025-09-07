// js/project-view.js (النسخة المحدثة)
document.addEventListener('DOMContentLoaded', function() {

    // ===================================
    // ==  1. ELEMENT SELECTION
    // ===================================
    const projectHeaderTitle = document.getElementById('project-header-title');
    const projectInfoCard = document.getElementById('project-info-card');
    const conversationsList = document.getElementById('project-conversations-list');
    const newChatBtn = document.getElementById('new-chat-in-project-btn');

    // ===================================
    // ==  2. DATA & STATE
    // ===================================
    let projects = [];
    let conversations = [];
    let currentProject = null;

    function loadData() {
        const savedProjects = localStorage.getItem('lunaris-projects');
        projects = savedProjects ? JSON.parse(savedProjects) : [];
        
        const savedConvos = localStorage.getItem('lunaris-conversations');
        conversations = savedConvos ? JSON.parse(savedConvos) : [];
    }

    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    // ===================================
    // ==  3. RENDER FUNCTIONS
    // ===================================
    function renderProjectDetails() {
        if (!currentProject) {
            document.body.innerHTML = '<h1>المشروع غير موجود أو تم حذفه.</h1><a href="projects.html">العودة للمشاريع</a>';
            return;
        }

        projectHeaderTitle.textContent = currentProject.name;

        projectInfoCard.innerHTML = `
            <h3>${currentProject.name}</h3>
            <p>${currentProject.description || 'لا يوجد وصف لهذا المشروع.'}</p>
            <div class="project-card-footer">
                <span>أنشئ في: ${new Date(currentProject.createdAt).toLocaleDateString('ar-SA')}</span>
            </div>
        `;

        renderProjectConversations();

        if (newChatBtn) {
            newChatBtn.href = `index.html?project_id=${currentProject.id}`;
        }
    }

    // ===================================
    // ==  RENDER CONVERSATIONS (مُحدث)
    // ===================================
    function renderProjectConversations() {
        if (!conversationsList) return;
        
        const projectConvos = conversations.filter(c => c.projectId === currentProject.id && !c.isArchived);

        if (projectConvos.length === 0) {
            conversationsList.innerHTML = `
                <div class="placeholder-content">
                    <h2>لا توجد محادثات بعد</h2>
                    <p>انقر على أيقونة القلم في الأعلى لبدء محادثتك الأولى في هذا المشروع.</p>
                </div>
            `;
        } else {
            conversationsList.innerHTML = ''; // مسح المحتوى القديم
            const list = document.createElement('div');
            list.className = 'library-list'; // ✅ إعادة استخدام نفس تنسيق المكتبة
            
            projectConvos.forEach(convo => {
                const item = document.createElement('a');
                item.className = 'library-item';
                // ✅ توجيه الرابط إلى المحادثة الصحيحة
                item.href = `index.html?conversation_id=${convo.id}`; 
                item.innerHTML = `
                    <span class="library-item-title">${convo.title}</span>
                    <span>${convo.messages.length} رسائل</span>
                `;
                list.appendChild(item);
            });
            conversationsList.appendChild(list);
        }
    }

    // ===================================
    // ==  4. INITIALIZATION
    // ===================================
    const projectId = getQueryParam('id');
    loadData();
    currentProject = projects.find(p => p.id === projectId);
    
    renderProjectDetails();
});