/**
 * Il Ticino - CMS Dynamic Loader Script
 * Loads content from JSON files and updates the page dynamically.
 * Implements progressive enhancement: if JavaScript or JSON fails,
 * the static fallback HTML content remains fully functional.
 */

document.addEventListener('DOMContentLoaded', () => {
    initCMS();
});

async function initCMS() {
    try {
        // Fetch all content JSON files in parallel
        const [impostazioni, home, servizi, contatti, prezzi, recensioni, galleria] = await Promise.all([
            fetchJSON('content/impostazioni.json').catch(() => null),
            fetchJSON('content/home.json').catch(() => null),
            fetchJSON('content/servizi.json').catch(() => null),
            fetchJSON('content/contatti.json').catch(() => null),
            fetchJSON('content/prezzi.json').catch(() => null),
            fetchJSON('content/recensioni.json').catch(() => null),
            fetchJSON('content/galleria.json').catch(() => null)
        ]);

        if (impostazioni) updateGlobalSettings(impostazioni);
        if (home) updateHomeSection(home);
        if (servizi) updateServiziSection(servizi);
        if (contatti) updateContattiSection(contatti);
        if (prezzi) updatePrezziSection(prezzi);
        if (recensioni) updateRecensioniSection(recensioni);
        if (galleria) updateGalleriaSection(galleria);

    } catch (error) {
        console.warn('CMS Loader: Fallback to static HTML active. Error details:', error);
    }
}

/**
 * Helper to fetch and parse JSON
 */
async function fetchJSON(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url} (status ${response.status})`);
    }
    return response.json();
}

/**
 * Helper to parse simple markdown to HTML (bold, italic, links)
 */
function parseMarkdown(text) {
    if (!text) return '';
    return text
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
        .replace(/\n/g, '<br>');
}

/**
 * Helper to dynamically display navbar links only if their sections contain data
 */
function showNavbarLink(targetId) {
    document.querySelectorAll(`.nav-condizionale[data-nav-target="${targetId}"]`).forEach(el => {
        el.style.display = '';
    });
}

/**
 * Setup IntersectionObserver for dynamically created elements
 */
function observeNewElements(elements) {
    if (!elements || elements.length === 0) return;
    
    if (window.IntersectionObserver) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.12 });
        
        elements.forEach(el => observer.observe(el));
    } else {
        // Fallback: make them immediately visible if observer not supported
        elements.forEach(el => el.classList.add('visible'));
    }
}

/**
 * SVGs for icons
 */
const SVGS = {
    // Services
    camper: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28">
        <rect x="1" y="3" width="15" height="13" rx="2" />
        <path d="M16 8h4l3 5v3h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>`,
    toilet: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="28" height="28">
        <path d="M17 21V7h-6v3" />
        <path d="M8 10h6l3 4H5Z" />
        <path d="M8 16v2M11 16v2M14 16v2" />
    </svg>`,
    relax: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>`,
    water: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="28" height="28">
        <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z" />
        <path d="M16 14a4 4 0 0 1-4 4" />
    </svg>`,
    
    // Experiences
    compass: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>`,
    bike: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="5.5" cy="17.5" r="3.5" />
        <circle cx="18.5" cy="17.5" r="3.5" />
        <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2" />
    </svg>`,
    village: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 21v-8l9-7 9 7v8" />
        <path d="M9 21v-4a3 3 0 0 1 6 0v4" />
    </svg>`,
    food: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
        <path d="M7 2v20" />
        <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </svg>`,

    // Socials
    instagram: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>`,
    facebook: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
    </svg>`,
    whatsapp: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>`
};

/**
 * 1. Global Settings & SEO
 */
