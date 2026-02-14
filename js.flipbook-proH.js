
	
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

        // =============================================
        // 🛠️ DYNAMIC INTERFACE INJECTION
        // =============================================
        const appInterfaceHTML = `
            <audio id="fbpH-sound" src="https://assets.mixkit.co/active_storage/sfx/2070/2070-preview.mp3"></audio>
            <div id="fbpH-toast" class="fbpH-toast">Bookmark saved!</div>

            <div id="fbpH-loader" class="fbpH-loader-container">
                <div class="fbpH-loader"></div>
                <div id="fbpH-loader-text" class="fbpH-loader-text">Initializing...</div>
            </div>

            <div id="fbpH-popup" class="fbpH-overlay">
                <div id="fbpH-btn-close" class="fbpH-close-btn" title="Close App"><i class="fas fa-times"></i></div>
                
                <!-- Thumb Sidebar -->
                <div class="fbpH-sidebar" id="fbpH-sidebar">
                    <div class="fbpH-sidebar-header">
                        <span>Page list</span>
                        <div id="fbpH-sidebar-close" class="fbpH-sidebar-close-icon" title="Close List">
                            <i class="fas fa-times"></i>
                        </div>
                    </div>
                    <div id="fbpH-thumb-container"></div>
                </div>

                <!-- Search Panel -->
                <div class="fbpH-search-panel" id="fbpH-search-panel">
                     <div class="fbpH-sidebar-header">
                        <span>Search</span>
                        <div id="fbpH-search-close" class="fbpH-sidebar-close-icon" title="Close Search">
                            <i class="fas fa-times"></i>
                        </div>
                    </div>
                    <div class="fbpH-search-box">
                        <input type="text" id="fbpH-search-input" class="fbpH-search-input" placeholder="Type text...">
                        <button id="fbpH-search-go" class="fbpH-search-btn-go">GO</button>
                    </div>
                    <div id="fbpH-search-results">
                        <div style="text-align:center; color:#666; margin-top:20px;">Enter keyword to search...</div>
                    </div>
                </div>

                <div class="fbpH-arrow fbpH-prev" id="fbpH-float-prev"><i class="fas fa-chevron-left"></i></div>
                <div class="fbpH-arrow fbpH-next" id="fbpH-float-next"><i class="fas fa-chevron-right"></i></div>

                <div class="fbpH-stage" id="fbpH-stage">
                    <div class="fbpH-zoom-layer" id="fbpH-zoom-layer"></div>
                </div>

                <div class="fbpH-controls" id="fbpH-controls">
                    <button class="fbpH-btn" id="fbpH-btn-thumbs" title="Toggle Page List"><i class="fas fa-th-large"></i></button>
                    <button class="fbpH-btn" id="fbpH-btn-search" title="Search"><i class="fas fa-search"></i></button> 
<!-- Search Button এর পরে এই লাইনটি যোগ করুন -->
<button class="fbpH-btn" id="fbpH-btn-audio" title="Audiobook Mode"><i class="fas fa-headphones"></i></button>					
                    <div class="fbpH-divider"></div>
                    <button class="fbpH-btn" id="fbpH-btn-autoplay" title="Auto Play"><i class="fas fa-play"></i></button>
                    <button class="fbpH-btn" id="fbpH-btn-bookmark" title="Bookmark"><i class="far fa-bookmark"></i></button>
                    <button class="fbpH-btn" id="fbpH-btn-load-mark" style="display:none; color: var(--fbpH-accent);" title="Go to Bookmark"><i class="fas fa-history"></i></button>
                    <div class="fbpH-divider"></div>
                    <button class="fbpH-btn" id="fbpH-btn-zoom-out" title="Zoom Out"><i class="fas fa-minus"></i></button>
                    <button class="fbpH-btn" id="fbpH-btn-zoom-in" title="Zoom In"><i class="fas fa-plus"></i></button>
                    <button class="fbpH-btn" id="fbpH-btn-fullscreen" title="Full Screen"><i class="fas fa-expand"></i></button>
                    <div class="fbpH-divider"></div>
                    <input type="number" id="fbpH-page-input" class="fbpH-page-input" value="0">
                    <span class="fbpH-total-page">/ <span id="fbpH-total-pages">0</span></span>
                </div>
            </div>
        `;
        
        document.getElementById('fbpH-root').insertAdjacentHTML('beforeend', appInterfaceHTML);



        let bookElement = null; 
        const zoomLayer = document.getElementById('fbpH-zoom-layer');
        const bookStage = document.getElementById('fbpH-stage');
        const loader = document.getElementById('fbpH-loader');
        const loaderText = document.getElementById('fbpH-loader-text');
        const controls = document.getElementById('fbpH-controls');
        
        // Panels
        const sidebar = document.getElementById('fbpH-sidebar');
        const searchPanel = document.getElementById('fbpH-search-panel');
        
        const thumbContainer = document.getElementById('fbpH-thumb-container');
        const toast = document.getElementById('fbpH-toast');
        const popup = document.getElementById('fbpH-popup');
        const fileUploadInput = document.getElementById('fbpH-file-upload');
        
        // Buttons
        const btnThumbs = document.getElementById('fbpH-btn-thumbs');
        const btnSearch = document.getElementById('fbpH-btn-search');
        const sidebarCloseBtn = document.getElementById('fbpH-sidebar-close');
        const searchCloseBtn = document.getElementById('fbpH-search-close');
        
        const floatPrev = document.getElementById('fbpH-float-prev');
        const floatNext = document.getElementById('fbpH-float-next');
        const pageInput = document.getElementById('fbpH-page-input');
        const totalPagesSpan = document.getElementById('fbpH-total-pages');
        
        // Search UI
        const searchInput = document.getElementById('fbpH-search-input');
        const searchBtnGo = document.getElementById('fbpH-search-go');
        const searchResultsDiv = document.getElementById('fbpH-search-results');

        let pageFlip = null;
        let currentZoom = 1; let minZoom = 1; 
        const ZOOM_MID = 1.08; const ZOOM_MAX = 1.8;
        let zoomDirection = 1;
        
        let isDragging = false;
        let startX, startY, translateX = 0, translateY = 0;
        let lastMoveX = 0, lastMoveY = 0;
        let velocityX = 0, velocityY = 0;
        let animationFrameId = null; 
        let clickStartX = 0; let clickStartY = 0;

        let autoPlayInterval = null; let isAutoPlaying = false;
        const STORAGE_KEY = 'fbpH_save_point';
        const flipSound = document.getElementById('fbpH-sound');
        if(flipSound) flipSound.volume = 0.2;

        const RENDER_SCALE = 1.8; 
        const PAGE_WIDTH = 595 * RENDER_SCALE; 
        const PAGE_HEIGHT = 842 * RENDER_SCALE; 
        
        let globalPdfDoc = null; 
        let pageDataMap = [];    
		let currentSearchQuery = ""; // সার্চ টেক্সট জমা রাখার জন্য
		
		
		
		
        // --- Initialize Library ---
