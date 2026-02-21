document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});
// NEWS SLIDER - vanilla JS (no jQuery / no Swiper)
(function () {
    const root = document.getElementById('newsSliderRoot');
    if (!root) return;

    const slider = root.querySelector('.news-slider');
    const track = root.querySelector('.news-slider__wrp');
    const slides = Array.from(root.querySelectorAll('.news-slider__item'));
    const items = slides.map((slide) => slide.querySelector('.news__item')).filter(Boolean);
    const itemBg = root.querySelector('.item-bg');
    const prevBtn = root.querySelector('.news-slider-prev');
    const nextBtn = root.querySelector('.news-slider-next');
    const pagination = root.querySelector('.news-slider__pagination');

    if (!slider || !track || !slides.length || !pagination || !itemBg) return;

    items.forEach((item) => {
        item.addEventListener('click', (event) => event.preventDefault());
    });

    let active = 0;
    let wheelLocked = false;
    let autoplayTimer = null;
    let isDragging = false;
    let dragMoved = false;
    let dragStartX = 0;
    let dragDeltaX = 0;

    const AUTO_DELAY = 4200;

    function wrap(index) {
        const len = slides.length;
        return ((index % len) + len) % len;
    }

    function getSignedDistance(index) {
        const len = slides.length;
        let distance = index - active;
        if (distance > len / 2) distance -= len;
        if (distance < -len / 2) distance += len;
        return distance;
    }

    function updateItemBg() {
        const activeItem = items[active];
        if (!activeItem) return;

        const rootRect = root.getBoundingClientRect();
        const itemRect = activeItem.getBoundingClientRect();

        const x = itemRect.left - rootRect.left;
        const y = itemRect.top - rootRect.top;

        itemBg.style.width = `${itemRect.width}px`;
        itemBg.style.height = `${itemRect.height}px`;
        itemBg.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        itemBg.classList.add('active');
    }

    function updatePagination() {
        const bullets = Array.from(pagination.children);
        bullets.forEach((bullet, index) => {
            bullet.classList.toggle('is-active', index === active);
        });
    }

    function render() {
        const compact = window.innerWidth < 700;
        const medium = window.innerWidth < 992;
        const spacing = compact ? 238 : (medium ? 292 : 360);
        const depth = compact ? 110 : (medium ? 145 : 175);

        slides.forEach((slide, index) => {
            const distance = getSignedDistance(index);
            const absDistance = Math.abs(distance);

            const x = distance * spacing;
            const z = -absDistance * depth;
            const rotateY = -distance * (compact ? 12 : 16);
            const scale = absDistance === 0 ? 1 : Math.max(0.78, 1 - (absDistance * 0.14));
            const opacity = absDistance > 2.45 ? 0 : Math.max(0.1, 1 - (absDistance * 0.42));
            const blur = absDistance === 0 ? 0 : Math.min(2.6, absDistance * 1.2);

            slide.style.transform = `translate3d(calc(-50% + ${x}px), 0, ${z}px) rotateY(${rotateY}deg) scale(${scale})`;
            slide.style.opacity = String(opacity);
            slide.style.filter = `blur(${blur}px)`;
            slide.style.zIndex = String(30 - Math.round(absDistance * 8));
            slide.classList.toggle('is-hidden', absDistance > 2.45);
            slide.classList.toggle('swiper-slide-active', index === active);
            slide.classList.toggle('swiper-slide-prev', distance === -1);
            slide.classList.toggle('swiper-slide-next', distance === 1);
        });

        items.forEach((item, index) => {
            item.classList.toggle('active', index === active);
        });

        updatePagination();
        updateItemBg();
    }

    function goTo(index) {
        active = wrap(index);
        render();
    }

    function next() {
        goTo(active + 1);
    }

    function prev() {
        goTo(active - 1);
    }

    function stopAutoplay() {
        if (!autoplayTimer) return;
        window.clearInterval(autoplayTimer);
        autoplayTimer = null;
    }

    function startAutoplay() {
        stopAutoplay();
        if (isDragging) return;
        autoplayTimer = window.setInterval(next, AUTO_DELAY);
    }

    function restartAutoplay() {
        stopAutoplay();
        startAutoplay();
    }

    function lockWheel() {
        wheelLocked = true;
        window.setTimeout(() => {
            wheelLocked = false;
        }, 360);
    }

    function buildPagination() {
        pagination.innerHTML = '';
        slides.forEach((_, index) => {
            const bullet = document.createElement('button');
            bullet.type = 'button';
            bullet.setAttribute('aria-label', `Go to news ${index + 1}`);
            bullet.addEventListener('click', () => {
                goTo(index);
                restartAutoplay();
            });
            pagination.appendChild(bullet);
        });
    }

    slider.addEventListener('wheel', (event) => {
        if (wheelLocked) return;
        const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
        if (Math.abs(delta) < 18) return;
        event.preventDefault();
        if (delta > 0) next(); else prev();
        lockWheel();
        restartAutoplay();
    }, { passive: false });

    slider.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
            prev();
            restartAutoplay();
        }
        if (event.key === 'ArrowRight') {
            next();
            restartAutoplay();
        }
    });

    track.addEventListener('pointerdown', (event) => {
        isDragging = true;
        dragMoved = false;
        dragStartX = event.clientX;
        dragDeltaX = 0;
        track.setPointerCapture(event.pointerId);
        stopAutoplay();
    });

    track.addEventListener('pointermove', (event) => {
        if (!isDragging) return;
        dragDeltaX = event.clientX - dragStartX;
        if (Math.abs(dragDeltaX) > 6) dragMoved = true;
    });

    function finishDrag(event) {
        if (!isDragging) return;
        isDragging = false;

        if (Math.abs(dragDeltaX) > 45) {
            if (dragDeltaX < 0) next();
            if (dragDeltaX > 0) prev();
        }

        if (track.hasPointerCapture(event.pointerId)) {
            track.releasePointerCapture(event.pointerId);
        }

        startAutoplay();
    }

    track.addEventListener('pointerup', finishDrag);
    track.addEventListener('pointercancel', finishDrag);

    track.addEventListener('click', (event) => {
        const card = event.target.closest('.news-slider__item');
        if (!card || dragMoved) return;
        const index = slides.indexOf(card);
        if (index < 0) return;
        goTo(index);
        restartAutoplay();
    });

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prev();
            restartAutoplay();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            next();
            restartAutoplay();
        });
    }

    window.addEventListener('resize', () => {
        window.requestAnimationFrame(render);
    });

    buildPagination();
    render();
    startAutoplay();
})();
// TEAM FOCUS RAIL - vanilla JS cinematic carousel

