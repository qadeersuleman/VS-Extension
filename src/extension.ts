import * as vscode from 'vscode';

interface AudioItem {
  title: string;
  url: string;
  key?: string;
}

class NoorViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'noor.sidebar';
  private view?: vscode.WebviewView;

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    const savedItems = this.context.globalState.get<AudioItem[]>('noor.audioItems', []);
    const roots: vscode.Uri[] = [this.context.extensionUri, vscode.Uri.file(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? this.context.extensionPath)];
    for (const item of savedItems) {
      if (item.url.startsWith('file:')) {
        try {
          const parent = vscode.Uri.file(require('path').dirname(vscode.Uri.parse(item.url).fsPath));
          if (!roots.some(root => root.toString() === parent.toString())) roots.push(parent);
        } catch { /* Ignore invalid stale local file entries. */ }
      }
    }
    this.view.webview.options = { enableScripts: true, localResourceRoots: roots };
    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (message: { type: string; title?: string; url?: string }) => {
      if (message.type === 'addLocalAudio') {
        await this.addLocalAudio();
      } else if (message.type === 'pickAsmaAudio') {
        await this.pickAsmaAudio();
      } else if (message.type === 'openExternal' && typeof message.url === 'string') {
        vscode.env.openExternal(vscode.Uri.parse(message.url));
      } else if (message.type === 'addOnlineAudio') {
        const title = (message.title ?? '').trim();
        const url = (message.url ?? '').trim();
        if (!title || !url) {
          vscode.window.showWarningMessage('Please enter both a title and an audio URL.');
          return;
        }
        try {
          const parsed = new URL(url);
          if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Only HTTP/HTTPS URLs are supported.');
        } catch {
          vscode.window.showErrorMessage('Please enter a valid http:// or https:// audio URL.');
          return;
        }
        const items = this.context.globalState.get<AudioItem[]>('noor.audioItems', []);
        items.push({ title, url });
        await this.context.globalState.update('noor.audioItems', items);
        this.refreshPlaylist();
        vscode.window.showInformationMessage(`Added "${title}" to Noor playlist.`);
      } else if (message.type === 'removeAudio' && typeof message.url === 'string') {
        const items = this.context.globalState.get<AudioItem[]>('noor.audioItems', []);
        await this.context.globalState.update('noor.audioItems', items.filter(item => item.url !== message.url));
        this.refreshPlaylist();
      }
    });
  }

  public async pickAsmaAudio(): Promise<void> {
    const selected = await vscode.window.showOpenDialog({
      canSelectMany: false,
      openLabel: 'Select Asma-ul-Husna Audio (MP3)',
      filters: { 'Audio files': ['mp3', 'wav', 'ogg', 'm4a', 'aac'] }
    });
    if (!selected?.length) return;
    const uri = selected[0];
    const parent = vscode.Uri.file(require('path').dirname(uri.fsPath));
    const existingRoots = this.view?.webview.options.localResourceRoots ?? [this.context.extensionUri];
    const roots = [...existingRoots];
    if (!roots.some(r => r.toString() === parent.toString())) {
      roots.push(parent);
      if (this.view) this.view.webview.options = { ...this.view.webview.options, localResourceRoots: roots };
    }
    const webviewUri = this.view?.webview.asWebviewUri(uri).toString();
    this.view?.webview.postMessage({
      type: 'setAsmaAudio',
      url: webviewUri,
      title: uri.path.split('/').pop() ?? 'Local Audio'
    });
    vscode.window.showInformationMessage(`Loaded Asma-ul-Husna audio: ${uri.path.split('/').pop()}`);
  }

  private async addLocalAudio(): Promise<void> {
    const selected = await vscode.window.showOpenDialog({
      canSelectMany: true,
      openLabel: 'Add MP3 audio',
      filters: { 'Audio files': ['mp3', 'wav', 'ogg', 'm4a', 'aac'] }
    });
    if (!selected?.length) return;

    const items = this.context.globalState.get<AudioItem[]>('noor.audioItems', []);
    const existingRoots = this.view?.webview.options.localResourceRoots ?? [this.context.extensionUri];
    const roots = [...existingRoots];
    for (const uri of selected) {
      const title = uri.path.split('/').pop() ?? 'Local audio';
      const url = uri.toString();
      const parent = vscode.Uri.file(require('path').dirname(uri.fsPath));
      if (!roots.some(root => root.toString() === parent.toString())) roots.push(parent);
      if (!items.some(item => item.url === url)) items.push({ title, url });
    }
    if (this.view) this.view.webview.options = { ...this.view.webview.options, localResourceRoots: roots };
    await this.context.globalState.update('noor.audioItems', items);
    this.refreshPlaylist();
    vscode.window.showInformationMessage(`Added ${selected.length} audio file(s) to Noor playlist.`);
  }

  public async pickLocalAudio(): Promise<void> {
    await this.addLocalAudio();
  }

  private toWebviewItems(webview: vscode.Webview): AudioItem[] {
    const items = this.context.globalState.get<AudioItem[]>('noor.audioItems', []);
    return items.map(item => {
      if (item.url.startsWith('file:')) {
        try {
          return { ...item, key: item.url, url: webview.asWebviewUri(vscode.Uri.parse(item.url)).toString() };
        } catch {
          return item;
        }
      }
      return item;
    });
  }

  private refreshPlaylist(): void {
    if (!this.view) return;
    this.view.webview.postMessage({
      type: 'playlist',
      items: this.toWebviewItems(this.view.webview)
    });
  }

  private getHtml(webview: vscode.Webview): string {
    const nonce = getNonce();
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'sidebar.js'));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'sidebar.css'));
    const items = this.toWebviewItems(webview);
    const csp = [
      `default-src 'none'`,
      `img-src ${webview.cspSource} https: data:`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `script-src 'nonce-${nonce}' https://www.youtube.com https://s.ytimg.com`,
      `frame-src https://www.youtube.com https://www.youtube-nocookie.com`,
      `connect-src https: http:`,
      `media-src ${webview.cspSource} https: http: blob:`
    ].join('; ');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<link href="${styleUri}" rel="stylesheet">