function renderLibrary() {
            const container = document.getElementById('fbpH-library-container');
            container.innerHTML = '';
            libraryData.forEach((book) => {
                const card = document.createElement('div');
                card.className = 'fbpH-book-card';
                let coverHTML = `<i class="fas fa-book"></i>`;
                if(book.cover && book.cover.startsWith('http')) {
                    coverHTML = `<img src="${book.cover}" alt="${book.title}" onerror="this.style.display='none';this.parentNode.innerHTML='<i class=&quot;fas fa-book&quot;></i>'">`;
                }
                card.innerHTML = `<div class="fbpH-book-cover">${coverHTML}</div><div class="fbpH-book-title">${book.title}</div>`;
                
                // 🔥 পরিবর্তন: এখানে book.id পাঠানো হচ্ছে
                card.addEventListener('click', () => loadBookFromURL(book.url, book.title, book.id));
                
                container.appendChild(card);
            });
        }
        renderLibrary();

        // --- App Logic ---
        function resetApplication() {
            if (pageFlip) { try { pageFlip.destroy(); } catch(e) {} pageFlip = null; }
            zoomLayer.innerHTML = '';
            bookElement = document.createElement('div');
            bookElement.id = 'fbpH-book';
            zoomLayer.appendChild(bookElement);
            thumbContainer.innerHTML = '';
            currentZoom = 1; translateX = 0; translateY = 0; zoomDirection = 1;
            
            globalPdfDoc = null;
            pageDataMap = [];

            updateZoom(); stopAutoPlay();
            sidebar.classList.remove('active'); btnThumbs.classList.remove('active-btn');
            searchPanel.classList.remove('active'); btnSearch.classList.remove('active-btn');
            
            totalPagesSpan.innerText = '0'; pageInput.value = '0';
            searchResultsDiv.innerHTML = '<div style="text-align:center; color:#666; margin-top:20px;">Enter keyword to search...</div>';
            searchInput.value = '';
        }

        function autoResizeBook() {
            if (window.getComputedStyle(popup).display === 'none') return;
            const availableHeight = bookStage.clientHeight;
            const availableWidth = bookStage.clientWidth;
            const baseWidth = PAGE_WIDTH * 2;
            const baseHeight = PAGE_HEIGHT;
            const scaleX = availableWidth / baseWidth;
            const scaleY = availableHeight / baseHeight;
            let scaleToFit = Math.min(scaleX, scaleY);
            scaleToFit = scaleToFit * 0.96; 
            minZoom = scaleToFit; currentZoom = scaleToFit;
            translateX = 0; translateY = 0; zoomDirection = 1; 
            updateZoom();
        }
        window.addEventListener('resize', autoResizeBook);

        // =============================================
        // 🖱️ ZOOM, PAN & SELECTION LOGIC
        // =============================================
        function updateZoom() {
            if (currentZoom <= minZoom) { currentZoom = minZoom; translateX = 0; translateY = 0; zoomDirection = 1; }
            
            let centeringOffset = 0;
            if (pageFlip && pageFlip.getCurrentPageIndex() === 0) centeringOffset = -(PAGE_WIDTH) / 2;
            
            const finalX = translateX + (centeringOffset * currentZoom);
            zoomLayer.style.transform = `translate(${finalX}px, ${translateY}px) scale(${currentZoom})`;
            
            if (isDragging) { 
                bookStage.style.cursor = 'grabbing'; 
                if(bookElement) bookElement.style.cursor = 'grabbing';
            } 
            else {
                bookStage.style.cursor = 'default'; 
                if (bookElement) {
                    if (currentZoom >= ZOOM_MAX - 0.05) bookElement.style.cursor = 'zoom-out';
                    else if (currentZoom <= minZoom + 0.05) bookElement.style.cursor = 'zoom-in';
                    else bookElement.style.cursor = (zoomDirection === 1) ? 'zoom-in' : 'zoom-out';
                }
            }
        }
        
        bookStage.addEventListener('wheel', (e) => {
            if (e.ctrlKey) return; e.preventDefault();
            const zoomSpeed = 0.15; zoomLayer.classList.remove('no-transition');
            if (e.deltaY < 0) { if (currentZoom < ZOOM_MAX) currentZoom += zoomSpeed; if (currentZoom >= ZOOM_MAX) zoomDirection = -1; } 
            else { if (currentZoom > minZoom) currentZoom -= zoomSpeed; if (currentZoom <= minZoom) zoomDirection = 1; }
            updateZoom();
        }, { passive: false });



