/**
 * Kırşehir Tanıtım - JavaScript
 * Features: Mobile Menu, Scroll Animations, Text Search, AI Visual Search
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Navigation Toggle
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    if (mobileMenu && navLinks) {
        mobileMenu.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileMenu.classList.toggle('active');
        });
    }

    // Mobile menu helper styles
    const navStyle = document.createElement('style');
    navStyle.textContent = `
        @media (max-width: 768px) {
            .nav-links.active {
                display: flex !important;
                flex-direction: column;
                position: absolute;
                top: 70px; left: 0; width: 100%;
                background: rgba(255, 255, 255, 0.98);
                padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                gap: 20px; text-align: center; backdrop-filter: blur(10px);
            }
            .menu-toggle.active i::before { content: "\\f00d"; }
        }
    `;
    document.head.appendChild(navStyle);

    // 2. Reveal on Scroll
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.15 });

    revealElements.forEach(el => revealObserver.observe(el));

    // 3. Navbar Scroll Effect
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.style.padding = '10px 0';
                navbar.style.boxShadow = '0 5px 20px rgba(0,0,0,0.1)';
            } else {
                navbar.style.padding = '15px 0';
                navbar.style.boxShadow = 'none';
            }
        }
    });

    // 4. Search Logic
    const searchInput = document.getElementById('text-search');
    const placeCards = document.querySelectorAll('.place-card');
    const noResults = document.getElementById('no-results');

    const filterPlaces = (query) => {
        let hasMatch = false;
        const lowerQuery = query.toLowerCase().trim();

        placeCards.forEach(card => {
            const tags = card.getAttribute('data-tags') || '';
            const title = card.querySelector('h3').innerText.toLowerCase();
            const text = card.querySelector('p').innerText.toLowerCase();

            if (title.includes(lowerQuery) || text.includes(lowerQuery) || tags.includes(lowerQuery)) {
                card.style.display = 'block';
                hasMatch = true;
            } else {
                card.style.display = 'none';
            }
        });

        if (noResults) noResults.style.display = hasMatch ? 'none' : 'block';
    };

    if (searchInput) {
        searchInput.addEventListener('input', (e) => filterPlaces(e.target.value));
    }

    // 5. AI Visual Search Logic
    const visualSearchInput = document.getElementById('visual-search-input');
    const aiModal = document.getElementById('ai-search-modal');
    const aiImagePreview = document.getElementById('ai-image-preview');
    const aiStatusText = document.getElementById('ai-status-text');
    const aiLabelChips = document.getElementById('ai-detected-labels');
    const closeModal = document.querySelector('.close-modal');
    const aiStatusDot = document.querySelector('.status-dot');
    const aiModelStatusDiv = document.getElementById('ai-model-status');

    let model = null;

    // Mapping common AI labels to our categories
    const categoryMapping = {
        'mosque': 'cami', 'dome': 'cami', 'temple': 'inanç', 'church': 'kilise',
        'abbey': 'kilise', 'monastery': 'kilise', 'castle': 'kale', 'lake': 'göl',
        'pond': 'göl', 'garden': 'bahçe', 'park': 'park', 'bridge': 'köprü',
        'viaduct': 'köprü', 'structure': 'tarih', 'ruin': 'harabe', 'fountain': 'su',
        'triumph arch': 'han'
    };

    // Load MobileNet model
    const initAI = async () => {
        try {
            console.log('Kırşehir Tanıtım AI: Modeli yükleniyor...');
            // Wait for model loading
            model = await mobilenet.load();
            
            // Update UI status when ready
            if (aiStatusDot && aiModelStatusDiv) {
                aiStatusDot.classList.remove('pulsing');
                aiStatusDot.classList.add('ready');
                aiModelStatusDiv.title = 'Yapay Zeka Hazır';
            }
            console.log('Kırşehir Tanıtım AI: Yapay zeka hazır.');
        } catch (err) {
            console.error('Kırşehir Tanıtım AI error:', err);
            if (aiStatusText) aiStatusText.innerText = 'Yapay zeka yüklenemedi. Lüttef sayfayı yenileyin.';
        }
    };

    initAI();

    if (visualSearchInput) {
        visualSearchInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Reset and show modal
            if (aiModal) aiModal.style.display = 'flex';
            if (aiStatusText) aiStatusText.innerText = 'Görsel analiz ediliyor...';
            if (aiLabelChips) aiLabelChips.innerHTML = '';
            
            const reader = new FileReader();
            reader.onload = async (event) => {
                if (aiImagePreview) aiImagePreview.src = event.target.result;
                
                // Analyze when image loads
                if (aiImagePreview) {
                    aiImagePreview.onload = async () => {
                        if (!model) {
                            if (aiStatusText) aiStatusText.innerText = 'Yapay zeka henüz hazır değil, otomatik başlayacak...';
                            // Poll for model
                            const checkInterval = setInterval(async () => {
                                if (model) {
                                    clearInterval(checkInterval);
                                    const predictions = await model.classify(aiImagePreview);
                                    processPredictions(predictions);
                                }
                            }, 1000);
                            return;
                        }

                        try {
                            const predictions = await model.classify(aiImagePreview);
                            processPredictions(predictions);
                        } catch (err) {
                            if (aiStatusText) aiStatusText.innerText = 'Analiz sırasında bir hata oluştu.';
                            console.error(err);
                        }
                    };
                }
            };
            reader.readAsDataURL(file);
        });
    }

    const processPredictions = (predictions) => {
        if (!aiLabelChips || !aiStatusText) return;

        aiLabelChips.innerHTML = '';
        aiStatusText.innerText = 'Analiz tamamlandı. Benzer yerler filtrelendi.';

        const labels = predictions.map(p => p.className.toLowerCase());
        let detectedTags = [];

        labels.forEach(label => {
            const chip = document.createElement('span');
            chip.className = 'ai-chip';
            chip.innerText = label;
            aiLabelChips.appendChild(chip);

            // Match labels with our categories
            Object.keys(categoryMapping).forEach(key => {
                if (label.includes(key)) {
                    detectedTags.push(categoryMapping[key]);
                    chip.classList.add('match');
                }
            });
        });

        // Apply filters
        if (detectedTags.length > 0) {
            const uniqueTags = [...new Set(detectedTags)];
            let matchFound = false;

            placeCards.forEach(card => {
                const cardTags = card.getAttribute('data-tags').toLowerCase();
                const isMatch = uniqueTags.some(tag => cardTags.includes(tag));
                
                if (isMatch) {
                    card.style.display = 'block';
                    matchFound = true;
                } else {
                    card.style.display = 'none';
                }
            });

            if (noResults) noResults.style.display = matchFound ? 'none' : 'block';
            
            // Auto close modal to show results
            setTimeout(() => {
                if (aiModal) aiModal.style.display = 'none';
                const placesSection = document.getElementById('places');
                if (placesSection) placesSection.scrollIntoView({ behavior: 'smooth' });
            }, 2500);
        } else {
            aiStatusText.innerText = 'Eşleşme bulunamadı, ancak benzer kategorileri keşfedebilirsiniz.';
        }
    };

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            if (aiModal) aiModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === aiModal) aiModal.style.display = 'none';
    });
});