function updateGlobalSettings(data) {
    // SEO Title
    if (data.meta_title) {
        document.title = data.meta_title;
        updateMeta('property="og:title"', data.meta_title);
        updateMeta('name="twitter:title"', data.meta_title);
    }
    // SEO Description
    if (data.meta_desc) {
        updateMeta('name="description"', data.meta_desc);
        updateMeta('property="og:description"', data.meta_desc);
        updateMeta('name="twitter:description"', data.meta_desc);
    }
    // SEO Keywords
    if (data.meta_keywords) {
        updateMeta('name="keywords"', data.meta_keywords);
    }

    // Logo Update
    if (data.logo) {
        document.querySelectorAll('[data-cms="logo"]').forEach(el => {
            el.src = data.logo;
        });
    }

    // Footer Tagline
    if (data.footer_tagline) {
        const tagline = document.querySelector('[data-cms="footer_tagline"]');
        if (tagline) tagline.textContent = data.footer_tagline;
    }

    // Render Social Links in designated containers
    renderSocials(data);
}

function updateMeta(selector, value) {
    const meta = document.querySelector(`meta[${selector}]`);
    if (meta) meta.setAttribute('content', value);
}

function renderSocials(data) {
    const containers = document.querySelectorAll('[data-cms-container="socials"]');
    containers.forEach(container => {
        container.innerHTML = '';
        const networks = ['instagram', 'facebook', 'whatsapp'];
        let hasSocials = false;
        
        networks.forEach(net => {
            const url = data[net];
            if (url) {
                hasSocials = true;
                const a = document.createElement('a');
                a.href = url;
                a.className = `social-btn social-${net}`;
                a.setAttribute('aria-label', `Seguici su ${net}`);
                a.setAttribute('target', '_blank');
                a.setAttribute('rel', 'noopener');
                a.innerHTML = SVGS[net] || '';
                container.appendChild(a);
            }
        });
        
        // Show or hide the social container/subtitle if empty
        if (!hasSocials) {
            container.style.display = 'none';
            const subtitle = container.previousElementSibling;
            if (subtitle && subtitle.classList.contains('contact-subtitle') && subtitle.textContent.toLowerCase().includes('social')) {
                subtitle.style.display = 'none';
            }
        } else {
            container.style.display = 'flex';
            const subtitle = container.previousElementSibling;
            if (subtitle && subtitle.classList.contains('contact-subtitle') && subtitle.textContent.toLowerCase().includes('social')) {
                subtitle.style.display = 'block';
            }
        }
    });
}

/**
 * 2. Home Section
 */
function updateHomeSection(data) {
    // Simple text mappings
    const textMappings = {
        hero_welcome: data.hero_welcome,
        hero_brand: data.hero_brand,
        hero_desc: data.hero_desc,
        info_label: data.info_label,
        info_title: data.info_title,
        info_body: data.info_body,
        chisiamo_label: data.chisiamo_label,
        chisiamo_title: data.chisiamo_title,
        chisiamo_body_1: data.chisiamo_body_1,
        chisiamo_body_2: data.chisiamo_body_2
    };

    for (const [key, val] of Object.entries(textMappings)) {
        const el = document.querySelector(`[data-cms="${key}"]`);
        if (el && val) {
            // Check if title or body contains line breaks
            if (val.includes('\n')) {
                el.innerHTML = val.replace(/\n/g, '<br>');
            } else {
                el.textContent = val;
            }
        }
    }

    // Images
    if (data.hero_image) {
        const heroImg = document.querySelector('[data-cms="hero_image"]');
        if (heroImg) heroImg.src = data.hero_image;
        
        // Also update SEO tags and LCP preloader
        updateMeta('property="og:image"', window.location.origin + '/' + data.hero_image);
        updateMeta('name="twitter:image"', window.location.origin + '/' + data.hero_image);
        const preload = document.querySelector('link[rel="preload"][as="image"]');
        if (preload) preload.setAttribute('href', data.hero_image);
    }
    if (data.info_image) {
        const infoImg = document.querySelector('[data-cms="info_image"]');
        if (infoImg) infoImg.src = data.info_image;
    }
    if (data.chisiamo_image) {
        const csImg = document.querySelector('[data-cms="chisiamo_image"]');
        if (csImg) csImg.src = data.chisiamo_image;
    }
}