// ✅ এই নতুন কোডটুকু বসান ✅

        // ১. মাউস ও টাচ পজিশন বের করার ফাংশন
        function getPointerPosition(e) {
            if (e.touches && e.touches.length > 0) {
                return { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
            return { x: e.clientX, y: e.clientY };
        }

        // ২. ড্র্যাগ শুরু (MouseDown / TouchStart)
        function handleDragStart(e) {
            // বাটন বা লিংকে টাচ করলে ড্র্যাগ হবে না
            if (e.target.tagName === 'A' || 
                e.target.closest('.linkAnnotation') || 
                e.target.closest('.fbpH-hotspot-dot') || 
                e.target.closest('.fbpH-product-modal') ||
                e.target.closest('.fbpH-controls') || 
                e.target.closest('.fbpH-arrow')) { 
                return; 
            }

            // টেক্সট সিলেকশন আটকাতে
            if (e.target.closest('.textLayer > span')) { 
                // টেক্সট কপি করার জন্য অনুমতি দিতে চাইলে নিচের লাইনটি কমেন্ট করে রাখুন
                // return; 
            }

            isDragging = true; 
            bookStage.classList.add('fbpH-grabbing-mode'); 

            const pos = getPointerPosition(e);
            clickStartX = pos.x; 
            clickStartY = pos.y;
            
            startX = pos.x - translateX; 
            startY = pos.y - translateY;
            
            lastMoveX = pos.x; 
            lastMoveY = pos.y; 
            velocityX = 0; 
            velocityY = 0;
            
            zoomLayer.classList.add('no-transition'); 
            
            // টাচ ডিভাইসে স্ক্রল বন্ধ করা (যদি জুম করা থাকে)
            if(e.type === 'touchstart' && currentZoom > minZoom) {
               // e.preventDefault(); // প্রয়োজনে এটি অন করতে পারেন
            }
        }

        // ৩. ড্র্যাগ করা (MouseMove / TouchMove)
        function handleDragMove(e) {
            if (!isDragging) return;

            // মোবাইলে ডিফল্ট স্ক্রল বন্ধ করা যাতে বই মুভ করা যায়
            if (e.cancelable && (currentZoom > minZoom || isDragging)) {
                e.preventDefault(); 
            }

            if (!animationFrameId) {
                animationFrameId = requestAnimationFrame(() => {
                    const pos = getPointerPosition(e);

                    velocityX = pos.x - lastMoveX; 
                    velocityY = pos.y - lastMoveY;
                    lastMoveX = pos.x; 
                    lastMoveY = pos.y;
                    
                    translateX = pos.x - startX; 
                    translateY = pos.y - startY; 
                    
                    updateZoom(); 
                    animationFrameId = null;
                });
            }
        }

        // ৪. ড্র্যাগ শেষ (MouseUp / TouchEnd)
        function handleDragEnd(e) {
            if (!isDragging) return;
            
            isDragging = false; 
            bookStage.classList.remove('fbpH-grabbing-mode');
            
            if (animationFrameId) cancelAnimationFrame(animationFrameId); 
            animationFrameId = null;
            zoomLayer.classList.remove('no-transition'); 
            
            // ক্লিক নাকি ড্র্যাগ ছিল তা চেক করা
            // TouchEnd এ clientX থাকে না, তাই lastMoveX ব্যবহার করা হলো
            const endX = (e.changedTouches && e.changedTouches.length > 0) ? e.changedTouches[0].clientX : lastMoveX;
            const endY = (e.changedTouches && e.changedTouches.length > 0) ? e.changedTouches[0].clientY : lastMoveY;

            const moveDist = Math.sqrt(Math.pow(endX - clickStartX, 2) + Math.pow(endY - clickStartY, 2));
            
            if (moveDist < 10) { 
                handleBookClick(e); 
            } else {
                // মোমেন্টাম ইফেক্ট (Momentum)
                translateX += velocityX * 12; 
                translateY += velocityY * 12;
                
                // বাউন্ডারি চেক (বই স্ক্রিনের বাইরে না যাওয়া)
                const stageW = bookStage.clientWidth; const stageH = bookStage.clientHeight;
                const bookTotalW = (PAGE_WIDTH * 2) * currentZoom;
                const bookTotalH = (PAGE_HEIGHT) * currentZoom;
                
                let maxPanX = (bookTotalW - stageW) / 2; 
                let maxPanY = (bookTotalH - stageH) / 2;
                
                if (maxPanX < 0) maxPanX = 0; 
                if (maxPanY < 0) maxPanY = 0;
                
                if (translateX > maxPanX) translateX = maxPanX; 
                else if (translateX < -maxPanX) translateX = -maxPanX;
                
                if (translateY > maxPanY) translateY = maxPanY; 
                else if (translateY < -maxPanY) translateY = -maxPanY;
                
                updateZoom();
            }
        }

        // ৫. ইভেন্ট লিসেনার যুক্ত করা (মাউস + টাচ)
        bookStage.addEventListener('mousedown', handleDragStart);
        bookStage.addEventListener('touchstart', handleDragStart, { passive: false });

        // উইন্ডোতে ইভেন্ট দেওয়া হয়েছে যাতে মাউস বাইরে গেলেও কাজ করে
        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('touchmove', handleDragMove, { passive: false });

        window.addEventListener('mouseup', handleDragEnd);
        window.addEventListener('touchend', handleDragEnd);
        
        // মাউস স্টেজ থেকে বেরিয়ে গেলে সেফটি চেক
        bookStage.addEventListener('mouseleave', () => { 
           if(isDragging && !('ontouchstart' in window)) { // শুধুমাত্র ডেস্কটপের জন্য
               isDragging = false;
               bookStage.classList.remove('fbpH-grabbing-mode');
               zoomLayer.classList.remove('no-transition');
           }
        });





        function handleBookClick(e) {
            if (e.target.closest('.fbpH-controls') || e.target.closest('.fbpH-sidebar') || e.target.closest('.fbpH-search-panel') || e.target.closest('.fbpH-arrow')) return;
            if (e.target.tagName === 'A' || e.target.closest('.linkAnnotation') || e.target.closest('.fbpH-hotspot-dot') || e.target.closest('.fbpH-product-modal')) return;
            
            const selection = window.getSelection();
            if (selection.toString().length > 0) return;

            if (!e.target.closest('#fbpH-book')) return;

            if (Math.abs(currentZoom - minZoom) < 0.1) { currentZoom = ZOOM_MID; zoomDirection = 1; } 
            else if (Math.abs(currentZoom - ZOOM_MAX) < 0.1) { currentZoom = ZOOM_MID; zoomDirection = -1; } 
            else { if (zoomDirection === 1) currentZoom = ZOOM_MAX; else { currentZoom = minZoom; translateX = 0; translateY = 0; zoomDirection = 1; } }
            updateZoom();
        }

        document.getElementById('fbpH-btn-zoom-in').addEventListener('click', () => { if (currentZoom < ZOOM_MAX) { currentZoom += 0.25; if (currentZoom > ZOOM_MAX) currentZoom = ZOOM_MAX; if(currentZoom >= ZOOM_MAX) zoomDirection = -1; updateZoom(); } });
        document.getElementById('fbpH-btn-zoom-out').addEventListener('click', () => { if (currentZoom > minZoom) { currentZoom -= 0.25; if (currentZoom < minZoom) currentZoom = minZoom; if(currentZoom <= minZoom) zoomDirection = 1; updateZoom(); } });

        // --- CORE PAGEFLIP ---
        function initFlipBook() {
            pageFlip = new St.PageFlip(bookElement, {
                width: PAGE_WIDTH, height: PAGE_HEIGHT,
                size: 'fixed', minWidth: 200, maxWidth: 8000, minHeight: 300, maxHeight: 8000,
                showCover: true, usePortrait: false, flippingTime: 800, 
                useMouseEvents: false, maxShadowOpacity: 0.3
            });
            
            pageFlip.on('flip', (e) => { 
                updatePageInfo(); 
                playSound(); 
                checkBookmarkIcon(); 
                updateZoom();
                manageMemoryAndRender(e.data);
                
                // 🔥 Close Modals on Flip via Manager
                if(typeof HotspotManager !== 'undefined') HotspotManager.closeAllModals();
            });
            
            setTimeout(() => {
                autoResizeBook();
                manageMemoryAndRender(0); 
            }, 100);
        }

        function playSound() { if(flipSound){ flipSound.currentTime = 0; flipSound.play().catch(() => {}); } }
        function updatePageInfo() { if(pageFlip) pageInput.value = (pageFlip.getCurrentPageIndex() + 1); }
        
        // --- Sidebar & Search Toggles ---
        btnThumbs.addEventListener('click', () => { 
            sidebar.classList.toggle('active'); btnThumbs.classList.toggle('active-btn'); 
            searchPanel.classList.remove('active'); btnSearch.classList.remove('active-btn');
        });
        sidebarCloseBtn.addEventListener('click', () => { sidebar.classList.remove('active'); btnThumbs.classList.remove('active-btn'); });
        
        btnSearch.addEventListener('click', () => { 
            searchPanel.classList.toggle('active'); btnSearch.classList.toggle('active-btn'); 
            sidebar.classList.remove('active'); btnThumbs.classList.remove('active-btn');
            setTimeout(()=> searchInput.focus(), 100);
        });
        searchCloseBtn.addEventListener('click', () => { searchPanel.classList.remove('active'); btnSearch.classList.remove('active-btn'); });

        const btnAutoPlay = document.getElementById('fbpH-btn-autoplay');
        btnAutoPlay.addEventListener('click', () => { if (isAutoPlaying) stopAutoPlay(); else startAutoPlay(); });
        function startAutoPlay() { isAutoPlaying = true; btnAutoPlay.innerHTML = '<i class="fas fa-pause"></i>'; btnAutoPlay.classList.add('active-btn'); autoPlayInterval = setInterval(() => { if (pageFlip.getCurrentPageIndex() < pageFlip.getPageCount() - 1) pageFlip.flipNext(); else stopAutoPlay(); }, 3000); }
        function stopAutoPlay() { isAutoPlaying = false; btnAutoPlay.innerHTML = '<i class="fas fa-play"></i>'; btnAutoPlay.classList.remove('active-btn'); clearInterval(autoPlayInterval); }
        
        floatNext.addEventListener('click', () => { if(pageFlip) pageFlip.flipNext(); stopAutoPlay(); });
        floatPrev.addEventListener('click', () => { if(pageFlip) pageFlip.flipPrev(); stopAutoPlay(); });

        const btnBookmark = document.getElementById('fbpH-btn-bookmark');
        const btnLoadMark = document.getElementById('fbpH-btn-load-mark');
        function checkSavedBookmark() { const saved = localStorage.getItem(STORAGE_KEY); if(saved) { btnLoadMark.style.display = 'flex'; return parseInt(saved); } return null; }
        function checkBookmarkIcon() { const saved = checkSavedBookmark(); const current = pageFlip.getCurrentPageIndex(); if (saved !== null && Math.abs(saved - current) <= 1) btnBookmark.innerHTML = '<i class="fas fa-bookmark"></i>'; else btnBookmark.innerHTML = '<i class="far fa-bookmark"></i>'; }
        btnBookmark.addEventListener('click', () => { localStorage.setItem(STORAGE_KEY, pageFlip.getCurrentPageIndex()); showToast('Bookmark saved!'); checkBookmarkIcon(); btnLoadMark.style.display = 'flex'; });
        btnLoadMark.addEventListener('click', () => { const saved = checkSavedBookmark(); if (saved !== null) { pageFlip.flip(saved); showToast('Bookmark loaded.'); } });
        function showToast(msg) { toast.innerText = msg; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2000); }
        
        document.getElementById('fbpH-btn-close').addEventListener('click', () => {
            resetApplication();
            popup.classList.remove('active'); 
            setTimeout(() => { popup.style.display = 'none'; }, 500);
            controls.classList.remove('active'); sidebar.classList.remove('active'); searchPanel.classList.remove('active');
            fileUploadInput.value = '';
        });

        // --- File Upload Logic ---
        fileUploadInput.addEventListener('change', async function(e) {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;
            resetApplication();
            popup.style.display = 'flex'; setTimeout(() => { popup.classList.add('active'); }, 10);
            loader.style.display = 'flex';
            const firstFile = files[0];
            try {
                if (firstFile.type === 'application/pdf') {
                    const arrayBuffer = await readFileAsArrayBuffer(firstFile);
                    await renderPDFBytes(arrayBuffer);
                }
                else if (firstFile.type.startsWith('image/')) await processImages(files);
                else { alert('PDF or Image required.'); loader.style.display = 'none'; popup.style.display = 'none'; }
            } catch (error) {
                console.error("Load Error:", error); alert("Error loading file."); resetApplication(); loader.style.display = 'none'; popup.style.display = 'none';
            }
        });

async function loadBookFromURL(url, title, bookId = null) {
    resetApplication();
    
    // ১. লাইব্রেরি ডাটা থেকে বর্তমান বইয়ের কনফিগারেশন খুঁজে বের করা
    const currentBookData = libraryData.find(b => b.id === bookId);
    
    // ২. LeadGen কনফিগার করা (যদি ডাটা পাওয়া যায়)
    if(typeof LeadGen !== 'undefined') {
        if (currentBookData && currentBookData.leadGenConfig) {
            // যদি কনফিগ থাকে তবে সেটি পাস করুন
            LeadGen.setConfig(currentBookData.leadGenConfig, bookId);
        } else {
            // যদি কনফিগ না থাকে তবে ফিচারটি বন্ধ রাখুন
            LeadGen.setConfig({ enabled: false }, bookId);
        }
    }

    // ৩. বাকি ম্যানেজার কনফিগারেশন
    if(bookId) {
        if(typeof HotspotManager !== 'undefined') HotspotManager.setActiveBook(bookId);
        if(typeof MediaManager !== 'undefined') MediaManager.setActiveBook(bookId);
    }

    // ... বাকি লোডিং কোড যেমন আছে তেমনই থাকবে ...
    popup.style.display = 'flex'; setTimeout(() => { popup.classList.add('active'); }, 10);
    loader.style.display = 'flex';
    loaderText.innerText = `Downloading: ${title}...`;
    
    // ... fetch and render logic ...
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Fetch failed");
        const arrayBuffer = await response.arrayBuffer();
        await renderPDFBytes(arrayBuffer);
    } catch (err) {
        console.error(err); alert("Network error. Cannot load book."); 
        loader.style.display = 'none'; popup.classList.remove('active');
    }
}

        function createInfoCover() {
            const div = document.createElement('div');
            div.className = 'fbpH-page fbpH-page-cover ';
            div.setAttribute('data-density', 'hard'); 
            div.style.cssText = `width: ${PAGE_WIDTH}px; height: ${PAGE_HEIGHT}px; background: linear-gradient(135deg, #1e272e 0%, #000000 100%); overflow: hidden;`;
            div.innerHTML = `<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; width: 90%; color: #ccc;"><i class="fas fa-book-reader" style="font-size: 100px; margin-bottom: 25px;"></i><h2 style="font-family: 'Poppins'; font-size: 30px; margin: 0;">FlipBook Pro</h2></div>`;
            return div;
        }

        async function renderPDFBytes(arrayBuffer) {
            try {
                const typedarray = new Uint8Array(arrayBuffer);
                globalPdfDoc = await pdfjsLib.getDocument(typedarray).promise;
                
                loaderText.innerText = `Analyzing ${globalPdfDoc.numPages} pages...`;
                
                let createdPagesCount = 0;
                pageDataMap = []; 

                const firstPage = await globalPdfDoc.getPage(1);
                const firstVp = firstPage.getViewport({ scale: 1 });
                if (firstVp.width > firstVp.height) {
                    bookElement.appendChild(createInfoCover());
                    pageDataMap.push({ isRendered: true, type: 'cover' }); 
                    createdPagesCount++;
                }

                for (let i = 1; i <= globalPdfDoc.numPages; i++) {
                    const page = await globalPdfDoc.getPage(i);
                    const viewport = page.getViewport({ scale: 1 });
                    const isLandscape = viewport.width > viewport.height;
                    
                    if (isLandscape) {
                        const p1 = createPlaceholder(createdPagesCount);
                        bookElement.appendChild(p1);
                        pageDataMap.push({ 
                            index: createdPagesCount, pdfIndex: i, side: 'left', isSplit: true, 
                            element: p1, isRendered: false 
                        });
                        createdPagesCount++;

                        const p2 = createPlaceholder(createdPagesCount);
                        bookElement.appendChild(p2);
                        pageDataMap.push({ 
                            index: createdPagesCount, pdfIndex: i, side: 'right', isSplit: true, 
                            element: p2, isRendered: false 
                        });
                        createdPagesCount++;
                    } else {
                        const p = createPlaceholder(createdPagesCount);
                        bookElement.appendChild(p);
                        pageDataMap.push({ 
                            index: createdPagesCount, pdfIndex: i, side: 'full', isSplit: false, 
                            element: p, isRendered: false 
                        });
                        createdPagesCount++;
                    }
                }

                totalPagesSpan.innerText = createdPagesCount;
                finishLoading();
                generateThumbnails(globalPdfDoc);

            } catch (err) { console.error(err); alert("PDF Error."); resetApplication(); }
        }

        function createPlaceholder(index) {
            const div = document.createElement('div');
            div.className = 'fbpH-page';
            div.setAttribute('data-density', 'hard'); // HARD PAGES
            div.id = `fbpH-page-${index}`;
            div.innerHTML = `
                <div class="page-loader" style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); color:#444;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 30px;"></i>
                </div>
            `;
            return div;
        }

        // --- AGGRESSIVE PRE-LOADING LOGIC ---
        async function manageMemoryAndRender(currentIndex) {
            if(!globalPdfDoc && !pageDataMap.length) return;

            const range = 3; 
            const startIndex = Math.max(0, currentIndex - range);
            const endIndex = Math.min(pageDataMap.length - 1, currentIndex + range);

            // 1. UNLOAD
            pageDataMap.forEach((data) => {
                if (data.type === 'cover') return;
                if ((data.index < startIndex || data.index > endIndex) && data.isRendered) {
                    unloadPage(data);
                }
            });

            // 2. QUEUE
            const loadQueue = [];
            loadQueue.push(currentIndex);
            const currentData = pageDataMap[currentIndex];
            if(currentData && currentData.isSplit) {
                if(currentData.side === 'left' && currentIndex + 1 <= endIndex) loadQueue.push(currentIndex + 1);
                if(currentData.side === 'right' && currentIndex - 1 >= startIndex) loadQueue.push(currentIndex - 1);
            }
            if(currentIndex + 1 <= endIndex && !loadQueue.includes(currentIndex + 1)) loadQueue.push(currentIndex + 1);
            if(currentIndex + 2 <= endIndex && !loadQueue.includes(currentIndex + 2)) loadQueue.push(currentIndex + 2);
            if(currentIndex + 3 <= endIndex && !loadQueue.includes(currentIndex + 3)) loadQueue.push(currentIndex + 3);
            if(currentIndex - 1 >= startIndex && !loadQueue.includes(currentIndex - 1)) loadQueue.push(currentIndex - 1);
            if(currentIndex - 2 >= startIndex && !loadQueue.includes(currentIndex - 2)) loadQueue.push(currentIndex - 2);

            for (let i of loadQueue) {
                const data = pageDataMap[i];
                if (data && !data.isRendered && data.type !== 'cover') {
                    await renderSinglePageHighRes(data);
                    await new Promise(r => setTimeout(r, 20));
                }
            }
        }

        function unloadPage(data) {
            data.element.innerHTML = `
                <div class="page-loader" style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); color:#444;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 30px;"></i>
                </div>
            `;
            data.isRendered = false;
        }

