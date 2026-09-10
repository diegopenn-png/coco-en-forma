# ETERNA Voice V6 diagnosis

The backend routes `/v1/transcribe` and `/v1/speak` require an authenticated Supabase bearer token. The ETERNA core already refreshes the session and retries authenticated API calls on HTTP 401. The isolated voice engines could activate the physical microphone but could still reach transcription without a usable token, producing a generic transcription failure.

Voice V6 resolves the access token from the canonical global Supabase client first and falls back to the persisted `sb-*-auth-token` session. It fails before opening the microphone if there is no authenticated session, retries once after a 401, keeps one-shot dictation isolated from the orange conversation state, and preserves the PCM/WAV capture path for iOS/PWA.