/**
 * 3. Servizi & Esperienze
 */
function updateServiziSection(data) {
    // Top headers
    const textMappings = {
        servizi_label: data.servizi_label,
        servizi_title: data.servizi_title,
        servizi_body: data.servizi_body,
        banner_title: data.banner_title,
        esperienze_label: data.esperienze_label,
        esperienze_title: data.esperienze_title,
        esperienze_body: data.esperienze_body,
        mappa_title: data.mappa_title,
        mappa_desc: data.mappa_desc,
        mappa_btn_text: data.mappa_btn_text
    };

    for (const [key, val] of Object.entries(textMappings)) {
        const el = document.querySelector(`[data-cms="${key}"]`);
        if (el && val) {
            if (key === 'banner_desc') {
                el.innerHTML = parseMarkdown(val);
            } else if (val.includes('\n')) {
                el.innerHTML = val.replace(/\n/g, '<br>');
            } else {
                el.textContent = val;
            }
        }
    }

    if (data.banner_desc) {
        const bannerDescEl = document.querySelector('[data-cms="banner_desc"]');
        if (bannerDescEl) bannerDescEl.innerHTML = parseMarkdown(data.banner_desc);
    }

    // Map download PDF file URL update
    if (data.mappa_file) {
        const ctaBtn = document.querySelector('[data-cms="mappa_file"]');
        if (ctaBtn) {
            ctaBtn.setAttribute('href', data.mappa_file);
            ctaBtn.setAttribute('download', data.mappa_file.split('/').pop());
        }
    }

    // Dynamic Services List
    if (data.servizi_items && Array.isArray(data.servizi_items)) {
        const container = document.getElementById('services-container');
        if (container) {
            container.innerHTML = ''; // Clear fallback HTML
            const newCards = [];
            
            data.servizi_items.forEach(item => {
                const card = document.createElement('div');
                card.className = 'service-card reveal-item';
                
                const iconSvg = SVGS[item.icon] || SVGS.camper;
                
                card.innerHTML = `
                    <div class="service-icon">
                        ${iconSvg}
                    </div>
                    <h3 class="service-title">${item.title}</h3>
                    <p class="service-desc">${item.desc}</p>
                `;
                container.appendChild(card);
                newCards.push(card);
            });
            
            // Re-register observer on the newly created cards so they animate
            observeNewElements(newCards);
        }
    }

    // Dynamic Experiences List
    if (data.esperienze_items && Array.isArray(data.esperienze_items)) {
        const container = document.getElementById('experiences-container');
        if (container) {
            container.innerHTML = ''; // Clear fallback HTML
            const newCards = [];
            
            data.esperienze_items.forEach(item => {
                const card = document.createElement('div');
                card.className = 'exp-card reveal-item';
                
                const iconSvg = SVGS[item.icon] || SVGS.compass;
                
                card.innerHTML = `
                    <div class="exp-icon">
                        ${iconSvg}
                    </div>
                    <h3 class="exp-title">${item.title}</h3>
                    <p class="exp-desc">${item.desc}</p>
                `;
                container.appendChild(card);
                newCards.push(card);
            });
            
            // Re-register observer
            observeNewElements(newCards);
        }
    }
}

/**
 * 4. Contatti
 */