async function renderSinglePageHighRes(data) {
    if (data.isRendered || !globalPdfDoc) return;
    data.isRendered = true; 

    try {
        const page = await globalPdfDoc.getPage(data.pdfIndex);
        
        const canvas = document.createElement('canvas');
        canvas.width = PAGE_WIDTH; 
        canvas.height = PAGE_HEIGHT;
        
        let viewport;

        if (data.isSplit) {
            const unscaledVp = page.getViewport({ scale: 1 });
            const scale = PAGE_HEIGHT / unscaledVp.height;
            viewport = page.getViewport({ scale: scale });
            
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = viewport.width; tempCanvas.height = viewport.height;
            
            await page.render({ canvasContext: tempCanvas.getContext('2d'), viewport }).promise;
            
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
            
            const splitW = viewport.width / 2;
            const srcX = (data.side === 'left') ? 0 : splitW;
            
            ctx.drawImage(tempCanvas, srcX, 0, splitW, viewport.height, 0, 0, PAGE_WIDTH, PAGE_HEIGHT);
            tempCanvas.width = 0; tempCanvas.height = 0; 

            let textOffsetLeft = 0;
            if (data.side === 'right') textOffsetLeft = -PAGE_WIDTH;
            renderTextAndLinks(page, viewport, data.element, textOffsetLeft, 0);

        } else {
            const unscaledVp = page.getViewport({ scale: 1 });
            const scale = Math.min(PAGE_WIDTH / unscaledVp.width, PAGE_HEIGHT / unscaledVp.height);
            viewport = page.getViewport({ scale: scale });

            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
            const drawX = (PAGE_WIDTH - viewport.width) / 2;
            const drawY = (PAGE_HEIGHT - viewport.height) / 2;
            
            ctx.translate(drawX, drawY);
            await page.render({ canvasContext: ctx, viewport }).promise;
            ctx.translate(-drawX, -drawY);
            
            renderTextAndLinks(page, viewport, data.element, drawX, drawY);
        }

        // Remove loader, add Canvas and Text
        const oldContent = data.element.querySelectorAll('.page-loader');
        oldContent.forEach(el => el.remove());
        
        if (data.element.firstChild) {
            data.element.insertBefore(canvas, data.element.firstChild);
        } else {
            data.element.appendChild(canvas);
        }
        
        // 🔥 ২. Hotspots রেন্ডার করা
        if(typeof HotspotManager !== 'undefined') {
            HotspotManager.render(data.index, data.element);
        }

        // 🔥 ৩. Media Embeds রেন্ডার করা (নতুন)
        if(typeof MediaManager !== 'undefined') {
            MediaManager.render(data.index, data.element);
        }

    } catch (e) {
        console.error("Render Error Page " + data.index, e);
        data.isRendered = false; 
    }
}

        // =============================================
        // 🔍 SEARCH LOGIC
        // =============================================
        searchBtnGo.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') performSearch(); });

