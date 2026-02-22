import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'dark' | 'light' | 'high-contrast';
type ColorblindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
type TextSpacing = 'normal' | 'medium' | 'wide';

interface A11yContextType {
    fontSize: number;
    setFontSize: (size: number) => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
    colorblindMode: ColorblindMode;
    setColorblindMode: (mode: ColorblindMode) => void;
    textSpacing: TextSpacing;
    setTextSpacing: (spacing: TextSpacing) => void;
    reducedMotion: boolean;
    setReducedMotion: (val: boolean) => void;
    highFocus: boolean;
    setHighFocus: (val: boolean) => void;
    simplifiedMode: boolean;
    setSimplifiedMode: (val: boolean) => void;
}

const A11yContext = createContext<A11yContextType | undefined>(undefined);

export function A11yProvider({ children }: { children: React.ReactNode }) {
    const [fontSize, setFontSizeState] = useState<number>(() => {
        const stored = localStorage.getItem('a11y-fontSize');
        return stored ? parseInt(stored, 10) : 100;
    });
    const [theme, setThemeState] = useState<Theme>(() =>
        (localStorage.getItem('a11y-theme') as Theme) || 'dark'
    );
    const [colorblindMode, setColorblindModeState] = useState<ColorblindMode>(() =>
        (localStorage.getItem('a11y-colorblind') as ColorblindMode) || 'none'
    );
    const [textSpacing, setTextSpacingState] = useState<TextSpacing>(() =>
        (localStorage.getItem('a11y-textSpacing') as TextSpacing) || 'normal'
    );
    const [reducedMotion, setReducedMotionState] = useState<boolean>(() =>
        localStorage.getItem('a11y-reducedMotion') === 'true'
    );
    const [highFocus, setHighFocusState] = useState<boolean>(() =>
        localStorage.getItem('a11y-highFocus') === 'true'
    );
    const [simplifiedMode, setSimplifiedModeState] = useState<boolean>(() =>
        localStorage.getItem('a11y-simplifiedMode') === 'true'
    );

    const setFontSize = (size: number) => {
        setFontSizeState(size);
        localStorage.setItem('a11y-fontSize', size.toString());
    };

    const setTheme = (t: Theme) => {
        setThemeState(t);
        localStorage.setItem('a11y-theme', t);
    };

    const setColorblindMode = (mode: ColorblindMode) => {
        setColorblindModeState(mode);
        localStorage.setItem('a11y-colorblind', mode);
    };

    const setTextSpacing = (spacing: TextSpacing) => {
        setTextSpacingState(spacing);
        localStorage.setItem('a11y-textSpacing', spacing);
    };

    const setReducedMotion = (val: boolean) => {
        setReducedMotionState(val);
        localStorage.setItem('a11y-reducedMotion', String(val));
    };

    const setHighFocus = (val: boolean) => {
        setHighFocusState(val);
        localStorage.setItem('a11y-highFocus', String(val));
    };

    const setSimplifiedMode = (val: boolean) => {
        setSimplifiedModeState(val);
        localStorage.setItem('a11y-simplifiedMode', String(val));
    };

    // Apply to document root
    useEffect(() => {
        const root = document.documentElement;

        // 1. Font Size (Percentage of base 16px)
        root.classList.remove('text-base', 'text-lg', 'text-xl');
        root.style.fontSize = `${(fontSize / 100) * 16}px`;

        // 2. Theme (High Contrast and Light Inversion)
        root.classList.remove('theme-light', 'theme-high-contrast');

        let currentFilter = '';

        if (theme === 'light') {
            root.classList.add('theme-light');
            // Improved light theme filter: adjusts brightness and contrast for a better look
            currentFilter = 'invert(1) hue-rotate(180deg) brightness(1.05) contrast(0.95)';
        } else if (theme === 'high-contrast') {
            root.classList.add('theme-high-contrast');
        }

        // 3. Colorblind Modes SVG Filter
        if (colorblindMode !== 'none') {
            const cbFilter = `url(#${colorblindMode})`;
            currentFilter = currentFilter ? `${currentFilter} ${cbFilter}` : cbFilter;
        }

        root.style.filter = currentFilter || 'none';

        // 4. Text Spacing
        root.classList.remove('a11y-spacing-medium', 'a11y-spacing-wide');
        if (textSpacing === 'medium') root.classList.add('a11y-spacing-medium');
        if (textSpacing === 'wide') root.classList.add('a11y-spacing-wide');

        // 5. Motor & Focus
        root.classList.toggle('a11y-reduced-motion', reducedMotion);
        root.classList.toggle('a11y-high-focus', highFocus);
        root.classList.toggle('a11y-simplified', simplifiedMode);

    }, [fontSize, theme, colorblindMode, textSpacing, reducedMotion, highFocus, simplifiedMode]);

    return (
        <A11yContext.Provider value={{
            fontSize, setFontSize,
            theme, setTheme,
            colorblindMode, setColorblindMode,
            textSpacing, setTextSpacing,
            reducedMotion, setReducedMotion,
            highFocus, setHighFocus,
            simplifiedMode, setSimplifiedMode
        }}>
            {/* SVG Definitions for Daltonism Matrices */}
            <svg className="hidden w-0 h-0" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <filter id="protanopia">
                        <feColorMatrix type="matrix" values="0.567, 0.433, 0, 0, 0  0.558, 0.442, 0, 0, 0  0, 0.242, 0.758, 0, 0  0, 0, 0, 1, 0" />
                    </filter>
                    <filter id="deuteranopia">
                        <feColorMatrix type="matrix" values="0.625, 0.375, 0, 0, 0  0.7, 0.3, 0, 0, 0  0, 0.3, 0.7, 0, 0  0, 0, 0, 1, 0" />
                    </filter>
                    <filter id="tritanopia">
                        <feColorMatrix type="matrix" values="0.95, 0.05, 0, 0, 0  0, 0.433, 0.567, 0, 0  0, 0.475, 0.525, 0, 0  0, 0, 0, 1, 0" />
                    </filter>
                </defs>
            </svg>
            {children}
        </A11yContext.Provider>
    );
}

export function useA11y() {
    const context = useContext(A11yContext);
    if (!context) throw new Error('useA11y must be used within A11yProvider');
    return context;
}
