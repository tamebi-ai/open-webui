import { APP_NAME } from '$lib/constants';
import { type Writable, writable } from 'svelte/store';
import type { ModelConfig } from '$lib/apis';
import type { Banner } from '$lib/types';
import type { Socket } from 'socket.io-client';

import emojiShortCodes from '$lib/emoji-shortcodes.json';

// Backend
export const WEBUI_NAME = writable(APP_NAME);
export const config: Writable<Config | undefined> = writable(undefined);
export const user: Writable<SessionUser | undefined> = writable(undefined);

// Electron App
export const isApp = writable(false);
export const appInfo = writable(null);
export const appData = writable(null);

// Frontend
export const MODEL_DOWNLOAD_POOL = writable({});

export const mobile = writable(false);

export const socket: Writable<null | Socket> = writable(null);
export const activeUserIds: Writable<null | string[]> = writable(null);
export const USAGE_POOL: Writable<null | string[]> = writable(null);

export const theme = writable('system');

export const shortCodesToEmojis = writable(
	Object.entries(emojiShortCodes).reduce((acc: Record<string, string>, [key, value]) => {
		if (typeof value === 'string') {
			acc[value] = key;
		} else {
			for (const v of value) {
				acc[v] = key;
			}
		}

		return acc;
	}, {})
);

export const TTSWorker = writable(null);

export const chatId = writable('');
export const chatTitle = writable('');

export const channels = writable([]);
export const chats = writable(null);
export const pinnedChats = writable([]);
export const tags = writable([]);

export const models: Writable<Model[]> = writable([]);

export const prompts: Writable<null | Prompt[]> = writable(null);
export const knowledge: Writable<null | Document[]> = writable(null);
export const tools = writable(null);
export const functions = writable(null);

export const toolServers = writable([]);

export const banners: Writable<Banner[]> = writable([]);

// Valeurs par défaut pour tous les utilisateurs (masquées dans l'interface)
const defaultSettings: Settings = {
	// Paramètres d'interface
	highContrastMode: true,
	landingPageMode: 'chat',
	chatBubble: true,
	chatDirection: 'auto',
	widescreenMode: false,
	splitLargeChunks: false,
	scrollOnBranchChange: true,
	showUsername: false,
	notificationSound: true,
	notificationSoundAlways: false,
	showUpdateToast: false,
	showChangelog: false,
	showEmojiInCall: false,
	voiceInterruption: false,
	hapticFeedback: true,
	richTextInput: true,
	promptAutocomplete: true,
	largeTextAsFile: true,
	copyFormatted: false,
	collapseCodeBlocks: false,
	expandDetails: false,
	imageCompression: false,
	imageCompressionSize: { width: '', height: '' },
	stylizedPdfExport: true,
	ctrlEnterToSend: false,
	iframeSandboxAllowSameOrigin: false,
	iframeSandboxAllowForms: false,
	backgroundImageUrl: "https://images.pexels.com/photos/772429/pexels-photo-772429.jpeg?_gl=1*xzpfvm*_ga*MjU4MTg2MDU4LjE3NTI3MDA5MDI.*_ga_8JE65Q40S6*czE3NTI3MDgzNzMkbzIkZzEkdDE3NTI3MDg0MzkkajYwJGwwJGgw",
	
	// Paramètres d'addons
	titleAutoGenerate: true,
	autoFollowUps: true,
	autoTags: true,
	responseAutoCopy: false,
	userLocation: false,
	detectArtifacts: true,
	
	// Paramètres de recherche web
	webSearch: null,
	
	// Paramètres de modèle par défaut
	models: [],
	
	// Paramètres avancés
	params: {
		stream_response: true,
		function_calling: null,
		seed: null,
		temperature: null,
		reasoning_effort: null,
		logit_bias: null,
		frequency_penalty: null,
		presence_penalty: null,
		repeat_penalty: null,
		repeat_last_n: null,
		mirostat: null,
		mirostat_eta: null,
		mirostat_tau: null,
		top_k: null,
		top_p: null,
		min_p: null,
		stop: null,
		tfs_z: null,
		num_ctx: null,
		num_batch: null,
		num_keep: null,
		max_tokens: null,
		num_gpu: null
	}
};

export { defaultSettings };

export const settings: Writable<Settings> = writable(defaultSettings);

export const showSidebar = writable(false);
export const showSearch = writable(false);
export const showSettings = writable(false);
export const showArchivedChats = writable(false);
export const showChangelog = writable(false);

export const showControls = writable(false);
export const showOverview = writable(false);
export const showArtifacts = writable(false);
export const showCallOverlay = writable(false);

export const artifactCode = writable(null);

export const temporaryChatEnabled = writable(false);
export const scrollPaginationEnabled = writable(false);
export const currentChatPage = writable(1);

export const isLastActiveTab = writable(true);
export const playingNotificationSound = writable(false);

export type Model = OpenAIModel | OllamaModel;

type BaseModel = {
	id: string;
	name: string;
	info?: ModelConfig;
	owned_by: 'ollama' | 'openai' | 'arena';
};

export interface OpenAIModel extends BaseModel {
	owned_by: 'openai';
	external: boolean;
	source?: string;
}