async function performSearch() {
    // ১. গ্লোবাল ভেরিয়েবলে সার্চ টেক্সট সেট করা
    const rawQuery = searchInput.value.trim();
    currentSearchQuery = rawQuery.toLowerCase(); // হাইলাইটের জন্য সেভ করা হলো

    if (!rawQuery || !globalPdfDoc) {
        // সার্চ ক্লিয়ার করলে হাইলাইট মুছে ফেলার জন্য
        currentSearchQuery = "";
        // পেজ রিফ্রেশ বা ক্লাস রিমুভ করা যেতে পারে, তবে সহজ উপায় হলো:
        return; 
    }

    searchResultsDiv.innerHTML = '<div style="text-align:center; padding:20px;"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';
    
    const results = [];
    
    try {
        for (let i = 1; i <= globalPdfDoc.numPages; i++) {
            const page = await globalPdfDoc.getPage(i);
            const textContent = await page.getTextContent();
            const textItems = textContent.items.map(item => item.str).join(' ');
            
            if (textItems.toLowerCase().includes(currentSearchQuery)) {
                const lowerText = textItems.toLowerCase();
                const idx = lowerText.indexOf(currentSearchQuery);
                const start = Math.max(0, idx - 20);
                const end = Math.min(textItems.length, idx + 40);
                let snippet = textItems.substring(start, end);
                
                // সাইডবারের রেজাল্টেও হাইলাইট দেখানো
                const regex = new RegExp(`(${currentSearchQuery})`, 'gi');
                snippet = snippet.replace(regex, '<span class="fbpH-search-highlight">$1</span>');

                results.push({ pageIndex: i, snippet: snippet });
            }
        }

        // ২. রেজাল্ট দেখানোর পর বর্তমান পেজে হাইলাইট আপডেট করা
        updateVisibleHighlights();

        searchResultsDiv.innerHTML = '';
        if (results.length === 0) {
            searchResultsDiv.innerHTML = '<div style="text-align:center; color:#ccc; margin-top:20px;">No matches found.</div>';
        } else {
            results.forEach(res => {
                const item = document.createElement('div');
                item.className = 'fbpH-search-item';
                item.innerHTML = `
                    <div class="fbpH-search-page-num">Page ${res.pageIndex}</div>
                    <div class="fbpH-search-text">...${res.snippet}...</div>
                `;
                item.addEventListener('click', () => {
                    // পেজে যাওয়ার লজিক
                    const targetData = pageDataMap.find(d => d.pdfIndex === res.pageIndex);
                    if (targetData) {
                        pageFlip.flip(targetData.index);
                    } else {
                        pageFlip.flip(res.pageIndex - 1); 
                    }
                });
                searchResultsDiv.appendChild(item);
            });
        }

    } catch(e) {
        console.error(e);
        searchResultsDiv.innerHTML = '<div style="text-align:center; color:red;">Search Error</div>';
    }
}


        async function generateThumbnails(pdf) {
            const container = document.getElementById('fbpH-thumb-container');
            if(!pdf) container.innerHTML = '';

            for (let i = 0; i < pageDataMap.length; i++) {
                const data = pageDataMap[i];
                if (data.type === 'cover') continue;
                if (data.side === 'right') continue; 
                createThumbnailPlaceholder(data.index, data.pdfIndex);
                await new Promise(r => setTimeout(r, 50));
            }
            lazyLoadThumbnails();
        }

        function createThumbnailPlaceholder(appPageIndex, pdfPageIndex) {
            const thumbDiv = document.createElement('div'); 
            thumbDiv.className = 'fbpH-thumb-item';
            thumbDiv.id = `thumb-item-${appPageIndex}`;
            thumbDiv.innerHTML = `
                <div style="width:100%; height:180px; background:#333; display:flex; align-items:center; justify-content:center;">
                    <i class="fas fa-image" style="color:#555;"></i>
                </div>
                <div class="fbpH-thumb-label">Page ${appPageIndex+1}</div>
            `;
            thumbDiv.onclick = () => { if(pageFlip) pageFlip.flip(appPageIndex); };
            thumbContainer.appendChild(thumbDiv);
        }

        async function lazyLoadThumbnails() {
            const thumbs = document.querySelectorAll('.fbpH-thumb-item');
            for (let i = 0; i < thumbs.length; i++) {
                const item = thumbs[i];
                if (item.querySelector('canvas')) continue;
                const appIndex = parseInt(item.id.replace('thumb-item-', ''));
                const data = pageDataMap.find(d => d.index === appIndex);
                if (!data) continue;
                const imgContainer = item.querySelector('div');
                if (globalPdfDoc && data.pdfIndex) {
                    try {
                        const page = await globalPdfDoc.getPage(data.pdfIndex);
                        const vp = page.getViewport({ scale: 0.2 }); 
                        const cvs = document.createElement('canvas');
                        cvs.width = vp.width; cvs.height = vp.height;
                        await page.render({ canvasContext: cvs.getContext('2d'), viewport: vp }).promise;
                        imgContainer.innerHTML = '';
                        imgContainer.style.height = 'auto';
                        imgContainer.style.background = 'transparent';
                        cvs.style.width = '100%'; cvs.style.height = 'auto';
                        imgContainer.appendChild(cvs);
                    } catch(e) {}
                }
                else if (data.type === 'image' && data.imgObj) {
                    const cvs = document.createElement('canvas');
                    let sw, sh, sx;
                    if (data.isSplit) {
                        sw = data.imgObj.width / 2; sh = data.imgObj.height; sx = (data.side === 'right') ? sw : 0;
                    } else {
                        sw = data.imgObj.width; sh = data.imgObj.height; sx = 0;
                    }
                    const targetWidth = 200; 
                    cvs.width = targetWidth; cvs.height = targetWidth * (sh / sw);
                    const ctx = cvs.getContext('2d');
                    ctx.drawImage(data.imgObj, sx, 0, sw, sh, 0, 0, cvs.width, cvs.height);
                    imgContainer.innerHTML = '';
                    imgContainer.style.height = 'auto'; imgContainer.style.display = 'block'; imgContainer.style.background = 'transparent';
                    cvs.style.width = '100%'; cvs.style.height = 'auto';
                    imgContainer.appendChild(cvs);
                }
                await new Promise(r => setTimeout(r, 100)); 
            }
        }

