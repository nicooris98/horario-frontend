import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth-interceptor';

const InstitutionalAura = definePreset(Aura, {
  primitive: {
    blue: {
      50: '#F3F7FC',
      100: '#E7EFF9',
      200: '#C8DCF3',
      300: '#A3C4EA',
      400: '#70A0DE',
      500: '#1769E0',
      600: '#0D5FE8',
      700: '#1552B3',
      800: '#12366A',
      900: '#0F2B55',
      950: '#091A36',
    },
  },
  semantic: {
    typography: {
      fontFamily: 'Inter, "Segoe UI", Arial, sans-serif',
      fontSize: '0.9375rem',
      lineHeight: '1.5',
    },
    primary: {
      50: '{blue.50}',
      100: '{blue.100}',
      200: '{blue.200}',
      300: '{blue.300}',
      400: '{blue.400}',
      500: '{blue.500}',
      600: '{blue.600}',
      700: '{blue.700}',
      800: '{blue.800}',
      900: '{blue.900}',
      950: '{blue.950}',
      color: '#1769E0',
      contrastColor: '#FFFFFF',
      hoverColor: '#0D5FE8',
      activeColor: '#12366A',
    },
    focusRing: {
      width: '2px',
      style: 'solid',
      color: 'color-mix(in srgb, {primary.color}, transparent 62%)',
      offset: '2px',
      shadow: 'none',
    },
    formField: {
      borderRadius: '0.625rem',
      borderColor: '#D7E2F0',
      hoverBorderColor: '#9CB5D5',
      background: '{surface.0}',
      filledBackground: '{surface.0}',
      color: '{text.color}',
      placeholderColor: '{text.mutedColor}',
      focusBorderColor: '{primary.color}',
      focusRing: {
        width: '2px',
        style: 'solid',
        color: 'color-mix(in srgb, {primary.color}, transparent 78%)',
        offset: '1px',
        shadow: 'none',
      },
    },
    content: {
      borderRadius: '0.75rem',
      borderColor: '#D7E2F0',
      background: '{surface.0}',
    },
    colorScheme: {
      light: {
        surface: {
          0: '#FFFFFF',
          50: '#F3F7FC',
          100: '#EAF1FA',
          200: '#D7E2F0',
          300: '#C1D0E3',
          400: '#98ADC8',
          500: '#7188A8',
          600: '#526B8E',
          700: '#3A5277',
          800: '#273F64',
          900: '#192F52',
          950: '#10234E',
        },
        text: {
          color: '#10234E',
          hoverColor: '#12366A',
          mutedColor: '#64779A',
          hoverMutedColor: '#506487',
        },
        highlight: {
          background: '#E7F0FF',
          focusBackground: '#D8E7FF',
          color: '#12366A',
          focusColor: '#10234E',
        },
      },
    },
  },
  components: {
    dialog: {
      root: {
        background: '{surface.0}',
        borderColor: '{surface.200}',
        color: '{text.color}',
      },
    },
    button: {
      root: {
        borderRadius: '0.625rem',
        label: { fontWeight: '600' },
      },
      outlined: {
        secondary: {
          color: '{surface.900}',
        },
      },
    },
    card: {
      root: {
        background: '{surface.0}',
        borderRadius: '1rem',
        color: '{content.color}',
        shadow: '0 18px 48px rgba(18, 54, 106, 0.12)',
      },
      body: {
        padding: 'clamp(1.5rem, 3vw, 2.25rem)',
      },
    },
    toolbar: {
      root: {
        background: '{surface.0}',
        borderColor: '{surface.200}',
        borderRadius: '0',
        padding: '0.5rem clamp(1rem, 3vw, 2rem)',
      },
    },
    avatar: {
      root: {
        background: '{primary.color}',
        color: '{primary.contrast.color}',
        borderRadius: '50%',
        fontWeight: '600',
      },
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    providePrimeNG({
      theme: {
        preset: InstitutionalAura,
      },
    }),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
