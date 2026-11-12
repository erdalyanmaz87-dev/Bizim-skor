(function () {
  'use strict';

  const steps = [
    { title: 'Tahmin Durumum', text: 'Hangi lig ve haftalarda tahmininin eksik olduğunu burada görürsün.', nav: 'predictionStatus' },
    { title: 'Tahmin Yap', text: 'Açık haftayı seç, maç skorlarını gir ve tahminlerini kaydet.', nav: 'pred' },
    { title: 'Menü', text: 'Fikstür, Fırsat Maçları ve diğer bölümler burada.', nav: 'menu' },
    { title: 'Genel Sıralama', text: 'Ligini seç, puanını ve sıranı gör. Kendimi Gör ile kendi satırına git.', tab: 'general' }
  ];
  let tour;

  function navigate({ nav, tab }) {
    window.BizimSkorSimpleNavigation?.closeTransientLayers(document);
    if (nav) document.querySelector(`[data-simple-nav="${nav}"]`)?.click();
    if (tab) document.querySelector(`.tab[data-tab="${tab}"]`)?.click();
  }

  function close() {
    tour?.remove();
    tour = undefined;
  }

  function start() {
    if (tour) return;
    let index = 0;
    tour = document.createElement('aside');
    tour.id = 'mobileFirstRunTour';
    tour.setAttribute('aria-label', 'İlk kullanım turu');
    tour.innerHTML = '<div aria-live="polite"><small></small><h2></h2><p></p></div><div class="mobile-tour-actions"><button type="button">Turu Atla</button><button type="button" class="p"></button></div>';
    const title = tour.querySelector('h2');
    const [skip, next] = tour.querySelectorAll('button');
    function show() {
      const step = steps[index];
      navigate(step);
      tour.querySelector('small').textContent = `${index + 1} / ${steps.length}`;
      title.textContent = step.title;
      tour.querySelector('p').textContent = step.text;
      next.textContent = index === steps.length - 1 ? 'Tahmin Yap' : 'İleri';
    }
    skip.addEventListener('click', () => { close(); navigate({ nav: 'home' }); });
    next.addEventListener('click', () => {
      index += 1;
      if (index < steps.length) show();
      else { close(); navigate({ nav: 'pred' }); }
    });
    document.body.append(tour);
    show();
    next.focus({ preventScroll: true });
  }

  window.BizimSkorFirstRunTour = { start, close };
  window.addEventListener('bizimskor:logged-out', close);
})();