function renderTextAndLinks(page, viewport, container, offsetX, offsetY) {
    // যদি আগে থেকেই থাকে তবে রিটার্ন
    if (container.querySelector('.textLayer')) {
        // যদি সার্চ কুয়েরি থাকে, তবে চেক করে হাইলাইট অ্যাপ্লাই করুন (রি-রেন্ডার এড়াতে)
        const existingLayer = container.querySelector('.textLayer');
        applyHighlights(existingLayer);
        return;
    }

    const textLayerDiv = document.createElement('div');
    textLayerDiv.className = 'textLayer';
    textLayerDiv.style.width = `${viewport.width}px`; 
    textLayerDiv.style.height = `${viewport.height}px`;
    textLayerDiv.style.left = `${offsetX}px`; 
    textLayerDiv.style.top = `${offsetY}px`;
    container.appendChild(textLayerDiv);
    
    page.getTextContent().then(textContent => {
        const task = pdfjsLib.renderTextLayer({ 
            textContent: textContent, 
            container: textLayerDiv, 
            viewport: viewport, 
            textDivs: [] 
        });

        // 🔥 CHANGE: রেন্ডার শেষ হলে হাইলাইট ফাংশন কল করা হচ্ছে
        task.promise.then(() => {
            applyHighlights(textLayerDiv);
        });
    });
    
    page.getAnnotations().then(annotations => {
        if (annotations.length === 0) return;
        const layer = document.createElement('div');
        layer.className = 'annotationLayer';
        layer.style.width = `${viewport.width}px`; 
        layer.style.height = `${viewport.height}px`;
        layer.style.left = `${offsetX}px`; 
        layer.style.top = `${offsetY}px`;
        container.appendChild(layer);
        annotations.forEach(annotation => {
            if (annotation.subtype === 'Link' && annotation.rect) {
                const rect = viewport.convertToViewportRectangle(annotation.rect);
                const x = Math.min(rect[0], rect[2]);
                const y = Math.min(rect[1], rect[3]);
                const w = Math.abs(rect[2] - rect[0]);
                const h = Math.abs(rect[3] - rect[1]);
                const section = document.createElement('section');
                section.className = 'linkAnnotation';
                section.style.left = x + 'px'; 
                section.style.top = y + 'px';
                section.style.width = w + 'px'; 
                section.style.height = h + 'px';
                const a = document.createElement('a');
                if (annotation.url) { 
                    a.href = annotation.url; a.target = '_blank'; a.title = annotation.url;
                    a.addEventListener('click', (e) => { e.stopPropagation(); });
                    a.addEventListener('touchstart', (e) => { e.stopPropagation(); }, { passive: true });
                }
                section.appendChild(a);
                layer.appendChild(section);
            }
        });
    });
}

        async function processImages(files) {
            files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
            let createdPagesCount = 0;
            pageDataMap = []; 
            globalPdfDoc = null; 
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!file.type.startsWith('image/')) continue;
                const imgData = await readFileAsDataURL(file);
                const img = await loadImage(imgData);
                if (i === 0 && img.width > img.height) {
                    bookElement.appendChild(createInfoCover());
                    pageDataMap.push({ isRendered: true, type: 'cover' }); 
                    createdPagesCount++;
                }
                if (img.width > img.height) {
                    const p1 = createPlaceholder(createdPagesCount); bookElement.appendChild(p1);
                    pageDataMap.push({ index: createdPagesCount, type: 'image', imgObj: img, side: 'left', isSplit: true, element: p1, isRendered: false });
                    createdPagesCount++;
                    const p2 = createPlaceholder(createdPagesCount); bookElement.appendChild(p2);
                    pageDataMap.push({ index: createdPagesCount, type: 'image', imgObj: img, side: 'right', isSplit: true, element: p2, isRendered: false });
                    createdPagesCount++;
                } else {
                    const p = createPlaceholder(createdPagesCount); bookElement.appendChild(p);
                    pageDataMap.push({ index: createdPagesCount, type: 'image', imgObj: img, side: 'full', isSplit: false, element: p, isRendered: false });
                    createdPagesCount++;
                }
            }
            totalPagesSpan.innerText = createdPagesCount;
            generateThumbnails(null);
            finishLoading();
            manageImageMemory(0);
        }
        
