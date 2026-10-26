# Qadeer — Islamic Companion & Focus Space for VS Code

A peaceful, personalized Islamic companion and productivity workspace crafted for **Qadeer**, integrated directly into Visual Studio Code.

---

## 🌟 Key Features

### 1. 📖 Daily Quran Reflections
- Beautiful Arabic typography with authentic Urdu translations.
- Instant recitation audio by **Mishary Rashid Alafasy** & Urdu translation recitation via EveryAyah.
- Previous / Next Ayah navigation.

### 2. 🌟 Asma-ul-Husna (99 Names of Allah)
- Complete list of all 99 Names of Allah with Arabic, English transliteration, Urdu translation, and English meaning.
- High-definition official recitation by **Atif Aslam (Coke Studio)** with precision second-by-second sync.
- Interactive timeline scrubber, volume control, and instant search filter.

### 3. 🕊️ Naats & Nasheeds (Built-in MP3 Audio)
- Pre-installed high-quality audio tracks (100% native offline MP3, zero external browser tabs or YouTube errors):
  1. **Sakoon Paya 🤍** *(Heart Touching Naat Sharif)*
  2. **Main Akela Aur Masail** *(Ghulam Mustafa Qadri)*
  3. **Main Akela Aur Masail Zindagi Ke Beshumar**
  4. **Faslon Ko Takalluf Hai Humse Agar** *(Soulful Naat)*
- Vinyl disc rotation animation, seek bar, previous/next, and auto-advance.

### 4. 🎵 Songs & Focus Music (Built-in MP3 Audio)
- Pre-installed high-quality audio tracks (100% native offline MP3):
  1. **Jaan Ban Gaye** *(Khuda Haafiz)*
  2. **Noziya Karomatullo - Nago Nago**
  3. **Wade Hin Nim Porhi Main Jawani** *(Tand Tanwar)*
  4. **Unko Bhi Humse Mohabbat Ho** *(Sad Lofi)*
  5. **Kaha Ho Tum Chaly Aao** *(Nayyara Noor)*

### 5. ⏰ 24-Hour Focus Reminders & Notes
- Simple, lightning-fast **time addition** on top of the current time (supported up to 24 hours).
- Quick 1-click preset chips for Qadeer: `🕌 Namaz Break`, `💻 Code Review`, `🚀 Git Commit`, `💧 Water Break`, `📿 Dhikr Pause`.
- Quick countdown increments: `+5m`, `+10m`, `+15m`, `+30m`, `+45m`, `+1h`, `+2h`, `+4h`, `+8h`, `+24h` with a live target preview (e.g. `⏰ Rings in 15m (11:15 PM)`).
- **Customizable Alarm Sounds** synthesized via Web Audio API:
  - ⏰ Digital Beep (Classic double-pulse alarm)
  - 🔔 Gentle Chime (Warm arpeggiated melodic chime)
  - 🎵 Soft Zen Bell (Meditative singing bowl bell with smooth decay)
  - 🔕 Mute (Silent visual notification only)
- **Native Bottom-Right Toast Notifications**: When the timer finishes, a native VS Code toast popup appears in the bottom-right corner with direct actions (`Acknowledge`, `Open Qadeer`).

### 6. 📿 Daily Azkar
- Essential daily adhkar: Tasbeeh, Shukr, Takbeer, Istighfar, Tawheed, Tawakkul, and Du'a with translations.

---

## 🚀 Development & Build

### Run in Debug Mode:
1. Open the project in VS Code.
2. Run `npm install` and `npm run compile`.
3. Press `F5` to open the **Extension Development Host**.
4. Click the **Qadeer** moon icon (`☾`) in the Activity Bar.

### Package VSIX:
```bash
npm run compile
npx vsce package
```
