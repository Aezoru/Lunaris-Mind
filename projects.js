document.addEventListener('DOMContentLoaded', function() {

    const addProjectBtn = document.getElementById('add-project-btn');
    const projectModal = document.getElementById('project-modal');
    const closeProjectModalBtn = document.getElementById('close-project-modal-btn');
    const projectForm = document.getElementById('project-form');
    const projectsGrid = document.getElementById('projects-grid');

    let projects = [];
    let conversations = [];

    function loadData() {
        const savedProjects = localStorage.getItem('lunaris-projects');
        projects = savedProjects ? JSON.parse(savedProjects) : [];

        const savedConvos = localStorage.getItem('lunaris-conversations');
        conversations = savedConvos ? JSON.parse(savedConvos) : [];
    }

    function saveData() {
        localStorage.setItem('lunaris-projects', JSON.stringify(projects));
        localStorage.setItem('lunaris-conversations', JSON.stringify(conversations));
    }

    function renderProjects() {
        if (!projectsGrid) return;
        projectsGrid.innerHTML = '';

        if (projects.length === 0) {
            projectsGrid.innerHTML = `<div class="placeholder-content" style="grid-column: 1 / -1;"><h2>لا توجد مشاريع بعد</h2><p>انقر على زر '+' في الأعلى لإنشاء مشروعك الأول.</p></div>`;
            return;
        }

        projects.forEach(project => {
            const convoCount = conversations.filter(c => c.projectId === project.id).length;
            const card = document.createElement('div');
            card.className = 'project-card';
            card.dataset.id = project.id;

            card.innerHTML = `
                <a href="project-view.html?id=${project.id}" class="project-card-main-content">
                    <h3>${project.name}</h3>
                    <p>${project.description || 'لا يوجد وصف لهذا المشروع.'}</p>
                    <div class="project-card-footer">
                        <span>${convoCount} محادثات</span>
                    </div>
                </a>
                <div class="project-options-container">
                    <button class="project-options-btn header-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="19" cy="12" r="1"></circle>
                            <circle cx="5" cy="12" r="1"></circle>
                        </svg>
                    </button>
                    <div class="options-dropdown">
                        <a href="#" class="dropdown-item edit-desc-btn"><span class="icon">&#128221;</span> تعديل المشروع</a>
                        <a href="#" class="dropdown-item danger-text delete-project-btn"><span class="icon">&#128465;</span> حذف المشروع</a>
                    </div>
                </div>
            `;
            projectsGrid.appendChild(card);
        });
    }

    function deleteProject(projectId) {
        if (confirm("هل أنت متأكد من حذف هذا المشروع؟ سيتم حذف جميع المحادثات المرتبطة به بشكل دائم!")) {
            projects = projects.filter(p => p.id !== projectId);
            conversations = conversations.filter(c => c.projectId !== projectId);
            saveData();
            renderProjects();
        }
    }

    function openEditModal(projectId) {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        const projectNameInput = document.getElementById('project-name');
        const projectDescInput = document.getElementById('project-description');
        projectNameInput.value = project.name;
        projectDescInput.value = project.description;

        projectModal.querySelector('h2').textContent = 'تعديل المشروع';
        projectModal.querySelector('button[type="submit"]').textContent = 'حفظ التعديلات';

        projectForm.dataset.editingId = projectId;

        openModal();
    }

    function openModal() { if (projectModal) projectModal.classList.add('is-visible'); }
    function closeModal() { if (projectModal) projectModal.classList.remove('is-visible'); }

    function handleFormSubmit(e) {
        e.preventDefault();
        const projectNameInput = document.getElementById('project-name');
        const projectDescInput = document.getElementById('project-description');
        const editingId = projectForm.dataset.editingId;

        if (editingId) {
            const projectToUpdate = projects.find(p => p.id === editingId);
            if (projectToUpdate) {
                projectToUpdate.name = projectNameInput.value.trim();
                projectToUpdate.description = projectDescInput.value.trim();
            }
        } else {
            const newProject = {
                id: 'proj-' + Date.now(),
                name: projectNameInput.value.trim(),
                description: projectDescInput.value.trim(),
                createdAt: new Date().toISOString()
            };
            projects.unshift(newProject);
        }

        saveData();
        renderProjects();

        projectForm.reset();
        delete projectForm.dataset.editingId;
        projectModal.querySelector('h2').textContent = 'إنشاء مشروع جديد';
        projectModal.querySelector('button[type="submit"]').textContent = 'إنشاء المشروع';

        closeModal();
    }

    // ✅ مستمع أحداث الشبكة الجديد
    if (projectsGrid) {
        projectsGrid.addEventListener('click', function(e) {
            // لا تفعل شيئاً إذا لم يكن النقر على زر داخل القائمة
            if (!e.target.closest('.dropdown-item')) {
                // إغلاق أي قائمة مفتوحة
                document.querySelectorAll('.project-card .options-dropdown.show').forEach(dropdown => {
                    dropdown.classList.remove('show');
                });
            }

            const optionsBtn = e.target.closest('.project-options-btn');
            const editBtn = e.target.closest('.edit-desc-btn');
            const deleteBtn = e.target.closest('.delete-project-btn');

            if (optionsBtn) {
                e.preventDefault();
                const dropdown = optionsBtn.nextElementSibling;
                dropdown.classList.toggle('show');
                return;
            }
            if (editBtn) {
                e.preventDefault();
                const projectId = editBtn.closest('.project-card').dataset.id;
                openEditModal(projectId);
                return;
            }
            if (deleteBtn) {
                e.preventDefault();
                const projectId = deleteBtn.closest('.project-card').dataset.id;
                deleteProject(projectId);
                return;
            }
        });
    }

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.project-options-container')) {
            document.querySelectorAll('.project-card .options-dropdown.show').forEach(dropdown => {
                dropdown.classList.remove('show');
            });
        }
    });

    if (addProjectBtn) addProjectBtn.addEventListener('click', openModal);
    if (closeProjectModalBtn) closeProjectModalBtn.addEventListener('click', closeModal);
    if (projectModal) projectModal.addEventListener('click', (e) => { if (e.target === projectModal) closeModal(); });
    if (projectForm) projectForm.addEventListener('submit', handleFormSubmit);

    loadData();
    renderProjects();

});