function manageImageMemory(currentIndex) {
    const range = 3; 
    const startIndex = Math.max(0, currentIndex - range);
    const endIndex = Math.min(pageDataMap.length - 1, currentIndex + range);

    // 1. Unload Pages
    pageDataMap.forEach(d => {
        if(d.type !== 'image') return;
        if((d.index < startIndex || d.index > endIndex) && d.isRendered) {
            d.element.innerHTML = ''; 
            d.isRendered = false;
        }
    });

    // 2. Render Pages in Range
    for(let i = startIndex; i <= endIndex; i++) {
        const d = pageDataMap[i];
        
        // Render Image Canvas
        if(d && !d.isRendered && d.type === 'image') { 
            renderImageToCanvas(d); 
        }

        // Render Hotspots (যদি পেজ রেন্ডার হয়ে থাকে)
        if(d && d.isRendered && typeof HotspotManager !== 'undefined') {
            HotspotManager.render(d.index, d.element);
        }

        // 🔥 Render Media Embeds (নতুন)
        if(d && d.isRendered && typeof MediaManager !== 'undefined') {
            MediaManager.render(d.index, d.element);
        }
    }
}

        function renderImageToCanvas(d) {
             if (!d.imgObj) return;
             d.isRendered = true;
             const cvs = document.createElement('canvas');
             cvs.width = PAGE_WIDTH; cvs.height = PAGE_HEIGHT;
             const ctx = cvs.getContext('2d');
             ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
             if (d.isSplit) {
                 const sourceHalfWidth = d.imgObj.width / 2; const sourceHeight = d.imgObj.height;
                 const sourceX = (d.side === 'left') ? 0 : sourceHalfWidth;
                 ctx.drawImage(d.imgObj, sourceX, 0, sourceHalfWidth, sourceHeight, 0, 0, PAGE_WIDTH, PAGE_HEIGHT);
             } else {
                 const sw = d.imgObj.width; const sh = d.imgObj.height;
                 const scale = Math.min(PAGE_WIDTH / sw, PAGE_HEIGHT / sh);
                 const dw = sw * scale; const dh = sh * scale;
                 const dx = (PAGE_WIDTH - dw) / 2; const dy = (PAGE_HEIGHT - dh) / 2;
                 ctx.drawImage(d.imgObj, 0, 0, sw, sh, dx, dy, dw, dh);
             }
             d.element.innerHTML = '';
             d.element.appendChild(cvs);
        }
        
