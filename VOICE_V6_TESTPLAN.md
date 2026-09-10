# Voice V6 focused validation

1. Open an authenticated ETERNA session on iPhone/PWA.
2. Tap only the small microphone. The orange conversation button must remain idle.
3. Speak a short phrase and pause. Expected: listening -> transcribing -> text appears in the composer; nothing is auto-sent.
4. Tap the orange conversation button. Expected: listening -> transcribing -> thinking -> spoken response -> listening again.
5. End conversation from the orange button. Expected: microphone closes and both controls return to idle.
6. Confirm no regression to typed input, camera/photo, mode switching, new activity, payments, games, scoring, Safety/School Scope.
7. If transcription fails, distinguish NO_AUTH_SESSION / HTTP 401 from audio-capture failures in console/status instead of showing a generic success claim.
