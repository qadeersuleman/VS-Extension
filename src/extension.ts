import * as vscode from 'vscode';
import * as path from 'path';

export interface MediaItem {
  id: string;
  title: string;
  url: string;
  fileName?: string;
  key?: string;
}

export interface ReminderItem {
  id: string;
  task: string;
  time: string; // ISO String or readable format
  dueTimestamp: number;
  details: string;
  sound?: string;
  createdAt: number;
  triggered: boolean;
  completed: boolean;
}

const DEFAULT_SONGS: MediaItem[] = [
  {
    id: 'song-1',
    title: 'Jaan Ban Gaye (Khuda Haafiz)',
    fileName: 'song-1.mp3',
    url: ''
  },
  {
    id: 'song-2',
    title: 'Noziya Karomatullo - Nago Nago',
    fileName: 'song-2.mp3',
    url: ''
  },
  {
    id: 'song-3',
    title: 'Wade Hin Nim Porhi Main Jawani (Tand Tanwar)',
    fileName: 'song-3.mp3',
    url: ''
  },
  {
    id: 'song-4',
    title: 'Unko Bhi Humse Mohabbat Ho (Sad Lofi)',
    fileName: 'song-4.mp3',
    url: ''
  },
  {
    id: 'song-5',
    title: 'Kaha Ho Tum Chaly Aao (Nayyara Noor)',
    fileName: 'song-5.mp3',
    url: ''
  }
];

const DEFAULT_NAATS: MediaItem[] = [
  {
    id: 'naat-1',
    title: 'Sakoon Paya 🤍 (Heart Touching Naat Sharif)',
    fileName: 'naat-1.mp3',
    url: ''
  },
  {
    id: 'naat-2',
    title: 'Main Akela Aur Masail (Ghulam Mustafa Qadri)',
    fileName: 'naat-2.mp3',
    url: ''
  },
  {
    id: 'naat-3',
    title: 'Main Akela Aur Masail Zindagi Ke Beshumar',
    fileName: 'naat-3.mp3',
    url: ''
  },
  {
    id: 'naat-4',
    title: 'Faslon Ko Takalluf Hai Humse Agar (Soulful Naat)',
    fileName: 'naat-4.mp3',
    url: ''
  }
];

class NoorViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'noor.sidebar';
  private view?: vscode.WebviewView;

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;

    // Collect all local roots from saved songs and naats
    const savedSongs = this.context.globalState.get<MediaItem[]>('noor.songs', DEFAULT_SONGS);
    const savedNaats = this.context.globalState.get<MediaItem[]>('noor.naats', DEFAULT_NAATS);
    const roots: vscode.Uri[] = [
      this.context.extensionUri,
      vscode.Uri.file(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? this.context.extensionPath)
    ];

    const checkRoots = (items: MediaItem[]) => {
      for (const item of items) {
        if (item.url && item.url.startsWith('file:')) {
          try {
            const parent = vscode.Uri.file(path.dirname(vscode.Uri.parse(item.url).fsPath));
            if (!roots.some(r => r.toString() === parent.toString())) roots.push(parent);
          } catch { /* ignore */ }
        }
      }
    };
    checkRoots(savedSongs);
    checkRoots(savedNaats);

    this.view.webview.options = { enableScripts: true, localResourceRoots: roots };
    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (message: any) => {
      if (!message || typeof message.type !== 'string') return;

      switch (message.type) {
        case 'openExternal':
          if (typeof message.url === 'string') {
            vscode.env.openExternal(vscode.Uri.parse(message.url));
          }
          break;

        case 'saveSongs':
          if (Array.isArray(message.items)) {
            await this.context.globalState.update('noor.songs', message.items);
          }
          break;

        case 'saveNaats':
          if (Array.isArray(message.items)) {
            await this.context.globalState.update('noor.naats', message.items);
          }
          break;

        case 'saveReminders':
          if (Array.isArray(message.reminders)) {
            await this.context.globalState.update('noor.reminders', message.reminders);
          }
          break;

        case 'reminderNotification': {
          const task = (message.task ?? 'Reminder').trim();
          const details = (message.details ?? '').trim();
          const detailStr = details ? `\nNote: ${details}` : '';
          vscode.window.showInformationMessage(
            `⏰ Qadeer Reminder: "${task}"${detailStr}`,
            'Acknowledge',
            'Open Qadeer'
          ).then(selection => {
            if (selection === 'Open Qadeer') {
              vscode.commands.executeCommand('noor.sidebar.focus');
            }
          });
          break;
        }
      }
    });
  }

  private toWebviewItems(webview: vscode.Webview, items: MediaItem[], defaults: MediaItem[]): MediaItem[] {
    return items.map(item => {
      const match = defaults.find(d => d.id === item.id);
      if (match && match.fileName) {
        const audioUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'audio', match.fileName)).toString();
        return { ...item, title: match.title, url: audioUri, fileName: match.fileName };
      }
      if (item.url && item.url.startsWith('file:')) {
        try {
          return { ...item, key: item.url, url: webview.asWebviewUri(vscode.Uri.parse(item.url)).toString() };
        } catch {
          return item;
        }
      }
      return item;
    });
  }

  private mergeWithDefaults(saved: MediaItem[], defaults: MediaItem[]): MediaItem[] {
    const custom = saved.filter(s => !defaults.some(d => d.id === s.id));
    return [...defaults, ...custom];
  }

  private getHtml(webview: vscode.Webview): string {
    const nonce = getNonce();
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'sidebar.js'));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'sidebar.css'));

    const rawSavedSongs = this.context.globalState.get<MediaItem[]>('noor.songs', DEFAULT_SONGS);
    const rawSavedNaats = this.context.globalState.get<MediaItem[]>('noor.naats', DEFAULT_NAATS);
    const rawReminders = this.context.globalState.get<ReminderItem[]>('noor.reminders', []);

    const mergedSongs = this.mergeWithDefaults(rawSavedSongs, DEFAULT_SONGS);
    const mergedNaats = this.mergeWithDefaults(rawSavedNaats, DEFAULT_NAATS);

    const songs = this.toWebviewItems(webview, mergedSongs, DEFAULT_SONGS);
    const naats = this.toWebviewItems(webview, mergedNaats, DEFAULT_NAATS);

    const csp = [
      `default-src 'none'`,
      `img-src ${webview.cspSource} https: data:`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `script-src 'nonce-${nonce}'`,
      `connect-src https: http:`,
      `media-src ${webview.cspSource} https: http: blob: data:`
    ].join('; ');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<link href="${styleUri}" rel="stylesheet">
