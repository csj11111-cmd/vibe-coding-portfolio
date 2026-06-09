// Mobile navigation toggle
const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.nav');
const header = document.querySelector('.header');

navToggle.addEventListener('click', () => {
  const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
  navToggle.setAttribute('aria-expanded', !isOpen);
  header.classList.toggle('nav--open', !isOpen);
});

nav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navToggle.setAttribute('aria-expanded', 'false');
    header.classList.remove('nav--open');
  });
});

// Services accordion
const serviceItems = document.querySelectorAll('.service-item');

serviceItems.forEach((item) => {
  const btn = item.querySelector('.service-item__btn');

  btn.addEventListener('click', () => {
    const isActive = item.classList.contains('service-item--active');

    serviceItems.forEach((other) => {
      other.classList.remove('service-item--active');
      other.querySelector('.service-item__btn').setAttribute('aria-expanded', 'false');
    });

    if (!isActive) {
      item.classList.add('service-item--active');
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});