export interface OllamaModel extends BaseModel {
	owned_by: 'ollama';
	details: OllamaModelDetails;
	size: number;
	description: string;
	model: string;
	modified_at: string;
	digest: string;
	ollama?: {
		name?: string;
		model?: string;
		modified_at: string;
		size?: number;
		digest?: string;
		details?: {
			parent_model?: string;
			format?: string;
			family?: string;
			families?: string[];
			parameter_size?: string;
			quantization_level?: string;
		};
		urls?: number[];
	};
}

type OllamaModelDetails = {
	parent_model: string;
	format: string;
	family: string;
	families: string[] | null;
	parameter_size: string;
	quantization_level: string;
};

type Settings = {
	models?: string[];
	conversationMode?: boolean;
	speechAutoSend?: boolean;
	responseAutoPlayback?: boolean;
	audio?: AudioSettings;
	showUsername?: boolean;
	notificationEnabled?: boolean;
	highContrastMode?: boolean;
	title?: TitleSettings;
	splitLargeDeltas?: boolean;
	chatDirection: 'LTR' | 'RTL' | 'auto';
	ctrlEnterToSend?: boolean;

	system?: string;
	seed?: number;
	temperature?: string;
	repeat_penalty?: string;
	top_k?: string;
	top_p?: string;
	num_ctx?: string;
	num_batch?: string;
	num_keep?: string;
	options?: ModelOptions;
	
	// Paramètres d'interface supplémentaires
	landingPageMode?: string;
	chatBubble?: boolean;
	widescreenMode?: boolean;
	splitLargeChunks?: boolean;
	scrollOnBranchChange?: boolean;
	notificationSound?: boolean;
	notificationSoundAlways?: boolean;
	showUpdateToast?: boolean;
	showChangelog?: boolean;
	showEmojiInCall?: boolean;
	voiceInterruption?: boolean;
	hapticFeedback?: boolean;
	richTextInput?: boolean;
	promptAutocomplete?: boolean;
	largeTextAsFile?: boolean;
	copyFormatted?: boolean;
	collapseCodeBlocks?: boolean;
	expandDetails?: boolean;
	imageCompression?: boolean;
	imageCompressionSize?: { width: string; height: string };
	stylizedPdfExport?: boolean;
	iframeSandboxAllowSameOrigin?: boolean;
	iframeSandboxAllowForms?: boolean;
	backgroundImageUrl?: string | null;
	
	// Paramètres d'addons
	titleAutoGenerate?: boolean;
	autoFollowUps?: boolean;
	autoTags?: boolean;
	responseAutoCopy?: boolean;
	userLocation?: boolean;
	detectArtifacts?: boolean;
	
	// Paramètres de recherche web
	webSearch?: string | null;
	
	// Paramètres avancés
	params?: {
		stream_response?: boolean | null;
		function_calling?: boolean | null;
		seed?: number | null;
		temperature?: number | null;
		reasoning_effort?: number | null;
		logit_bias?: string | null;
		frequency_penalty?: number | null;
		presence_penalty?: number | null;
		repeat_penalty?: number | null;
		repeat_last_n?: number | null;
		mirostat?: number | null;
		mirostat_eta?: number | null;
		mirostat_tau?: number | null;
		top_k?: number | null;
		top_p?: number | null;
		min_p?: number | null;
		stop?: string[] | null;
		tfs_z?: number | null;
		num_ctx?: number | null;
		num_batch?: number | null;
		num_keep?: number | null;
		max_tokens?: number | null;
		num_gpu?: number | null;
		use_mmap?: boolean | null;
		use_mlock?: boolean | null;
		num_thread?: number | null;
		think?: boolean | null;
		keep_alive?: string | null;
		format?: string | null;
		custom_params?: Record<string, any>;
	};
};

type ModelOptions = {
	stop?: boolean;
};

type AudioSettings = {
	STTEngine?: string;
	TTSEngine?: string;
	speaker?: string;
	model?: string;
	nonLocalVoices?: boolean;
};

type TitleSettings = {
	auto?: boolean;
	model?: string;
	modelExternal?: string;
	prompt?: string;
};

type Prompt = {
	command: string;
	user_id: string;
	title: string;
	content: string;
	timestamp: number;
};

type Document = {
	collection_name: string;
	filename: string;
	name: string;
	title: string;
};

type Config = {
	status: boolean;
	name: string;
	version: string;
	default_locale: string;
	default_models: string;
	default_prompt_suggestions: PromptSuggestion[];
	features: {
		auth: boolean;
		auth_trusted_header: boolean;
		enable_api_key: boolean;
		enable_signup: boolean;
		enable_login_form: boolean;
		enable_web_search?: boolean;
		enable_google_drive_integration: boolean;
		enable_onedrive_integration: boolean;
		enable_image_generation: boolean;
		enable_admin_export: boolean;
		enable_admin_chat_access: boolean;
		enable_community_sharing: boolean;
		enable_autocomplete_generation: boolean;
		enable_direct_connections: boolean;
	};
	oauth: {
		providers: {
			[key: string]: string;
		};
	};
	ui?: {
		pending_user_overlay_title?: string;
		pending_user_overlay_description?: string;
	};
};

type PromptSuggestion = {
	content: string;
	title: [string, string];
};

type SessionUser = {
	id: string;
	email: string;
	name: string;
	role: string;
	profile_image_url: string;
};
