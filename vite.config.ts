import { Plugin, defineConfig } from 'vite';

// This custom plugin logs module resolution attempts
const logResolverPlugin: () => Plugin = () => {
  return {
    name: 'log-resolver',
    resolveId(source, importer) {
      // To reduce noise, we only log the import we are struggling with
      if (source.includes('sketch')) {
        console.log(`[Vite Resolver] Trying to resolve: ${source}`);
        // Uncomment the line below for even more detail
        // console.log(`  > From importer: ${importer}`);
      }
      return null; // Return null to let the default resolver continue
    }
  };
};

export default defineConfig({
  plugins: [
    logResolverPlugin()
  ]
});