function updateContattiSection(data) {
    const textMappings = {
        contatti_label: data.label,
        contatti_title: data.title,
        contatti_body: data.body,
        contatti_indirizzo: data.indirizzo,
        contatti_banner_text: data.banner_text
    };

    for (const [key, val] of Object.entries(textMappings)) {
        const el = document.querySelector(`[data-cms="${key}"]`);
        if (el && val) {
            if (val.includes('\n')) {
                el.innerHTML = val.replace(/\n/g, '<br>');
            } else {
                el.textContent = val;
            }
        }
    }

    // Map Iframe URL update
    if (data.mappa_iframe_url) {
        const mapIframe = document.querySelector('[data-cms="mappa_iframe_url"]');
        if (mapIframe) {
            mapIframe.src = data.mappa_iframe_url;
        }
    }

    // Phone render (uncommented/added to DOM if exists)
    const phoneContainer = document.querySelector('[data-cms-wrapper="telefono"]');
    if (phoneContainer) {
        if (data.telefono) {
            phoneContainer.style.display = 'flex';
            const phoneVal = phoneContainer.querySelector('[data-cms="telefono"]');
            if (phoneVal) {
                phoneVal.textContent = data.telefono;
                phoneVal.setAttribute('href', `tel:${data.telefono.replace(/\s+/g, '')}`);
            }
        } else {
            phoneContainer.style.display = 'none';
        }
    }

    // Email render (uncommented/added to DOM if exists)
    const emailContainer = document.querySelector('[data-cms-wrapper="email"]');
    if (emailContainer) {
        if (data.email) {
            emailContainer.style.display = 'flex';
            const emailVal = emailContainer.querySelector('[data-cms="email"]');
            if (emailVal) {
                emailVal.textContent = data.email;
                emailVal.setAttribute('href', `mailto:${data.email}`);
            }
        } else {
            emailContainer.style.display = 'none';
        }
    }

    // Orari render (New block if configured)
    const orariContainer = document.querySelector('[data-cms-wrapper="orari"]');
    if (orariContainer) {
        if (data.orari) {
            orariContainer.style.display = 'flex';
            const orariVal = orariContainer.querySelector('[data-cms="orari"]');
            if (orariVal) orariVal.textContent = data.orari;
        } else {
            orariContainer.style.display = 'none';
        }
    }

    // Prezzi render (New block if configured)
    const prezziContainer = document.querySelector('[data-cms-wrapper="prezzi"]');
    if (prezziContainer) {
        if (data.prezzi) {
            prezziContainer.style.display = 'flex';
            const prezziVal = prezziContainer.querySelector('[data-cms="prezzi"]');
            if (prezziVal) prezziVal.textContent = data.prezzi;
        } else {
            prezziContainer.style.display = 'none';
        }
    }
}

/**
 * 5. Prezzi
 */
