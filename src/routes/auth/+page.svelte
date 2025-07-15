<script>
	import { toast } from 'svelte-sonner';

	import { onMount, getContext, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	import { getBackendConfig } from '$lib/apis';
	import { ldapUserSignIn, getSessionUser, userSignIn, userSignUp } from '$lib/apis/auths';

	import { WEBUI_API_BASE_URL, WEBUI_BASE_URL } from '$lib/constants';
	import { WEBUI_NAME, config, user, socket } from '$lib/stores';

	import { generateInitialsImage, canvasPixelTest } from '$lib/utils';

	import Spinner from '$lib/components/common/Spinner.svelte';
	import OnBoarding from '$lib/components/OnBoarding.svelte';

	const i18n = getContext('i18n');

	let loaded = false;
	let isSubmitting = false;

	let mode = $config?.features.enable_ldap ? 'ldap' : 'signin';

	let name = '';
	let email = '';
	let password = '';
	let ldapUsername = '';

	const querystringValue = (key) => {
		const querystring = window.location.search;
		const urlParams = new URLSearchParams(querystring);
		return urlParams.get(key);
	};

	const setSessionUser = async (sessionUser) => {
		if (sessionUser) {
			console.log(sessionUser);
			toast.success($i18n.t(`You're now logged in.`));
			if (sessionUser.token) {
				localStorage.token = sessionUser.token;
			}
			$socket.emit('user-join', { auth: { token: sessionUser.token } });
			await user.set(sessionUser);
			await config.set(await getBackendConfig());

			const redirectPath = querystringValue('redirect') || '/';
			goto(redirectPath);
		}
	};

	const signInHandler = async () => {
		const sessionUser = await userSignIn(email, password).catch((error) => {
			toast.error(`${error}`);
			return null;
		});

		await setSessionUser(sessionUser);
	};

	const signUpHandler = async () => {
		const sessionUser = await userSignUp(name, email, password, generateInitialsImage(name)).catch(
			(error) => {
				toast.error(`${error}`);
				return null;
			}
		);

		await setSessionUser(sessionUser);
	};

	const ldapSignInHandler = async () => {
		const sessionUser = await ldapUserSignIn(ldapUsername, password).catch((error) => {
			toast.error(`${error}`);
			return null;
		});
		await setSessionUser(sessionUser);
	};

	const submitHandler = async () => {
		isSubmitting = true;
		try {
			if (mode === 'ldap') {
				await ldapSignInHandler();
			} else if (mode === 'signin') {
				await signInHandler();
			} else {
				await signUpHandler();
			}
		} finally {
			isSubmitting = false;
		}
	};

	const checkOauthCallback = async () => {
		if (!$page.url.hash) {
			return;
		}
		const hash = $page.url.hash.substring(1);
		if (!hash) {
			return;
		}
		const params = new URLSearchParams(hash);
		const token = params.get('token');
		if (!token) {
			return;
		}
		const sessionUser = await getSessionUser(token).catch((error) => {
			toast.error(`${error}`);
			return null;
		});
		if (!sessionUser) {
			return;
		}
		localStorage.token = token;
		await setSessionUser(sessionUser);
	};

	let onboarding = false;

	async function setLogoImage() {
		await tick();
		const logo = document.getElementById('logo');

		if (logo) {
			const isDarkMode = document.documentElement.classList.contains('dark');

			if (isDarkMode) {
				const darkImage = new Image();
				darkImage.src = '/static/favicon-dark.png';

				darkImage.onload = () => {
					logo.src = '/static/favicon-dark.png';
					logo.style.filter = '';
				};

				darkImage.onerror = () => {
					logo.style.filter = 'invert(1)';
				};
			}
		}
	}

	onMount(async () => {
		if ($user !== undefined) {
			const redirectPath = querystringValue('redirect') || '/';
			goto(redirectPath);
		}
		await checkOauthCallback();

		loaded = true;
		setLogoImage();

		if (($config?.features.auth_trusted_header ?? false) || $config?.features.auth === false) {
			await signInHandler();
		} else {
			onboarding = $config?.onboarding ?? false;
		}
	});
</script>

<svelte:head>
	<title>{`${$WEBUI_NAME}`}</title>
</svelte:head>

<OnBoarding
	bind:show={onboarding}
	getStartedHandler={() => {
		onboarding = false;
		mode = $config?.features.enable_ldap ? 'ldap' : 'signup';
	}}
/>

<div class="min-h-screen w-full relative overflow-hidden">
	<!-- Background avec gradient moderne -->
	<div class="fixed inset-0 bg-gradient-to-br from-gray-50 via-amber-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-black"></div>
	
	<!-- Éléments décoratifs animés avec couleurs jaune/noir -->
	<div class="fixed inset-0 overflow-hidden pointer-events-none">
		<div class="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-amber-400 to-amber-600 opacity-10 rounded-full blur-3xl animate-pulse"></div>
		<div class="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-amber-300 to-amber-500 opacity-10 rounded-full blur-3xl animate-pulse" style="animation-delay: -2s"></div>
		<div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-amber-200 to-amber-400 opacity-10 rounded-full blur-3xl animate-pulse" style="animation-delay: -4s"></div>
	</div>

	<!-- Drag region pour desktop -->
	<div class="w-full absolute top-0 left-0 right-0 h-8 drag-region z-10" />

	{#if loaded}
		<!-- Header avec logo -->
		<div class="fixed top-6 left-6 z-50 flex items-center space-x-3">
			<div class="relative">
				<div class="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 rounded-xl blur-sm opacity-75"></div>
				<div class="relative bg-white dark:bg-gray-800 backdrop-blur-sm rounded-xl p-2.5 shadow-lg">
					<img
						id="logo"
						crossorigin="anonymous"
						src="{WEBUI_BASE_URL}/static/favicon.png"
						class="w-7 h-7 rounded-lg"
						alt="Logo"
					/>
				</div>
			</div>
			<div class="hidden sm:block">
				<h1 class="text-lg font-bold bg-gradient-to-r from-gray-800 to-black dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
					{$WEBUI_NAME}
				</h1>
			</div>
		</div>

		<div class="relative z-20 min-h-screen flex items-center justify-center p-4">
			<div class="w-full max-w-md">
				{#if ($config?.features.auth_trusted_header ?? false) || $config?.features.auth === false}
					<!-- État de chargement -->
					<div class="text-center py-16">
						<div class="relative inline-block">
							<div class="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 rounded-2xl blur-xl opacity-30"></div>
							<div class="relative bg-white dark:bg-gray-800 backdrop-blur-xl rounded-2xl p-8 shadow-2xl">
								<div class="flex items-center justify-center space-x-4">
									<div class="text-xl font-semibold text-gray-800 dark:text-gray-200">
										{$i18n.t('Signing in to your {{WEBUI_NAME}}', { WEBUI_NAME: $WEBUI_NAME })}
									</div>
									<Spinner />
								</div>
							</div>
						</div>
					</div>
				{:else}
					<!-- Formulaire de connexion -->
					<div class="relative">
						<!-- Glow effect jaune -->
						<div class="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 rounded-3xl blur-xl opacity-20"></div>
						
						<!-- Carte principale -->
						<div class="relative bg-white dark:bg-gray-800 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white dark:border-gray-700">
							<form
								class="space-y-6"
								on:submit={(e) => {
									e.preventDefault();
									submitHandler();
								}}
							>
								<!-- En-tête -->
								<div class="text-center mb-8">
									<div class="mb-2">
										<h2 class="text-3xl font-bold bg-gradient-to-r from-gray-800 to-black dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
											{#if $config?.onboarding ?? false}
												{$i18n.t(`Get started with {{WEBUI_NAME}}`, { WEBUI_NAME: $WEBUI_NAME })}
											{:else if mode === 'ldap'}
												{$i18n.t(`Sign in to {{WEBUI_NAME}} with LDAP`, { WEBUI_NAME: $WEBUI_NAME })}
											{:else if mode === 'signin'}
												{$i18n.t(`Welcome back`)}
											{:else}
												{$i18n.t(`Create your account`)}
											{/if}
										</h2>
									</div>

									{#if $config?.onboarding ?? false}
										<p class="text-sm text-gray-600 dark:text-gray-400 bg-amber-50 dark:bg-gray-700 border border-amber-200 dark:border-gray-600 rounded-xl p-3 inline-flex items-center space-x-2">
											<svg class="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
											</svg>
											<span>{$WEBUI_NAME} {$i18n.t('does not make any external connections, and your data stays securely on your locally hosted server.')}</span>
										</p>
									{/if}
								</div>

								{#if $config?.features.enable_login_form || $config?.features.enable_ldap}
									<div class="space-y-4">
										{#if mode === 'signup'}
											<div class="group">
												<label for="name" class="block text-sm font-medium text-gray-800 dark:text-gray-300 mb-2">
													{$i18n.t('Full Name')}
												</label>
												<div class="relative">
													<input
														bind:value={name}
														type="text"
														id="name"
														class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
														autocomplete="name"
														placeholder={$i18n.t('Enter Your Full Name')}
														required
													/>
												</div>
											</div>
										{/if}

										{#if mode === 'ldap'}
											<div class="group">
												<label for="username" class="block text-sm font-medium text-gray-800 dark:text-gray-300 mb-2">
													{$i18n.t('Username')}
												</label>
												<div class="relative">
													<input
														bind:value={ldapUsername}
														type="text"
														id="username"
														class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
														autocomplete="username"
														name="username"
														placeholder={$i18n.t('Enter Your Username')}
														required
													/>
												</div>
											</div>
										{:else}
											<div class="group">
												<label for="email" class="block text-sm font-medium text-gray-800 dark:text-gray-300 mb-2">
													{$i18n.t('Email Address')}
												</label>
												<div class="relative">
													<input
														bind:value={email}
														type="email"
														id="email"
														class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
														autocomplete="email"
														name="email"
														placeholder={$i18n.t('Enter Your Email')}
														required
													/>
												</div>
											</div>
										{/if}

										<div class="group">
											<label for="password" class="block text-sm font-medium text-gray-800 dark:text-gray-300 mb-2">
												{$i18n.t('Password')}
											</label>
											<div class="relative">
												<input
													bind:value={password}
													type="password"
													id="password"
													class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
													placeholder={$i18n.t('Enter Your Password')}
													autocomplete="current-password"
													name="current-password"
													required
												/>
											</div>
										</div>
									</div>

									<!-- Bouton principal -->
									<div class="pt-2">
										{#if mode === 'ldap'}
											<button
												type="submit"
												disabled={isSubmitting}
												class="group relative w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
											>
												{#if isSubmitting}
													<Spinner />
												{:else}
													{$i18n.t('Authenticate')}
												{/if}
											</button>
										{:else}
											<button
												type="submit"
												disabled={isSubmitting}
												class="group relative w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
											>
												{#if isSubmitting}
													<Spinner />
												{:else}
													{mode === 'signin'
														? $i18n.t('Sign in')
														: ($config?.onboarding ?? false)
															? $i18n.t('Create Admin Account')
															: $i18n.t('Create Account')}
												{/if}
											</button>

											{#if $config?.features.enable_signup && !($config?.onboarding ?? false)}
												<div class="mt-4 text-center">
													<p class="text-sm text-gray-600 dark:text-gray-400">
														{mode === 'signin'
															? $i18n.t("Don't have an account?")
															: $i18n.t('Already have an account?')}
														<button
															type="button"
															class="font-medium text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300 transition-colors duration-200"
															on:click={() => {
																mode = mode === 'signin' ? 'signup' : 'signin';
															}}
														>
															{mode === 'signin' ? $i18n.t('Sign up') : $i18n.t('Sign in')}
														</button>
													</p>
												</div>
											{/if}
										{/if}
									</div>
								{/if}

								<!-- OAuth providers -->
								{#if Object.keys($config?.oauth?.providers ?? {}).length > 0}
									<div class="relative">
										<div class="absolute inset-0 flex items-center">
											<div class="w-full border-t border-gray-200 dark:border-gray-600"></div>
										</div>
										<div class="relative flex justify-center text-sm">
											<span class="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
												{$i18n.t('or continue with')}
											</span>
										</div>
									</div>

									<div class="space-y-3">
										{#if $config?.oauth?.providers?.google}
											<button
												type="button"
												class="w-full flex items-center justify-center px-4 py-3 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 shadow-sm"
												on:click={() => {
													window.location.href = `${WEBUI_BASE_URL}/oauth/google/login`;
												}}
											>
												<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" class="w-5 h-5 mr-3">
													<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
													<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
													<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
													<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
													<path fill="none" d="M0 0h48v48H0z"/>
												</svg>
												<span class="text-gray-700 dark:text-gray-300 font-medium">
													{$i18n.t('Continue with {{provider}}', { provider: 'Google' })}
												</span>
											</button>
										{/if}

										{#if $config?.oauth?.providers?.microsoft}
											<button
												type="button"
												class="w-full flex items-center justify-center px-4 py-3 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 shadow-sm"
												on:click={() => {
													window.location.href = `${WEBUI_BASE_URL}/oauth/microsoft/login`;
												}}
											>
												<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21" class="w-5 h-5 mr-3">
													<rect x="1" y="1" width="9" height="9" fill="#f25022"/>
													<rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
													<rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
													<rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
												</svg>
												<span class="text-gray-700 dark:text-gray-300 font-medium">
													{$i18n.t('Continue with {{provider}}', { provider: 'Microsoft' })}
												</span>
											</button>
										{/if}

										{#if $config?.oauth?.providers?.github}
											<button
												type="button"
												class="w-full flex items-center justify-center px-4 py-3 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 shadow-sm"
												on:click={() => {
													window.location.href = `${WEBUI_BASE_URL}/oauth/github/login`;
												}}
											>
												<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5 mr-3">
													<path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.92 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57C20.565 21.795 24 17.31 24 12c0-6.63-5.37-12-12-12z"/>
												</svg>
												<span class="text-gray-700 dark:text-gray-300 font-medium">
													{$i18n.t('Continue with {{provider}}', { provider: 'GitHub' })}
												</span>
											</button>
										{/if}

										{#if $config?.oauth?.providers?.oidc}
											<button
												type="button"
												class="w-full flex items-center justify-center px-4 py-3 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 shadow-sm"
												on:click={() => {
													window.location.href = `${WEBUI_BASE_URL}/oauth/oidc/login`;
												}}
											>
												<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-3">
													<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"/>
												</svg>
												<span class="text-gray-700 dark:text-gray-300 font-medium">
													{$i18n.t('Continue with {{provider}}', { provider: $config?.oauth?.providers?.oidc ?? 'SSO' })}
												</span>
											</button>
										{/if}
									</div>
								{/if}

								<!-- Basculer entre LDAP et email -->
								{#if $config?.features.enable_ldap && $config?.features.enable_login_form}
									<div class="text-center">
										<button
											type="button"
											class="text-sm text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300 transition-colors duration-200 underline"
											on:click={() => {
												if (mode === 'ldap') {
													mode = ($config?.onboarding ?? false) ? 'signup' : 'signin';
												} else {
													mode = 'ldap';
												}
											}}
										>
											{mode === 'ldap' ? $i18n.t('Continue with Email') : $i18n.t('Continue with LDAP')}
										</button>
									</div>
								{/if}
							</form>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	:global(body) {
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.group:hover input {
		border-color: rgb(217 119 6); /* amber-600 */
	}

	input:focus {
		ring-color: rgb(245 158 11); /* amber-500 */
		border-color: transparent;
	}

	@keyframes float {
		0%, 100% { transform: translateY(0px); }
		50% { transform: translateY(-10px); }
	}

	.animate-float {
		animation: float 6s ease-in-out infinite;
	}
</style>