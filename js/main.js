const header = document.getElementById('siteHeader');
  const toTop = document.getElementById('toTop');
  window.addEventListener('scroll', ()=>{
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 30);
    toTop.classList.toggle('show', y > 600);
  });
  toTop.addEventListener('click', ()=> window.scrollTo({top:0, behavior:'smooth'}));

  const targets = document.querySelectorAll('.reveal, .stagger');
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} });
  },{threshold:0.12});
  targets.forEach(el=>io.observe(el));

  const counters = document.querySelectorAll('[data-count]');
  const co = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        const el = e.target, target = +el.dataset.count;
        let cur = 0; const step = Math.max(1, Math.ceil(target/30));
        const t = setInterval(()=>{ cur += step; if(cur>=target){cur=target; clearInterval(t);} el.textContent = cur; }, 40);
        co.unobserve(el);
      }
    });
  },{threshold:0.5});
  counters.forEach(el=>co.observe(el));

  const stamps = [
    {country:'SINGAPORE', code:'DHK—SIN · 5+ DAYS'},
    {country:'MALAYSIA', code:'DHK—KUL · 7 DAYS'},
    {country:'THAILAND', code:'DHK—BKK · 5–7 DAYS'},
    {country:'DUBAI', code:'DHK—DXB · 30/60 DAY'},
    {country:'CHINA', code:'DHK—PEK · STANDARD'}
  ];
  let si = 0;
  const stampEl = document.getElementById('stampVisual');
  setInterval(()=>{
    si = (si+1) % stamps.length;
    stampEl.style.opacity = 0;
    setTimeout(()=>{
      stampEl.querySelector('.country').textContent = stamps[si].country;
      stampEl.querySelector('.code').textContent = stamps[si].code;
      stampEl.style.opacity = 1;
    }, 260);
  }, 3200);

  document.querySelectorAll('.btn-primary, .btn-ghost, .nav-cta').forEach(btn=>{
    btn.style.position = btn.style.position || 'relative';
    btn.style.overflow = 'hidden';
    btn.addEventListener('click', function(e){
      const r = this.getBoundingClientRect();
      const circle = document.createElement('span');
      circle.className = 'ripple';
      const size = Math.max(r.width, r.height);
      circle.style.width = circle.style.height = size + 'px';
      circle.style.left = (e.clientX - r.left - size/2) + 'px';
      circle.style.top = (e.clientY - r.top - size/2) + 'px';
      this.appendChild(circle);
      setTimeout(()=>circle.remove(), 650);
    });
  });

  document.querySelectorAll('.dest-card').forEach(card=>{
    card.addEventListener('mousemove', (e)=>{
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left)/r.width - .5;
      const y = (e.clientY - r.top)/r.height - .5;
      card.style.transform = `translateY(-8px) rotateX(${(-y*5).toFixed(2)}deg) rotateY(${(x*5).toFixed(2)}deg)`;
    });
    card.addEventListener('mouseleave', ()=>{ card.style.transform = ''; });
  });

  /* visa detail tabs */
  function openTab(id){
    document.querySelectorAll('.vd-panel').forEach(p=>p.classList.remove('active'));
    document.querySelectorAll('.vd-tab').forEach(t=>t.classList.remove('active'));
    const panel = document.getElementById('panel-' + id);
    const tab = document.querySelector('.vd-tab[data-tab="' + id + '"]');
    if(panel) panel.classList.add('active');
    if(tab) tab.classList.add('active');
  }

  /* gallery filter */
  function filterGallery(cat, btn){
    document.querySelectorAll('.gal-filter').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.gal-item').forEach(item=>{
      const show = cat === 'all' || item.dataset.cat === cat;
      item.classList.toggle('hide', !show);
    });
  }

  /* gallery lightbox */
  const galItems = Array.from(document.querySelectorAll('.gal-item'));
  const lightbox = document.getElementById('lightbox');
  const lbImage = document.getElementById('lbImage');
  const lbCaption = document.getElementById('lbCaption');
  let lbIndex = 0;

  function visibleItems(){
    return galItems.filter(item => !item.classList.contains('hide'));
  }

  function showAt(index){
    const items = visibleItems();
    if(items.length === 0) return;
    lbIndex = (index + items.length) % items.length;
    const item = items[lbIndex];
    lbImage.src = item.querySelector('img').src;
    lbImage.alt = item.querySelector('img').alt;
    lbCaption.textContent = item.dataset.cat;
  }

  function openLightbox(originalIndex){
    const items = visibleItems();
    const clicked = galItems[originalIndex];
    let idx = items.indexOf(clicked);
    if(idx === -1) idx = 0;
    showAt(idx);
    lightbox.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox(){
    lightbox.classList.remove('show');
    document.body.style.overflow = '';
  }

  function navLightbox(dir){
    showAt(lbIndex + dir);
  }

  document.addEventListener('keydown', (e)=>{
    if(!lightbox.classList.contains('show')) return;
    if(e.key === 'Escape') closeLightbox();
    if(e.key === 'ArrowLeft') navLightbox(-1);
    if(e.key === 'ArrowRight') navLightbox(1);
  });

  /* form validation + real submission */
  const form = document.getElementById('visaForm');
  const banner = document.getElementById('successBanner');
  const errorBanner = document.getElementById('errorBanner');
  const submitBtn = document.getElementById('submitBtn');
  const waBtn = document.getElementById('waBtn');

  // Change this to your desk's WhatsApp Business number (country code, no + or spaces)
  const WHATSAPP_NUMBER = '8801713998232';
  // Path to the PHP mail handler — upload send-form.php next to this HTML file on your server
  const FORM_ENDPOINT = 'send-form.php';

  const validators = {
    name:  v => v.trim().length >= 3,
    phone: v => /^01[3-9]\d{8}$/.test(v.trim()),
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    dest:  v => v.trim().length > 0
  };
  function setFieldState(id, ok){
    const field = document.getElementById('f-' + id);
    field.classList.toggle('error', !ok);
  }
  Object.keys(validators).forEach(id=>{
    const el = document.getElementById(id);
    el.addEventListener('input', ()=> setFieldState(id, validators[id](el.value)));
    el.addEventListener('blur', ()=> setFieldState(id, validators[id](el.value)));
  });

  function validateAll(){
    let allOk = true, firstBad = null;
    Object.keys(validators).forEach(id=>{
      const el = document.getElementById(id);
      const ok = validators[id](el.value);
      setFieldState(id, ok);
      if(!ok){ allOk = false; if(!firstBad) firstBad = el; }
    });
    if(!allOk && firstBad) firstBad.focus();
    return allOk;
  }

  function fieldValues(){
    return {
      name: document.getElementById('name').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      email: document.getElementById('email').value.trim(),
      dest: document.getElementById('dest').value.trim(),
      msg: document.getElementById('msg').value.trim()
    };
  }

  function whatsappLink(v){
    const lines = [
      'New visa enquiry — Union Tours & Travels website',
      `Name: ${v.name}`,
      `Phone: ${v.phone}`,
      `Email: ${v.email}`,
      `Destination: ${v.dest}`,
      v.msg ? `Details: ${v.msg}` : null
    ].filter(Boolean);
    const text = encodeURIComponent(lines.join('\n'));
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
  }

  /* Main submit → sends email via send-form.php AND opens WhatsApp pre-filled, in one click */
  form.addEventListener('submit', async function(e){
    e.preventDefault();
    banner.classList.remove('show');
    errorBanner.classList.remove('show');
    if(!validateAll()) return;

    const v = fieldValues();
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    // Open WhatsApp immediately (must happen synchronously with the click,
    // otherwise some browsers block the popup after the awaited fetch below).
    const waWindow = window.open(whatsappLink(v), '_blank');

    try{
      const fd = new FormData(form);
      const res = await fetch(FORM_ENDPOINT, { method:'POST', body: fd, headers:{'X-Requested-With':'fetch'} });
      const data = await res.json().catch(()=>({ok:false}));

      if(res.ok && data.ok){
        banner.classList.add('show');
        form.reset();
        Object.keys(validators).forEach(id=> setFieldState(id, true));
        banner.scrollIntoView({behavior:'smooth', block:'nearest'});
      } else {
        throw new Error(data.error || 'Send failed');
      }
    } catch(err){
      // Email leg failed (commonly: send-form.php not uploaded yet, or host
      // disabled PHP mail()) — WhatsApp tab has still opened above, so the
      // enquiry isn't lost, just tell them the email copy didn't go through.
      errorBanner.classList.add('show');
      errorBanner.scrollIntoView({behavior:'smooth', block:'nearest'});
      console.error('Form submission error:', err);
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  });

  /* Secondary button → WhatsApp only, no email (for people who prefer that) */
  waBtn.addEventListener('click', function(){
    if(!validateAll()) return;
    window.open(whatsappLink(fieldValues()), '_blank');
  });
