/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Where "Send an intention" emails go. Leave unset to hide the prayer-request box. */
  readonly VITE_PRAYER_REQUEST_EMAIL?: string;
}
