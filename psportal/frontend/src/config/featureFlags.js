/**
 * Optional UI features. Defaults keep the classic student flow unchanged.
 *
 * Assessment Hub: set VITE_USE_ASSESSMENT_HUB=true in frontend/.env
 * Classic flow stays: Book Slots (/book-slots) → Course (/course/:id) → Pre-test → exam.
 */
export const USE_ASSESSMENT_HUB = import.meta.env.VITE_USE_ASSESSMENT_HUB === "true";
