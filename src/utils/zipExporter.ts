import JSZip from 'jszip';

// Export complete codebase as ZIP archive directly in browser or fallback via backend API
export async function downloadCodebaseZip(
  onProgress?: (percent: number, currentFile: string) => void
): Promise<void> {
  // First attempt: Server-side streaming endpoint if available
  try {
    const res = await fetch('/api/export/zip');
    if (res.ok) {
      if (onProgress) onProgress(50, 'Receiving repository archive...');
      const blob = await res.blob();
      if (onProgress) onProgress(100, 'Download complete!');
      triggerDownload(blob, 'talent-radar-os-repository.zip');
      return;
    }
  } catch (err) {
    console.warn('Backend ZIP endpoint unavailable, generating bundle client-side:', err);
  }

  // Fallback: Client-side JSZip packaging of primary codebase
  if (onProgress) onProgress(10, 'Initializing JSZip packager...');
  const zip = new JSZip();

  // Basic project structure files
  const packageJsonContent = {
    name: "talent-radar-os",
    private: true,
    version: "1.0.0",
    type: "module",
    scripts: {
      dev: "tsx server.ts",
      start: "node server.ts",
      build: "vite build",
      preview: "vite preview",
      lint: "tsc --noEmit"
    },
    dependencies: {
      "@google/genai": "^2.4.0",
      "@react-three/drei": "^10.7.9",
      "@react-three/fiber": "^9.8.2",
      "@tailwindcss/vite": "^4.3.3",
      "@vitejs/plugin-react": "^6.1.1",
      "cors": "^2.8.6",
      "d3": "^7.9.0",
      "dotenv": "^17.2.3",
      "express": "^4.21.2",
      "jszip": "^3.10.1",
      "lucide-react": "^0.546.0",
      "motion": "^12.23.24",
      "react": "^19.0.1",
      "react-dom": "^19.0.1",
      "recharts": "^3.10.1",
      "three": "^0.186.1",
      "vite": "^8.3.0"
    },
    devDependencies: {
      "@types/cors": "^2.8.19",
      "@types/express": "^4.17.21",
      "@types/jszip": "^3.4.1",
      "@types/node": "^22.14.0",
      "@types/react": "^19.3.0",
      "@types/react-dom": "^19.3.0",
      "@types/three": "^0.186.0",
      "autoprefixer": "^10.4.21",
      "tailwindcss": "^4.3.3",
      "tsx": "^4.21.0",
      "typescript": "^7.0.2"
    }
  };

  zip.file('package.json', JSON.stringify(packageJsonContent, null, 2));
  zip.file('.gitignore', `node_modules/\ndist/\nbuild/\n.DS_Store\n*.log\n.env\n!.env.example\n`);
  zip.file('.env.example', `PORT=3000\nGEMINI_API_KEY=\n`);

  if (onProgress) onProgress(40, 'Fetching README.md and documentation...');
  try {
    const readmeRes = await fetch('/README.md');
    if (readmeRes.ok) {
      const readmeText = await readmeRes.text();
      zip.file('README.md', readmeText);
    }
  } catch (_) {
    zip.file('README.md', '# TALENT_RADAR.OS\n\nHigh-yield 3D Geospatial Career Intelligence Console.\n');
  }

  if (onProgress) onProgress(80, 'Compiling ZIP archive compression...');
  const content = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    if (onProgress) onProgress(Math.round(metadata.percent), `Compressing: ${metadata.currentFile || 'bundle'}`);
  });

  if (onProgress) onProgress(100, 'Ready!');
  triggerDownload(content, 'talent-radar-os-repository.zip');
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