<title>Qadeer — Islamic Companion</title>
</head>
<body>
  <header class="hero">
    <div class="brand-mark">☾</div>
    <div>
      <p class="eyebrow">PERSONAL ISLAMIC & FOCUS SPACE</p>
      <h1>Qadeer</h1>
      <p class="sub">Islamic Companion & Focus Space</p>
    </div>
  </header>

  <nav class="tabs" aria-label="Sections">
    <button class="tab active" data-tab="quran">Quran</button>
    <button class="tab" data-tab="names">99 Names</button>
    <button class="tab" data-tab="naats">Naats</button>
    <button class="tab" data-tab="songs">Songs</button>
    <button class="tab" data-tab="reminders">Reminders</button>
    <button class="tab" data-tab="azkar">Azkar</button>
  </nav>

  <main>
    <!-- 1. QURAN TAB -->
    <section id="quran" class="panel active">
      <div class="section-heading">
        <span>DAILY REFLECTION</span>
        <span class="pill" id="ayahCounter">Ayah 1 / 8</span>
      </div>
      <article class="verse-card">
        <p class="arabic" lang="ar" dir="rtl"></p>
        <p class="translation" lang="ur" dir="rtl"></p>
        <p class="reference"></p>
        
        <div class="audio-action-row">
          <button id="playArabicBtn" class="audio-btn arabic-btn" title="عربی تلاوت سنیں">
            <span class="btn-icon">🔊</span>
            <span class="btn-label">عربی تلاوت</span>
            <span class="sound-wave"><span></span><span></span><span></span></span>
          </button>
          <button id="playUrduBtn" class="audio-btn urdu-btn" title="اردو ترجمہ سنیں">
            <span class="btn-icon">🔊</span>
            <span class="btn-label">اردو ترجمہ</span>
            <span class="sound-wave"><span></span><span></span><span></span></span>
          </button>
        </div>
      </article>
      <div class="row-actions">
        <button id="prevAyah" class="button secondary">← Previous</button>
        <button id="nextAyah" class="button primary">Next →</button>
      </div>
      <audio id="quranAudio" preload="none" style="display:none;"></audio>
      <p class="muted tiny">Recitation audio by Mishary Rashid Alafasy & Urdu translation recitation via EveryAyah.</p>
    </section>

    <!-- 2. 99 NAMES TAB -->
    <section id="names" class="panel">
      <div class="section-heading">
        <span>ASMA-UL-HUSNA (99 NAMES)</span>
        <span class="pill" id="asmaCurrentBadge">#01 / 99</span>
      </div>

      <!-- Spotlight Hero Card with glowing animation -->
      <div class="spotlight-card" id="spotlightCard">
        <div class="spotlight-glow"></div>
        <div class="spotlight-header">
          <span class="spotlight-tag" id="spotlightTag">★ Recitation Spotlight</span>
          <span class="spotlight-index" id="spotlightIndex">01 / 99</span>
        </div>
        <div class="spotlight-arabic-wrapper">
          <div class="spotlight-arabic" id="spotlightArabic" dir="rtl">الرَّحْمَٰنُ</div>
        </div>
        <div class="spotlight-trans" id="spotlightTrans">Ar-Rahman</div>
        <div class="spotlight-urdu" id="spotlightUrdu" dir="rtl">نہایت مہربان، سب پر رحم فرمانے والا</div>
        <div class="spotlight-meaning" id="spotlightMeaning">The Entirely Merciful</div>

        <!-- Progress Timeline Bar -->
        <div class="progress-wrap">
          <div class="progress-bar-bg" id="asmaProgressContainer">
            <div class="progress-bar-fill" id="asmaProgressBar"></div>
          </div>
          <div class="progress-times">
            <span id="asmaCurrentTime">00:00</span>
            <span id="spotlightNext">Next: Ar-Raheem</span>
            <span id="asmaTotalTime">03:23</span>
          </div>
        </div>

        <!-- Interactive Playback Controls -->
        <div class="spotlight-controls">
          <button id="asmaPrevBtn" class="ctl-btn" title="Previous Name">⏮</button>
          <button id="asmaPlayBtn" class="ctl-btn play-main" title="Play / Pause Recitation">
            <span id="asmaPlayIcon">▶</span> <span id="asmaPlayText">Play Recitation</span>
          </button>
          <button id="asmaNextBtn" class="ctl-btn" title="Next Name">⏭</button>
        </div>

        <!-- Audio Source & Volume -->
        <div class="audio-status-row">
          <span class="audio-chip" id="asmaAudioChip">♫ Atif Aslam (Coke Studio)</span>
          <div class="vol-wrap">
            <span>🔊</span>
            <input type="range" id="asmaVolume" min="0" max="1" step="0.05" value="1" title="Volume">
          </div>
        </div>
      </div>

      <audio id="asmaAudioPlayer" preload="auto"></audio>

      <!-- Search & 99 Names Grid/List -->
      <input id="nameSearch" class="input" type="search" placeholder="Search 99 names (Arabic, English, Urdu)…" aria-label="Search Allah's names">
      
      <div class="list-heading">
        <span>ALL 99 NAMES · CLICK ANY TO JUMP</span>
      </div>
      <div id="namesList" class="list names-scroll-list"></div>
    </section>

    <!-- 3. NAATS TAB (Direct Local MP3 Audio) -->
    <section id="naats" class="panel">
      <div class="section-heading"><span>NAATS & NASHEEDS</span><span class="pill" id="naatCountBadge">4 Tracks</span></div>
      
      <!-- Audio Hero Card -->
      <div class="spotlight-card" id="naatPlayerCard">
        <div class="spotlight-glow"></div>
        <div class="spotlight-header">
          <span class="spotlight-tag">★ Naat Player</span>
          <span class="spotlight-index" id="naatIndexBadge">01 / 04</span>
        </div>
        
        <div class="player-hero-center">
          <div class="disc disc-lg" id="naatDisc">♫</div>
          <strong id="naatNowTitle" class="hero-player-title">Sakoon Paya 🤍 (Heart Touching Naat Sharif)</strong>
          <span id="naatPlayerStatus" class="hero-player-status">Ready to Play</span>
        </div>

        <!-- Progress Timeline Bar -->
        <div class="progress-wrap">
          <div class="progress-bar-bg" id="naatProgressContainer">
            <div class="progress-bar-fill" id="naatProgressBar"></div>
          </div>
          <div class="progress-times">
            <span id="naatCurrentTime">00:00</span>
            <span id="naatNextTitle">Next: Main Akela Aur Masail</span>
            <span id="naatTotalTime">05:42</span>
          </div>
        </div>

        <!-- Playback Controls -->
        <div class="spotlight-controls">
          <button id="naatPrevBtn" class="ctl-btn" title="Previous Naat">⏮</button>
          <button id="naatPlayBtn" class="ctl-btn play-main" title="Play / Pause Naat">
            <span id="naatPlayIcon">▶</span> <span id="naatPlayText">Play Naat</span>
          </button>
          <button id="naatNextBtn" class="ctl-btn" title="Next Naat">⏭</button>
        </div>

        <!-- Audio Source & Volume -->
        <div class="audio-status-row">
          <span class="audio-chip" id="naatAudioChip">♫ High Quality Audio</span>
          <div class="vol-wrap">
            <span>🔊</span>
            <input type="range" id="naatVolume" min="0" max="1" step="0.05" value="1" title="Volume">
          </div>
        </div>
      </div>

      <audio id="naatAudioPlayer" preload="auto"></audio>

      <div class="list-heading">
        <span>ALL NAATS · CLICK ANY TO PLAY</span>
      </div>
      <div id="naatPlaylist" class="list"></div>
    </section>

    <!-- 4. SONGS TAB (Direct Local MP3 Audio) -->
    <section id="songs" class="panel">
      <div class="section-heading"><span>SONGS & MUSIC</span><span class="pill" id="songCountBadge">5 Tracks</span></div>
      
      <!-- Audio Hero Card -->
      <div class="spotlight-card" id="songPlayerCard">
        <div class="spotlight-glow"></div>
        <div class="spotlight-header">
          <span class="spotlight-tag">★ Song Player</span>
          <span class="spotlight-index" id="songIndexBadge">01 / 05</span>
        </div>
        
        <div class="player-hero-center">
          <div class="disc disc-lg" id="songDisc">♪</div>
          <strong id="songNowTitle" class="hero-player-title">Jaan Ban Gaye (Khuda Haafiz)</strong>
          <span id="songPlayerStatus" class="hero-player-status">Ready to Play</span>
        </div>

        <!-- Progress Timeline Bar -->
        <div class="progress-wrap">
          <div class="progress-bar-bg" id="songProgressContainer">
            <div class="progress-bar-fill" id="songProgressBar"></div>
          </div>
          <div class="progress-times">
            <span id="songCurrentTime">00:00</span>
            <span id="songNextTitle">Next: Noziya Karomatullo</span>
            <span id="songTotalTime">03:42</span>
          </div>
        </div>

        <!-- Playback Controls -->
        <div class="spotlight-controls">
          <button id="songPrevBtn" class="ctl-btn" title="Previous Song">⏮</button>
          <button id="songPlayBtn" class="ctl-btn play-main" title="Play / Pause Song">
            <span id="songPlayIcon">▶</span> <span id="songPlayText">Play Song</span>
          </button>
          <button id="songNextBtn" class="ctl-btn" title="Next Song">⏭</button>
        </div>

        <!-- Audio Source & Volume -->
        <div class="audio-status-row">
          <span class="audio-chip" id="songAudioChip">♪ High Quality Audio</span>
          <div class="vol-wrap">
            <span>🔊</span>
            <input type="range" id="songVolume" min="0" max="1" step="0.05" value="1" title="Volume">
          </div>
        </div>
      </div>

      <audio id="songAudioPlayer" preload="auto"></audio>

      <div class="list-heading">
        <span>ALL SONGS · CLICK ANY TO PLAY</span>
      </div>
      <div id="songPlaylist" class="list"></div>
    </section>

    <!-- 5. REMINDERS & NOTES TAB (Super Simple 24h Time Addition) -->
    <section id="reminders" class="panel">
      <div class="section-heading">
        <span>REMINDERS & NOTES</span>
        <span class="pill" id="reminderCountBadge">0 Active</span>
      </div>

      <!-- Personalized Qadeer Focus Card -->
      <div class="personal-info-card">
        <p class="personal-greeting"><strong>Assalamu Alaikum, Qadeer!</strong></p>
        <p class="personal-text">Quick 24-hour focus timers for Namaz, coding milestones, and daily notes.</p>
        <div class="quick-preset-chips" id="quickTaskChips">
          <span class="chip-label">Quick Set:</span>
          <button type="button" class="preset-task-btn" data-task="🕌 Namaz Break" data-mins="15">🕌 Namaz Break</button>
          <button type="button" class="preset-task-btn" data-task="💻 Code Review" data-mins="30">💻 Code Review</button>
          <button type="button" class="preset-task-btn" data-task="🚀 Git Commit & Push" data-mins="45">🚀 Git Commit</button>
          <button type="button" class="preset-task-btn" data-task="💧 Drink Water & Stretch" data-mins="20">💧 Water Break</button>
          <button type="button" class="preset-task-btn" data-task="📿 Dhikr & Pause" data-mins="10">📿 Dhikr Pause</button>
        </div>
      </div>

      <!-- Reminder Form -->
      <div class="reminder-form-card">
        <div class="field-group">
          <label for="reminderTask"><strong>Task / Reminder Title *</strong></label>
          <input id="reminderTask" class="input" type="text" placeholder="e.g. Asr Namaz break, Git commit, Fix API bug…">
        </div>

        <div class="field-group">
          <div class="time-header-row">
            <label><strong>Alarm Countdown (Max 24h) *</strong></label>
            <span class="live-target-badge" id="liveTargetBadge">⏰ Rings in 15m</span>
          </div>

          <!-- Quick Time Addition Chips -->
          <div class="quick-chips" id="timeAddChips">
            <button type="button" class="chip-btn" data-set="5">+5m</button>
            <button type="button" class="chip-btn" data-set="10">+10m</button>
            <button type="button" class="chip-btn active" data-set="15">+15m</button>
            <button type="button" class="chip-btn" data-set="30">+30m</button>
            <button type="button" class="chip-btn" data-set="45">+45m</button>
            <button type="button" class="chip-btn" data-set="60">+1h</button>
            <button type="button" class="chip-btn" data-set="120">+2h</button>
            <button type="button" class="chip-btn" data-set="240">+4h</button>
            <button type="button" class="chip-btn" data-set="480">+8h</button>
            <button type="button" class="chip-btn" data-set="1440">+24h</button>
          </div>

          <!-- Stepper controller -->
          <div class="time-stepper-row">
            <button type="button" class="stepper-btn" id="minusTimeBtn" title="Subtract 5 minutes">− 5m</button>
            <div class="stepper-display">
              <input type="number" id="minutesInput" class="minutes-num-input" min="1" max="1440" value="15">
              <span class="stepper-unit">minutes</span>
            </div>
            <button type="button" class="stepper-btn" id="plusTimeBtn" title="Add 5 minutes">+ 5m</button>
            <button type="button" class="stepper-btn reset-btn" id="resetTimeBtn" title="Reset to 15m">Reset</button>
          </div>
        </div>

        <div class="field-group">
          <label for="reminderDetails"><strong>Personal Notes & Details (Optional)</strong></label>
          <textarea id="reminderDetails" class="input textarea" rows="2" placeholder="Write any notes, steps, links or details here…"></textarea>
        </div>

        <!-- Alarm Sound Selector -->
        <div class="sound-config-row">
          <div class="sound-picker-group">
            <label for="alarmSoundSelect"><strong>Alarm Sound:</strong></label>
            <select id="alarmSoundSelect" class="sound-select">
              <option value="beep" selected>⏰ Digital Beep</option>
              <option value="chime">🔔 Gentle Chime</option>
              <option value="bell">🎵 Soft Zen Bell</option>
              <option value="silent">🔕 Mute (Toast Only)</option>
            </select>
          </div>
          <button type="button" id="previewSoundBtn" class="btn-sm preview-btn" title="Listen to selected sound">▶ Test Sound</button>
        </div>

        <div class="row-actions" style="margin-top:14px;">
          <button id="addReminderBtn" class="button primary">＋ Set Reminder</button>
        </div>
      </div>

      <!-- Active Reminders -->
      <div class="list-heading">
        <span>ACTIVE REMINDERS (<span id="activeCount">0</span>)</span>
      </div>
      <div id="activeRemindersList" class="list"></div>

      <!-- Completed History -->
      <div class="list-heading" id="historyHeading" style="margin-top:16px;">
        <span>COMPLETED & HISTORY (<span id="historyCount">0</span>)</span>
      </div>
      <div id="historyRemindersList" class="list"></div>
    </section>

    <!-- 6. AZKAR TAB -->
    <section id="azkar" class="panel">
      <div class="section-heading"><span>REMEMBER ALLAH</span><span class="pill">Daily</span></div>
      <div id="azkarList" class="list"></div>
      <p class="muted tiny">Confirm Arabic text, transliteration, and translations with a trusted source before public distribution.</p>
    </section>
  </main>

  <footer><span class="status-dot"></span> Qadeer is ready · Take a peaceful pause</footer>

  <script nonce="${nonce}">
    window.initialNaats = ${JSON.stringify(naats).replace(/</g, '\\u003c')};
    window.initialSongs = ${JSON.stringify(songs).replace(/</g, '\\u003c')};
    window.initialReminders = ${JSON.stringify(rawReminders).replace(/</g, '\\u003c')};
  </script>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

export function activate(context: vscode.ExtensionContext): void {
  const provider = new NoorViewProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(NoorViewProvider.viewType, provider, {
      webviewOptions: { retainContextWhenHidden: true }
    }),
    vscode.commands.registerCommand('noor.openSidebar', () => vscode.commands.executeCommand('noor.sidebar.focus'))
  );
}

export function deactivate(): void {}