function finishLoading() {
    // ১. ফ্লিপবুক ইঞ্জিন চালু করা
    initFlipBook(); 

    const pages = document.querySelectorAll('.fbpH-page');
    
    // ২. পেপার টাইপ সেট করা
    pages.forEach(p => p.setAttribute('data-density', 'hard'));

    // ৩. পেজ লোড করা (এখানে pageFlip ব্যবহার করা হয়েছে)
    pageFlip.loadFromHTML(pages);
    
    // ৪. Lead Generation ইনিশিয়াল করা
    if(typeof LeadGen !== 'undefined') LeadGen.init();

// ✅ সঠিক: pageFlip.on(...)
pageFlip.on('flip', (e) => { 
    updatePageInfo(); 
    playSound(); 
    updateZoom();
    
    if(!globalPdfDoc) manageImageMemory(e.data);
    if(typeof LeadGen !== 'undefined') LeadGen.checkLock(e.data);
    if(typeof HotspotManager !== 'undefined') HotspotManager.closeAllModals();
    if(typeof MediaManager !== 'undefined') MediaManager.stopAllMedia();

    // অডিওবুক আপডেট
    if(typeof AudiobookManager !== 'undefined') AudiobookManager.handlePageFlip();
});

    // ৬. বুকমার্ক চেক
    checkSavedBookmark(); 
    
    // ৭. লোডার বন্ধ ও কন্ট্রোল দেখানো
    loader.style.display = 'none'; 
    controls.classList.add('active'); 
    
    setTimeout(() => { 
        updateZoom(); 
        updatePageInfo(); 
    }, 100);
}
        
        function readFileAsDataURL(file) { return new Promise((r, j) => { const x = new FileReader(); x.onload = () => r(x.result); x.onerror = j; x.readAsDataURL(file); }); }
        function readFileAsArrayBuffer(file) { return new Promise((r, j) => { const x = new FileReader(); x.onload = () => r(x.result); x.onerror = j; x.readAsArrayBuffer(file); }); }
        function loadImage(src) { return new Promise((r, j) => { const i = new Image(); i.onload = () => r(i); i.onerror = j; i.src = src; }); }
        
        document.getElementById('fbpH-btn-fullscreen').addEventListener('click', () => { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); });
		
		
		
        // 👇 এই কোডটুকু এখানে বসান (বাটন ক্লিক ইভেন্ট) 👇
        const btnAudio = document.getElementById('fbpH-btn-audio');
        if(btnAudio) {
            btnAudio.addEventListener('click', () => {
                // টগল করা (অন/অফ)
                if(typeof AudiobookManager !== 'undefined') {
                    // বাটন স্টাইল চেঞ্জ করা
                    if (AudiobookManager.isActive) {
                        btnAudio.classList.remove('active-btn');
                        btnAudio.innerHTML = '<i class="fas fa-headphones"></i>';
                        AudiobookManager.stopReading();
                        AudiobookManager.isActive = false;
                    } else {
                        btnAudio.classList.add('active-btn');
                        btnAudio.innerHTML = '<i class="fas fa-volume-up"></i>';
                        AudiobookManager.isActive = true;
                        AudiobookManager.readCurrentPage();
                    }
                }
            });
        }
        // 👆 কোড শেষ 👆		
		
		
// --- 🔥 NEW: Highlight Logic ---
function applyHighlights(container) {
    if (!currentSearchQuery || currentSearchQuery.length < 2) return;
    
    // Text Layer এর সব span খুঁজে বের করা
    const spans = container.querySelectorAll('span');
    
    spans.forEach(span => {
        const text = span.textContent;
        const regex = new RegExp(`(${currentSearchQuery})`, 'gi');
        
        // যদি টেক্সট ম্যাচ করে
        if (regex.test(text)) {
            // হাইলাইট স্প্যান দিয়ে রিপ্লেস করা
            span.innerHTML = text.replace(regex, '<span class="fbpH-highlight-match">$1</span>');
        }
    });
}

// বর্তমান পেজ রিফ্রেশ করে হাইলাইট দেখানোর জন্য
function updateVisibleHighlights() {
    const activePages = document.querySelectorAll('.fbpH-page .textLayer');
    activePages.forEach(layer => {
        // আগের হাইলাইট ক্লিয়ার করে নতুন করে অ্যাপ্লাই করা
        // (সহজ উপায়ে আমরা পেজটি আবার রেন্ডার হওয়ার অপেক্ষা না করে সরাসরি অ্যাপ্লাই করছি)
        applyHighlights(layer);
    });
}


