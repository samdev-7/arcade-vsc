const esbuild = require("esbuild");

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ["src/extension.ts"],
    bundle: true,
    format: "cjs",
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: "node",
    outfile: "dist/extension.js",
    external: ["vscode"],
    logLevel: "info",
    plugins: [
      /* add to the end of plugins array */
      esbuildProblemMatcherPlugin,
    ],
  });
  // TODO: re-enable webview when ready
  // const webviewCtx = await esbuild.context({
  //   entryPoints: ["src/webview.ts"],
  //   bundle: true,
  //   format: "esm",
  //   minify: production,
  //   sourcemap: !production,
  //   outfile: "dist/webview.js",
  //   logLevel: "info",
  // });
  if (watch) {
    await ctx.watch();
    // await webviewCtx.watch();
  } else {
    await ctx.rebuild();
    // await webviewCtx.rebuild();
    await ctx.dispose();
    // await webviewCtx.dispose();
  }
}

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
  name: "esbuild-problem-matcher",

  setup(build) {
    build.onStart(() => {
      console.log("[watch] build started");
    });
    build.onEnd((result) => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        console.error(
          `    ${location.file}:${location.line}:${location.column}:`
        );
      });
      console.log("[watch] build finished");
    });
  },
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
