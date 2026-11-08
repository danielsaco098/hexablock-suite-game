// @ts-check
/**
 * HexaBlock Suite — reglas de capas (Clean Architecture).
 *
 * Dirección de dependencias permitida:
 *   presentation ──▶ application ──▶ domain
 *   infrastructure ─▶ application ──▶ domain
 *
 * - domain:          no conoce a ninguna otra capa ni a frameworks (React, Capacitor).
 * - domain/engine:   motor genérico; NO conoce variantes concretas.
 * - domain/variants: cada variante solo depende del engine, nunca de otra variante.
 * - application:     no conoce infraestructura ni presentación (usa ports).
 * - infrastructure:  no conoce presentación.
 * - presentation:    no conoce infraestructura (la recibe ya construida desde la raíz de composición).
 * - src/main.tsx y src/App.tsx son la raíz de composición: pueden importar factories de infraestructura.
 *
 * NOTA: para analizar .ts/.tsx hay que añadir el parser de typescript-eslint
 * (languageOptions.parser) cuando se instale; las reglas de capas no cambian.
 */

const VARIANTS = ['hexa-lines', 'hexa-fit', 'hexa-sort', 'hexa-merge'];

const FRAMEWORKS = [
  { group: ['react', 'react-dom', 'react/*', 'react-dom/*'], message: 'El dominio/aplicación no puede depender de React.' },
  { group: ['@capacitor/*', '@capacitor-community/*'], message: 'Capacitor solo se usa en infrastructure.' },
];

const layer = (name, message) => ({
  group: [`**/${name}`, `**/${name}/**`, `@/${name}`, `@/${name}/**`],
  message,
});

const NO_APPLICATION = layer('application', 'Esta capa no puede importar application.');
const NO_INFRASTRUCTURE = layer('infrastructure', 'Esta capa no puede importar infrastructure (usa un port de application).');
const NO_PRESENTATION = layer('presentation', 'Esta capa no puede importar presentation.');
const NO_VARIANTS = {
  group: ['**/domain/variants/**', '**/variants/**', '@/domain/variants/**'],
  message: 'El engine es genérico: no puede conocer variantes concretas.',
};

/** @param {Array<{group: string[], message: string}>} patterns */
const restrict = (patterns) => ({
  'no-restricted-imports': ['error', { patterns }],
});

const DOMAIN_BASE = [NO_APPLICATION, NO_INFRASTRUCTURE, NO_PRESENTATION, ...FRAMEWORKS];
const SRC = '**/*.{ts,tsx,js,jsx}';

export default [
  {
    ignores: ['dist/**', 'coverage/**', 'android/**', 'node_modules/**', 'public/**'],
  },

  // ── domain (general) ────────────────────────────────────────────────
  {
    files: [`src/domain/${SRC}`],
    rules: restrict(DOMAIN_BASE),
  },

  // ── domain/engine: además, prohibido conocer variantes ──────────────
  {
    files: [`src/domain/engine/${SRC}`],
    rules: restrict([...DOMAIN_BASE, NO_VARIANTS]),
  },

  // ── domain/variants/<x>: aislada de las demás variantes ─────────────
  ...VARIANTS.map((variant) => ({
    files: [`src/domain/variants/${variant}/${SRC}`],
    rules: restrict([
      ...DOMAIN_BASE,
      ...VARIANTS.filter((other) => other !== variant).map((other) => ({
        group: [`**/variants/${other}`, `**/variants/${other}/**`, `@/domain/variants/${other}/**`],
        message: `La variante ${variant} no puede depender de ${other}.`,
      })),
    ]),
  })),

  // ── application ─────────────────────────────────────────────────────
  {
    files: [`src/application/${SRC}`],
    rules: restrict([NO_INFRASTRUCTURE, NO_PRESENTATION, ...FRAMEWORKS]),
  },

  // ── infrastructure ──────────────────────────────────────────────────
  {
    files: [`src/infrastructure/${SRC}`],
    rules: restrict([NO_PRESENTATION]),
  },

  // ── presentation ────────────────────────────────────────────────────
  {
    files: [`src/presentation/${SRC}`],
    rules: restrict([NO_INFRASTRUCTURE]),
  },

  // ── raíz de composición (src/main.tsx, src/App.tsx): sin restricciones de capa
];