<title>Noor Islamic Companion</title>
</head>
<body>
  <header class="hero">
    <div class="brand-mark">☾</div>
    <div><p class="eyebrow">YOUR PEACEFUL CODING SPACE</p><h1>Noor</h1><p class="sub">Islamic Companion</p></div>
  </header>

  <nav class="tabs" aria-label="Sections">
    <button class="tab active" data-tab="quran">Quran</button>
    <button class="tab" data-tab="names">99 Names</button>
    <button class="tab" data-tab="naats">Naats</button>
    <button class="tab" data-tab="azkar">Azkar</button>
  </nav>

  <main>
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
          <button id="asmaPrevBtn" class="ctl-btn" title="Previous Name (پچھلا نام)">⏮</button>
          <button id="asmaPlayBtn" class="ctl-btn play-main" title="Play / Pause Recitation">
            <span id="asmaPlayIcon">▶</span> <span id="asmaPlayText">Play Recitation</span>
          </button>
          <button id="asmaNextBtn" class="ctl-btn" title="Next Name (اگلا نام)">⏭</button>
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

      <!-- Media & Sync Options Bar -->
      <div class="media-toggle-bar">
        <button id="pickLocalAsmaBtn" class="toggle-pill" title="Select Local MP3 Audio">📁 Choose Local MP3</button>
        <button id="toggleYtBtn" class="toggle-pill" title="Toggle YouTube Player">🎬 YouTube Video</button>
        <button id="openYtExternalBtn" class="toggle-pill yt-external" title="Open YouTube in Browser">↗ YouTube.com</button>
      </div>

      <!-- YouTube Embed Container -->
      <div id="ytContainer" class="yt-container collapsed">
        <iframe id="asmaYtIframe" 
                src="https://www.youtube.com/embed/lgm3puP3tMA?enablejsapi=1&playsinline=1"
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowfullscreen>
        </iframe>
      </div>
      <p class="muted tiny yt-hint" id="ytHint">▶ <strong>Play Recitation</strong> dabayein — Atif Aslam ki official Coke Studio recitation play ho jayegi aur 99 names audio ke saath step-by-step sync honge!</p>
      <audio id="asmaAudioPlayer" preload="auto"></audio>

      <!-- Search & 99 Names Grid/List -->
      <input id="nameSearch" class="input" type="search" placeholder="Search 99 names (Arabic, English, Urdu)…" aria-label="Search Allah's names">
      
      <div class="list-heading">
        <span>ALL 99 NAMES · CLICK ANY TO JUMP</span>
      </div>
      <div id="namesList" class="list names-scroll-list"></div>
    </section>

    <section id="naats" class="panel">
      <div class="section-heading"><span>YOUR AUDIO LIBRARY</span><span class="pill">Playlist</span></div>
      <div class="player-card">
        <div class="disc">♫</div>
        <div class="player-title"><strong id="nowTitle">Choose a Naat</strong><span id="playerStatus">Online URL or local audio</span></div>
        <audio id="audio" controls preload="none"></audio>
      </div>
      <div class="row-actions">
        <button id="addOnline" class="button primary">＋ Online URL</button>
        <button id="addLocal" class="button secondary">＋ Local MP3</button>
      </div>
      <div class="field-group">
        <label for="onlineTitle">Audio title</label>
        <input id="onlineTitle" class="input" placeholder="e.g. My favourite Naat">
        <label for="onlineUrl">Direct audio URL</label>
        <input id="onlineUrl" class="input" placeholder="https://example.com/audio.mp3">
        <p class="muted tiny">Use a direct audio-file URL that permits playback. Video-page URLs (such as ordinary YouTube watch links) will not work as audio sources.</p>
      </div>
      <div id="playlist" class="list"></div>
    </section>

    <section id="azkar" class="panel">
      <div class="section-heading"><span>REMEMBER ALLAH</span><span class="pill">Daily</span></div>
      <div id="azkarList" class="list"></div>
      <p class="muted tiny">Confirm Arabic text, transliteration, and translations with a trusted source before public distribution.</p>
    </section>
  </main>
  <footer><span class="status-dot"></span> Noor is ready · Take a peaceful pause</footer>
  <script nonce="${nonce}">window.initialPlaylist = ${JSON.stringify(items).replace(/</g, '\\u003c')};</script>
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
    vscode.window.registerWebviewViewProvider(NoorViewProvider.viewType, provider, { webviewOptions: { retainContextWhenHidden: true } }),
    vscode.commands.registerCommand('noor.addLocalAudio', () => provider.pickLocalAudio()),
    vscode.commands.registerCommand('noor.openSidebar', () => vscode.commands.executeCommand('noor.sidebar.focus'))
  );
}

export function deactivate(): void {}