function updatePrezziSection(data) {
    if (!data) return;
    
    const prezziSection = document.getElementById('prezzi');
    
    // Se non ci sono tariffe stagionali, nascondi la sezione e termina
    if (!data.prezzi_seasons || !Array.isArray(data.prezzi_seasons) || data.prezzi_seasons.length === 0) {
        if (prezziSection) prezziSection.style.display = 'none';
        return;
    }
    
    // Mostra la sezione
    if (prezziSection) prezziSection.style.display = '';

    // Testi principali
    const textMappings = {
        prezzi_label: data.prezzi_label,
        prezzi_title: data.prezzi_title,
        prezzi_body: data.prezzi_body
    };

    for (const [key, val] of Object.entries(textMappings)) {
        const el = document.querySelector(`[data-cms="${key}"]`);
        if (el && val) el.textContent = val;
    }


    // Tariffe Stagionali
    if (data.prezzi_seasons && Array.isArray(data.prezzi_seasons)) {
        const contentContainer = document.querySelector('[data-cms-container="prezzi_content"]');
        
        if (contentContainer && data.prezzi_seasons.length > 0) {
            showNavbarLink('prezzi');
            contentContainer.innerHTML = '';
            
            // Crea un'unica card che ospiterà sia le tab che le tariffe
            const mainCard = document.createElement('div');
            mainCard.className = 'prezzo-card reveal-item visible';
            mainCard.style.margin = '0 auto';
            mainCard.style.maxWidth = '600px';
            mainCard.style.padding = '32px';
            
            // Genera la testata interna con le tab
            const tabsWrapper = document.createElement('div');
            tabsWrapper.className = 'prezzi-tabs-inner';
            
            data.prezzi_seasons.forEach((season, index) => {
                const btn = document.createElement('button');
                btn.className = `prezzi-tab ${index === 0 ? 'active' : ''}`;
                btn.textContent = season.nome;
                btn.style.textTransform = 'capitalize';
                btn.addEventListener('click', () => {
                    mainCard.querySelectorAll('.prezzi-tab').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    updateCardData(season);
                });
                tabsWrapper.appendChild(btn);
            });
            
            mainCard.appendChild(tabsWrapper);
            
            // Contenitore per i dati della stagione (titolo, date, tariffe)
            const infoContainer = document.createElement('div');
            infoContainer.className = 'fade-in';
            mainCard.appendChild(infoContainer);
            
            // Funzione per aggiornare i dati interni alla card
            function updateCardData(season) {
                // Aggiungiamo un piccolo effetto fade
                infoContainer.style.opacity = '0';
                infoContainer.style.transform = 'translateY(8px)';
                infoContainer.style.transition = 'opacity 0.2s, transform 0.2s';
                
                setTimeout(() => {
                    infoContainer.innerHTML = `
                        <div style="border-bottom: 1px solid var(--cream-dark); padding-bottom: 16px; margin-bottom: 24px; text-align: left;">
                            <h3 class="prezzo-titolo" style="margin: 0 0 4px 0; text-transform: capitalize;">${season.nome} Stagione</h3>
                            <div class="prezzo-durata" style="margin: 0; color: var(--brown); font-size: 0.95rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${season.periodo}</div>
                        </div>
                        <div style="text-align: left;">
                            <ul style="margin: 0; padding: 0; list-style: none;">
                                <li style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 16px; background: rgba(26,60,40,0.02); border-radius: 8px; gap: 16px;">
                                    <span style="font-weight: 500; font-size: 0.95rem; color: var(--text-dark); line-height: 1.3;">Piazzola senza corrente</span>
                                    <span style="font-size: 1.8rem; font-weight: 900; color: var(--brown); font-family: 'Outfit', sans-serif; white-space: nowrap; flex-shrink: 0;">${season.prezzo_senza_corrente}</span>
                                </li>
                                <li style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0; padding: 16px; background: rgba(26,60,40,0.06); border-radius: 8px; border: 1px solid rgba(26,60,40,0.1); gap: 16px;">
                                    <span style="font-weight: 500; font-size: 0.95rem; color: var(--green); line-height: 1.3;">Piazzola standard <small style="font-weight:400; opacity:0.8; display: inline-block;">(corrente incl.)</small></span>
                                    <span style="font-size: 2.2rem; font-weight: 900; color: var(--green); font-family: 'Outfit', sans-serif; white-space: nowrap; flex-shrink: 0;">${season.prezzo_standard}</span>
                                </li>
                            </ul>
                        </div>
                    `;
                    infoContainer.style.opacity = '1';
                    infoContainer.style.transform = 'translateY(0)';
                }, 150);
            }
            
            // Inizializza con la prima stagione
            updateCardData(data.prezzi_seasons[0]);
            contentContainer.appendChild(mainCard);
        }
    }

    // Extra
    if (data.prezzi_extra && Array.isArray(data.prezzi_extra)) {
        const extraContainer = document.querySelector('[data-cms-container="prezzi_extra"]');
        if (extraContainer && data.prezzi_extra.length > 0) {
            extraContainer.innerHTML = '';
            data.prezzi_extra.forEach(extra => {
                const card = document.createElement('div');
                card.className = 'prezzo-card extra-card reveal-item visible';
                card.style.cssText = 'margin: 24px auto 0; max-width: 600px; padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; background: white;';
                card.innerHTML = `
                    <h3 style="margin: 0; font-size: 1.1rem; font-family: var(--font-display); letter-spacing: 0.5px; color: var(--green); text-transform: capitalize; white-space: nowrap;">${extra.nome}</h3>
                    <span style="font-size: 1.7rem; font-weight: 800; font-family: 'Outfit', sans-serif; color: var(--brown); white-space: nowrap; flex-shrink: 0;">${extra.prezzo}</span>
                `;
                extraContainer.appendChild(card);
            });
        }
    }
}