(function () {
    const root = document.getElementById("focusRail");
    const stage = document.getElementById("focusRailStage");
    const metaEl = document.getElementById("focusRailMeta");
    const titleEl = document.getElementById("focusRailTitle");
    const descEl = document.getElementById("focusRailDesc");
    const counterEl = document.getElementById("focusRailCounter");
    const linkEl = document.getElementById("focusRailLink");
    const prevBtn = document.getElementById("focusRailPrev");
    const nextBtn = document.getElementById("focusRailNext");
    const copyWrap = document.querySelector(".focus-rail-copy");

    if (!root || !stage || !metaEl || !titleEl || !descEl || !counterEl || !linkEl) {
        return;
    }

    const items = [
        {
            id: 1,
            title: "Royal Leadership",
            description: "Vision-driven leadership balancing character, excellence, and measurable growth.",
            meta: "Leadership",
            imageSrc: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1400&auto=format&fit=crop",
            href: "#about"
        },
        {
            id: 2,
            title: "Academic Supervision",
            description: "Curriculum quality, assessment precision, and teacher development across all grades.",
            meta: "Academics",
            imageSrc: "https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=1400&auto=format&fit=crop",
            href: "#news"
        },
        {
            id: 3,
            title: "Student Affairs",
            description: "A structured support system that keeps students and families continuously connected.",
            meta: "Community",
            imageSrc: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1400&auto=format&fit=crop",
            href: "#contact"
        },
        {
            id: 4,
            title: "Activities & Events",
            description: "Competitions, clubs, and experiences that turn confidence into leadership.",
            meta: "Culture",
            imageSrc: "https://images.unsplash.com/photo-1511988617509-a57c8a288659?q=80&w=1400&auto=format&fit=crop",
            href: "#news"
        },
        {
            id: 5,
            title: "Digital Learning",
            description: "Modern digital infrastructure supporting deep learning and future-ready skills.",
            meta: "Technology",
            imageSrc: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1400&auto=format&fit=crop",
            href: "#contact"
        }
    ];

    const settings = {
        loop: true,
        autoPlay: true,
        autoPlayDelay: 4000,
        wheelLockMs: 380,
        spring: 0.1,
        damping: 0.78,
        maxVelocity: 2.2
    };

    const state = {
        current: 0,
        target: 0,
        velocity: 0,
        activeIndex: -1,
        isDragging: false,
        dragMoved: false,
        dragStartX: 0,
        dragStartCurrent: 0,
        dragDeltaX: 0,
        lastWheelAt: 0,
        autoTimer: null,
        rafId: null
    };

    const cards = [];

    function wrapIndex(value, length) {
        return ((value % length) + length) % length;
    }

    function shortestDelta(from, to, length) {
        let delta = to - from;
        if (delta > length / 2) delta -= length;
        if (delta < -length / 2) delta += length;
        return delta;
    }

    function getWrappedDistance(cardIndex, virtualPosition) {
        const pos = wrapIndex(virtualPosition, items.length);
        return shortestDelta(pos, cardIndex, items.length);
    }

    function createCards() {
        const fragment = document.createDocumentFragment();

        items.forEach((item, index) => {
            const card = document.createElement("button");
            card.type = "button";
            card.className = "focus-rail-card";
            card.dataset.index = String(index);
            card.setAttribute("aria-label", item.title);

            const inner = document.createElement("div");
            inner.className = "focus-rail-card-inner";

            const media = document.createElement("div");
            media.className = "focus-rail-media";

            const image = document.createElement("img");
            image.loading = "lazy";
            image.alt = item.title;
            image.src = item.imageSrc;

            media.appendChild(image);
            inner.appendChild(media);
            card.appendChild(inner);
            fragment.appendChild(card);
            cards.push(card);
        });

        stage.appendChild(fragment);
    }

    function updateCopy(activeItem, activeIndex) {
        if (copyWrap) {
            copyWrap.classList.remove("is-switching");
            void copyWrap.offsetWidth;
            copyWrap.classList.add("is-switching");
        }

        metaEl.textContent = activeItem.meta || "";
        titleEl.textContent = activeItem.title;
        descEl.textContent = activeItem.description || "";
        counterEl.textContent = `${activeIndex + 1} / ${items.length}`;

        if (activeItem.href) {
            linkEl.href = activeItem.href;
            linkEl.classList.remove("is-hidden");
        } else {
            linkEl.classList.add("is-hidden");
            linkEl.removeAttribute("href");
        }
    }

    function refreshActiveContent(force) {
        const nearest = wrapIndex(Math.round(state.current), items.length);
        if (!force && nearest === state.activeIndex) return;

        state.activeIndex = nearest;
        const activeItem = items[nearest];
        updateCopy(activeItem, nearest);
    }

    function renderRail() {
        const stageWidth = stage.clientWidth || root.clientWidth;
        const spacing = Math.max(116, Math.min(300, stageWidth * 0.28));
        const zStep = Math.max(88, Math.min(220, spacing * 0.75));
        const rotateStep = window.innerWidth < 768 ? 13 : 17;

        cards.forEach((card, index) => {
            const delta = getWrappedDistance(index, state.current);
            const absDelta = Math.abs(delta);

            const x = delta * spacing;
            const z = -Math.pow(absDelta, 1.16) * zStep;
            const rotateY = -delta * rotateStep;
            const scale = Math.max(0.72, 1 - (absDelta * 0.13));
            const opacity = absDelta > 2.55 ? 0 : Math.max(0.08, 1 - (absDelta * 0.35));
            const blur = absDelta < 0.18 ? 0 : Math.min(8, absDelta * 2.8);
            const brightness = absDelta < 0.18 ? 1 : Math.max(0.42, 1 - (absDelta * 0.26));
            const saturate = absDelta < 0.18 ? 1.12 : Math.max(0.72, 1 - (absDelta * 0.15));
            const zIndex = 400 - Math.round(absDelta * 100);
            const isActive = absDelta < 0.33;

            card.classList.toggle("is-active", isActive);
            card.style.transform = `translate3d(calc(-50% + ${x}px), -50%, ${z}px) rotateY(${rotateY}deg) scale(${scale})`;
            card.style.opacity = String(opacity);
            card.style.filter = `blur(${blur}px) brightness(${brightness}) saturate(${saturate})`;
            card.style.zIndex = String(zIndex);
            card.style.pointerEvents = opacity < 0.16 ? "none" : "auto";
        });

        refreshActiveContent(false);
    }

    function normalizeIndices() {
        if (Math.abs(state.current) < 10000 && Math.abs(state.target) < 10000) return;
        const base = Math.trunc(state.current / items.length) * items.length;
        state.current -= base;
        state.target -= base;
    }

    function animate() {
        if (state.isDragging) {
            const dragSteps = -state.dragDeltaX / 150;
            state.current = state.dragStartCurrent + dragSteps;
            state.velocity = 0;
        } else {
            const displacement = state.target - state.current;
            state.velocity += displacement * settings.spring;
            state.velocity *= settings.damping;

            if (Math.abs(state.velocity) > settings.maxVelocity) {
                state.velocity = Math.sign(state.velocity) * settings.maxVelocity;
            }

            state.current += state.velocity;

            if (Math.abs(displacement) < 0.0009 && Math.abs(state.velocity) < 0.0009) {
                state.current = state.target;
                state.velocity = 0;
            }
        }

        renderRail();
        normalizeIndices();
        state.rafId = window.requestAnimationFrame(animate);
    }

    function navigate(step) {
        state.target = Math.round(state.target + step);
    }

    function goToCard(index) {
        const rounded = wrapIndex(Math.round(state.target), items.length);
        const delta = shortestDelta(rounded, index, items.length);
        state.target = Math.round(state.target + delta);
    }

    function stopAutoplay() {
        if (!state.autoTimer) return;
        window.clearInterval(state.autoTimer);
        state.autoTimer = null;
    }

    function startAutoplay() {
        stopAutoplay();
        if (!settings.autoPlay || state.isDragging) return;
        state.autoTimer = window.setInterval(() => {
            navigate(1);
        }, settings.autoPlayDelay);
    }

    function restartAutoplay() {
        stopAutoplay();
        startAutoplay();
    }

    function handleWheel(event) {
        const now = Date.now();
        if (now - state.lastWheelAt < settings.wheelLockMs) return;

        const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
        const delta = horizontal ? event.deltaX : event.deltaY;
        if (Math.abs(delta) < 20) return;

        event.preventDefault();
        state.lastWheelAt = now;
        navigate(delta > 0 ? 1 : -1);
        restartAutoplay();
    }

    function onPointerDown(event) {
        state.isDragging = true;
        state.dragMoved = false;
        state.dragStartX = event.clientX;
        state.dragStartCurrent = state.current;
        state.dragDeltaX = 0;
        stage.setPointerCapture(event.pointerId);
        stopAutoplay();
    }

    function onPointerMove(event) {
        if (!state.isDragging) return;
        state.dragDeltaX = event.clientX - state.dragStartX;
        if (Math.abs(state.dragDeltaX) > 4) {
            state.dragMoved = true;
        }
    }

    function onPointerUp(event) {
        if (!state.isDragging) return;

        const dragSteps = -state.dragDeltaX / 150;
        let snappedTarget = state.dragStartCurrent + dragSteps;

        if (Math.abs(state.dragDeltaX) > 48) {
            snappedTarget = state.dragStartCurrent + (state.dragDeltaX < 0 ? 1 : -1);
        }

        state.isDragging = false;
        state.target = Math.round(snappedTarget);
        state.velocity *= 0.45;

        if (stage.hasPointerCapture(event.pointerId)) {
            stage.releasePointerCapture(event.pointerId);
        }

        startAutoplay();
    }

    stage.addEventListener("pointerdown", onPointerDown);
    stage.addEventListener("pointermove", onPointerMove);
    stage.addEventListener("pointerup", onPointerUp);
    stage.addEventListener("pointercancel", onPointerUp);

    stage.addEventListener("click", (event) => {
        const targetCard = event.target.closest(".focus-rail-card");
        if (!targetCard || state.dragMoved) return;

        const index = Number(targetCard.dataset.index);
        if (!Number.isFinite(index)) return;

        goToCard(index);
        restartAutoplay();
    });

    root.addEventListener("wheel", handleWheel, { passive: false });

    root.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") {
            navigate(-1);
            restartAutoplay();
        }
        if (event.key === "ArrowRight") {
            navigate(1);
            restartAutoplay();
        }
    });

    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            navigate(-1);
            restartAutoplay();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            navigate(1);
            restartAutoplay();
        });
    }

    window.addEventListener("resize", renderRail);

    createCards();
    refreshActiveContent(true);
    renderRail();
    state.rafId = window.requestAnimationFrame(animate);
    startAutoplay();
})();

