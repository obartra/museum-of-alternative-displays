/**
 * The few words a model writes into its own picture, in the language in use. The interface fills this when the
 * language changes (`useLang`); a model reads it when it is built. It imports nothing, so that the scripts that
 * load the models outside the browser can load it too.
 */
export const words: { homage?: string } = {};
