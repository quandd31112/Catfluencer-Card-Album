# Catfluencer Card Album Prototype

This build keeps the **Spec tab**, but it is **read-only**.

- All Album tuning comes from the hard-coded `CA.defaults()` data in `app.js`.
- The Spec tab is only for reviewing the current values.
- No Save / Copy / Paste / Import controls.
- No Album spec is loaded from or saved to `localStorage`.
- Every account/browser sees the same deployed Album configuration.
- Debug preferences and the last-opened tab may still be stored locally; they do not change the Album spec.
- Existing `img/` assets can remain unchanged.
