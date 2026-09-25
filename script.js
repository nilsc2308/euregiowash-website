/* Euregio Carwash – Interaktionen */

const TELEFON   = '+491773617931';
const WHATSAPP  = '4915753209427';   // ohne + und ohne führende Null

/* --- Öffnungszeiten: hier anpassen. [von, bis] in Stunden, null = geschlossen --- */
const ZEITEN = {
  1: [7.5, 15],  // Montag
  2: [7.5, 15],
  3: [7.5, 15],
  4: [7.5, 15],
  5: [7.5, 15],
  6: [9, 16],    // Samstag
  0: null        // Sonntag
};
const TAGE = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
const formatZeit = wert => {
  const stunde = Math.floor(wert), minute = Math.round((wert - stunde) * 60);
  return `${String(stunde).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;
};

const $  = (s, w = document) => w.querySelector(s);
const $$ = (s, w = document) => [...w.querySelectorAll(s)];

/* Jahr im Footer */
const jahr = $('#jahr'); if (jahr) jahr.textContent = new Date().getFullYear();

/* Scroll-Fortschritt + feste Navigation + Nach-oben-Knopf */
const balken = $('#fortschritt'), navEl = $('#nav'), hoch = $('#hoch');
function beiScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  if (balken) balken.style.width = (max > 0 ? scrollY / max * 100 : 0) + '%';
  navEl?.classList.toggle('fest', scrollY > 30);
  if (hoch) hoch.hidden = scrollY < 600;
}
addEventListener('scroll', beiScroll, {passive:true}); beiScroll();
hoch?.addEventListener('click', () => scrollTo({top:0, behavior:'smooth'}));

/* Mobiles Menü */
const burger = $('#burger'), menu = $('#menu');
burger?.addEventListener('click', () => {
  const offen = menu.classList.toggle('offen');
  burger.setAttribute('aria-expanded', offen);
  burger.setAttribute('aria-label', offen ? 'Menü schließen' : 'Menü öffnen');
});
menu?.addEventListener('click', e => {
  if (e.target.tagName === 'A') { menu.classList.remove('offen'); burger.setAttribute('aria-expanded', false); }
});

/* Einblenden beim Scrollen */
const io = new IntersectionObserver(
  es => es.forEach(e => e.isIntersecting && e.target.classList.add('da')), {threshold:.12});
$$('.reveal').forEach(el => io.observe(el));

/* Zähler in der Kopfzeile */
const zahl = $('#zahlBewertungen');
if (zahl) new IntersectionObserver((es, ob) => es.forEach(e => {
  if (!e.isIntersecting) return;
  const ziel = +zahl.dataset.count; let n = 0;
  const t = setInterval(() => {
    n += Math.ceil(ziel / 35);
    if (n >= ziel) { n = ziel; clearInterval(t); }
    zahl.textContent = n;
  }, 28);
  ob.disconnect();
})).observe(zahl);

/* Öffnungsstatus + Tabelle */
(function oeffnung() {
  const jetzt = new Date(), tag = jetzt.getDay(), std = jetzt.getHours() + jetzt.getMinutes() / 60;
  const heute = ZEITEN[tag], offen = !!heute && std >= heute[0] && std < heute[1];

  const punkt = $('#ampel'), text = $('#ampelText');
  if (punkt && text) {
    punkt.style.color = offen ? 'var(--wa)' : 'var(--warn)';
    if (offen) {
      text.textContent = `Jetzt geöffnet – bis ${formatZeit(heute[1])} Uhr`;
    } else {
      // nächsten geöffneten Tag suchen
      let d = 1, naechster = null;
      while (d <= 7) { const z = ZEITEN[(tag + d) % 7]; if (z) { naechster = {tag:(tag + d) % 7, z}; break; } d++; }
      const heuteSpaeter = heute && std < heute[0];
      text.textContent = heuteSpaeter
        ? `Geschlossen – heute ab ${formatZeit(heute[0])} Uhr`
        : naechster ? `Geschlossen – ${TAGE[naechster.tag]} ab ${formatZeit(naechster.z[0])} Uhr` : 'Geschlossen';
    }
  }

  const tb = $('#zeiten tbody');
  if (tb) {
    [1,2,3,4,5,6,0].forEach(d => {
      const z = ZEITEN[d], tr = document.createElement('tr');
      if (d === tag) tr.className = 'heute';
      tr.innerHTML = `<td>${TAGE[d]}</td><td>${z ? `${formatZeit(z[0])} – ${formatZeit(z[1])} Uhr` : 'geschlossen'}</td>`;
      tb.appendChild(tr);
    });
  }
})();

/* Hero-Video: Ton an/aus */
const heroVideo = $('#heroVideo'), tonBtn = $('#tonBtn');
tonBtn?.addEventListener('click', () => {
  heroVideo.muted = !heroVideo.muted;
  tonBtn.firstElementChild.textContent = heroVideo.muted ? '🔇' : '🔊';
  tonBtn.setAttribute('aria-label', heroVideo.muted ? 'Ton einschalten' : 'Ton ausschalten');
  if (!heroVideo.muted) heroVideo.play().catch(() => {});
});

/* Wunschtermin frühestens heute */
const datumFeld = document.querySelector('#fDatum');
if (datumFeld) datumFeld.min = new Date().toISOString().slice(0, 10);

/* Leistungen auswählen */
const gewaehlt = new Set();
const leistungsFeld = $('#fLeistung'), leiste = $('#auswahlLeiste'), leisteText = $('#auswahlText');

$$('#leistungsGrid .karte').forEach(k => k.addEventListener('click', () => {
  const name = k.dataset.leistung.replace(/&amp;/g, '&');
  k.classList.toggle('aktiv');
  k.classList.contains('aktiv') ? gewaehlt.add(name) : gewaehlt.delete(name);

  if (leistungsFeld) leistungsFeld.value = [...gewaehlt].join(', ');
  if (leiste) {
    leiste.hidden = gewaehlt.size === 0;
    leisteText.textContent = gewaehlt.size === 1 ? '1 Leistung ausgewählt' : `${gewaehlt.size} Leistungen ausgewählt`;
  }
  baueVorschau();
}));

/* Fahrzeuggröße wählen – die Auswahl wandert in die Anfrage */
const fahrzeugFeld = $('#fAuto'), flotteHinweis = $('#flotteHinweis');
$$('.fz').forEach(k => k.addEventListener('click', () => {
  const schon = k.classList.contains('gewaehlt');
  $$('.fz').forEach(a => a.classList.remove('gewaehlt'));

  if (schon) {
    if (flotteHinweis) flotteHinweis.hidden = true;
    return;
  }
  k.classList.add('gewaehlt');
  const typ = k.dataset.fahrzeug;
  if (fahrzeugFeld) fahrzeugFeld.value = typ;
  if (flotteHinweis) {
    flotteHinweis.hidden = false;
    flotteHinweis.textContent = `${typ} in die Anfrage übernommen – Sie können unten noch das Modell ergänzen.`;
  }
  baueVorschau();
}));

/* Anfrage: Nachricht bauen */
const formular = $('#formular'), vorschau = $('#vorschau');

function daten() {
  return {
    name:     $('#fName')?.value.trim()     || '',
    auto:     $('#fAuto')?.value.trim()     || '',
    leistung: $('#fLeistung')?.value.trim() || '',
    datum:    $('#fDatum')?.value           || '',
    zeit:     $('#fZeit')?.value            || '',
    text:     $('#fText')?.value.trim()     || ''
  };
}

function nachricht() {
  const d = daten();
  const zeilen = ['Hallo Euregio Carwash,', ''];
  zeilen.push(`ich möchte gerne einen Termin anfragen.`);
  if (d.auto)     zeilen.push(`Fahrzeug: ${d.auto}`);
  if (d.leistung) zeilen.push(`Gewünscht: ${d.leistung}`);
  if (d.datum) {
    const [j, m, t] = d.datum.split('-');
    zeilen.push(`Wunschtermin: ${t}.${m}.${j}${d.zeit ? ' (' + d.zeit + ')' : ''}`);
  } else if (d.zeit) {
    zeilen.push(`Uhrzeit: ${d.zeit}`);
  }
  if (d.text) zeilen.push(`Anmerkung: ${d.text}`);
  zeilen.push('', `Viele Grüße${d.name ? ', ' + d.name : ''}`);
  return zeilen.join('\n');
}

function baueVorschau() {
  if (!vorschau) return;
  const d = daten();
  const etwasDa = d.name || d.auto || d.leistung || d.datum || d.text;
  vorschau.classList.toggle('an', !!etwasDa);
  if (etwasDa) vorschau.textContent = nachricht();
}
formular?.addEventListener('input', baueVorschau);

function pruefen() {
  const meldung = $('#formFehler');
  const fehlend = [];
  [['#fName', 'Ihr Name'], ['#fAuto', 'Fahrzeug']].forEach(([sel, bez]) => {
    const f = $(sel), leer = !f.value.trim();
    f.classList.toggle('fehler', leer);
    f.setAttribute('aria-invalid', leer);
    if (leer) fehlend.push(bez);
  });

  if (meldung) {
    meldung.hidden = fehlend.length === 0;
    if (fehlend.length) meldung.textContent =
      `Bitte noch ausfüllen: ${fehlend.join(' und ')}.`;
  }
  if (fehlend.length) { $(fehlend[0] === 'Ihr Name' ? '#fName' : '#fAuto').focus(); return false; }
  return true;
}

$('#sendenWa')?.addEventListener('click', () => {
  if (!pruefen()) return;
  open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(nachricht())}`, '_blank', 'noopener');
});

