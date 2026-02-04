const noBtn = document.getElementById('no-btn');
const yesBtn = document.getElementById('yes-btn');
const question = document.getElementById('question');
const gifContainer = document.querySelector('.gif-container');
const buttons = document.querySelector('.buttons');
const celebration = document.getElementById('celebration');
const card = document.querySelector('.card');

// URL PARAMETER HANDLING
const urlParams = new URLSearchParams(window.location.search);
const names = urlParams.get('name');

if (names) {
  question.innerHTML = `Hey ${names},<br>Will you be my <span class="highlight-text">Valentine</span>?`;
}

// STATE
let isAbsolute = false;

// ------------------------------------------
// YES BUTTON Logic
// ------------------------------------------
yesBtn.addEventListener('click', () => {
  // Hide the interactive elements
  // Hide the interactive elements
  card.style.display = 'none';

  // Also hide the No button in case it has been teleported out of the card
  noBtn.style.display = 'none';

  // Show celebration
  celebration.classList.remove('hidden');
  fireConfetti();
});

// ------------------------------------------
// NO BUTTON Logic (The "Teleporter")
// ------------------------------------------

// When mouse enters the "danger zone" (the button itself), it teleports.
noBtn.addEventListener('mouseenter', teleportButton);

// Also works on touch for mobile (though harder to chase on mobile)
noBtn.addEventListener('touchstart', (e) => {
  e.preventDefault(); // prevents click
  teleportButton();
});

function teleportButton() {
  if (!isAbsolute) {
    // First time: Make it absolute so it can move freely
    // We replace it with a spacer in the flow so the layout doesn't collapse
    const spacer = document.createElement('div');
    spacer.style.width = `${noBtn.offsetWidth}px`;
    spacer.style.height = `${noBtn.offsetHeight}px`;
    spacer.style.display = 'inline-block';
    noBtn.parentNode.insertBefore(spacer, noBtn);

    // Provide absolute positioning to body to escape any parent transforms
    document.body.appendChild(noBtn);

    noBtn.style.position = 'fixed';
    noBtn.style.zIndex = '1000';
    isAbsolute = true;
  }

  // Helper to get safe random coordinates
  const position = getSafeRandomPosition(noBtn.offsetWidth, noBtn.offsetHeight);

  // Apply new position
  noBtn.style.left = `${position.x}px`;
  noBtn.style.top = `${position.y}px`;
}

// ------------------------------------------
// RESCUE PROTOCOL
// ------------------------------------------
// If for ANY reason the button goes off screen (bug, resize, cosmic ray),
// this interval will catch it and teleport it back to center.
setInterval(() => {
  if (!isAbsolute) return;

  const rect = noBtn.getBoundingClientRect();
  const winW = document.documentElement.clientWidth;
  const winH = document.documentElement.clientHeight;

  // Check if completely off-screen
  const isGone = (
    rect.right < 0 ||
    rect.left > winW ||
    rect.bottom < 0 ||
    rect.top > winH
  );

  if (isGone) {
    // RESCUE!
    noBtn.style.left = `${(winW / 2) - (rect.width / 2)}px`;
    noBtn.style.top = `${(winH / 2) - (rect.height / 2)}px`;
  }
}, 500);

function getSafeRandomPosition(width, height) {
  // Viewport dimensions
  // Use clientWidth to exclude scrollbars if any exist
  const winW = document.documentElement.clientWidth;
  const winH = document.documentElement.clientHeight;

  // Padding from edge (increased to 50 to be super safe)
  const pad = 50;

  // Max X and Y allow the button to be fully visible
  // (Width - ElementWidth - Padding)
  const maxX = winW - width - pad;
  const maxY = winH - height - pad;

  // Generate random coordinates
  // We ensure at least 'pad' distance from top/left
  let newX = Math.random() * (maxX - pad) + pad;
  let newY = Math.random() * (maxY - pad) + pad;

  // Safety Force: If negative (screen too small?), default to center
  if (newX < 0) newX = winW / 2 - width / 2;
  if (newY < 0) newY = winH / 2 - height / 2;

  return { x: newX, y: newY };
}

// ------------------------------------------
// CONFETTI Logic
// ------------------------------------------
function fireConfetti() {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
  }, 250);
}

// ------------------------------------------
// DYNAMIC BACKGROUND Logic
// ------------------------------------------
const floatingContainer = document.querySelector('.floating-hearts');

function createFloatingElement() {
  const emojis = ['❤️', '💖', '💕', '🌹', '🎀', '✨', '😻', '💌'];
  const el = document.createElement('div');
  el.classList.add('floating-item');
  el.textContent = emojis[Math.floor(Math.random() * emojis.length)];

  // Randomize properties
  const leftPos = Math.random() * 100; // 0% to 100%
  const duration = Math.random() * 10 + 10; // 10s to 20s
  const size = Math.random() * 2 + 1; // 1rem to 3rem

  el.style.left = `${leftPos}%`;
  el.style.animationDuration = `${duration}s`;
  el.style.fontSize = `${size}rem`;

  floatingContainer.appendChild(el);

  // Remove element after animation finishes to keep DOM clean
  setTimeout(() => {
    el.remove();
  }, duration * 1000);
}

// Start spawning elements
// We spawn them frequently to create a rich density
setInterval(createFloatingElement, 500);

// Initial burst to populate the screen immediately (not waiting for them to float up from bottom)
for (let i = 0; i < 7; i++) {
  const emojis = ['❤️', '💖', '💕', '🌹', '🎀', '✨', '😻', '💌'];
  const el = document.createElement('div');
  el.classList.add('floating-item');
  el.textContent = emojis[Math.floor(Math.random() * emojis.length)];

  // Random start positions throughout the screen
  const leftPos = Math.random() * 100;
  const topPos = Math.random() * 100;
  const duration = Math.random() * 10 + 10;
  const size = Math.random() * 2 + 1;

  el.style.left = `${leftPos}%`;
  el.style.top = `${topPos}%`; // Override default bottom positioning
  el.style.animation = `floatUp ${duration}s linear forwards`; // Reset animation
  el.style.fontSize = `${size}rem`;

  // Adjust animation delay negatively so it looks like it's already mid-flight
  // But CSS animation-delay doesn't work well with already running keyframes if we want exact position.
  // Instead, we just place them and let them float up from there.
  // Simple hack: just use similar animation but starting from current top.
  // Actually, standard floatUp goes from translateY(0) to -110vh.
  // If we set top to 50%, translateY(0) is at 50%. It will float up to -60% ish.

  floatingContainer.appendChild(el);

  setTimeout(() => {
    el.remove();
  }, duration * 1000);
}
