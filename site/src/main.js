// sobr site: the growing tree, the slider, and scroll reveals.
// Tree geometry is ported from apps/mobile/src/components/Tree.tsx; keep the
// two in step if the app's tree changes.
(() => {
  const STAGES = [
    { at: 0, name: 'Seed', blurb: 'Every forest starts here. Plant your first win.' },
    { at: 3, name: 'Sprout', blurb: 'First green showing. You’ve begun.' },
    { at: 7, name: 'Sapling', blurb: 'Taking root. A week of good days behind you.' },
    { at: 14, name: 'Young tree', blurb: 'Standing on your own. Branches forming.' },
    { at: 30, name: 'Full tree', blurb: 'Strong and settled. A month-plus of wins.' },
    { at: 60, name: 'Grove', blurb: 'One tree became many. This is who you are now.' },
  ];
  const TRUNK = '#8B6F47';

  function stageFor(days) {
    let i = 0;
    STAGES.forEach((s, k) => { if (days >= s.at) i = k; });
    const next = STAGES[i + 1];
    const progress = next ? (days - STAGES[i].at) / (next.at - STAGES[i].at) : 1;
    return { index: i, progress };
  }

  function canopy(i, progress) {
    const grow = i + progress * 0.6;
    switch (i) {
      case 0: return [];
      case 1: return [[100, 120, 16 + grow * 3]];
      case 2: return [[100, 104, 30], [84, 116, 18], [116, 116, 18]];
      case 3: return [[100, 92, 38], [76, 110, 26], [124, 110, 26]];
      case 4: return [[100, 80, 46], [70, 104, 32], [130, 104, 32], [100, 60, 30]];
      default: return [[100, 78, 48], [64, 104, 34], [136, 104, 34], [100, 56, 32], [42, 122, 24], [158, 122, 24]];
    }
  }

  let uid = 0;
  function treeSVG(days) {
    const { index: i, progress } = stageFor(days);
    const id = 'fol' + uid++;
    const top = [156, 134, 118, 96, 78, 76][i];
    let body;
    if (i === 0) {
      body =
        '<path d="M60 169 Q100 143 140 169 Z" fill="#6E3712"/>' +
        '<path d="M100 166 L100 137" stroke="#5E8C3A" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M100 143 C87 139 79 128 84 119 C95 120 100 131 100 143 Z" fill="#7FA855"/>' +
        '<path d="M100 143 C113 139 121 128 116 119 C105 120 100 131 100 143 Z" fill="#A2C878"/>';
    } else {
      const c = canopy(i, progress);
      body =
        `<path d="M100 168 L100 ${top}" stroke="${TRUNK}" stroke-width="${i >= 3 ? 8 : 5}" stroke-linecap="round"/>` +
        (i >= 3
          ? `<path d="M100 120 Q82 104 76 86" stroke="${TRUNK}" stroke-width="5" stroke-linecap="round" fill="none"/>` +
            `<path d="M100 112 Q120 98 126 82" stroke="${TRUNK}" stroke-width="5" stroke-linecap="round" fill="none"/>`
          : '') +
        c.map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id})"/>`).join('') +
        (c[0]
          ? `<circle cx="${c[0][0] - c[0][2] * 0.3}" cy="${c[0][1] - c[0][2] * 0.3}" r="${c[0][2] * 0.28}" fill="#CCDBB2" opacity="0.5"/>`
          : '');
    }
    const ground = i > 0
      ? '<path d="M40 168 Q100 150 160 168" stroke="#A9C3BB" stroke-width="5" stroke-linecap="round" stroke-opacity="0.5" fill="none"/>'
      : '';
    return (
      `<svg viewBox="0 0 200 200" aria-hidden="true"><defs><linearGradient id="${id}" x1="100" y1="40" x2="100" y2="140" gradientUnits="userSpaceOnUse">` +
      `<stop offset="0" stop-color="#AEBF92"/><stop offset="1" stop-color="#457029"/></linearGradient></defs>` +
      `${ground}<g class="breathe">${body}</g></svg>`
    );
  }

  // Static trees (the phone mockup)
  document.querySelectorAll('[data-tree]').forEach((el) => {
    el.innerHTML = treeSVG(Number(el.dataset.tree));
  });

  // The slider
  const slider = document.getElementById('days');
  const box = document.getElementById('tree-box');
  if (slider && box) {
    const num = document.getElementById('day-num');
    const word = document.getElementById('day-word');
    const name = document.getElementById('stage-name');
    const blurb = document.getElementById('stage-blurb');
    const ticks = document.querySelectorAll('#ticks button');
    let shownStage = -1;
    ticks.forEach((t) => { t.style.left = (Number(t.dataset.d) / Number(slider.max)) * 100 + '%'; });

    const render = (days) => {
      const { index } = stageFor(days);
      num.textContent = days;
      word.textContent = days === 1 ? 'day' : 'days';
      slider.style.setProperty('--p', (days / Number(slider.max)) * 100 + '%');
      slider.setAttribute('aria-valuetext', `${days} days, ${STAGES[index].name}`);
      box.innerHTML = treeSVG(days);
      box.setAttribute('aria-label', `The sobr tree at ${days} days: ${STAGES[index].name}`);
      if (index !== shownStage) {
        shownStage = index;
        name.textContent = STAGES[index].name;
        blurb.textContent = STAGES[index].blurb;
        ticks.forEach((t) => t.classList.toggle('on', Number(t.dataset.d) === STAGES[index].at));
      }
    };
    slider.addEventListener('input', () => render(Number(slider.value)));
    ticks.forEach((t) =>
      t.addEventListener('click', () => {
        slider.value = t.dataset.d;
        render(Number(t.dataset.d));
      }),
    );
    render(0);

    // Grow it once on its own the first time it scrolls into view.
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce && 'IntersectionObserver' in window) {
      let played = false;
      const io = new IntersectionObserver((entries) => {
        if (played || !entries.some((e) => e.isIntersecting)) return;
        played = true;
        io.disconnect();
        let d = 0;
        const target = 30;
        const tick = () => {
          if (Number(slider.value) !== d) return; // the visitor took over
          d += 1;
          slider.value = d;
          render(d);
          if (d < target) setTimeout(tick, 70);
        };
        setTimeout(tick, 500);
      }, { threshold: 0.5 });
      io.observe(box);
    }
  }

  // Scroll reveals
  const items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach((el) => io.observe(el));
  } else {
    items.forEach((el) => el.classList.add('in'));
  }
})();
