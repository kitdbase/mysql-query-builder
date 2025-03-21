import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'], // Punto de entrada
  format: ['cjs', 'esm'], // Genera CommonJS y ES Modules
  dts: true, // Genera archivos de tipos
  clean: true, // Limpia el directorio de salida
  outDir: 'dist', // Directorio de salida
  splitting: false, // Desactiva la división de código
  sourcemap: true, // Genera sourcemaps
  outExtension: ({ format }) => ({ // Forzar extensiones personalizadas
    js: format === 'cjs' ? '.cjs' : '.js',
  }),
});