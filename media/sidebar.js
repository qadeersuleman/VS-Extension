(() => {
  const vscode = acquireVsCodeApi();
  const $ = (id) => document.getElementById(id);

  /* ============================================================
     0. AUDIO HELPERS & MUTUAL EXCLUSION
     ============================================================ */
  let audioCtx = null;
  function getAudioContext() {
    try {
      if (!audioCtx) {
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        if (AudioCtxClass) audioCtx = new AudioCtxClass();
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    } catch (e) {
      console.error('AudioContext init error:', e);
    }
    return audioCtx;
  }

  function playAlarmSound(soundType = 'beep') {
    if (soundType === 'silent') return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (soundType === 'chime') {
        // Melodic ascending chime (C6, E6, G6, C7 arpeggio with soft decay)
        const notes = [
          { start: 0.00, freq: 1046.50, dur: 0.40 },
          { start: 0.15, freq: 1318.51, dur: 0.40 },
          { start: 0.30, freq: 1567.98, dur: 0.50 },
          { start: 0.45, freq: 2093.00, dur: 0.70 }
        ];
        notes.forEach(n => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(n.freq, now + n.start);
          gain.gain.setValueAtTime(0.0001, now + n.start);
          gain.gain.exponentialRampToValueAtTime(0.28, now + n.start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + n.start + n.dur);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + n.start);
          osc.stop(now + n.start + n.dur);
        });
      } else if (soundType === 'bell') {
        // Meditative singing bell (fundamental + octave overtone + long gentle decay)
        const harmonics = [523.25, 1046.5, 1567.98];
        harmonics.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = idx === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, now);
          const initialVol = idx === 0 ? 0.32 : (0.15 / idx);
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.exponentialRampToValueAtTime(initialVol, now + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 1.8);
        });
      } else {
        // Default 'beep': Dual-pulse alarm tone pattern
        const beeps = [
          { start: 0.00, freq: 880, dur: 0.12 },
          { start: 0.16, freq: 1046.5, dur: 0.16 },
          { start: 0.45, freq: 880, dur: 0.12 },
          { start: 0.61, freq: 1046.5, dur: 0.16 },
          { start: 0.90, freq: 880, dur: 0.12 },
          { start: 1.06, freq: 1046.5, dur: 0.22 }
        ];
        beeps.forEach(b => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(b.freq, now + b.start);
          gain.gain.setValueAtTime(0.0001, now + b.start);
          gain.gain.exponentialRampToValueAtTime(0.35, now + b.start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + b.start + b.dur);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + b.start);
          osc.stop(now + b.start + b.dur);
        });
      }
    } catch (err) {
      console.error('Alarm sound error:', err);
    }
  }

  function extractYouTubeId(url) {
    if (!url || typeof url !== 'string') return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
  }

  function pauseAllMedia(except) {
    if (except !== 'quran') stopAyahAudio();
    if (except !== 'asma') pauseRecitation();
    if (except !== 'naats') pauseNaat();
    if (except !== 'songs') pauseSong();
  }

  /* ============================================================
     1. QURAN AYATS WITH AUDIO (ARABIC & URDU)
     ============================================================ */
  const ayahs = [
    {
      arabic: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا',
      urdu: 'بے شک مشکل کے ساتھ آسانی ہے، یقیناً مشکل کے ساتھ آسانی ہے۔',
      ref: 'Surah Ash-Sharh · 94:5-6',
      arabicAudio: 'https://everyayah.com/data/Alafasy_128kbps/094005.mp3',
      urduAudio: 'https://everyayah.com/data/translations/urdu_shamshad_ali_khan_46kbps/094005.mp3'
    },
    {
      arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ',
      urdu: 'اللہ، جس کے سوا کوئی معبود نہیں، وہ ہمیشہ زندہ اور سب کا نگہبان ہے۔ نہ اُسے اونگھ آتی ہے نہ نیند۔',
      ref: 'Surah Al-Baqarah (Ayat-ul-Kursi) · 2:255',
      arabicAudio: 'https://everyayah.com/data/Alafasy_128kbps/002255.mp3',
      urduAudio: 'https://everyayah.com/data/translations/urdu_shamshad_ali_khan_46kbps/002255.mp3'
    },
    {
      arabic: 'الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
      urdu: 'وہ لوگ جو ایمان لائے اور جن کے دل اللہ کے ذکر سے اطمینان پاتے ہیں، سن لو! اللہ کے ذکر ہی سے دلوں کو سکون ملتا ہے۔',
      ref: 'Surah Ar-Ra’d · 13:28',
      arabicAudio: 'https://everyayah.com/data/Alafasy_128kbps/013028.mp3',
      urduAudio: 'https://everyayah.com/data/translations/urdu_shamshad_ali_khan_46kbps/013028.mp3'
    },
    {
      arabic: 'وَهُوَ مَعَكُمْ أَيْنَ مَا كُنْتُمْ ۚ وَاللَّهُ بِمَا تَعْمَلُونَ بَصِيرٌ',
      urdu: 'اور تم جہاں کہیں بھی ہو وہ تمہارے ساتھ ہے، اور جو کچھ تم کرتے ہو اللہ اسے خوب دیکھ رہا ہے۔',
      ref: 'Surah Al-Hadid · 57:4',
      arabicAudio: 'https://everyayah.com/data/Alafasy_128kbps/057004.mp3',
      urduAudio: 'https://everyayah.com/data/translations/urdu_shamshad_ali_khan_46kbps/057004.mp3'
    },
    {
      arabic: 'وَوَجَدَكَ ضَالًّا فَهَدَىٰ',
      urdu: 'اور اس نے آپ کو راہ کی تلاش میں پایا تو منزل تک پہنچایا۔',
      ref: 'Surah Ad-Duha · 93:7',
      arabicAudio: 'https://everyayah.com/data/Alafasy_128kbps/093007.mp3',
      urduAudio: 'https://everyayah.com/data/translations/urdu_shamshad_ali_khan_46kbps/093007.mp3'
    },
    {
      arabic: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ ۚ إِنَّ اللَّهَ بَالِغُ أَمْرِهِ',
      urdu: 'اور جو اللہ پر بھروسہ کرتا ہے تو وہ اس کے لیے کافی ہے، بے شک اللہ اپنا کام پورا کر کے رہتا ہے۔',
      ref: 'Surah At-Talaq · 65:3',
      arabicAudio: 'https://everyayah.com/data/Alafasy_128kbps/065003.mp3',
      urduAudio: 'https://everyayah.com/data/translations/urdu_shamshad_ali_khan_46kbps/065003.mp3'
    },
    {
      arabic: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
      urdu: 'اللہ کسی جان پر اس کی طاقت سے زیادہ بوجھ نہیں ڈالتا۔',
      ref: 'Surah Al-Baqarah · 2:286',
      arabicAudio: 'https://everyayah.com/data/Alafasy_128kbps/002286.mp3',
      urduAudio: 'https://everyayah.com/data/translations/urdu_shamshad_ali_khan_46kbps/002286.mp3'
    },
    {
      arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ',
      urdu: 'آپ فرما دیجیے کہ وہ اللہ ایک ہے، اللہ بے نیاز ہے، نہ اس کی کوئی اولاد ہے اور نہ وہ کسی کی اولاد ہے، اور کوئی اس کی برابری کرنے والا نہیں۔',
      ref: 'Surah Al-Ikhlas · 112:1-4',
      arabicAudio: 'https://everyayah.com/data/Alafasy_128kbps/112001.mp3',
      urduAudio: 'https://everyayah.com/data/translations/urdu_shamshad_ali_khan_46kbps/112001.mp3'
    }
  ];

  let ayahIndex = 0;
  let activeAyahAudioType = null;
  const quranAudio = $('quranAudio');

  function renderAyah() {
    const a = ayahs[ayahIndex];
    document.querySelector('#quran .verse-card .arabic').textContent = a.arabic;
    document.querySelector('#quran .verse-card .translation').textContent = a.urdu;
    document.querySelector('#quran .verse-card .reference').textContent = a.ref;
    $('ayahCounter').textContent = `Ayah ${ayahIndex + 1} / ${ayahs.length}`;
    stopAyahAudio();
  }

  function stopAyahAudio() {
    if (quranAudio && !quranAudio.paused) {
      quranAudio.pause();
      quranAudio.removeAttribute('src');
    }
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    activeAyahAudioType = null;
    updateAyahAudioButtons();
  }

  function updateAyahAudioButtons() {
    const arabicBtn = $('playArabicBtn');
    const urduBtn = $('playUrduBtn');
    if (!arabicBtn || !urduBtn) return;
    if (activeAyahAudioType === 'arabic') {
      arabicBtn.classList.add('playing');
      arabicBtn.querySelector('.btn-label').textContent = 'تلاوت جاری ہے…';
      urduBtn.classList.remove('playing');
      urduBtn.querySelector('.btn-label').textContent = 'اردو ترجمہ';
    } else if (activeAyahAudioType === 'urdu') {
      urduBtn.classList.add('playing');
      urduBtn.querySelector('.btn-label').textContent = 'ترجمہ جاری ہے…';
      arabicBtn.classList.remove('playing');
      arabicBtn.querySelector('.btn-label').textContent = 'عربی تلاوت';
    } else {
      arabicBtn.classList.remove('playing');
      arabicBtn.querySelector('.btn-label').textContent = 'عربی تلاوت';
      urduBtn.classList.remove('playing');
      urduBtn.querySelector('.btn-label').textContent = 'اردو ترجمہ';
    }
  }

  function playAyahAudio(type) {
    if (activeAyahAudioType === type) {
      stopAyahAudio();
      return;
    }

    pauseAllMedia('quran');

    const a = ayahs[ayahIndex];
    const url = type === 'arabic' ? a.arabicAudio : a.urduAudio;
    activeAyahAudioType = type;
    updateAyahAudioButtons();

    quranAudio.src = url;
    quranAudio.play().catch(() => {
      if (type === 'urdu' && ('speechSynthesis' in window)) {
        const utter = new SpeechSynthesisUtterance(a.urdu);
        utter.lang = 'ur-PK';
        utter.rate = 0.9;
        utter.onend = () => { activeAyahAudioType = null; updateAyahAudioButtons(); };
        utter.onerror = () => { activeAyahAudioType = null; updateAyahAudioButtons(); };
        window.speechSynthesis.speak(utter);
      } else {
        activeAyahAudioType = null;
        updateAyahAudioButtons();
      }
    });
  }

  quranAudio.addEventListener('ended', () => {
    activeAyahAudioType = null;
    updateAyahAudioButtons();
  });

  $('playArabicBtn').addEventListener('click', () => playAyahAudio('arabic'));
  $('playUrduBtn').addEventListener('click', () => playAyahAudio('urdu'));

  $('prevAyah').addEventListener('click', () => {
    ayahIndex = (ayahIndex + ayahs.length - 1) % ayahs.length;
    renderAyah();
  });
  $('nextAyah').addEventListener('click', () => {
    ayahIndex = (ayahIndex + 1) % ayahs.length;
    renderAyah();
  });

  /* ============================================================
     2. NAVIGATION TABS (6 TABS)
     ============================================================ */
  document.querySelectorAll('.tab').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b === button));
    document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === button.dataset.tab));
  }));

  /* ============================================================
     3. ASMA-UL-HUSNA (99 NAMES) WITH TIMESTAMPS
     ============================================================ */
  const asmaNames = [
    { id: 1, arabic: 'الرَّحْمَٰنُ', trans: 'Ar-Rahman', en: 'The Entirely Merciful', ur: 'نہایت مہربان، سب پر رحم فرمانے والا', time: 24.5 },
    { id: 2, arabic: 'الرَّحِيمُ', trans: 'Ar-Raheem', en: 'The Especially Merciful', ur: 'ہمیشہ رحم فرمانے والا', time: 26.2 },
    { id: 3, arabic: 'الْمَلِكُ', trans: 'Al-Malik', en: 'The King / Sovereign', ur: 'حقیقی بادشاہ', time: 27.9 },
    { id: 4, arabic: 'الْقُدُّوسُ', trans: 'Al-Quddus', en: 'The Most Sacred / Pure', ur: 'ہر عیب اور برائی سے پاک', time: 29.5 },
    { id: 5, arabic: 'السَّلَامُ', trans: 'As-Salam', en: 'The Source of Peace', ur: 'سلامتی عطا کرنے والا', time: 31.1 },
    { id: 6, arabic: 'الْمُؤْمِنُ', trans: 'Al-Mu’min', en: 'The Giver of Security', ur: 'امن و امان بخشنے والا', time: 32.7 },
    { id: 7, arabic: 'الْمُهَيْمِنُ', trans: 'Al-Muhaymin', en: 'The Guardian / Overseer', ur: 'نگہبان اور محافظ', time: 34.3 },
    { id: 8, arabic: 'الْعَزِيزُ', trans: 'Al-Aziz', en: 'The All-Mighty', ur: 'سب پر غالب اور زبردست', time: 35.9 },
    { id: 9, arabic: 'الْجَبَّارُ', trans: 'Al-Jabbar', en: 'The Compeller / Restorer', ur: 'ٹوٹے دلوں کو جوڑنے والا، زبردست', time: 37.5 },
    { id: 10, arabic: 'الْمُتَكَبِّرُ', trans: 'Al-Mutakabbir', en: 'The Supreme / Majestic', ur: 'عظمت اور بڑائی والا', time: 39.2 },
    { id: 11, arabic: 'الْخَالِقُ', trans: 'Al-Khaliq', en: 'The Creator', ur: 'پیدا کرنے والا', time: 40.8 },
    { id: 12, arabic: 'الْبَارِئُ', trans: 'Al-Bari’', en: 'The Evolver / Maker', ur: 'عدم سے وجود میں لانے والا', time: 42.4 },
    { id: 13, arabic: 'الْمُصَوِّرُ', trans: 'Al-Musawwir', en: 'The Fashioner of Forms', ur: 'ہر چیز کو صورت دینے والا', time: 44 },
    { id: 14, arabic: 'الْغَفَّارُ', trans: 'Al-Ghaffar', en: 'The Great Forgiver', ur: 'بہت زیادہ بخشنے والا', time: 45.6 },
    { id: 15, arabic: 'الْقَهَّارُ', trans: 'Al-Qahhar', en: 'The All-Subduer', ur: 'سب پر غالب و مسلط', time: 47.3 },
    { id: 16, arabic: 'الْوَهَّابُ', trans: 'Al-Wahhab', en: 'The Supreme Bestower', ur: 'بلا معاوضہ کثرت سے عطا کرنے والا', time: 48.9 },
    { id: 17, arabic: 'الرَّزَّاقُ', trans: 'Ar-Razzaq', en: 'The Total Provider', ur: 'تمام مخلوقات کو رزق دینے والا', time: 50.5 },
    { id: 18, arabic: 'الْفَتَّاحُ', trans: 'Al-Fattah', en: 'The Supreme Opener', ur: 'رحمت کے دروازے کھولنے والا', time: 52.1 },
    { id: 19, arabic: 'الْعَلِيمُ', trans: 'Al-Alim', en: 'The All-Knowing', ur: 'سب کچھ جاننے والا', time: 53.7 },
    { id: 20, arabic: 'الْقَابِضُ', trans: 'Al-Qabid', en: 'The Restrainer', ur: 'تنگ کرنے والا، قبض کرنے والا', time: 58.7 },
    { id: 21, arabic: 'الْبَاسِطُ', trans: 'Al-Basit', en: 'The Expander', ur: 'فراخی اور کشادگی دینے والا', time: 60.3 },
    { id: 22, arabic: 'الْخَافِضُ', trans: 'Al-Khafid', en: 'The Abaser', ur: 'سرکشوں کو پست کرنے والا', time: 61.9 },
    { id: 23, arabic: 'الرَّافِعُ', trans: 'Ar-Rafi’', en: 'The Exalter', ur: 'مرتبے بلند فرمانے والا', time: 63.5 },
    { id: 24, arabic: 'الْمُعِزُّ', trans: 'Al-Mu’izz', en: 'The Bestower of Honour', ur: 'عزت عطا کرنے والا', time: 65.1 },
    { id: 25, arabic: 'الْمُذِلُّ', trans: 'Al-Mudhill', en: 'The Dishonourer', ur: 'ذلت دینے والا', time: 66.8 },
    { id: 26, arabic: 'السَّمِيعُ', trans: 'As-Sami’', en: 'The All-Hearing', ur: 'ہر بات سننے والا', time: 68.4 },
    { id: 27, arabic: 'الْبَصِيرُ', trans: 'Al-Basir', en: 'The All-Seeing', ur: 'ہر چیز کو دیکھنے والا', time: 70.0 },
    { id: 28, arabic: 'الْحَكَمُ', trans: 'Al-Hakam', en: 'The Supreme Judge', ur: 'انصاف کا فیصلہ کرنے والا', time: 71.6 },
    { id: 29, arabic: 'الْعَدْلُ', trans: 'Al-Adl', en: 'The Utterly Just', ur: 'سراسر عدل و انصاف والا', time: 72.3 },
    { id: 30, arabic: 'اللَّطِيفُ', trans: 'Al-Latif', en: 'The Subtle / Kind', ur: 'باریک بین اور لطف و کرم والا', time: 73.0 },
    { id: 31, arabic: 'الْخَبِيرُ', trans: 'Al-Khabir', en: 'The All-Aware', ur: 'پوشیدہ باتوں سے باخبر', time: 74.6 },
    { id: 32, arabic: 'الْحَلِيمُ', trans: 'Al-Halim', en: 'The Most Forbearing', ur: 'بردبار، عجلت نہ کرنے والا', time: 76.2 },
    { id: 33, arabic: 'الْعَظِيمُ', trans: 'Al-Azim', en: 'The Magnificent', ur: 'بے انتہا عظمت والا', time: 77.9 },
    { id: 34, arabic: 'الْغَفُورُ', trans: 'Al-Ghafur', en: 'The Ever-Forgiving', ur: 'بہت زیادہ بخشش فرمانے والا', time: 79.5 },
    { id: 35, arabic: 'الشَّكُورُ', trans: 'Ash-Shakur', en: 'The Most Grateful', ur: 'تھوڑے عمل کی قدر کرنے والا', time: 80.8 },
    { id: 36, arabic: 'الْعَلِيُّ', trans: 'Al-Aliyy', en: 'The Most High', ur: 'سب سے بلند و برتر', time: 81.9 },
    { id: 37, arabic: 'الْكَبِيرُ', trans: 'Al-Kabir', en: 'The Greatest', ur: 'سب سے بڑا', time: 83.2 },
    { id: 38, arabic: 'الْحَفِيظُ', trans: 'Al-Hafiz', en: 'The Preserver', ur: 'ہر چیز کی حفاظت کرنے والا', time: 85.5 },
    { id: 39, arabic: 'الْمُقِيتُ', trans: 'Al-Muqit', en: 'The Sustainer', ur: 'سب کو روزی و توانائی دینے والا', time: 87.1 },
    { id: 40, arabic: 'الْحَسِيبُ', trans: 'Al-Hasib', en: 'The Reckoner', ur: 'کفایت کرنے والا، حساب لینے والا', time: 88.7 },
    { id: 41, arabic: 'الْجَلِيلُ', trans: 'Al-Jalil', en: 'The Majestic', ur: 'بزرگ اور جلیل القدر', time: 90.3 },
    { id: 42, arabic: 'الْكَرِيمُ', trans: 'Al-Karim', en: 'The Most Generous', ur: 'بے پایاں کرم اور سخاوت والا', time: 92.0 },
    { id: 43, arabic: 'الرَّقِيبُ', trans: 'Ar-Raqib', en: 'The Watchful', ur: 'ہر پل نگہبان', time: 93.6 },
    { id: 44, arabic: 'الْمُجِيبُ', trans: 'Al-Mujib', en: 'The Responsive', ur: 'دعائیں قبول فرمانے والا', time: 94.3 },
    { id: 45, arabic: 'الْوَاسِعُ', trans: 'Al-Wasi’', en: 'The All-Encompassing', ur: 'لامحدود وسعت والا', time: 95.9 },
    { id: 46, arabic: 'الْحَكِيمُ', trans: 'Al-Hakim', en: 'The All-Wise', ur: 'حکمت اور دانائی والا', time: 97.6 },
    { id: 47, arabic: 'الْوَدُودُ', trans: 'Al-Wadud', en: 'The Most Loving', ur: 'اپنے بندوں سے محبت فرمانے والا', time: 99.2 },
    { id: 48, arabic: 'الْمَجِيدُ', trans: 'Al-Majid', en: 'The Glorious', ur: 'بزرگی اور شان والا', time: 100.8 },
    { id: 49, arabic: 'الْبَاعِثُ', trans: 'Al-Ba’ith', en: 'The Resurrector', ur: 'مردوں کو زندہ اٹھانے والا', time: 102.5 },
    { id: 50, arabic: 'الشَّهِيدُ', trans: 'Ash-Shahid', en: 'The Witness', ur: 'ہر وقت اور ہر جگہ حاضر و ناظر', time: 104.1 },
    { id: 51, arabic: 'الْحَقُّ', trans: 'Al-Haqq', en: 'The Absolute Truth', ur: 'برحق اور ہمیشہ قائم رہنے والا', time: 105.7 },
    { id: 52, arabic: 'الْوَكِيلُ', trans: 'Al-Wakil', en: 'The Trustee / Advocate', ur: 'بہترین کارساز', time: 107.3 },
    { id: 53, arabic: 'الْقَوِيُّ', trans: 'Al-Qawiyy', en: 'The All-Strong', ur: 'کامل قوت اور طاقت والا', time: 109.0 },
    { id: 54, arabic: 'الْمَتِينُ', trans: 'Al-Matin', en: 'The Firm / Steadfast', ur: 'مضبوط اور اٹل', time: 110.6 },
    { id: 55, arabic: 'الْوَلِيُّ', trans: 'Al-Waliyy', en: 'The Protecting Friend', ur: 'مددگار اور دوست', time: 112.2 },
    { id: 56, arabic: 'الْحَمِيدُ', trans: 'Al-Hamid', en: 'The Praiseworthy', ur: 'تمام تعریفوں کے لائق', time: 113.8 },
    { id: 57, arabic: 'الْمُحْصِي', trans: 'Al-Muhsi', en: 'The Reckoner / Counter', ur: 'ہر چھوٹی بڑی چیز کا شمار رکھنے والا', time: 115.5 },
    { id: 58, arabic: 'الْمُبْدِئُ', trans: 'Al-Mubdi’', en: 'The Originator', ur: 'پہلی بار پیدا فرمانے والا', time: 117.1 },
    { id: 59, arabic: 'الْمُعِيدُ', trans: 'Al-Mu’id', en: 'The Restorer', ur: 'دوبارہ پیدا کرنے والا', time: 118.7 },
    { id: 60, arabic: 'الْمُحْيِي', trans: 'Al-Muhyi', en: 'The Giver of Life', ur: 'زندگی بخشنے والا', time: 120.3 },
    { id: 61, arabic: 'الْمُمِيتُ', trans: 'Al-Mumit', en: 'The Creator of Death', ur: 'موت دینے والا', time: 122.0 },
    { id: 62, arabic: 'الْحَيُّ', trans: 'Al-Hayy', en: 'The Ever-Living', ur: 'ہمیشہ زندہ رہنے والا', time: 123.6 },
    { id: 63, arabic: 'الْقَيُّومُ', trans: 'Al-Qayyum', en: 'The Self-Subsisting', ur: 'سب کا نگہبان اور تھامنے والا', time: 125.2 },
    { id: 64, arabic: 'الْوَاجِدُ', trans: 'Al-Wajid', en: 'The Perceiver / Finder', ur: 'جو چاہے پانے والا', time: 126.8 },
    { id: 65, arabic: 'الْمَاجِدُ', trans: 'Al-Majid', en: 'The Illustrious', ur: 'بڑی شان اور شوکت والا', time: 128.5 },
    { id: 66, arabic: 'الْوَاحِدُ', trans: 'Al-Wahid', en: 'The One / Unique', ur: 'اکیلا اور یکتا', time: 130.1 },
    { id: 67, arabic: 'الْأَحَدُ', trans: 'Al-Ahad', en: 'The Sole One', ur: 'ذات اور صفات میں یکتا', time: 131.7 },
    { id: 68, arabic: 'الصَّمَدُ', trans: 'As-Samad', en: 'The Eternal / Self-Sufficient', ur: 'بے نیاز، جس کا سب محتاج ہیں', time: 133.3 },
    { id: 69, arabic: 'الْقَادِرُ', trans: 'Al-Qadir', en: 'The Omnipotent', ur: 'ہر چیز پر کامل قدرت رکھنے والا', time: 135.0 },
    { id: 70, arabic: 'الْمُقْتَدِرُ', trans: 'Al-Muqtadir', en: 'The Creator of All Power', ur: 'مکمل قدرت و اقتدار والا', time: 136.6 },
    { id: 71, arabic: 'الْمُقَدِّمُ', trans: 'Al-Muqaddim', en: 'The Expediter', ur: 'آگے بڑھانے والا', time: 138.2 },
    { id: 72, arabic: 'الْمُؤَخِّرُ', trans: 'Al-Mu’akhkhir', en: 'The Delayer', ur: 'پیچھے رکھنے والا', time: 139.8 },
    { id: 73, arabic: 'الْأَوَّلُ', trans: 'Al-Awwal', en: 'The First', ur: 'سب سے پہلے، ازل سے موجود', time: 141.5 },
    { id: 74, arabic: 'الْآخِرُ', trans: 'Al-Akhir', en: 'The Last', ur: 'سب کے بعد، ہمیشہ رہنے والا', time: 143.1 },
    { id: 75, arabic: 'الظَّاهِرُ', trans: 'Az-Zahir', en: 'The Manifest', ur: 'اپنی قدرتوں سے بالکل ظاہر', time: 144.7 },
    { id: 76, arabic: 'الْبَاطِنُ', trans: 'Al-Batin', en: 'The Hidden', ur: 'نگاہوں سے پوشیدہ', time: 146.3 },
    { id: 77, arabic: 'الْوَالِي', trans: 'Al-Wali', en: 'The Sole Governor', ur: 'کائنات کا انتظام سنبھالنے والا', time: 148.0 },
    { id: 78, arabic: 'الْمُتَعَالِي', trans: 'Al-Muta’ali', en: 'The Self Exalted', ur: 'سب سے برتر اور بلند شان والا', time: 149.6 },
    { id: 79, arabic: 'الْبَرُّ', trans: 'Al-Barr', en: 'The Source of All Goodness', ur: 'سراپا احسان اور بھلائی فرمانے والا', time: 151.2 },
    { id: 80, arabic: 'التَّوَّابُ', trans: 'At-Tawwab', en: 'The Ever-Pardoning', ur: 'توبہ قبول فرمانے والا', time: 152.8 },
    { id: 81, arabic: 'الْمُنْتَقِمُ', trans: 'Al-Muntaqim', en: 'The Just Avenger', ur: 'سرکشوں سے بدلہ لینے والا', time: 154.5 },
    { id: 82, arabic: 'الْعَفُوُّ', trans: 'Al-‘Afuww', en: 'The Supreme Pardoner', ur: 'گناہوں کو معاف فرما دینے والا', time: 156.1 },
    { id: 83, arabic: 'الرَّءُوفُ', trans: 'Ar-Ra’uf', en: 'The Most Clement', ur: 'بے پناہ شفقت اور رحم والا', time: 157.7 },
    { id: 84, arabic: 'مَالِكُ الْمُلْكِ', trans: 'Malik-ul-Mulk', en: 'Owner of All Sovereignty', ur: 'تمام کائنات اور بادشاہی کا مالک', time: 159.3 },
    { id: 85, arabic: 'ذُو الْجَلَالِ وَالْإِكْرَامِ', trans: 'Dhul-Jalali wal-Ikram', en: 'Lord of Majesty & Generosity', ur: 'عظمت، جلال اور انعام و اکرام والا', time: 161.3 },
    { id: 86, arabic: 'الْمُقْسِطُ', trans: 'Al-Muqsit', en: 'The Equitable Requiter', ur: 'عدل و انصاف قائم کرنے والا', time: 163.3 },
    { id: 87, arabic: 'الْجَامِعُ', trans: 'Al-Jami’', en: 'The Gatherer / Unifier', ur: 'سب کو قیامت کے دن جمع کرنے والا', time: 164.9 },
    { id: 88, arabic: 'الْغَنِيُّ', trans: 'Al-Ghaniyy', en: 'The All-Rich / Independent', ur: 'بے نیاز اور غنی', time: 166.5 },
    { id: 89, arabic: 'الْمُغْنِي', trans: 'Al-Mughni', en: 'The Enricher', ur: 'غنی اور بے پرواہ کر دینے والا', time: 168.1 },
    { id: 90, arabic: 'الْمَانِعُ', trans: 'Al-Mani’', en: 'The Preventer / Withholder', ur: 'نقصان سے روکنے والا', time: 169.8 },
    { id: 91, arabic: 'الضَّارُّ', trans: 'Ad-Darr', en: 'The Creator of the Harmful', ur: 'حکمت سے نقصان پہنچانے والا', time: 171.4 },
    { id: 92, arabic: 'النَّافِعُ', trans: 'An-Nafi’', en: 'The Creator of Good', ur: 'نفع اور فائدہ بخشنے والا', time: 173.0 },
    { id: 93, arabic: 'النُّورُ', trans: 'An-Nur', en: 'The Light', ur: 'زمین و آسمان کو روشن کرنے والا', time: 174.6 },
    { id: 94, arabic: 'الْهَادِي', trans: 'Al-Hadi', en: 'The Guide', ur: 'ہدایت کا راستہ دکھانے والا', time: 176.3 },
    { id: 95, arabic: 'الْبَدِيعُ', trans: 'Al-Badi’', en: 'The Incomparable Originator', ur: 'بغیر نمونے کے کائنات کو تخلیق فرمانے والا', time: 177.9 },
    { id: 96, arabic: 'الْبَاقِي', trans: 'Al-Baqi', en: 'The Ever-Surviving', ur: 'ہمیشہ باقی رہنے والا', time: 179.5 },
    { id: 97, arabic: 'الْوَارِثُ', trans: 'Al-Warith', en: 'The Supreme Inheritor', ur: 'سب کے بعد باقی رہنے والا سچا وارث', time: 181.1 },
    { id: 98, arabic: 'الرَّشِيدُ', trans: 'Ar-Rashid', en: 'The Infallible Teacher', ur: 'صحیح راہ پر چلانے والا، دانا', time: 182.8 },
    { id: 99, arabic: 'الصَّبُورُ', trans: 'As-Sabur', en: 'The Most Patient', ur: 'بڑا صابر اور تحمل والا', time: 184.4 }
  ];

  const ATIF_ASLAM_AUDIO_URL = 'https://downloadthequran.com/wp-content/uploads/2021/02/99-Names-of-Allah-by-Atif-Aslam.mp3';
  const TOTAL_RECITATION_DURATION = 203; // 3:23

  let currentAsmaIndex = 0;
  let isReciting = false;
  let currentRecitationTime = 0;
  const asmaAudioPlayer = $('asmaAudioPlayer');
  asmaAudioPlayer.src = ATIF_ASLAM_AUDIO_URL;

  function formatTime(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m < 10 ? '0' : ''}${m}:${rem < 10 ? '0' : ''}${rem}`;
  }

  function renderSpotlight(index, animate = true) {
    if (index < 0 || index >= asmaNames.length) return;
    currentAsmaIndex = index;
    const name = asmaNames[index];
    const arabicEl = $('spotlightArabic');

    if (animate) {
      arabicEl.classList.remove('pulse-anim');
      void arabicEl.offsetWidth;
      arabicEl.classList.add('pulse-anim');
    }

    arabicEl.textContent = name.arabic;
    $('spotlightTrans').textContent = name.trans;
    $('spotlightUrdu').textContent = name.ur;
    $('spotlightMeaning').textContent = name.en;
    $('spotlightIndex').textContent = `${name.id < 10 ? '0' : ''}${name.id} / 99`;
    $('asmaCurrentBadge').textContent = `#${name.id < 10 ? '0' : ''}${name.id} / 99`;

    const nextName = asmaNames[index + 1];
    $('spotlightNext').textContent = nextName ? `Next: ${nextName.trans}` : 'Completed 99 Names';

    const pct = Math.min(100, Math.max(0, (name.time / TOTAL_RECITATION_DURATION) * 100));
    $('asmaProgressBar').style.width = `${pct}%`;
    $('asmaCurrentTime').textContent = formatTime(name.time);
    $('asmaTotalTime').textContent = formatTime(TOTAL_RECITATION_DURATION);

    highlightScrollListItem(index);
  }

  function highlightScrollListItem(index) {
    document.querySelectorAll('.name-item').forEach((el, i) => {
      const isActive = i === index;
      el.classList.toggle('active-reciting', isActive);
      if (isActive && el.parentElement) {
        const parent = el.parentElement;
        const top = el.offsetTop - parent.offsetTop - 50;
        parent.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      }
    });
  }

  function renderNamesList(filter = '') {
    const list = $('namesList');
    list.replaceChildren();
    const query = filter.trim().toLowerCase();

    asmaNames.forEach((n, idx) => {
      const match = !query ||
        n.trans.toLowerCase().includes(query) ||
        n.en.toLowerCase().includes(query) ||
        n.ur.includes(query) ||
        n.arabic.includes(query) ||
        String(n.id) === query;

      if (!match) return;

      const item = document.createElement('div');
      item.className = 'list-item name-item';
      if (idx === currentAsmaIndex) item.classList.add('active-reciting');

      const num = document.createElement('span');
      num.className = 'name-badge-num';
      num.textContent = `${n.id < 10 ? '0' : ''}${n.id}`;

      const ar = document.createElement('span');
      ar.className = 'name-arabic';
      ar.dir = 'rtl';
      ar.textContent = n.arabic;

      const copy = document.createElement('div');
      copy.className = 'name-copy';
      const strong = document.createElement('strong');
      strong.textContent = n.trans;
      const ur = document.createElement('p');
      ur.dir = 'rtl';
      ur.textContent = n.ur;
      const en = document.createElement('span');
      en.textContent = n.en;
      copy.append(strong, ur, en);

      const jumpBtn = document.createElement('button');
      jumpBtn.className = 'name-jump-btn';
      jumpBtn.title = `Jump to ${n.trans} in recitation`;
      jumpBtn.textContent = '▶';

      item.append(num, ar, copy, jumpBtn);
      item.addEventListener('click', () => jumpToName(idx));
      list.append(item);
    });
  }

  function handleTimeTick(currentTime) {
    currentRecitationTime = currentTime;
    $('asmaCurrentTime').textContent = formatTime(currentTime);
    const pct = Math.min(100, Math.max(0, (currentTime / TOTAL_RECITATION_DURATION) * 100));
    $('asmaProgressBar').style.width = `${pct}%`;

    let activeIdx = 0;
    for (let i = 0; i < asmaNames.length; i++) {
      if (currentTime >= asmaNames[i].time) activeIdx = i;
      else break;
    }

    if (activeIdx !== currentAsmaIndex) {
      renderSpotlight(activeIdx, true);
    }
  }

  function sendYtCommand(func, args = []) {
    const iframe = $('asmaYtIframe');
    if (!iframe || !iframe.contentWindow) return;
    iframe.contentWindow.postMessage(JSON.stringify({
      event: 'command',
      func: func,
      args: args
    }), '*');
  }

  function playRecitation() {
    pauseAllMedia('asma');
    isReciting = true;
    $('asmaPlayIcon').textContent = '⏸';
    $('asmaPlayText').textContent = 'Pause';

    if (currentRecitationTime > 0 && Math.abs(asmaAudioPlayer.currentTime - currentRecitationTime) > 1.5) {
      asmaAudioPlayer.currentTime = currentRecitationTime;
    }

    asmaAudioPlayer.play().then(() => {
      sendYtCommand('seekTo', [asmaAudioPlayer.currentTime, true]);
      sendYtCommand('mute');
      sendYtCommand('playVideo');
    }).catch(err => {
      console.warn('Playback error:', err);
      sendYtCommand('unMute');
      sendYtCommand('playVideo');
    });
  }

  function pauseRecitation() {
    if (asmaAudioPlayer && !asmaAudioPlayer.paused) {
      asmaAudioPlayer.pause();
    }
    sendYtCommand('pauseVideo');
    $('asmaPlayIcon').textContent = '▶';
    $('asmaPlayText').textContent = 'Play Recitation';
    isReciting = false;
  }

  function jumpToName(index) {
    if (index < 0) index = 0;
    if (index >= asmaNames.length) index = asmaNames.length - 1;

    renderSpotlight(index, true);
    const targetTime = asmaNames[index].time;
    currentRecitationTime = targetTime;

    if (!asmaAudioPlayer.src) {
      asmaAudioPlayer.src = ATIF_ASLAM_AUDIO_URL;
    }

    asmaAudioPlayer.currentTime = targetTime;
    sendYtCommand('seekTo', [targetTime, true]);
    playRecitation();
  }

  asmaAudioPlayer.addEventListener('timeupdate', () => {
    if (!asmaAudioPlayer.paused) {
      handleTimeTick(asmaAudioPlayer.currentTime);
    }
  });

  asmaAudioPlayer.addEventListener('ended', () => {
    pauseRecitation();
    handleTimeTick(0);
    renderSpotlight(0, false);
  });

  $('asmaPlayBtn').addEventListener('click', () => {
    if (asmaAudioPlayer.paused) playRecitation();
    else pauseRecitation();
  });

  $('asmaPrevBtn').addEventListener('click', () => jumpToName(currentAsmaIndex - 1));
  $('asmaNextBtn').addEventListener('click', () => jumpToName(currentAsmaIndex + 1));

  $('asmaProgressContainer').addEventListener('click', (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const seekTime = ratio * TOTAL_RECITATION_DURATION;
    asmaAudioPlayer.currentTime = seekTime;
    sendYtCommand('seekTo', [seekTime, true]);
    handleTimeTick(seekTime);
  });

  $('asmaVolume').addEventListener('input', (e) => {
    const vol = parseFloat(e.target.value);
    asmaAudioPlayer.volume = vol;
    sendYtCommand('setVolume', [Math.round(vol * 100)]);
  });

  $('nameSearch').addEventListener('input', e => renderNamesList(e.target.value));

  /* ============================================================
     4. DAILY AZKAR
     ============================================================ */
  const azkar = [
    ['سُبْحَانَ اللَّهِ', 'SubhanAllah', 'اللہ ہر عیب سے پاک ہے۔', 'Tasbeeh'],
    ['الْحَمْدُ لِلَّهِ', 'Alhamdulillah', 'تمام تعریفیں اور شکر اللہ ہی کے لیے ہے۔', 'Shukr'],
    ['اللَّهُ أَكْبَرُ', 'Allahu Akbar', 'اللہ سب سے بڑا ہے۔', 'Takbeer'],
    ['أَسْتَغْفِرُ اللَّهَ', 'Astaghfirullah', 'میں اللہ سے اپنے گناہوں کی بخشش مانگتا ہوں۔', 'Istighfar'],
    ['لَا إِلَٰهَ إِلَّا اللَّهُ', 'La ilaha illallah', 'اللہ کے سوا کوئی معبود نہیں۔', 'Tawheed'],
    ['حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', 'Hasbunallahu wa ni’mal wakeel', 'ہمیں اللہ کافی ہے اور وہ بہترین کارساز ہے۔', 'Tawakkul'],
    ['لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', 'La hawla wa la quwwata illa billah', 'گناہوں سے بچنے کی طاقت اور نیکی کی توفیق اللہ کے بغیر نہیں۔', 'Du’a']
  ];
  const azkarList = $('azkarList');
  azkar.forEach(z => {
    const card = document.createElement('article');
    card.className = 'list-item';
    const ar = document.createElement('p');
    ar.className = 'arabic small';
    ar.dir = 'rtl';
    ar.textContent = z[0];
    const title = document.createElement('strong');
    title.textContent = z[1];
    const meaning = document.createElement('p');
    meaning.className = 'translation small';
    meaning.dir = 'rtl';
    meaning.lang = 'ur';
    meaning.textContent = z[2];
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = z[3];
    card.append(ar, title, meaning, tag);
    azkarList.append(card);
  });

  /* ============================================================
     5. NAATS & NASHEEDS (DIRECT AUDIO PLAYER)
     ============================================================ */
  let naats = Array.isArray(window.initialNaats) ? window.initialNaats : [];
  let currentNaatIndex = 0;
  const naatAudio = $('naatAudioPlayer');

  function renderNaatSpotlight(index, autoPlay = false) {
    if (!naats.length) return;
    if (index < 0) index = 0;
    if (index >= naats.length) index = naats.length - 1;
    currentNaatIndex = index;
    const item = naats[index];

    $('naatNowTitle').textContent = item.title;
    $('naatIndexBadge').textContent = `${index + 1 < 10 ? '0' : ''}${index + 1} / ${naats.length < 10 ? '0' : ''}${naats.length}`;
    const nextItem = naats[index + 1];
    $('naatNextTitle').textContent = nextItem ? `Next: ${nextItem.title}` : 'Playlist End';

    naatAudio.src = item.url;
    if (autoPlay) {
      playNaat();
    } else {
      $('naatPlayIcon').textContent = '▶';
      $('naatPlayText').textContent = 'Play Naat';
      $('naatPlayerStatus').textContent = 'Ready to Play';
      $('naatDisc').classList.remove('active');
    }
    renderNaatPlaylist();
  }

  function playNaat() {
    pauseAllMedia('naats');
    const item = naats[currentNaatIndex];
    if (!item) return;

    if (!naatAudio.src || (!naatAudio.src.endsWith(item.fileName || item.url) && naatAudio.src !== item.url)) {
      naatAudio.src = item.url;
    }

    $('naatDisc').classList.add('active');
    $('naatPlayIcon').textContent = '⏸';
    $('naatPlayText').textContent = 'Pause';
    $('naatPlayerStatus').textContent = 'Now Playing';

    naatAudio.play().catch(err => {
      console.warn('Naat play error:', err);
      $('naatPlayerStatus').textContent = 'Audio error: ' + (err.message || 'Cannot play');
      $('naatDisc').classList.remove('active');
      $('naatPlayIcon').textContent = '▶';
      $('naatPlayText').textContent = 'Play Naat';
    });
    renderNaatPlaylist();
  }

  function pauseNaat() {
    if (naatAudio && !naatAudio.paused) {
      naatAudio.pause();
    }
    $('naatDisc').classList.remove('active');
    $('naatPlayIcon').textContent = '▶';
    $('naatPlayText').textContent = 'Play Naat';
    $('naatPlayerStatus').textContent = 'Paused';
    renderNaatPlaylist();
  }

  function jumpToNaat(index) {
    if (index < 0) index = 0;
    if (index >= naats.length) index = naats.length - 1;
    renderNaatSpotlight(index, true);
  }

  naatAudio.addEventListener('loadedmetadata', () => {
    if (naatAudio.duration && isFinite(naatAudio.duration)) {
      $('naatTotalTime').textContent = formatTime(naatAudio.duration);
    }
  });

  naatAudio.addEventListener('timeupdate', () => {
    const cur = naatAudio.currentTime;
    const dur = naatAudio.duration || 0;
    $('naatCurrentTime').textContent = formatTime(cur);
    if (dur > 0) {
      $('naatTotalTime').textContent = formatTime(dur);
      const pct = Math.min(100, Math.max(0, (cur / dur) * 100));
      $('naatProgressBar').style.width = `${pct}%`;
    }
  });

  $('naatProgressContainer').addEventListener('click', (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (naatAudio.duration) {
      naatAudio.currentTime = ratio * naatAudio.duration;
    }
  });

  $('naatVolume').addEventListener('input', (e) => {
    naatAudio.volume = parseFloat(e.target.value);
  });

  $('naatPlayBtn').addEventListener('click', () => {
    if (naatAudio.paused) playNaat();
    else pauseNaat();
  });

  $('naatPrevBtn').addEventListener('click', () => jumpToNaat(currentNaatIndex - 1));
  $('naatNextBtn').addEventListener('click', () => jumpToNaat(currentNaatIndex + 1));

  naatAudio.addEventListener('ended', () => {
    if (currentNaatIndex < naats.length - 1) {
      jumpToNaat(currentNaatIndex + 1);
    } else {
      pauseNaat();
    }
  });

  function renderNaatPlaylist() {
    const list = $('naatPlaylist');
    list.replaceChildren();
    $('naatCountBadge').textContent = `${naats.length} Tracks`;

    if (!naats.length) {
      const empty = document.createElement('p');
      empty.className = 'muted empty';
      empty.textContent = 'Playlist is empty.';
      list.append(empty);
      return;
    }

    naats.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'list-item playlist-item';
      const isCurrent = index === currentNaatIndex;
      if (isCurrent && !naatAudio.paused) row.classList.add('playing');

      const play = document.createElement('button');
      play.className = 'play-button';
      play.textContent = isCurrent && !naatAudio.paused ? '⏸' : '▶';
      play.title = `Play ${item.title}`;
      play.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isCurrent && !naatAudio.paused) pauseNaat();
        else jumpToNaat(index);
      });

      const title = document.createElement('span');
      title.className = 'playlist-title';
      const badge = document.createElement('span');
      badge.className = 'media-badge mp3';
      badge.textContent = 'Naat';
      title.append(badge, document.createTextNode(item.title));
      row.append(play, title);
      row.addEventListener('click', () => jumpToNaat(index));
      list.append(row);
    });
  }

  /* ============================================================
     6. SONGS & MUSIC (DIRECT AUDIO PLAYER)
     ============================================================ */
  let songs = Array.isArray(window.initialSongs) ? window.initialSongs : [];
  let currentSongIndex = 0;
  const songAudio = $('songAudioPlayer');

  function renderSongSpotlight(index, autoPlay = false) {
    if (!songs.length) return;
    if (index < 0) index = 0;
    if (index >= songs.length) index = songs.length - 1;
    currentSongIndex = index;
    const item = songs[index];

    $('songNowTitle').textContent = item.title;
    $('songIndexBadge').textContent = `${index + 1 < 10 ? '0' : ''}${index + 1} / ${songs.length < 10 ? '0' : ''}${songs.length}`;
    const nextItem = songs[index + 1];
    $('songNextTitle').textContent = nextItem ? `Next: ${nextItem.title}` : 'Playlist End';

    songAudio.src = item.url;
    if (autoPlay) {
      playSong();
    } else {
      $('songPlayIcon').textContent = '▶';
      $('songPlayText').textContent = 'Play Song';
      $('songPlayerStatus').textContent = 'Ready to Play';
      $('songDisc').classList.remove('active');
    }
    renderSongPlaylist();
  }

  function playSong() {
    pauseAllMedia('songs');
    const item = songs[currentSongIndex];
    if (!item) return;

    if (!songAudio.src || (!songAudio.src.endsWith(item.fileName || item.url) && songAudio.src !== item.url)) {
      songAudio.src = item.url;
    }

    $('songDisc').classList.add('active');
    $('songPlayIcon').textContent = '⏸';
    $('songPlayText').textContent = 'Pause';
    $('songPlayerStatus').textContent = 'Now Playing';

    songAudio.play().catch(err => {
      console.warn('Song play error:', err);
      $('songPlayerStatus').textContent = 'Audio error: ' + (err.message || 'Cannot play');
      $('songDisc').classList.remove('active');
      $('songPlayIcon').textContent = '▶';
      $('songPlayText').textContent = 'Play Song';
    });
    renderSongPlaylist();
  }

  function pauseSong() {
    if (songAudio && !songAudio.paused) {
      songAudio.pause();
    }
    $('songDisc').classList.remove('active');
    $('songPlayIcon').textContent = '▶';
    $('songPlayText').textContent = 'Play Song';
    $('songPlayerStatus').textContent = 'Paused';
    renderSongPlaylist();
  }

  function jumpToSong(index) {
    if (index < 0) index = 0;
    if (index >= songs.length) index = songs.length - 1;
    renderSongSpotlight(index, true);
  }

  songAudio.addEventListener('loadedmetadata', () => {
    if (songAudio.duration && isFinite(songAudio.duration)) {
      $('songTotalTime').textContent = formatTime(songAudio.duration);
    }
  });

  songAudio.addEventListener('timeupdate', () => {
    const cur = songAudio.currentTime;
    const dur = songAudio.duration || 0;
    $('songCurrentTime').textContent = formatTime(cur);
    if (dur > 0) {
      $('songTotalTime').textContent = formatTime(dur);
      const pct = Math.min(100, Math.max(0, (cur / dur) * 100));
      $('songProgressBar').style.width = `${pct}%`;
    }
  });

  $('songProgressContainer').addEventListener('click', (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (songAudio.duration) {
      songAudio.currentTime = ratio * songAudio.duration;
    }
  });

  $('songVolume').addEventListener('input', (e) => {
    songAudio.volume = parseFloat(e.target.value);
  });

  $('songPlayBtn').addEventListener('click', () => {
    if (songAudio.paused) playSong();
    else pauseSong();
  });

  $('songPrevBtn').addEventListener('click', () => jumpToSong(currentSongIndex - 1));
  $('songNextBtn').addEventListener('click', () => jumpToSong(currentSongIndex + 1));

  songAudio.addEventListener('ended', () => {
    if (currentSongIndex < songs.length - 1) {
      jumpToSong(currentSongIndex + 1);
    } else {
      pauseSong();
    }
  });

  function renderSongPlaylist() {
    const list = $('songPlaylist');
    list.replaceChildren();
    $('songCountBadge').textContent = `${songs.length} Tracks`;

    if (!songs.length) {
      const empty = document.createElement('p');
      empty.className = 'muted empty';
      empty.textContent = 'Playlist is empty.';
      list.append(empty);
      return;
    }

    songs.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'list-item playlist-item';
      const isCurrent = index === currentSongIndex;
      if (isCurrent && !songAudio.paused) row.classList.add('playing');

      const play = document.createElement('button');
      play.className = 'play-button';
      play.textContent = isCurrent && !songAudio.paused ? '⏸' : '▶';
      play.title = `Play ${item.title}`;
      play.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isCurrent && !songAudio.paused) pauseSong();
        else jumpToSong(index);
      });

      const title = document.createElement('span');
      title.className = 'playlist-title';
      const badge = document.createElement('span');
      badge.className = 'media-badge mp3';
      badge.textContent = 'Song';
      title.append(badge, document.createTextNode(item.title));
      row.append(play, title);
      row.addEventListener('click', () => jumpToSong(index));
      list.append(row);
    });
  }

  /* ============================================================
     7. REMINDERS & NOTES (24H TIME ADDITION & ALARM SOUNDS)
     ============================================================ */
  let reminders = Array.isArray(window.initialReminders) ? window.initialReminders : [];
  let scheduledMinutes = 15;

  function formatClockTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatDurationText(mins) {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  function formatHumanDueTime(date) {
    const now = new Date();
    const isToday = now.toDateString() === date.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = tomorrow.toDateString() === date.toDateString();
    const timeStr = formatClockTime(date);
    if (isToday) return `Today at ${timeStr}`;
    if (isTomorrow) return `Tomorrow at ${timeStr}`;
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`;
  }

  function formatRemainingDuration(ms) {
    if (ms <= 0) return 'Due now!';
    const totalSec = Math.floor(ms / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    if (days > 0) return `in ${days}d ${hours}h`;
    if (hours > 0) return `in ${hours}h ${mins}m`;
    if (mins > 0) return `in ${mins}m ${secs}s`;
    return `in ${secs}s`;
  }

  function updateTimeDisplay() {
    scheduledMinutes = Math.min(1440, Math.max(1, scheduledMinutes));
    const targetDate = new Date(Date.now() + scheduledMinutes * 60000);
    const badge = $('liveTargetBadge');
    if (badge) {
      badge.textContent = `⏰ Rings in ${formatDurationText(scheduledMinutes)} (${formatClockTime(targetDate)})`;
    }
    const input = $('minutesInput');
    if (input) input.value = scheduledMinutes;

    document.querySelectorAll('#timeAddChips .chip-btn').forEach(btn => {
      const val = parseInt(btn.getAttribute('data-set'), 10);
      btn.classList.toggle('active', val === scheduledMinutes);
    });
  }

  // Quick preset task chips for Qadeer
  document.querySelectorAll('.preset-task-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const task = btn.getAttribute('data-task');
      const mins = btn.getAttribute('data-mins');
      if (task) $('reminderTask').value = task;
      if (mins) {
        scheduledMinutes = parseInt(mins, 10);
        updateTimeDisplay();
      }
      $('reminderTask').focus();
    });
  });

  // Time Add Chips (+5m, +10m, +15m, etc.)
  document.querySelectorAll('#timeAddChips .chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const setMins = parseInt(btn.getAttribute('data-set'), 10);
      if (!isNaN(setMins)) {
        scheduledMinutes = setMins;
        updateTimeDisplay();
      }
    });
  });

  // Stepper buttons
  $('plusTimeBtn').addEventListener('click', () => {
    scheduledMinutes = Math.min(1440, scheduledMinutes + 5);
    updateTimeDisplay();
  });
  $('minusTimeBtn').addEventListener('click', () => {
    scheduledMinutes = Math.max(1, scheduledMinutes - 5);
    updateTimeDisplay();
  });
  $('resetTimeBtn').addEventListener('click', () => {
    scheduledMinutes = 15;
    updateTimeDisplay();
  });
  $('minutesInput').addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      scheduledMinutes = Math.min(1440, Math.max(1, val));
      updateTimeDisplay();
    }
  });

  // Preview alarm sound button
  $('previewSoundBtn').addEventListener('click', () => {
    const sel = $('alarmSoundSelect');
    playAlarmSound(sel ? sel.value : 'beep');
  });

  // Add reminder
  $('addReminderBtn').addEventListener('click', () => {
    const taskInput = $('reminderTask');
    const detailsInput = $('reminderDetails');
    const soundSel = $('alarmSoundSelect');

    const task = (taskInput.value || '').trim();
    const details = (detailsInput.value || '').trim();
    const sound = soundSel ? soundSel.value : 'beep';

    if (!task) {
      alert('Please enter a Task / Reminder title.');
      taskInput.focus();
      return;
    }

    const dueTimestamp = Date.now() + scheduledMinutes * 60000;
    const newReminder = {
      id: 'rem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      task: task,
      time: new Date(dueTimestamp).toISOString(),
      dueTimestamp: dueTimestamp,
      details: details,
      sound: sound,
      createdAt: Date.now(),
      triggered: false,
      completed: false
    };

    reminders.push(newReminder);
    vscode.postMessage({ type: 'saveReminders', reminders: reminders });

    taskInput.value = '';
    detailsInput.value = '';
    scheduledMinutes = 15;
    updateTimeDisplay();
    renderReminders();
  });

  function renderReminders() {
    const activeList = $('activeRemindersList');
    const historyList = $('historyRemindersList');
    activeList.replaceChildren();
    historyList.replaceChildren();

    const now = Date.now();
    const activeItems = reminders.filter(r => !r.completed);
    const historyItems = reminders.filter(r => r.completed);

    $('activeCount').textContent = activeItems.length;
    $('historyCount').textContent = historyItems.length;
    $('reminderCountBadge').textContent = `${activeItems.length} Active`;

    // Sort active reminders by due time
    activeItems.sort((a, b) => {
      const aTime = a.dueTimestamp || new Date(a.time).getTime();
      const bTime = b.dueTimestamp || new Date(b.time).getTime();
      return aTime - bTime;
    });

    if (!activeItems.length) {
      const empty = document.createElement('p');
      empty.className = 'muted empty';
      empty.textContent = 'No pending reminders. Pick a quick task above or add a countdown alarm!';
      activeList.append(empty);
    } else {
      activeItems.forEach(r => {
        const dueTime = r.dueTimestamp || new Date(r.time).getTime();
        const dueDate = new Date(dueTime);
        const diff = dueTime - now;
        const isAlarming = r.triggered || diff <= 0;

        const card = document.createElement('div');
        card.className = `reminder-card ${isAlarming ? 'alarm-active' : ''}`;

        const header = document.createElement('div');
        header.className = 'reminder-header';

        const soundIcon = r.sound === 'chime' ? '🔔' : r.sound === 'bell' ? '🎵' : r.sound === 'silent' ? '🔕' : '⏰';
        const taskTitle = document.createElement('span');
        taskTitle.className = 'reminder-task';
        taskTitle.textContent = `${isAlarming ? '🔔 ' : `${soundIcon} `}${r.task}`;

        const badge = document.createElement('span');
        badge.className = `reminder-badge ${isAlarming ? 'badge-alarm' : 'badge-pending'}`;
        badge.id = `badge_${r.id}`;
        badge.textContent = isAlarming ? 'ALARM / DUE!' : formatRemainingDuration(diff);

        header.append(taskTitle, badge);
        card.append(header);

        if (r.details) {
          const det = document.createElement('div');
          det.className = 'reminder-details-box';
          det.textContent = r.details;
          card.append(det);
        }

        const meta = document.createElement('div');
        meta.className = 'reminder-meta';
        meta.innerHTML = `<span>📅 ${formatHumanDueTime(dueDate)}</span>`;
        card.append(meta);

        const actions = document.createElement('div');
        actions.className = 'reminder-actions';

        const doneBtn = document.createElement('button');
        doneBtn.className = 'btn-sm done-btn';
        doneBtn.textContent = '✓ Done';
        doneBtn.title = 'Mark reminder as completed';
        doneBtn.addEventListener('click', () => {
          r.completed = true;
          vscode.postMessage({ type: 'saveReminders', reminders: reminders });
          renderReminders();
        });

        const snoozeBtn = document.createElement('button');
        snoozeBtn.className = 'btn-sm';
        snoozeBtn.textContent = '↺ +10m';
        snoozeBtn.title = 'Snooze reminder for 10 minutes';
        snoozeBtn.addEventListener('click', () => {
          r.dueTimestamp = Date.now() + 10 * 60000;
          r.time = new Date(r.dueTimestamp).toISOString();
          r.triggered = false;
          vscode.postMessage({ type: 'saveReminders', reminders: reminders });
          renderReminders();
        });

        const delBtn = document.createElement('button');
        delBtn.className = 'btn-sm del-btn';
        delBtn.textContent = '🗑 Delete';
        delBtn.title = 'Delete reminder';
        delBtn.addEventListener('click', () => {
          reminders = reminders.filter(item => item.id !== r.id);
          vscode.postMessage({ type: 'saveReminders', reminders: reminders });
          renderReminders();
        });

        actions.append(doneBtn, snoozeBtn, delBtn);
        card.append(actions);

        activeList.append(card);
      });
    }

    // Render history
    if (!historyItems.length) {
      const emptyHistory = document.createElement('p');
      emptyHistory.className = 'muted tiny';
      emptyHistory.textContent = 'Completed tasks will appear here.';
      historyList.append(emptyHistory);
    } else {
      historyItems.slice(-5).reverse().forEach(r => {
        const card = document.createElement('div');
        card.className = 'reminder-card completed';

        const header = document.createElement('div');
        header.className = 'reminder-header';
        const taskTitle = document.createElement('span');
        taskTitle.className = 'reminder-task';
        taskTitle.style.textDecoration = 'line-through';
        taskTitle.textContent = r.task;

        const badge = document.createElement('span');
        badge.className = 'reminder-badge badge-done';
        badge.textContent = 'Completed';
        header.append(taskTitle, badge);
        card.append(header);

        if (r.details) {
          const det = document.createElement('div');
          det.className = 'reminder-details-box';
          det.textContent = r.details;
          card.append(det);
        }

        const actions = document.createElement('div');
        actions.className = 'reminder-actions';

        const reopenBtn = document.createElement('button');
        reopenBtn.className = 'btn-sm';
        reopenBtn.textContent = '↺ Reopen';
        reopenBtn.addEventListener('click', () => {
          r.completed = false;
          r.triggered = false;
          r.dueTimestamp = Date.now() + 15 * 60000;
          r.time = new Date(r.dueTimestamp).toISOString();
          vscode.postMessage({ type: 'saveReminders', reminders: reminders });
          renderReminders();
        });

        const delBtn = document.createElement('button');
        delBtn.className = 'btn-sm del-btn';
        delBtn.textContent = '🗑';
        delBtn.addEventListener('click', () => {
          reminders = reminders.filter(item => item.id !== r.id);
          vscode.postMessage({ type: 'saveReminders', reminders: reminders });
          renderReminders();
        });

        actions.append(reopenBtn, delBtn);
        card.append(actions);
        historyList.append(card);
      });
    }
  }

  // Periodic reminder checking loop (every 1 second)
  setInterval(() => {
    const now = Date.now();
    let triggeredAny = false;

    reminders.forEach(r => {
      if (r.completed) return;
      const dueTime = r.dueTimestamp || new Date(r.time).getTime();
      const diff = dueTime - now;

      // Update badge in DOM live
      const badge = $(`badge_${r.id}`);
      if (badge) {
        if (r.triggered || diff <= 0) {
          badge.textContent = 'ALARM / DUE!';
          badge.className = 'reminder-badge badge-alarm';
        } else {
          badge.textContent = formatRemainingDuration(diff);
        }
      }

      if (diff <= 0 && !r.triggered) {
        r.triggered = true;
        triggeredAny = true;
        playAlarmSound(r.sound || 'beep');
        vscode.postMessage({
          type: 'reminderNotification',
          task: r.task,
          details: r.details
        });
      }
    });

    if (triggeredAny) {
      vscode.postMessage({ type: 'saveReminders', reminders: reminders });
      renderReminders();
    }
  }, 1000);

  /* ============================================================
     8. GLOBAL MESSAGE LISTENER
     ============================================================ */
  window.addEventListener('message', (event) => {
    if (!event.data || typeof event.data !== 'object') return;

    if (event.data.type === 'setAsmaAudio') {
      asmaAudioPlayer.src = event.data.url;
      const chip = $('asmaAudioChip');
      if (chip) chip.textContent = `♫ ${event.data.title}`;
      const pickBtn = $('pickLocalAsmaBtn');
      if (pickBtn) {
        pickBtn.textContent = `📁 ${event.data.title}`;
        pickBtn.classList.add('active');
      }
      playRecitation();
      return;
    }

    if (event.data.type === 'updateNaats') {
      naats = event.data.items || [];
      if (currentNaatIndex >= naats.length) currentNaatIndex = -1;
      renderNaatPlaylist();
      return;
    }

    if (event.data.type === 'updateSongs') {
      songs = event.data.items || [];
      if (currentSongIndex >= songs.length) currentSongIndex = -1;
      renderSongPlaylist();
      return;
    }

    // YouTube iframe postMessages
    if (typeof event.data === 'string') {
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'infoDelivery' && data.info) {
          if (typeof data.info.currentTime === 'number' && asmaAudioPlayer.paused) {
            handleTimeTick(data.info.currentTime);
          }
        }
      } catch { /* Ignore */ }
    }
  });

  // Initial renders
  renderAyah();
  renderSpotlight(0, false);
  renderNamesList();
  renderNaatSpotlight(0, false);
  renderNaatPlaylist();
  renderSongSpotlight(0, false);
  renderSongPlaylist();
  updateTimeDisplay();
  renderReminders();
})();