/**
 * 6. Recensioni
 */
function updateRecensioniSection(data) {
    if (!data) return;
    
    const recensioniSection = document.getElementById('recensioni');
    
    // Se non ci sono recensioni, nascondi e termina
    if (!data.recensioni_items || !Array.isArray(data.recensioni_items) || data.recensioni_items.length === 0) {
        if (recensioniSection) recensioniSection.style.display = 'none';
        return;
    }
    
    // Mostra la sezione e il relativo link della navbar
    if (recensioniSection) recensioniSection.style.display = '';
    showNavbarLink('recensioni');

    // Testi principali
    const textMappings = {
        recensioni_label: data.recensioni_label,
        recensioni_title: data.recensioni_title
    };

    for (const [key, val] of Object.entries(textMappings)) {
        const el = document.querySelector(`[data-cms="${key}"]`);
        if (el && val) el.textContent = val;
    }

    // Helper per generare le stelle SVG (supporta mezze stelle ed è personalizzabile)
    function generateStarsHTML(rating, reviewId) {
        let starsHTML = '';
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 >= 0.5;
        
        // Definisce un gradiente SVG per la mezza stella per questa card (in modo sicuro per il rendering del browser)
        const gradientId = `half-star-grad-${reviewId}`;
        starsHTML += `
            <svg style="position: absolute; width: 0; height: 0; overflow: hidden;" aria-hidden="true">
                <defs>
                    <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="50%" stop-color="#ffffff" />
                        <stop offset="50%" stop-color="rgba(247, 243, 218, 0.15)" />
                    </linearGradient>
                </defs>
            </svg>
        `;

        for (let i = 1; i <= 5; i++) {
            let fill = 'rgba(247, 243, 218, 0.15)'; // Colore spento di default (semi-trasparente)
            if (i <= fullStars) {
                fill = '#ffffff'; // Stella piena
            } else if (i === fullStars + 1 && hasHalf) {
                fill = `url(#${gradientId})`; // Stella a metà
            }

            starsHTML += `
                <svg class="review-star" viewBox="0 0 24 24" fill="${fill}" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z"/>
                </svg>
            `;
        }
        return starsHTML;
    }

    // Renderizza le card
    const container = document.querySelector('[data-cms-container="recensioni_items"]');
    if (container) {
        container.innerHTML = '';
        data.recensioni_items.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'review-card reveal-item visible';
            const rating = typeof item.stelle === 'number' ? item.stelle : 5;
            
            card.innerHTML = `
                <div class="review-stars">${generateStarsHTML(rating, index)}</div>
                <p class="review-text">"${item.testo}"</p>
                <div class="review-author">
                    <div class="author-avatar">${item.iniziali || item.autore.substring(0, 2).toUpperCase()}</div>
                    <span class="author-name">${item.autore}</span>
                </div>
            `;
            container.appendChild(card);
        });
    }
}

/**
 * 7. Galleria
 */
