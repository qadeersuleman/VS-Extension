# Noor — Islamic Companion for VS Code

A starter VS Code extension with a sidebar for Quran ayat, selected Asma-ul-Husna entries, daily azkar, and a personal audio playlist that accepts direct online audio URLs and local audio files.

## Requirements

- Node.js (LTS) and npm
- Visual Studio Code
- Internet connection only for online audio URLs

## Run from source

1. Extract the project folder and open it in VS Code.
2. Open the integrated terminal in the project folder.
3. Run:

   ```bash
   npm install
   npm run compile
   ```

4. Press `F5`. VS Code opens an **Extension Development Host** window.
5. Click the **Noor** moon icon in the Activity Bar to open the sidebar.
6. Open **Naats**:
   - Enter a title and a direct audio URL, then click **Online URL**.
   - Or click **Local MP3** and select one or more local audio files.
   - Use the audio player's controls to play/pause/seek. The next item starts when the current track ends.

## Build an installable VSIX

```bash
npm install
npm run compile
npx vsce package
```

This creates `noor-islamic-companion-0.1.0.vsix` in the project directory. In VS Code, open Extensions (`Ctrl+Shift+X`), select the `...` menu, choose **Install from VSIX...**, and select the file.

You can also install from the terminal:

```bash
code --install-extension noor-islamic-companion-0.1.0.vsix
```

## Important notes

- The Quran section contains a few starter ayat and Urdu meanings; verify every verse reference and translation with a trusted source before publishing.
- The names section intentionally contains selected sample entries, not the full 99. Add a verified complete dataset before calling this release complete.
- The azkar list is a small starter sample. Verify Arabic spelling, transliteration, meanings, and any claimed virtues/counts with trusted references.
- Online playback requires a **direct audio URL** accessible from the webview. A normal YouTube watch page is not a direct audio URL and won't work here. Some hosts block playback via CORS, hotlink rules, authentication, or unsupported formats.
- Local audio is selected through VS Code's file picker. Files are not uploaded to any server. VS Code may require permission to access files outside the workspace.
- Playlist entries are stored in VS Code extension global state on the current device/profile. This starter does not sync playlists between devices.
- This extension does not include audio recordings or copyrighted naats. Add only audio you own or have permission to use.
- The `noor.addLocalAudio` command currently focuses the sidebar; use the **Local MP3** button in the sidebar to open the file picker.
- Arabic font availability depends on your operating system. Install a readable Arabic font if glyphs appear disconnected.
- This is a working starter, not yet a fully verified religious reference app. Do not publish religious data without review.
