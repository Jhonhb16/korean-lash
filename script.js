/* ============================================================
   METODO LASH MASTERY — QUIZ APP
   Typeform-style high-conversion lead quiz
   ============================================================ */

(() => {
  'use strict';

  /* ----------------------------------------------------------
     CONFIGURATION — Edit these values before deploying
     ---------------------------------------------------------- */
  const CONFIG = {
    // Google Apps Script Web App URL (deploy as "Anyone" with "Execute as Me")
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbyL-mrNRNW0lyHZ2809y-B_NcZn6Pd1F8_9hRAkzsW_TJkkz1BiENF_S413uSD1qlux/exec',

    // WhatsApp group invite URL (redirect target on the final screen)
    WHATSAPP_GROUP_URL: 'https://chat.whatsapp.com/Bnf9w8oYwtqJjat5zN02f8',

    // Event details shown on the final screen
    EVENT_DATE: '23 de junio',
    EVENT_TIME: '7:00 PM EST',
    WORKSHOP_NAME: 'Workshop Método Lash Mastery™',
  };

  /* ----------------------------------------------------------
     UTMs CAPTURE
     ---------------------------------------------------------- */
  const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const utms = {};
  UTM_KEYS.forEach((key) => {
    const value = new URLSearchParams(window.location.search).get(key);
    utms[key] = value || '';
  });

  /* ----------------------------------------------------------
     QUESTION DEFINITIONS
     ---------------------------------------------------------- */
  const QUESTIONS = [
    {
      key: 'situacion_actual',
      type: 'choice',
      title: '¿Cuál de estas situaciones se parece más a ti hoy?',
      options: [
        'Tengo trabajo pero me gustaría ganar más',
        'Me gustaría generar ingresos propios',
        'Estoy buscando una nueva oportunidad',
        'Tengo curiosidad por aprender algo diferente',
      ],
    },
    {
      key: 'cambio_deseado',
      type: 'choice',
      title: 'Si pudieras generar ingresos adicionales con una habilidad especializada... ¿qué cambiaría para ti?',
      options: [
        'Más tranquilidad económica',
        'Más tiempo con mi familia',
        'Más independencia',
        'Poder ahorrar e invertir más',
      ],
    },
    {
      key: 'interes_principal',
      type: 'choice',
      title: '¿Qué fue lo que más llamó tu atención de esta oportunidad?',
      options: [
        'Aprender una habilidad premium',
        'Tener más flexibilidad',
        'Generar ingresos adicionales',
        'Construir algo propio',
      ],
    },
    {
      key: 'bloqueo_principal',
      type: 'choice',
      title: '¿Qué es lo que más te ha frenado para dar el siguiente paso?',
      options: [
        'No sé por dónde empezar',
        'No tengo suficiente tiempo',
        'No tengo experiencia',
        'No estoy segura de que funcione para mí',
      ],
    },
    {
      key: 'cuando_comenzar',
      type: 'choice',
      title: 'Si descubrieras una forma clara de aprender esta habilidad... ¿cuándo te gustaría comenzar?',
      options: [
        'Lo antes posible',
        'Durante los próximos meses',
        'Más adelante este año',
        'Solo estoy explorando opciones',
      ],
      // Conditional branch: when the user picks the last option, insert this follow-up
      branchOn: { match: 'Solo estoy explorando opciones', insert: 'explorando_motivo' },
    },
    {
      key: 'explorando_motivo',
      type: 'choice',
      title: '¿Qué te gustaría descubrir primero?',
      options: [
        'Ver casos reales',
        'Conocer cómo funciona',
        'Entender la inversión',
        'Solo tengo curiosidad',
      ],
    },
    {
      key: 'compromiso_economico',
      type: 'choice',
      title: '¿Qué tan comprometida estás con mejorar tu situación económica durante los próximos 6 meses?',
      options: [
        'Totalmente comprometida',
        'Bastante comprometida',
        'Algo comprometida',
        'Solo estoy explorando opciones',
      ],
    },
    {
      key: 'prioridad_ingresos',
      type: 'scale',
      title: '¿Qué tan importante es para ti encontrar nuevas formas de generar ingresos en este momento?',
      min: 1,
      max: 10,
      minLabel: 'Nada importante',
      maxLabel: 'Extremadamente importante',
      defaultValue: 7,
    },
    {
      key: 'estado',
      type: 'select',
      title: '¿En qué estado te encuentras actualmente?',
      options: ['Florida', 'Texas', 'California', 'New York', 'New Jersey', 'Georgia', 'Illinois', 'Otro'],
    },
    {
      key: 'nombre',
      type: 'text',
      title: '¿Cómo te llamas?',
      placeholder: 'Tu nombre',
      inputType: 'text',
      autocomplete: 'name',
      autocapitalize: 'words',
      validate: (v) => v.trim().length >= 2 || 'Por favor escribe tu nombre',
    },
    {
      key: 'whatsapp',
      type: 'text',
      title: '¿Cuál es tu mejor número de WhatsApp?',
      placeholder: '+1 555 123 4567',
      inputType: 'tel',
      autocomplete: 'tel',
      format: formatPhone,
      validate: (v) => {
        const digits = v.replace(/\D/g, '');
        if (digits.length < 10) return 'Necesitamos un número válido (mín. 10 dígitos)';
        return true;
      },
    },
    {
      key: 'email',
      type: 'text',
      title: '¿A qué correo quieres que te enviemos los detalles del Workshop?',
      placeholder: 'tu@correo.com',
      inputType: 'email',
      autocomplete: 'email',
      validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Ingresa un correo válido',
    },
  ];

  /* ----------------------------------------------------------
     LEAD SCORING
     ---------------------------------------------------------- */
  const SCORE_MAP = {
    cuando_comenzar: {
      'Lo antes posible': 30,
      'Durante los próximos meses': 20,
      'Más adelante este año': 10,
      'Solo estoy explorando opciones': 0,
    },
    compromiso_economico: {
      'Totalmente comprometida': 30,
      'Bastante comprometida': 20,
      'Algo comprometida': 10,
      'Solo estoy explorando opciones': 0,
    },
  };

  function calculateLeadScore() {
    const q5 = SCORE_MAP.cuando_comenzar[state.answers.cuando_comenzar] ?? 0;
    const comp = SCORE_MAP.compromiso_economico[state.answers.compromiso_economico] ?? 0;
    const pri = Number(state.answers.prioridad_ingresos) || 0;
    const score = q5 + comp + pri;
    let temperatura = 'Frío';
    if (score >= 60) temperatura = 'Caliente';
    else if (score >= 40) temperatura = 'Tibio';
    return { score, temperatura };
  }

  /* ----------------------------------------------------------
     STATE
     ---------------------------------------------------------- */
  const rawAnswers = {};
  const state = {
    stepIndex: 0, // 0 = welcome, 1..N = questions, N+1 = final
    answers: rawAnswers,
    submitting: false,
  };

  // Persist the answers to sessionStorage on every write
  function persist() {
    try {
      sessionStorage.setItem('lash_mastery_lead_state', JSON.stringify({ answers: state.answers }));
    } catch (e) { /* quota or disabled */ }
  }
  function tryRestore() {
    try {
      const raw = sessionStorage.getItem('lash_mastery_lead_state');
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data && data.answers) Object.assign(state.answers, data.answers);
    } catch (e) { /* ignore */ }
  }

  /* ----------------------------------------------------------
     STEP PLAN
     The order of steps the user will see. Rebuilt on every
     navigation so conditional branches stay in sync.
     ---------------------------------------------------------- */
  let stepPlan = []; // [{type:'welcome'} | {type:'question', key} | {type:'final'}]

  function buildStepPlan() {
    const plan = [{ type: 'welcome' }];
    QUESTIONS.forEach((q) => {
      plan.push({ type: 'question', key: q.key });
      if (q.branchOn && state.answers[q.key] === q.branchOn.match) {
        plan.push({ type: 'question', key: q.branchOn.insert });
      }
    });
    plan.push({ type: 'final' });
    return plan;
  }

  function refreshStepPlan() {
    stepPlan = buildStepPlan();
    // Drop answers for questions that no longer appear (e.g. user changed Q5 away from "exploring")
    const activeKeys = new Set();
    stepPlan.forEach((s) => { if (s.key) activeKeys.add(s.key); });
    Object.keys(state.answers).forEach((k) => {
      if (!activeKeys.has(k)) delete state.answers[k];
    });
  }

  function isAnswered(key) {
    const v = state.answers[key];
    return v !== undefined && v !== null && v !== '';
  }

  function findResumeIndex() {
    for (let i = 1; i < stepPlan.length - 1; i++) {
      if (stepPlan[i].type === 'question' && !isAnswered(stepPlan[i].key)) return i;
    }
    return stepPlan.length - 1; // all answered → final
  }

  /* ----------------------------------------------------------
     DOM REFERENCES
     ---------------------------------------------------------- */
  const $ = (sel) => document.querySelector(sel);
  const screen = $('#screen');
  const progressFill = $('#progressFill');
  const progressPercent = $('#progressPercent');
  const progressStep = $('#progressStep');
  const toastEl = $('#toast');

  /* ----------------------------------------------------------
     UTILITIES
     ---------------------------------------------------------- */
  function formatPhone(value) {
    const digits = String(value).replace(/\D/g, '').slice(0, 15);
    if (digits.length === 0) return '';
    if (digits.length <= 3) return `+${digits}`;
    if (digits.length <= 6) return `+${digits.slice(0, 3)} ${digits.slice(3)}`;
    if (digits.length <= 10) {
      return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    }
    return `+${digits.slice(0, digits.length - 10)} ${digits.slice(-10, -7)} ${digits.slice(-7, -4)} ${digits.slice(-4)}`;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function showToast(message, type = 'default', duration = 3500) {
    toastEl.textContent = message;
    toastEl.className = 'toast is-visible' + (type !== 'default' ? ` is-${type}` : '');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      toastEl.classList.remove('is-visible');
    }, duration);
  }

  function updateProgress() {
    // Progress goes from 0% at welcome to 100% at final.
    // Mid-way through questions, the bar smoothly fills.
    const lastIdx = stepPlan.length - 1;
    if (state.stepIndex <= 0) {
      progressFill.style.width = '0%';
      progressPercent.textContent = '0%';
    } else if (state.stepIndex >= lastIdx) {
      progressFill.style.width = '100%';
      progressPercent.textContent = '100%';
    } else {
      const pct = Math.round((state.stepIndex / lastIdx) * 100);
      progressFill.style.width = Math.max(5, Math.min(95, pct)) + '%';
      progressPercent.textContent = Math.max(5, Math.min(95, pct)) + '%';
    }
    // Step counter (e.g. "3 / 11")
    const stepNum = Math.max(0, state.stepIndex);
    const total = stepPlan.length - 1;
    progressStep.textContent = `${stepNum} / ${total}`;
  }

  /* ----------------------------------------------------------
     SCREEN RENDERERS
     ---------------------------------------------------------- */
  function renderWelcome() {
    screen.className = 'screen screen-enter';
    screen.innerHTML = `
      <div class="welcome">
        <div class="welcome-badge">Acceso exclusivo</div>
        <h1>Workshop<br/><span class="accent">Método Lash Mastery™</span></h1>
        <p>Descubre cómo mujeres latinas están transformando una habilidad premium en una fuente de ingresos en Estados Unidos.</p>
        <p class="subtext">Responde estas preguntas rápidas para reservar tu lugar.</p>
        <div class="duration">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>Duración estimada: 60 segundos</span>
        </div>
        <button class="btn btn-primary" id="btnStart" type="button">
          <span class="btn-text">Comenzar →</span>
        </button>
      </div>
    `;
    screen.querySelector('#btnStart').addEventListener('click', goNext);
  }

  function renderQuestion(questionKey) {
    const q = QUESTIONS.find((x) => x.key === questionKey);
    if (!q) return renderWelcome();

    screen.className = 'screen screen-enter';

    const backButton = state.stepIndex > 1
      ? `<button class="btn-ghost" id="btnBack" type="button" style="margin-top:14px;background:none;border:none;cursor:pointer;">← Atrás</button>`
      : '';

    if (q.type === 'choice') {
      const keys = ['A', 'B', 'C', 'D', 'E', 'F'];
      screen.innerHTML = `
        <div class="question">
          <div class="question-number">Pregunta</div>
          <h2 class="question-title">${escapeHtml(q.title)}</h2>
          <div class="options" role="radiogroup">
            ${q.options
              .map(
                (opt, i) => `
              <button class="option" type="button" data-value="${escapeHtml(opt)}" role="radio" aria-checked="false">
                <span class="option-key">${keys[i]}</span>
                <span class="option-label">${escapeHtml(opt)}</span>
              </button>`
              )
              .join('')}
          </div>
          ${backButton}
        </div>
      `;
      screen.querySelectorAll('.option').forEach((btn) => {
        btn.addEventListener('click', () => {
          const value = btn.dataset.value;
          state.answers[q.key] = value;
          persist();
          // Visual feedback
          btn.style.borderColor = 'var(--color-primary)';
          btn.style.background = 'rgba(184, 51, 106, 0.04)';
          setTimeout(goNext, 220);
        });
      });
    } else if (q.type === 'scale') {
      const currentVal = isAnswered(q.key) ? Number(state.answers[q.key]) : (q.defaultValue ?? Math.round((q.min + q.max) / 2));
      state.answers[q.key] = currentVal;
      persist();
      screen.innerHTML = `
        <div class="question">
          <div class="question-number">Pregunta</div>
          <h2 class="question-title">${escapeHtml(q.title)}</h2>
          <div class="scale">
            <div class="scale-track-wrapper">
              <div class="scale-track">
                <input
                  class="scale-input"
                  type="range"
                  id="scaleInput"
                  min="${q.min}"
                  max="${q.max}"
                  value="${currentVal}"
                  step="1"
                  aria-label="${escapeHtml(q.title)}"
                />
              </div>
              <div class="scale-labels">
                <span>${escapeHtml(q.minLabel || q.min)}</span>
                <span>${escapeHtml(q.maxLabel || q.max)}</span>
              </div>
            </div>
            <div class="scale-value">
              <span class="scale-value-number" id="scaleVal">${currentVal}</span>
              <span class="scale-value-suffix">/ ${q.max}</span>
            </div>
            <div class="form-actions">
              <button class="btn btn-primary" id="btnContinue" type="button">
                <span class="btn-text">Continuar →</span>
              </button>
            </div>
            ${backButton}
          </div>
        </div>
      `;
      const input = screen.querySelector('#scaleInput');
      const out = screen.querySelector('#scaleVal');
      input.addEventListener('input', () => {
        const v = Number(input.value);
        state.answers[q.key] = v;
        persist();
        out.textContent = v;
        out.style.animation = 'none';
        void out.offsetWidth;
        out.style.animation = '';
      });
      screen.querySelector('#btnContinue').addEventListener('click', goNext);
    } else if (q.type === 'select') {
      const currentVal = state.answers[q.key] || '';
      screen.innerHTML = `
        <div class="question">
          <div class="question-number">Pregunta</div>
          <h2 class="question-title">${escapeHtml(q.title)}</h2>
          <div class="select-wrapper">
            <select class="input" id="selectInput" aria-label="${escapeHtml(q.title)}">
              <option value="" ${currentVal ? '' : 'selected'} disabled>Selecciona tu estado</option>
              ${q.options.map((o) => `<option value="${escapeHtml(o)}" ${currentVal === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}
            </select>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" id="btnContinue" type="button" ${currentVal ? '' : 'disabled'}>
              <span class="btn-text">Continuar →</span>
            </button>
            ${backButton}
          </div>
        </div>
      `;
      const sel = screen.querySelector('#selectInput');
      const btn = screen.querySelector('#btnContinue');
      sel.addEventListener('change', () => {
        state.answers[q.key] = sel.value;
        persist();
        btn.disabled = !sel.value;
      });
      btn.addEventListener('click', () => {
        if (!sel.value) {
          showToast('Por favor selecciona una opción', 'error');
          return;
        }
        goNext();
      });
    } else if (q.type === 'text') {
      const currentVal = state.answers[q.key] || '';
      screen.innerHTML = `
        <div class="question">
          <div class="question-number">Pregunta</div>
          <h2 class="question-title">${escapeHtml(q.title)}</h2>
          <input
            class="input"
            type="${q.inputType || 'text'}"
            id="textInput"
            placeholder="${escapeHtml(q.placeholder || '')}"
            value="${escapeHtml(currentVal)}"
            autocomplete="${q.autocomplete || 'off'}"
            autocapitalize="${q.autocapitalize || 'off'}"
            spellcheck="false"
            aria-label="${escapeHtml(q.title)}"
          />
          <div class="input-hint" id="inputHint"></div>
          <div class="form-actions">
            <button class="btn btn-primary" id="btnContinue" type="button">
              <span class="btn-text">Continuar →</span>
            </button>
            ${backButton}
          </div>
        </div>
      `;
      const input = screen.querySelector('#textInput');
      const btn = screen.querySelector('#btnContinue');
      const hint = screen.querySelector('#inputHint');
      input.focus();
      // Move cursor to the end on restore
      const len = input.value.length;
      try { input.setSelectionRange(len, len); } catch (e) { /* not supported */ }

      input.addEventListener('input', () => {
        if (q.format) input.value = q.format(input.value);
        state.answers[q.key] = input.value;
        persist();
        input.classList.remove('is-invalid');
        hint.classList.remove('is-error');
        hint.textContent = '';
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          btn.click();
        }
      });
      btn.addEventListener('click', () => {
        const value = input.value;
        if (q.validate) {
          const ok = q.validate(value);
          if (ok !== true) {
            input.classList.add('is-invalid');
            hint.classList.add('is-error');
            hint.textContent = ok;
            input.focus();
            return;
          }
        }
        state.answers[q.key] = value.trim();
        persist();
        goNext();
      });
    }

    const back = screen.querySelector('#btnBack');
    if (back) back.addEventListener('click', goBack);
  }

  function renderFinal() {
    screen.className = 'screen screen-enter';
    screen.innerHTML = `
      <div class="final">
        <div class="final-emoji">🎉</div>
        <h2>¡Tu lugar está <span class="accent">reservado</span>!</h2>
        <div class="workshop-name">${escapeHtml(CONFIG.WORKSHOP_NAME)}</div>

        <div class="event-details">
          <div class="event-detail">
            <span class="event-detail-label">📅 Fecha</span>
            <span class="event-detail-value">${escapeHtml(CONFIG.EVENT_DATE)}</span>
          </div>
          <div class="event-detail">
            <span class="event-detail-label">🕖 Hora</span>
            <span class="event-detail-value">${escapeHtml(CONFIG.EVENT_TIME)}</span>
          </div>
        </div>

        <div class="benefits">
          <div class="benefit"><span class="benefit-icon">✓</span> Casos de éxito reales</div>
          <div class="benefit"><span class="benefit-icon">✓</span> Mini entrenamientos exclusivos</div>
          <div class="benefit"><span class="benefit-icon">✓</span> Recordatorios del Workshop</div>
          <div class="benefit"><span class="benefit-icon">✓</span> Material previo al evento</div>
        </div>

        <a class="btn btn-whatsapp" id="btnWhatsapp" href="${escapeHtml(CONFIG.WHATSAPP_GROUP_URL)}" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488"/></svg>
          <span>ENTRAR AL GRUPO DE WHATSAPP</span>
        </a>
      </div>
    `;
    launchConfetti();
  }

  /* ----------------------------------------------------------
     CONFETTI
     ---------------------------------------------------------- */
  function launchConfetti() {
    const colors = ['#B8336A', '#E66B9C', '#C9A87C', '#F5B8C8', '#8B1A4B', '#E5CFA9'];
    const container = document.createElement('div');
    container.className = 'confetti';
    document.body.appendChild(container);
    for (let i = 0; i < 60; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = Math.random() * 1.5 + 's';
      piece.style.animationDuration = 2.5 + Math.random() * 2 + 's';
      piece.style.transform = `rotate(${Math.random() * 360}deg)`;
      piece.style.opacity = '0.9';
      piece.style.width = (6 + Math.random() * 6) + 'px';
      piece.style.height = (10 + Math.random() * 8) + 'px';
      container.appendChild(piece);
    }
    setTimeout(() => container.remove(), 6000);
  }

  /* ----------------------------------------------------------
     NAVIGATION
     ---------------------------------------------------------- */
  function goNext() {
    if (state.submitting) return;

    // If we're about to leave the last question, submit first
    refreshStepPlan();
    const isLastQuestion = state.stepIndex === stepPlan.length - 2;
    if (isLastQuestion) {
      // submit in background; don't block navigation
      submitLead().catch((err) => {
        console.error('submitLead error', err);
        showToast('Hubo un error al enviar. Reintenta en la pantalla final.', 'error');
      });
    }

    refreshStepPlan();
    if (state.stepIndex < stepPlan.length - 1) {
      transitionTo(state.stepIndex + 1);
    }
  }

  function goBack() {
    refreshStepPlan();
    for (let i = state.stepIndex - 1; i >= 1; i--) {
      if (stepPlan[i].type === 'question') {
        transitionTo(i);
        return;
      }
    }
    // Fall back to welcome
    transitionTo(0);
  }

  function transitionTo(idx) {
    screen.classList.add('screen-exit');
    setTimeout(() => {
      screen.classList.remove('screen-exit');
      state.stepIndex = idx;
      renderCurrent();
    }, 280);
  }

  function renderCurrent() {
    const step = stepPlan[state.stepIndex];
    if (!step) return;
    if (step.type === 'welcome') renderWelcome();
    else if (step.type === 'question') renderQuestion(step.key);
    else if (step.type === 'final') renderFinal();
    updateProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ----------------------------------------------------------
     SUBMISSION
     ---------------------------------------------------------- */
  function buildPayload() {
    const { score, temperatura } = calculateLeadScore();
    return {
      fecha: new Date().toISOString(),
      nombre: state.answers.nombre || '',
      whatsapp: state.answers.whatsapp || '',
      email: state.answers.email || '',
      situacion_actual: state.answers.situacion_actual || '',
      cambio_deseado: state.answers.cambio_deseado || '',
      interes_principal: state.answers.interes_principal || '',
      bloqueo_principal: state.answers.bloqueo_principal || '',
      cuando_comenzar: state.answers.cuando_comenzar || '',
      explorando_motivo: state.answers.explorando_motivo || '',
      compromiso_economico: state.answers.compromiso_economico || '',
      prioridad_ingresos: state.answers.prioridad_ingresos || '',
      estado: state.answers.estado || '',
      lead_score: score,
      lead_temperatura: temperatura,
      utm_source: utms.utm_source,
      utm_medium: utms.utm_medium,
      utm_campaign: utms.utm_campaign,
      utm_content: utms.utm_content,
      utm_term: utms.utm_term,
    };
  }

  async function submitLead() {
    state.submitting = true;
    const payload = buildPayload();
    const finalBtn = screen.querySelector('#btnContinue');
    if (finalBtn) {
      finalBtn.classList.add('btn-loading');
      finalBtn.disabled = true;
      const spinner = document.createElement('span');
      spinner.className = 'btn-spinner';
      finalBtn.appendChild(spinner);
    }
    try {
      sessionStorage.setItem('lash_mastery_lead_backup', JSON.stringify(payload));
    } catch (e) { /* ignore */ }

    try {
      // Apps Script Web Apps reject preflight requests, so we use no-cors with text/plain.
      // We can't read the response this way, but the request is delivered.
      await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('Submit warning:', err);
      // With no-cors we cannot inspect status; just continue to final screen.
    } finally {
      state.submitting = false;
    }
  }

  /* ----------------------------------------------------------
     KEYBOARD SUPPORT
     ---------------------------------------------------------- */
  document.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA')) return;
    const step = stepPlan[state.stepIndex];
    if (!step) return;

    if (e.key === 'Backspace' || e.key === 'Escape') {
      if (state.stepIndex > 0) {
        e.preventDefault();
        goBack();
      }
      return;
    }

    if (step.type === 'question') {
      const q = QUESTIONS.find((x) => x.key === step.key);
      if (!q || q.type !== 'choice') return;
      const keyMap = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5 };
      const idx = keyMap[e.key.toLowerCase()];
      if (idx !== undefined && q.options[idx]) {
        const opts = screen.querySelectorAll('.option');
        if (opts[idx]) opts[idx].click();
      }
    }
  });

  /* ----------------------------------------------------------
     BOOT
     ---------------------------------------------------------- */
  function boot() {
    tryRestore();
    refreshStepPlan();
    // If the user had partially filled answers, jump to the first un-answered question
    if (Object.keys(state.answers).length > 0) {
      state.stepIndex = findResumeIndex();
    } else {
      state.stepIndex = 0;
    }
    renderCurrent();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
