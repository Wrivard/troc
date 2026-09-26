export const messages = {
  googleSignIn: ["Continue with Google", "Continuer avec Google"],
  googleUnavailable: [
    "Google sign-in is currently unavailable.",
    "La connexion Google n’est pas disponible actuellement.",
  ],
  google_auth_failed: [
    "Google sign-in did not finish. Please try again or use your email and password.",
    "La connexion Google n’a pas abouti. Réessayez ou utilisez votre courriel et votre mot de passe.",
  ],
  canada_confirmation_required: [
    "Confirm that you live in Canada to continue.",
    "Confirmez que vous résidez au Canada pour continuer.",
  ],
  signIn: ["Sign in", "Se connecter"],
  signUp: ["Create an account", "Créer un compte"],
  account: ["Your account", "Votre compte"],
  settings: ["Account settings", "Paramètres du compte"],
  email: ["Email address", "Adresse courriel"],
  password: ["Password", "Mot de passe"],
  passwordHint: [
    "Use at least 8 characters.",
    "Utilisez au moins 8 caractères.",
  ],
  country: [
    "TROC is currently available to buyers in Canada.",
    "TROC est actuellement offert aux acheteurs au Canada.",
  ],
  canadaConfirm: ["I live in Canada.", "Je réside au Canada."],
  signOut: ["Sign out", "Se déconnecter"],
  save: ["Save preferences", "Enregistrer les préférences"],
  saved: ["Preferences saved.", "Préférences enregistrées."],
  language: ["Language", "Langue"],
  theme: ["Theme", "Thème"],
  guide: ["Style guide", "Guide de style"],
  loading: ["Loading…", "Chargement…"],
  check_email: [
    "Check your email to confirm your account, then sign in.",
    "Consultez vos courriels pour confirmer votre compte, puis connectez-vous.",
  ],
  auth_failed: [
    "We could not sign you in. Check your details and email confirmation.",
    "Connexion impossible. Vérifiez vos renseignements et la confirmation de votre courriel.",
  ],
  service_unavailable: [
    "Account services are temporarily unavailable. Please try again later.",
    "Les services de compte sont temporairement indisponibles. Réessayez plus tard.",
  ],
  unauthorized: [
    "Sign in to access your account.",
    "Connectez-vous pour accéder à votre compte.",
  ],
  forbidden: [
    "You do not have access to this action.",
    "Vous n’avez pas accès à cette action.",
  ],
  invalid_credentials: [
    "Enter a valid email address and a password of 8–128 characters.",
    "Entrez une adresse courriel valide et un mot de passe de 8 à 128 caractères.",
  ],
  rate_limited: [
    "Too many attempts. Please try again later.",
    "Trop de tentatives. Réessayez plus tard.",
  ],
  notFound: ["Page not found", "Page introuvable"],
} as const;
export type MessageKey = keyof typeof messages;
