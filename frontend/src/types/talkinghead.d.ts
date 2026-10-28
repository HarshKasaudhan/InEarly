declare module '@met4citizen/talkinghead' {
  export interface TalkingHeadOptions {
    cameraView?: 'head' | 'upper' | 'full';
    cameraDistance?: number;
    cameraX?: number;
    cameraY?: number;
    cameraRotateEnable?: boolean;
    cameraPanEnable?: boolean;
    cameraZoomEnable?: boolean;
    avatarMood?: string;
    avatarMute?: boolean;
    avatarSpeakingEyeContact?: number;
    avatarIdleEyeContact?: number;
    avatarSpeakingHeadMove?: number;
    lipsyncModules?: string[];
    lipsyncLang?: string;
    modelFPS?: number;
    modelRoot?: string;
    lightAmbientColor?: number;
    lightAmbientIntensity?: number;
    lightDirectColor?: number;
    lightDirectIntensity?: number;
    statsNode?: HTMLElement | null;
    [key: string]: unknown;
  }

  export interface AvatarConfig {
    url: string;
    body?: 'M' | 'F';
    avatarMood?: string;
    lipsyncLang?: string;
    ttsLang?: string;
    ttsVoice?: string;
    ttsRate?: number;
    ttsPitch?: number;
    ttsVolume?: number;
    baseline?: Record<string, number>;
    [key: string]: unknown;
  }

  export interface SpeakAudioPayload {
    audio?: AudioBuffer;
    words?: string[];
    wtimes?: number[];
    wdurations?: number[];
    visemes?: string[];
    vtimes?: number[];
    vdurations?: number[];
    markers?: Array<() => void>;
    mtimes?: number[];
    anim?: { name: string; [key: string]: unknown };
  }

  export class TalkingHead {
    constructor(node: HTMLElement, options?: TalkingHeadOptions);
    audioCtx: AudioContext;
    showAvatar(avatar: AvatarConfig, onprogress?: (url: string, event: { loaded: number; total: number; lengthComputable: boolean }) => void): Promise<void>;
    speakText(text: string, opt?: Record<string, unknown>, onsubtitles?: (s: string) => void): void;
    speakAudio(payload: SpeakAudioPayload, opt?: Record<string, unknown>, onsubtitles?: (s: string) => void): void;
    speakWithHands(): void;
    lookAtCamera(durationMs?: number): void;
    lookAhead(durationMs?: number): void;
    setMood(mood: string): void;
    setView(view: 'head' | 'upper' | 'full'): void;
    startSpeaking(force?: boolean): void;
    stopSpeaking(): void;
    resetLips(): void;
    start(): void;
    stop(): void;
    startListening(): void;
    stopListening(): void;
    onResize(): void;
    dispose(): void;
  }
}
