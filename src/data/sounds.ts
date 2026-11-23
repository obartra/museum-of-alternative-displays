/**
 * The sound of a machine, where a recording of the real machine exists under an open licence. Each file was trimmed,
 * brought to an even loudness and converted for the web (docs/sound/REQUEST.md says where each came from). What a
 * recording is, is said in the language of the page: its words are the interface string `sound.<file stem>`.
 */
export interface Sound {
  /** In public/sounds/. */
  file: string;
  seconds: number;
  /** The recording as its page names it, who made it, its licence and its page. */
  title: string;
  by: string;
  licence: string;
  url: string;
}

export const sounds: Record<string, Sound[]> = {
  'split-flap': [
    { file: 'split-flap.mp3', seconds: 16, title: 'mab-bigboard-mono-lowcut.wav', by: 'mab', licence: 'CC BY 3.0', url: 'https://freesound.org/s/23025/' },
    { file: 'pragotron.mp3', seconds: 12, title: 'pragotron_split-flap-display.wav', by: 'matucha', licence: 'CC BY-NC 4.0', url: 'https://freesound.org/s/174056/' },
  ],
  'cathode-ray-tube': [
    { file: 'crt-on.mp3', seconds: 10, title: 'TV_CRT_PAL_TurnOn.wav', by: 'firefreak', licence: 'CC BY 3.0', url: 'https://freesound.org/s/65400/' },
    { file: 'crt-degauss.mp3', seconds: 30, title: 'Computer CRT monitor turn on/off/degauss', by: 'Sanderboah', licence: 'CC0', url: 'https://freesound.org/people/Sanderboah/sounds/838728/' },
  ],
  stereoscope: [
    { file: 'view-master.mp3', seconds: 15, title: 'View Master Sounds', by: 'PimJanssen', licence: 'CC0', url: 'https://freesound.org/people/PimJanssen/sounds/385893/' },
  ],
};
