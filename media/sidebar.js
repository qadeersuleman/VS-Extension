(() => {
  const vscode = acquireVsCodeApi();
  const $ = (id) => document.getElementById(id);

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
  let activeAyahAudioType = null; // 'arabic' | 'urdu' | null
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
    if (!quranAudio.paused) {
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

    // Stop naat or asma audio
    pauseRecitation();
    const naatAudio = $('audio');
    if (naatAudio && !naatAudio.paused) naatAudio.pause();

    const a = ayahs[ayahIndex];
    const url = type === 'arabic' ? a.arabicAudio : a.urduAudio;
    activeAyahAudioType = type;
    updateAyahAudioButtons();

    quranAudio.src = url;
    quranAudio.play().catch(() => {
      // If Urdu audio fails over network, try Web Speech API
      if (type === 'urdu' && ('speechSynthesis' in window)) {
        const utter = new SpeechSynthesisUtterance(a.urdu);
        utter.lang = 'ur-PK';
        utter.rate = 0.9;
        utter.onend = () => {
          activeAyahAudioType = null;
          updateAyahAudioButtons();
        };
        utter.onerror = () => {
          activeAyahAudioType = null;
          updateAyahAudioButtons();
        };
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
     2. NAVIGATION TABS
     ============================================================ */
  document.querySelectorAll('.tab').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b === button));
    document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === button.dataset.tab));
  }));

  /* ============================================================
     3. ASMA-UL-HUSNA (99 NAMES) WITH SYNCHRONIZED RECITATION
     ============================================================ */
  // Exact 99 names mapped with timestamps corresponding to Atif Aslam's Coke Studio recitation
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
    { id: 13, arabic: 'الْمُصَوِّرُ', trans: 'Al-Musawwir', en: 'The Fashioner of Forms', ur: 'ہر چیز کو صورت دینے والا', time: 44.0 },
    { id: 14, arabic: 'الْغَفَّارُ', trans: 'Al-Ghaffar', en: 'The Great Forgiver', ur: 'بہت زیادہ بخشنے والا', time: 45.6 },
    { id: 15, arabic: 'الْقَهَّارُ', trans: 'Al-Qahhar', en: 'The All-Subduer', ur: 'سب پر غالب و مسلط', time: 47.3 },
    { id: 16, arabic: 'الْوَهَّابُ', trans: 'Al-Wahhab', en: 'The Supreme Bestower', ur: 'بلا معاوضہ کثرت سے عطا کرنے والا', time: 48.9 },
    { id: 17, arabic: 'الرَّزَّاقُ', trans: 'Ar-Razzaq', en: 'The Total Provider', ur: 'تمام مخلوقات کو رزق دینے والا', time: 50.5 },
    { id: 18, arabic: 'الْفَتَّاحُ', trans: 'Al-Fattah', en: 'The Supreme Opener', ur: 'رحمت کے دروازے کھولنے والا', time: 52.1 },
    { id: 19, arabic: 'الْعَلِيمُ', trans: 'Al-Alim', en: 'The All-Knowing', ur: 'سب کچھ جاننے والا', time: 53.7 },
    { id: 20, arabic: 'الْقَابِضُ', trans: 'Al-Qabid', en: 'The Restrainer', ur: 'تنگ کرنے والا، قبض کرنے والا', time: 55.4 },
    { id: 21, arabic: 'الْبَاسِطُ', trans: 'Al-Basit', en: 'The Expander', ur: 'فراخی اور کشادگی دینے والا', time: 57.0 },
    { id: 22, arabic: 'الْخَافِضُ', trans: 'Al-Khafid', en: 'The Abaser', ur: 'سرکشوں کو پست کرنے والا', time: 58.6 },
    { id: 23, arabic: 'الرَّافِعُ', trans: 'Ar-Rafi’', en: 'The Exalter', ur: 'مرتبے بلند فرمانے والا', time: 60.2 },
    { id: 24, arabic: 'الْمُعِزُّ', trans: 'Al-Mu’izz', en: 'The Bestower of Honour', ur: 'عزت عطا کرنے والا', time: 61.8 },
    { id: 25, arabic: 'الْمُذِلُّ', trans: 'Al-Mudhill', en: 'The Dishonourer', ur: 'ذلت دینے والا', time: 63.5 },
    { id: 26, arabic: 'السَّمِيعُ', trans: 'As-Sami’', en: 'The All-Hearing', ur: 'ہر بات سننے والا', time: 65.1 },
    { id: 27, arabic: 'الْبَصِيرُ', trans: 'Al-Basir', en: 'The All-Seeing', ur: 'ہر چیز کو دیکھنے والا', time: 66.7 },
    { id: 28, arabic: 'الْحَكَمُ', trans: 'Al-Hakam', en: 'The Supreme Judge', ur: 'انصاف کا فیصلہ کرنے والا', time: 68.3 },
    { id: 29, arabic: 'الْعَدْلُ', trans: 'Al-Adl', en: 'The Utterly Just', ur: 'سراسر عدل و انصاف والا', time: 70.0 },
    { id: 30, arabic: 'اللَّطِيفُ', trans: 'Al-Latif', en: 'The Subtle / Kind', ur: 'باریک بین اور لطف و کرم والا', time: 71.6 },
    { id: 31, arabic: 'الْخَبِيرُ', trans: 'Al-Khabir', en: 'The All-Aware', ur: 'پوشیدہ باتوں سے باخبر', time: 73.2 },
    { id: 32, arabic: 'الْحَلِيمُ', trans: 'Al-Halim', en: 'The Most Forbearing', ur: 'بردبار، عجلت نہ کرنے والا', time: 74.8 },
    { id: 33, arabic: 'الْعَظِيمُ', trans: 'Al-Azim', en: 'The Magnificent', ur: 'بے انتہا عظمت والا', time: 76.5 },
    { id: 34, arabic: 'الْغَفُورُ', trans: 'Al-Ghafur', en: 'The Ever-Forgiving', ur: 'بہت زیادہ بخشش فرمانے والا', time: 78.1 },
    { id: 35, arabic: 'الشَّكُورُ', trans: 'Ash-Shakur', en: 'The Most Grateful', ur: 'تھوڑے عمل کی قدر کرنے والا', time: 79.7 },
    { id: 36, arabic: 'الْعَلِيُّ', trans: 'Al-Aliyy', en: 'The Most High', ur: 'سب سے بلند و برتر', time: 81.3 },
    { id: 37, arabic: 'الْكَبِيرُ', trans: 'Al-Kabir', en: 'The Greatest', ur: 'سب سے بڑا', time: 82.9 },
    { id: 38, arabic: 'الْحَفِيظُ', trans: 'Al-Hafiz', en: 'The Preserver', ur: 'ہر چیز کی حفاظت کرنے والا', time: 84.6 },
    { id: 39, arabic: 'الْمُقِيتُ', trans: 'Al-Muqit', en: 'The Sustainer', ur: 'سب کو روزی و توانائی دینے والا', time: 86.2 },
    { id: 40, arabic: 'الْحَسِيبُ', trans: 'Al-Hasib', en: 'The Reckoner', ur: 'کفایت کرنے والا، حساب لینے والا', time: 87.8 },
    { id: 41, arabic: 'الْجَلِيلُ', trans: 'Al-Jalil', en: 'The Majestic', ur: 'بزرگ اور جلیل القدر', time: 89.4 },
    { id: 42, arabic: 'الْكَرِيمُ', trans: 'Al-Karim', en: 'The Most Generous', ur: 'بے پایاں کرم اور سخاوت والا', time: 91.1 },
    { id: 43, arabic: 'الرَّقِيبُ', trans: 'Ar-Raqib', en: 'The Watchful', ur: 'ہر پل نگہبان', time: 92.7 },
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
    { id: 70, arabic: 'الْمُقْتَدِرُ', trans: 'Al-Muqtadir', en: 'The Supreme in Ability', ur: 'مقتدر اور غالب', time: 136.6 },
    { id: 71, arabic: 'الْمُقَدِّمُ', trans: 'Al-Muqaddim', en: 'The Advancer', ur: 'جسے چاہے آگے بڑھانے والا', time: 138.2 },
    { id: 72, arabic: 'الْمُؤَخِّرُ', trans: 'Al-Mu’akhkhir', en: 'The Delayer', ur: 'جسے چاہے پیچھے کرنے والا', time: 139.8 },
    { id: 73, arabic: 'الْأَوَّلُ', trans: 'Al-Awwal', en: 'The First', ur: 'سب سے پہلا، جس کی ابتدا نہیں', time: 141.5 },
    { id: 74, arabic: 'الْآخِرُ', trans: 'Al-Akhir', en: 'The Last', ur: 'سب کے بعد باقی رہنے والا', time: 143.1 },
    { id: 75, arabic: 'الظَّاهِرُ', trans: 'Az-Zahir', en: 'The Manifest', ur: 'اپنی قدرت سے ہر جگہ ظاہر', time: 144.7 },
    { id: 76, arabic: 'الْبَاطِنُ', trans: 'Al-Batin', en: 'The Hidden', ur: 'نگاہوں سے پوشیدہ', time: 146.3 },
    { id: 77, arabic: 'الْوَالِي', trans: 'Al-Wali', en: 'The Governor / Ruler', ur: 'تمام کائنات کا کارساز و مالک', time: 148.0 },
    { id: 78, arabic: 'الْمُتَعَالِي', trans: 'Al-Muta’ali', en: 'The Supreme Exalted', ur: 'انتہائی بلند اور عالی شان', time: 149.6 },
    { id: 79, arabic: 'الْبَرُّ', trans: 'Al-Barr', en: 'The Beneficent', ur: 'احسان اور نیکی فرمانے والا', time: 151.2 },
    { id: 80, arabic: 'التَّوَّابُ', trans: 'At-Tawwab', en: 'The Ever-Pardoning', ur: 'توبہ قبول فرمانے والا', time: 152.8 },
    { id: 81, arabic: 'الْمُنْتَقِمُ', trans: 'Al-Muntaqim', en: 'The Avenger', ur: 'سرکشوں اور ظالموں سے بدلہ لینے والا', time: 154.5 },
    { id: 82, arabic: 'الْعَفُوُّ', trans: 'Al-Afuww', en: 'The Pardoner', ur: 'گناہوں کو معاف فرمانے والا', time: 156.1 },
    { id: 83, arabic: 'الرَّؤُوفُ', trans: 'Ar-Ra’uf', en: 'The Most Compassionate', ur: 'انتہائی شفقت اور نرمی فرمانے والا', time: 157.7 },
    { id: 84, arabic: 'مَالِكُ الْمُلْكِ', trans: 'Malik-ul-Mulk', en: 'Owner of All Sovereignty', ur: 'سارے جہان کا حقیقی بادشاہ', time: 159.5 },
    { id: 85, arabic: 'ذُو الْجَلَالِ وَالْإِكْرَامِ', trans: 'Dhul-Jalali wal-Ikram', en: 'Lord of Majesty & Generosity', ur: 'جلال اور انعام و اکرام کا مالک', time: 162.0 },
    { id: 86, arabic: 'الْمُقْسِطُ', trans: 'Al-Muqsit', en: 'The Equitable / Just', ur: 'انصاف قائم فرمانے والا', time: 165.0 },
    { id: 87, arabic: 'الْجَامِعُ', trans: 'Al-Jami’', en: 'The Gatherer', ur: 'قیامت کے دن سب کو جمع کرنے والا', time: 167.0 },
    { id: 88, arabic: 'الْغَنِيُّ', trans: 'Al-Ghaniyy', en: 'The Self-Sufficient', ur: 'بے پروا اور بے نیاز', time: 169.0 },
    { id: 89, arabic: 'الْمُغْنِي', trans: 'Al-Mughni', en: 'The Enricher', ur: 'بے نیاز اور مالدار بنانے والا', time: 171.0 },
    { id: 90, arabic: 'الْمَانِعُ', trans: 'Al-Mani’', en: 'The Preventer / Defender', ur: 'نقصان سے روکنے والا', time: 173.0 },
    { id: 91, arabic: 'الضَّارُّ', trans: 'Ad-Darr', en: 'The Afflicter', ur: 'حکمت سے نقصان پہنچانے پر قادر', time: 175.0 },
    { id: 92, arabic: 'النَّافِعُ', trans: 'An-Nafi’', en: 'The Benefactor', ur: 'نفع اور بھلائی عطا کرنے والا', time: 177.0 },
    { id: 93, arabic: 'النُّورُ', trans: 'An-Nur', en: 'The Light', ur: 'تمام جہاں کو روشن فرمانے والا', time: 179.0 },
    { id: 94, arabic: 'الْهَادِي', trans: 'Al-Hadi', en: 'The Guide', ur: 'ہدایت اور سیدھی راہ دکھانے والا', time: 181.0 },
    { id: 95, arabic: 'الْبَدِيعُ', trans: 'Al-Badi’', en: 'The Incomparable Originator', ur: 'بغیر کسی نمونے کے کائنات بنانے والا', time: 183.0 },
    { id: 96, arabic: 'الْبَاقِي', trans: 'Al-Baqi', en: 'The Everlasting', ur: 'ہمیشہ باقی رہنے والا', time: 185.0 },
    { id: 97, arabic: 'الْوَارِثُ', trans: 'Al-Warith', en: 'The Ultimate Inheritor', ur: 'سب کے بعد باقی اور وارث رہنے والا', time: 187.0 },
    { id: 98, arabic: 'الرَّشِيدُ', trans: 'Ar-Rashid', en: 'The Guide to Right Path', ur: 'صحیح راہ پر چلانے والا', time: 189.0 },
    { id: 99, arabic: 'الصَّبُورُ', trans: 'As-Sabur', en: 'The Most Patient', ur: 'بے انتہا صبر اور تحمل فرمانے والا', time: 191.5 }
  ];

  const ATIF_ASLAM_AUDIO_URL = 'https://downloadthequran.com/wp-content/uploads/2021/02/99-Names-of-Allah-by-Atif-Aslam.mp3';
  const totalTrackDuration = 203; // ~3m 23s
  let currentAsmaIndex = 0;
  let currentRecitationTime = 0;
  const asmaAudioPlayer = $('asmaAudioPlayer');

  function formatTime(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m < 10 ? '0' : ''}${m}:${rem < 10 ? '0' : ''}${rem}`;
  }

  function renderSpotlight(index, triggerPulse = true) {
    if (index < 0 || index >= asmaNames.length) return;
    currentAsmaIndex = index;
    const item = asmaNames[index];
    const nextItem = asmaNames[(index + 1) % asmaNames.length];

    const arabicEl = $('spotlightArabic');
    arabicEl.textContent = item.arabic;
    if (triggerPulse) {
      arabicEl.classList.remove('pulse-anim');
      void arabicEl.offsetWidth; // re-flow
      arabicEl.classList.add('pulse-anim');
    }

    $('spotlightTrans').textContent = item.trans;
    $('spotlightUrdu').textContent = item.ur;
    $('spotlightMeaning').textContent = item.en;
    $('spotlightIndex').textContent = `${item.id < 10 ? '0' : ''}${item.id} / 99`;
    $('asmaCurrentBadge').textContent = `#${item.id < 10 ? '0' : ''}${item.id} / 99`;
    $('spotlightNext').textContent = `Next: ${nextItem.trans}`;

    // Update active highlight in list
    document.querySelectorAll('.name-item').forEach(el => {
      const match = Number(el.dataset.id) === item.id;
      el.classList.toggle('active-reciting', match);
      if (match) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  function renderNamesList(query = '') {
    const list = $('namesList');
    list.replaceChildren();
    const q = query.trim().toLowerCase();

    asmaNames.filter(n => {
      if (!q) return true;
      return n.arabic.includes(q) ||
             n.trans.toLowerCase().includes(q) ||
             n.en.toLowerCase().includes(q) ||
             n.ur.includes(q) ||
             String(n.id) === q;
    }).forEach(n => {
      const card = document.createElement('article');
      card.className = `list-item name-item${n.id === asmaNames[currentAsmaIndex].id ? ' active-reciting' : ''}`;
      card.dataset.id = n.id;

      const num = document.createElement('span');
      num.className = 'name-badge-num';
      num.textContent = `${n.id < 10 ? '0' : ''}${n.id}`;

      const arabic = document.createElement('div');
      arabic.className = 'name-arabic';
      arabic.dir = 'rtl';
      arabic.textContent = n.arabic;

      const copy = document.createElement('div');
      copy.className = 'name-copy';
      const title = document.createElement('strong');
      title.textContent = n.trans;
      const meaning = document.createElement('span');
      meaning.textContent = n.en;
      const urdu = document.createElement('p');
      urdu.lang = 'ur';
      urdu.dir = 'rtl';
      urdu.textContent = n.ur;
      copy.append(title, meaning, urdu);

      const jumpBtn = document.createElement('button');
      jumpBtn.className = 'name-jump-btn';
      jumpBtn.textContent = '▶';
      jumpBtn.title = `Jump to ${n.trans}`;

      card.append(num, arabic, copy, jumpBtn);
      card.addEventListener('click', () => jumpToName(n.id - 1));
      list.append(card);
    });
  }

  // Audio player initialization with official Atif Aslam track
  if (asmaAudioPlayer) {
    asmaAudioPlayer.src = ATIF_ASLAM_AUDIO_URL;
    asmaAudioPlayer.volume = 1.0;
    asmaAudioPlayer.preload = 'auto';

    asmaAudioPlayer.addEventListener('timeupdate', () => {
      handleTimeTick(asmaAudioPlayer.currentTime);
    });

    asmaAudioPlayer.addEventListener('play', () => {
      stopAyahAudio();
      const naatAudio = $('audio');
      if (naatAudio && !naatAudio.paused) naatAudio.pause();
      $('asmaPlayIcon').textContent = '⏸';
      $('asmaPlayText').textContent = 'Pause Recitation';
    });

    asmaAudioPlayer.addEventListener('pause', () => {
      $('asmaPlayIcon').textContent = '▶';
      $('asmaPlayText').textContent = 'Play Recitation';
    });

    asmaAudioPlayer.addEventListener('ended', () => {
      handleTimeTick(0);
      renderSpotlight(0, true);
      $('asmaPlayIcon').textContent = '▶';
      $('asmaPlayText').textContent = 'Play Recitation';
    });

    asmaAudioPlayer.addEventListener('error', () => {
      const hint = $('ytHint');
      if (hint) {
        hint.innerHTML = '⚠️ Audio stream connect nahi ho saka. <strong>📁 Choose Local MP3</strong> dabakar downloaded audio select karein!';
      }
    });
  }

  // Volume slider
  const asmaVolume = $('asmaVolume');
  if (asmaVolume && asmaAudioPlayer) {
    asmaVolume.addEventListener('input', (e) => {
      asmaAudioPlayer.volume = parseFloat(e.target.value);
    });
  }

  function sendYtCommand(func, args = []) {
    const iframe = $('asmaYtIframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: func,
        args: args
      }), '*');
    }
  }

  function handleTimeTick(timeSec) {
    currentRecitationTime = timeSec;
    $('asmaCurrentTime').textContent = formatTime(timeSec);
    const pct = Math.min(100, Math.max(0, (timeSec / totalTrackDuration) * 100));
    $('asmaProgressBar').style.width = `${pct}%`;

    // Find current active name based on timestamp
    if (timeSec >= asmaNames[0].time) {
      let matchedIndex = 0;
      for (let i = 0; i < asmaNames.length; i++) {
        if (timeSec >= asmaNames[i].time) {
          matchedIndex = i;
        } else {
          break;
        }
      }
      if (matchedIndex !== currentAsmaIndex) {
        renderSpotlight(matchedIndex, true);
      }
    } else {
      // Still in intro (0 to 24s)
      $('spotlightNext').textContent = 'Intro: Bismillah & Azan…';
    }

    if (timeSec >= totalTrackDuration) {
      pauseRecitation();
    }
  }

  function playRecitation() {
    stopAyahAudio();
    const naatAudio = $('audio');
    if (naatAudio && !naatAudio.paused) naatAudio.pause();

    if (!asmaAudioPlayer.src) {
      asmaAudioPlayer.src = ATIF_ASLAM_AUDIO_URL;
    }

    asmaAudioPlayer.play().then(() => {
      $('asmaPlayIcon').textContent = '⏸';
      $('asmaPlayText').textContent = 'Pause Recitation';
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

    handleTimeTick(targetTime);
    if (asmaAudioPlayer.paused) {
      playRecitation();
    }
  }

  $('asmaPlayBtn').addEventListener('click', () => {
    if (asmaAudioPlayer && !asmaAudioPlayer.paused) {
      pauseRecitation();
    } else {
      playRecitation();
    }
  });

  $('asmaNextBtn').addEventListener('click', () => {
    jumpToName((currentAsmaIndex + 1) % asmaNames.length);
  });

  $('asmaPrevBtn').addEventListener('click', () => {
    jumpToName((currentAsmaIndex + asmaNames.length - 1) % asmaNames.length);
  });

  // Seek bar click
  $('asmaProgressContainer').addEventListener('click', (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const seekTime = ratio * totalTrackDuration;
    currentRecitationTime = seekTime;
    if (!asmaAudioPlayer.src) {
      asmaAudioPlayer.src = ATIF_ASLAM_AUDIO_URL;
    }
    asmaAudioPlayer.currentTime = seekTime;
    sendYtCommand('seekTo', [seekTime, true]);
    handleTimeTick(seekTime);
  });

  // Toggle YouTube player visibility
  $('toggleYtBtn').addEventListener('click', () => {
    const c = $('ytContainer');
    c.classList.toggle('collapsed');
    $('toggleYtBtn').classList.toggle('active', !c.classList.contains('collapsed'));
  });

  // Open YouTube in external browser
  $('openYtExternalBtn').addEventListener('click', () => {
    vscode.postMessage({
      type: 'openExternal',
      url: 'https://youtu.be/lgm3puP3tMA?si=5iepsD_e4Gffk0Rq'
    });
  });

  // Select local MP3 audio
  $('pickLocalAsmaBtn').addEventListener('click', () => {
    vscode.postMessage({ type: 'pickAsmaAudio' });
  });

  $('nameSearch').addEventListener('input', e => renderNamesList(e.target.value));

  // Listen for extension & audio events
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'setAsmaAudio') {
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

    if (event.data?.type === 'playlist') {
      playlist = event.data.items || [];
      if (currentIndex >= playlist.length) currentIndex = -1;
      renderPlaylist();
      return;
    }

    // YouTube iframe postMessages if user plays YouTube video directly
    if (typeof event.data === 'string') {
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'infoDelivery' && data.info) {
          if (typeof data.info.currentTime === 'number' && asmaAudioPlayer.paused) {
            handleTimeTick(data.info.currentTime);
          }
        }
      } catch { /* Ignore non-JSON postMessages */ }
    }
  });

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
     5. NAATS AUDIO PLAYLIST
     ============================================================ */
  let playlist = Array.isArray(window.initialPlaylist) ? window.initialPlaylist : [];
  let currentIndex = -1;
  const audio = $('audio');

  function renderPlaylist() {
    const list = $('playlist');
    list.replaceChildren();
    if (!playlist.length) {
      const empty = document.createElement('p');
      empty.className = 'muted empty';
      empty.textContent = 'Your playlist is empty. Add an online URL or choose local audio files.';
      list.append(empty);
      return;
    }
    playlist.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'list-item playlist-item';
      const play = document.createElement('button');
      play.className = 'play-button';
      play.textContent = index === currentIndex && !audio.paused ? 'Ⅱ' : '▶';
      play.setAttribute('aria-label', 'Play ' + item.title);
      play.addEventListener('click', () => playItem(index));
      const title = document.createElement('span');
      title.className = 'playlist-title';
      title.textContent = item.title;
      const remove = document.createElement('button');
      remove.className = 'remove-button';
      remove.textContent = '×';
      remove.title = 'Remove from playlist';
      remove.addEventListener('click', () => {
        playlist = playlist.filter((_, i) => i !== index);
        vscode.postMessage({ type: 'removeAudio', url: item.key || item.url });
        if (currentIndex === index) {
          audio.pause();
          audio.removeAttribute('src');
          currentIndex = -1;
          $('nowTitle').textContent = 'Choose a Naat';
        } else if (currentIndex > index) {
          currentIndex--;
        }
        renderPlaylist();
      });
      row.append(play, title, remove);
      list.append(row);
    });
  }

  function playItem(index) {
    const item = playlist[index];
    if (!item) return;

    // Pause other audios
    stopAyahAudio();
    pauseRecitation();

    currentIndex = index;
    audio.src = item.url;
    $('nowTitle').textContent = item.title;
    $('playerStatus').textContent = 'Now selected';
    audio.play().then(() => renderPlaylist()).catch(() => {
      $('playerStatus').textContent = 'Could not play. Check URL/file permissions.';
      renderPlaylist();
    });
  }

  $('addOnline').addEventListener('click', () => {
    vscode.postMessage({ type: 'addOnlineAudio', title: $('onlineTitle').value, url: $('onlineUrl').value });
    $('onlineTitle').value = '';
    $('onlineUrl').value = '';
  });
  $('addLocal').addEventListener('click', () => vscode.postMessage({ type: 'addLocalAudio' }));
  audio.addEventListener('ended', () => {
    if (currentIndex >= 0 && currentIndex < playlist.length - 1) playItem(currentIndex + 1);
  });
  audio.addEventListener('play', renderPlaylist);
  audio.addEventListener('pause', renderPlaylist);

  // Initial render
  renderAyah();
  renderSpotlight(0, false);
  renderNamesList();
  renderPlaylist();
})();
