import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function wrapTsx(tsxContent: string): string {
  // Detect the exported default component name
  const exportMatch = tsxContent.match(/export\s+default\s+function\s+(\w+)/);
  const componentName = exportMatch?.[1] ?? 'App';

  // Rewrite bare module specifiers to absolute esm.sh URLs.
  // Babel standalone dynamically imports via a blob URL, which does NOT respect
  // import maps — only absolute URLs work from blob URL modules.
  let code = tsxContent
    .replace(/from\s+['"]react-dom\/client['"]/g, "from 'https://esm.sh/react-dom@18/client'")
    .replace(/from\s+['"]react-dom['"]/g,         "from 'https://esm.sh/react-dom@18'")
    .replace(/from\s+['"]react\/jsx-runtime['"]/g, "from 'https://esm.sh/react@18/jsx-runtime'")
    .replace(/from\s+['"]react['"]/g,              "from 'https://esm.sh/react@18'")
    .replace(/from\s+['"]lucide-react['"]/g,       "from 'https://esm.sh/lucide-react@latest?deps=react@18'");

  // Strip export default — keep the function in module scope for the render call
  code = code.replace(/^export\s+default\s+/gm, '');

  // Shim Claude artifact window.storage API → localStorage
  code = code
    .replace(/await\s+window\.storage\.get\(([^,)]+),\s*[^)]+\)/g, '{ value: localStorage.getItem($1) }')
    .replace(/await\s+window\.storage\.set\(([^,]+),\s*([^,]+),\s*[^)]+\)/g, 'localStorage.setItem($1, $2)')
    .replace(/await\s+window\.storage\.delete\(([^,)]+),\s*[^)]+\)/g, 'localStorage.removeItem($1)');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script src="https://cdn.tailwindcss.com"><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <script>
    // Force classic JSX runtime so Babel does NOT inject "import ... from 'react/jsx-runtime'".
    // That bare specifier would fail inside the blob URL module that Babel standalone creates,
    // because blob URLs ignore import maps and bare specifiers are unresolvable there.
    Babel.registerPreset('tsx-classic', {
      presets: [
        [Babel.availablePresets['react'], { runtime: 'classic' }],
        Babel.availablePresets['typescript']
      ]
    });
  <\/script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="tsx-classic" data-type="module">
import { createRoot } from 'https://esm.sh/react-dom@18/client';
${code}
createRoot(document.getElementById('root')).render(<${componentName} />);
  <\/script>
</body>
</html>`;
}
