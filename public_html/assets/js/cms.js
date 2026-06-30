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
        const [impostazioni, home, servizi, contatti] = await Promise.all([
            fetchJSON('content/impostazioni.json'),
            fetchJSON('content/home.json'),
            fetchJSON('content/servizi.json'),
            fetchJSON('content/contatti.json')
        ]);

        if (impostazioni) updateGlobalSettings(impostazioni);
        if (home) updateHomeSection(home);
        if (servizi) updateServiziSection(servizi);
        if (contatti) updateContattiSection(contatti);

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