function updateGalleriaSection(data) {
    if (!data) return;

    const galleriaSection = document.getElementById('galleria');

    if (!data.galleria_items || !Array.isArray(data.galleria_items) || data.galleria_items.length === 0) {
        if (galleriaSection) galleriaSection.style.display = 'none';
        return;
    }

    if (galleriaSection) galleriaSection.style.display = '';
    showNavbarLink('galleria');

    // Testi sezione
    const textMappings = { galleria_label: data.galleria_label, galleria_title: data.galleria_title };
    for (const [key, val] of Object.entries(textMappings)) {
        const el = document.querySelector(`[data-cms="${key}"]`);
        if (el && val) el.textContent = val;
    }

    const items = data.galleria_items.filter(i => i.immagine);
    const getLimit = () => {
        const width = window.innerWidth;
        if (width < 480) return 3;   // Mobile (1 colonna, mostra 3)
        if (width < 768) return 4;   // Tablet (2 colonne, mostra 4)
        return 6;                    // Desktop (3 colonne, mostra 6)
    };

    let currentIndex = 0;
    let expanded = false;

    // ---- Lightbox (condiviso) ----
    const existingLb = document.getElementById('lightbox-overlay');
    if (existingLb) existingLb.remove();

    const overlay = document.createElement('div');
    overlay.id = 'lightbox-overlay';
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML = `
        <button class="lightbox-close" id="lb-close" aria-label="Chiudi">&#10005;</button>
        <div class="lightbox-main">
            <button class="lightbox-arrow prev" id="lb-prev" aria-label="Precedente">&#8249;</button>
            <img class="lightbox-img" id="lb-img" src="" alt="">
            <button class="lightbox-arrow next" id="lb-next" aria-label="Successiva">&#8250;</button>
        </div>
        <div class="lightbox-caption" id="lb-caption"></div>
        <div class="lightbox-thumbs" id="lb-thumbs"></div>
    `;
    document.body.appendChild(overlay);

    const lbImg = overlay.querySelector('#lb-img');
    const lbCaption = overlay.querySelector('#lb-caption');
    const lbThumbs = overlay.querySelector('#lb-thumbs');

    // Miniature lightbox — deferred: caricano solo quando il lightbox viene aperto
    items.forEach((item, i) => {
        const thumb = document.createElement('img');
        thumb.dataset.src = item.immagine;
        thumb.alt = item.didascalia || '';
        thumb.className = 'lightbox-thumb';
        thumb.addEventListener('click', () => goTo(i));
        lbThumbs.appendChild(thumb);
    });

    // Carica tutte le miniature al primo open del lightbox
    let thumbsLoaded = false;
    function ensureThumbsLoaded() {
        if (thumbsLoaded) return;
        thumbsLoaded = true;
        lbThumbs.querySelectorAll('img[data-src]').forEach(t => {
            t.src = t.dataset.src;
            delete t.dataset.src;
        });
    }

    function goTo(index) {
        currentIndex = (index + items.length) % items.length;
        const item = items[currentIndex];
        
        // Cambio immediato e sincrono per evitare ghosting e sovrapposizioni
        lbImg.src = item.immagine;
        lbImg.alt = item.didascalia || '';
        lbCaption.textContent = item.didascalia || '';
        
        lbThumbs.querySelectorAll('.lightbox-thumb').forEach((t, i) => t.classList.toggle('active', i === currentIndex));
        const activeThumb = lbThumbs.querySelectorAll('.lightbox-thumb')[currentIndex];
        if (activeThumb) activeThumb.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
    }

    function openLightbox(index) {
        // Se la grid-modal mobile è aperta, chiudila prima
        const gm = document.getElementById('galleria-modal');
        if (gm) gm.classList.remove('active');
        ensureThumbsLoaded();
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        goTo(index);
    }

    function closeLightbox() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    overlay.querySelector('#lb-close').addEventListener('click', closeLightbox);
    overlay.querySelector('#lb-prev').addEventListener('click', () => goTo(currentIndex - 1));
    overlay.querySelector('#lb-next').addEventListener('click', () => goTo(currentIndex + 1));
    overlay.addEventListener('click', e => { if (e.target === overlay) closeLightbox(); });

    document.addEventListener('keydown', e => {
        if (!overlay.classList.contains('active')) return;
        if (e.key === 'ArrowRight') goTo(currentIndex + 1);
        if (e.key === 'ArrowLeft') goTo(currentIndex - 1);
        if (e.key === 'Escape') closeLightbox();
    });


    // ---- Griglia principale ----
    const container = document.querySelector('[data-cms-container="galleria_items"]');
    if (!container) return;
    container.innerHTML = '';

    items.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'galleria-item reveal-item visible';
        const limit = getLimit();
        const isVisible = index < limit;

        if (isVisible) {
            // Foto visibili subito: src normale, eager per le prime 3
            card.innerHTML = `
                <img src="${item.immagine}" alt="${item.didascalia || 'Galleria Il Ticino'}" class="galleria-img" loading="${index < 3 ? 'eager' : 'lazy'}">
                ${item.didascalia ? `<div class="galleria-caption">${item.didascalia}</div>` : ''}
            `;
        } else {
            // Foto nascoste: data-src, il browser NON le scarica
            card.style.display = 'none';
            card.innerHTML = `
                <img data-src="${item.immagine}" alt="${item.didascalia || 'Galleria Il Ticino'}" class="galleria-img">
                ${item.didascalia ? `<div class="galleria-caption">${item.didascalia}</div>` : ''}
            `;
        }

        card.addEventListener('click', () => openLightbox(index));
        container.appendChild(card);
    });

    // Attiva il src di tutte le immagini che sono visibili nella griglia
    function revealVisibleImages() {
        container.querySelectorAll('.galleria-item').forEach(card => {
            if (card.style.display !== 'none') {
                const img = card.querySelector('img[data-src]');
                if (img) {
                    img.src = img.dataset.src;
                    delete img.dataset.src;
                }
            }
        });
    }

    // Carica tutte le immagini (usata quando si espande la griglia o si apre il lightbox)
    function loadAllGridImages() {
        container.querySelectorAll('.galleria-item img[data-src]').forEach(img => {
            img.src = img.dataset.src;
            delete img.dataset.src;
        });
    }

    // ---- Toggle button ----
    const btnContainer = document.getElementById('galleria-btn-container');
    
    function updateToggleButton() {
        if (!btnContainer) return;
        btnContainer.innerHTML = '';

        const limit = getLimit();
        if (items.length > limit) {
            const btn = document.createElement('button');
            btn.className = 'galleria-toggle-btn';

            const checkMobileBehavior = () => window.innerWidth < 480;

            if (checkMobileBehavior()) {
                // Mobile: apre il lightbox dalla prima foto (design unificato, no bottom sheet)
                btn.textContent = 'Vedi tutte le foto';
                btn.addEventListener('click', () => {
                    ensureThumbsLoaded();
                    loadAllGridImages();
                    openLightbox(0);
                });
            } else {
                // Tablet e Desktop: espansione inline
                btn.textContent = expanded ? 'Nascondi foto' : 'Vedi altre foto';
                btn.addEventListener('click', () => {
                    loadAllGridImages(); // carica tutte le foto
                    expanded = !expanded;
                    const currentLimit = getLimit();
                    container.querySelectorAll('.galleria-item').forEach((card, i) => {
                        if (i >= currentLimit) card.style.display = expanded ? 'block' : 'none';
                    });
                    revealVisibleImages(); // assicura caricamento delle foto mostrate
                    btn.textContent = expanded ? 'Nascondi foto' : 'Vedi altre foto';
                });
            }

            btnContainer.appendChild(btn);
        }
    }

    // Inizializza il bottone e rivela le immagini visibili al caricamento
    revealVisibleImages();
    updateToggleButton();

    // Aggiorna comportamento al resize (es. rotazione schermo o ridimensionamento finestra)
    window.addEventListener('resize', () => {
        const limit = getLimit();
        container.querySelectorAll('.galleria-item').forEach((card, i) => {
            if (i < limit) {
                card.style.display = 'block';
            } else if (!expanded) {
                card.style.display = 'none';
            }
        });
        
        // Carica le immagini che sono diventate visibili dopo il ridimensionamento
        revealVisibleImages();
        
        // Rigenera il bottone dinamicamente per allinearsi al nuovo limite/comportamento dello schermo
        updateToggleButton();
    }, { passive: true });
}