/* Video-Kacheln: laden und abspielen, sobald sichtbar.
   Handys sind wählerisch – Safari startet nur stumme Videos mit playsinline,
   und im Energiesparmodus gar keine. Deshalb hier mit Absicherung. */
const kachelVideos = $$('.vcard video');

function starte(v) {
  // Safari verlangt die Eigenschaften, nicht nur die HTML-Attribute
  v.muted = true;
  v.defaultMuted = true;
  v.playsInline = true;
  v.setAttribute('muted', '');

  if (!v.src && v.dataset.src) { v.src = v.dataset.src; v.load(); }

  const versuch = v.play();
  if (versuch !== undefined) {
    versuch
      .then(()  => v.closest('.vcard')?.classList.add('laeuft'))
      .catch(() => v.closest('.vcard')?.classList.remove('laeuft'));
  }
}

if (kachelVideos.length) {
  const vio = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) starte(v);
    else { v.pause(); v.closest('.vcard')?.classList.remove('laeuft'); }
  }), {threshold:.25});
  kachelVideos.forEach(v => vio.observe(v));

  // Manche Browser erlauben das Abspielen erst nach einer Berührung.
  // Beim ersten Antippen irgendwo auf der Seite alles Sichtbare nachstarten.
  const nachstarten = () => {
    kachelVideos.forEach(v => {
      const r = v.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0 && v.paused) starte(v);
    });
    if (heroVideo?.paused) heroVideo.play().catch(() => {});
  };
  addEventListener('touchstart', nachstarten, {once:true, passive:true});
  addEventListener('click',      nachstarten, {once:true});
}