const translations = {
    en: {
        "page-title": "Royal School | Shaping Future Leaders",
        "nav-home": "Home",
        "nav-about": "About",
        "nav-news": "News",
        "nav-team": "Our Team",
        "nav-contact": "Contact",
        "btn-hero-contact": "Contact Us",
        "home-pill": "Royal School Ã¢â‚¬Â¢ Since 1924",
        "home-title": "A Royal Journey of Learning and Character.",
        "home-text": "Welcome to Royal School, where we combine strong values, excellent teaching, and a caring community to shape confident and responsible learners.",
        "home-btn-primary": "Learn About Our School",
        "home-btn-secondary": "View Latest News <span class=\"material-icons-outlined text-sm\">arrow_forward</span>",
        "home-highlight-1-number": "KGÃ¢â‚¬â€œGrade 12",
        "home-highlight-1-label": "Comprehensive Programs",
        "home-highlight-2-label": "Royal Community",
        "home-highlight-2-text": "Students, staff, and families working together for success.",
        "about-tagline": "About the School",
        "about-title": "Building Character, Knowledge, and Leadership.",
        "about-text": "Royal School is a private educational community that focuses on academic excellence, personal values, and future-ready skills. Our classrooms, activities, and campus life are all designed to help students grow in every area of life.",
        "about-stat-1-number": "20+",
        "about-stat-1-label": "Years of local impact",
        "about-stat-2-number": "3",
        "about-stat-2-label": "Educational stages",
        "about-stat-3-number": "100%",
        "about-stat-3-label": "Care for every student",
        "about-point-1-title": "Strong academic foundation",
        "about-point-1-text": "Structured programs that build solid skills in languages, math, and sciences.",
        "about-point-2-title": "Safe and supportive environment",
        "about-point-2-text": "We care about the emotional and social well-being of every learner.",
        "about-point-3-title": "Future-focused education",
        "about-point-3-text": "Activities and projects that prepare students for university and modern careers.",
        "news-tagline": "School News",
        "news-title": "Latest Updates from Campus.",
        "news-text": "Stay up to date with events, achievements, and important announcements from Royal School.",
        "news-1-date": "September 2024",
        "news-1-title": "New science labs opened",
        "news-1-text": "Our upgraded labs give students hands-on experience in physics, chemistry, and biology.",
        "news-2-date": "August 2024",
        "news-2-title": "Back-to-school orientation",
        "news-2-text": "Parents and students enjoyed an introduction day to meet teachers and explore the campus.",
        "news-3-date": "June 2024",
        "news-3-title": "Graduation ceremony",
        "news-3-text": "We celebrated our graduating class with families, awards, and memorable moments.",
        "team-tagline": "School Team",
        "team-title": "Leaders and Educators Who Care.",
        "team-text": "Our administrative and teaching teams work together to provide a high-quality and caring learning experience.",
        "team-1-name": "Principal / School Director",
        "team-1-role": "Overall leadership",
        "team-2-name": "Academic Supervisor",
        "team-2-role": "Teaching quality & curricula",
        "team-3-name": "Student Affairs Coordinator",
        "team-3-role": "Students & parents support",
        "team-4-name": "Activities & Events Leader",
        "team-4-role": "Clubs & school life",
        "contact-tagline": "Contact Us",
        "contact-title": "We are happy to answer your questions.",
        "contact-text": "For inquiries about registration, fees, transportation, or any other details, please reach out to our school office.",
        "contact-address": "123 Heritage Way, Windsor, UK",
        "contact-phone": "+44 20 7946 0123",
        "contact-email": "admissions@royalschool.edu",
        "contact-form-title": "Send us a message",
        "contact-form-text": "Fill in your details and our team will contact you as soon as possible.",
        "contact-form-name-label": "Student / Parent Name",
        "contact-form-phone-label": "Mobile Number",
        "contact-form-message-label": "Message / Inquiry",
        "contact-form-submit": "Send"
    },
    ar: {
        "page-title": "المدرسة الملكية | صناعة قادة المستقبل",
        "nav-home": "الرئيسية",
        "nav-about": "من نحن",
        "nav-news": "الأخبار",
        "nav-team": "فريقنا",
        "nav-contact": "اتصل بنا",
        "btn-hero-contact": "تواصل معنا",

        "home-pill": "المدرسة الملكية • منذ 1924",
        "home-title": "رحلة ملكية في التعلم وبناء الشخصية.",
        "home-text": "مرحبًا بكم في المدرسة الملكية، حيث نجمع بين القيم الراسخة، والتعليم المتميز، والمجتمع الداعم لنصنع طلابًا واثقين ومسؤولين.",
        "home-btn-primary": "تعرّف على مدرستنا",
        "home-btn-secondary": "عرض آخر الأخبار <span class=\"material-icons-outlined text-sm\">arrow_forward</span>",
        "home-highlight-1-number": "الروضة – الصف الثاني عشر",
        "home-highlight-1-label": "برامج تعليمية متكاملة",
        "home-highlight-2-label": "مجتمع ملكي",
        "home-highlight-2-text": "طلاب وهيئة تدريس وأولياء أمور يعملون معًا لتحقيق النجاح.",

        "about-tagline": "عن المدرسة",
        "about-title": "نبني الشخصية والمعرفة والقيادة.",
        "about-text": "المدرسة الملكية مؤسسة تعليمية خاصة تركز على التميز الأكاديمي، والقيم الشخصية، والمهارات المستقبلية. تم تصميم صفوفنا وأنشطتنا وحياتنا المدرسية لمساعدة الطلاب على النمو في جميع جوانب حياتهم.",
        "about-stat-1-number": "+20",
        "about-stat-1-label": "سنة من التأثير المحلي",
        "about-stat-2-number": "3",
        "about-stat-2-label": "مراحل تعليمية",
        "about-stat-3-number": "100%",
        "about-stat-3-label": "رعاية لكل طالب",
        "about-point-1-title": "أساس أكاديمي قوي",
        "about-point-1-text": "برامج منظمة تبني مهارات متينة في اللغات والرياضيات والعلوم.",
        "about-point-2-title": "بيئة آمنة وداعمة",
        "about-point-2-text": "نحرص على الصحة النفسية والاجتماعية لكل طالب.",
        "about-point-3-title": "تعليم يواكب المستقبل",
        "about-point-3-text": "أنشطة ومشاريع تهيئ الطلاب للجامعة والمهن الحديثة.",

        "news-tagline": "أخبار المدرسة",
        "news-title": "آخر المستجدات من الحرم المدرسي.",
        "news-text": "ابقَ على اطلاع على الفعاليات والإنجازات والإعلانات المهمة من المدرسة الملكية.",
        "news-1-date": "سبتمبر 2024",
        "news-1-title": "افتتاح مختبرات العلوم الجديدة",
        "news-1-text": "توفر مختبراتنا المطورة تجربة عملية للطلاب في الفيزياء والكيمياء والأحياء.",
        "news-2-date": "أغسطس 2024",
        "news-2-title": "اليوم التعريفي للعام الدراسي",
        "news-2-text": "استمتع أولياء الأمور والطلاب بيوم تعريفي للقاء المعلمين واستكشاف الحرم المدرسي.",
        "news-3-date": "يونيو 2024",
        "news-3-title": "حفل التخرج",
        "news-3-text": "احتفلنا بتخريج طلابنا بحضور العائلات وتوزيع الجوائز ولحظات لا تُنسى.",

        "team-tagline": "فريق المدرسة",
        "team-title": "قيادات ومعلمون يهتمون.",
        "team-text": "يعمل فريقنا الإداري والتعليمي معًا لتقديم تجربة تعليمية عالية الجودة ومليئة بالرعاية.",
        "team-1-name": "مدير / مديرة المدرسة",
        "team-1-role": "القيادة العامة",
        "team-2-name": "المشرف الأكاديمي",
        "team-2-role": "جودة التعليم والمناهج",
        "team-3-name": "منسق شؤون الطلبة",
        "team-3-role": "دعم الطلاب وأولياء الأمور",
        "team-4-name": "مسؤول الأنشطة والفعاليات",
        "team-4-role": "الأندية والحياة المدرسية",

        "contact-tagline": "اتصل بنا",
        "contact-title": "يسعدنا الإجابة على استفساراتكم.",
        "contact-text": "للاستفسار حول التسجيل، الرسوم، المواصلات، أو أي تفاصيل أخرى، يرجى التواصل مع إدارة المدرسة.",
        "contact-address": "123 شارع التراث، وندسور، المملكة المتحدة",
        "contact-phone": "+44 20 7946 0123",
        "contact-email": "admissions@royalschool.edu",
        "contact-form-title": "أرسل لنا رسالة",
        "contact-form-text": "املأ بياناتك وسيتواصل معك فريقنا في أقرب وقت ممكن.",
        "contact-form-name-label": "اسم الطالب / ولي الأمر",
        "contact-form-phone-label": "رقم الجوال",
        "contact-form-message-label": "الرسالة / الاستفسار",
        "contact-form-submit": "إرسال"
    }
};
const html = document.documentElement;
const langToggle = document.getElementById("lang-toggle");
function applyLanguage(lang) {
    const dict = translations[lang] || translations.en;
    Object.keys(dict).forEach(key => {
        if (key === "page-title") {
            return;
        }
        const elements = document.querySelectorAll('[data-i18n="' + key + '"]');
        elements.forEach(el => {
            el.innerHTML = dict[key];
        });
    });
    if (dict["page-title"]) {
        document.title = dict["page-title"];
    }
    html.lang = lang === "ar" ? "ar" : "en";
    html.dir = "ltr";
    if (langToggle) {
        langToggle.textContent = lang === "ar" ? "EN" : "ع";
    }
}
let currentLanguage = localStorage.getItem("language") || "en";
if (!translations[currentLanguage]) {
    currentLanguage = "en";
}
applyLanguage(currentLanguage);

if (langToggle) {
    langToggle.addEventListener("click", () => {
        currentLanguage = currentLanguage === "en" ? "ar" : "en";
        localStorage.setItem("language", currentLanguage);
        applyLanguage(currentLanguage);
    });
}
