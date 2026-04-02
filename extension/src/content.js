function throttle(fn, intervalMs) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last < intervalMs) return;
    last = now;
    fn(...args);
  };
}

function emit(type, extra = {}) {
  chrome.runtime.sendMessage({
    channel: 'activity_signal',
    signal: {
      type,
      url: location.href,
      title: document.title,
      ...extra
    }
  });
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.channel !== 'decision_made' || !msg.decision) return;

  const { decision } = msg;
  const label = `[AI Pet] decision=${decision.decision} state=${decision.state} conf=${decision.confidence}`;

  console.groupCollapsed(label);
  console.log(decision);
  console.groupEnd();
});

window.addEventListener('scroll', throttle(() => emit('scroll', { y: window.scrollY }), 1000), {
  passive: true
});

window.addEventListener('mousemove', throttle(() => emit('mousemove'), 2000), {
  passive: true
});

window.addEventListener('click', () => emit('click'), { passive: true });
window.addEventListener('keydown', throttle(() => emit('keydown'), 500), { passive: true });

emit('page_loaded');