/* Vollbild mit Ton */
function grossZeigen(quelle, poster) {
  const box = document.createElement('div');
  box.className = 'lightbox';

  const v = document.createElement('video');
  Object.assign(v, {src:quelle, poster, controls:true, autoplay:true, loop:true, playsInline:true});

  const zu = document.createElement('button');
  zu.className = 'zu'; zu.textContent = '×'; zu.setAttribute('aria-label', 'Schließen');

  box.append(v, zu);
  document.body.appendChild(box);
  document.body.style.overflow = 'hidden';
  zu.focus();

  const schliessen = () => { box.remove(); document.body.style.overflow = ''; removeEventListener('keydown', taste); };
  const taste = e => e.key === 'Escape' && schliessen();
  box.addEventListener('click', e => { if (e.target === box || e.target === zu) schliessen(); });
  addEventListener('keydown', taste);
}

$$('.vcard').forEach(k => {
  const oeffne = () => { const v = k.querySelector('video'); grossZeigen(v.dataset.src || v.src, v.poster); };
  k.addEventListener('click', oeffne);
  k.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); oeffne(); } });
});

/* Google Maps erst nach Einwilligung laden */
$('#karteLaden')?.addEventListener('click', () => {
  const halter = $('#karteHalter');
  halter.innerHTML = '';
  const f = document.createElement('iframe');
  f.title = 'Standort Würselener Str. 6, Stolberg auf Google Maps';
  f.loading = 'lazy';
  f.referrerPolicy = 'no-referrer-when-downgrade';
  f.allowFullscreen = true;
  f.src = 'https://www.google.com/maps?q=W%C3%BCrselener%20Str.%206,%2052222%20Stolberg&output=embed';
  halter.appendChild(f);
});
