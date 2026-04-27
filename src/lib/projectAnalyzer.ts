// Client-side project analyzer — produces a real, project-specific README
// based on the actual files the user uploaded (no AI required).

export interface ProjectInfo {
  framework: string;
  language: string;
  packageManager: string;
  type: string;
  installCommand: string;
  runCommand: string;
  buildCommand: string;
  description: string;
  features: string[];
  suggestedGitignore: string[];
  detectedLanguages: string[];
  fileStats: {
    total: number;
    byExtension: Record<string, number>;
    codeFiles: number;
    configFiles: number;
  };
  /** Real package.json metadata when present */
  packageMeta?: {
    name?: string;
    version?: string;
    description?: string;
    author?: string;
    license?: string;
    homepage?: string;
    repository?: string;
    scripts?: Record<string, string>;
    dependencies?: string[];
    devDependencies?: string[];
  };
  /** Top-level directories detected in the upload */
  topFolders: string[];
  /** Entry / important file paths */
  entryPoints: string[];
  /** Notable existing files (LICENSE, CHANGELOG, etc.) */
  notableFiles: string[];
}

const FRAMEWORK_PATTERNS: Record<string, { files: string[]; indicators: string[] }> = {
  'Next.js': { files: ['next.config.js', 'next.config.mjs', 'next.config.ts'], indicators: ['next'] },
  Astro: { files: ['astro.config.mjs', 'astro.config.ts'], indicators: ['astro'] },
  Remix: { files: ['remix.config.js'], indicators: ['@remix-run/react'] },
  'Nuxt.js': { files: ['nuxt.config.js', 'nuxt.config.ts'], indicators: ['nuxt'] },
  SvelteKit: { files: ['svelte.config.js'], indicators: ['@sveltejs/kit'] },
  Vite: { files: ['vite.config.js', 'vite.config.ts'], indicators: ['vite'] },
  React: { files: [], indicators: ['react', 'react-dom'] },
  'Vue.js': { files: ['vue.config.js'], indicators: ['vue'] },
  Angular: { files: ['angular.json'], indicators: ['@angular/core'] },
  Svelte: { files: [], indicators: ['svelte'] },
  Express: { files: [], indicators: ['express'] },
  Fastify: { files: [], indicators: ['fastify'] },
  NestJS: { files: ['nest-cli.json'], indicators: ['@nestjs/core'] },
  Django: { files: ['manage.py', 'settings.py'], indicators: [] },
  Flask: { files: ['app.py', 'wsgi.py'], indicators: ['flask'] },
  FastAPI: { files: [], indicators: ['fastapi'] },
  Laravel: { files: ['artisan', 'composer.json'], indicators: ['laravel/framework'] },
  'Spring Boot': { files: ['pom.xml', 'build.gradle'], indicators: ['spring-boot'] },
  'Ruby on Rails': { files: ['Gemfile', 'config/routes.rb'], indicators: ['rails'] },
  'Go (Gin)': { files: ['go.mod'], indicators: ['gin-gonic/gin'] },
};

const GITIGNORE_PATTERNS: Record<string, string[]> = {
  node: ['node_modules/', 'dist/', 'build/', '.env', '.env.local', '.env.*.local', 'npm-debug.log*', 'yarn-debug.log*', 'yarn-error.log*', '.pnpm-debug.log*', '.DS_Store', '*.log', '.cache/', 'coverage/', '.vite/', '.next/', '.turbo/'],
  python: ['__pycache__/', '*.py[cod]', '*$py.class', '.Python', 'env/', 'venv/', '.venv/', 'pip-log.txt', '.env', '*.egg-info/', 'dist/', 'build/', '.pytest_cache/', '.mypy_cache/'],
  java: ['target/', '*.class', '*.jar', '*.war', '*.ear', '.idea/', '*.iml', '.gradle/', 'build/', '.env'],
  php: ['vendor/', '.env', 'storage/*.key', 'storage/logs/', 'bootstrap/cache/', 'node_modules/', '.phpunit.result.cache'],
  go: ['bin/', 'pkg/', '*.exe', '*.test', '*.out', 'vendor/'],
  general: ['.DS_Store', 'Thumbs.db', '.idea/', '.vscode/', '*.swp', '*.swo', '*~', '.env', '.env.local'],
};

const CODE_EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.php', '.rb', '.go', '.rs', '.c', '.cpp', '.cs', '.swift', '.kt'];
const CONFIG_EXTENSIONS = ['.json', '.yaml', '.yml', '.toml', '.xml', '.ini', '.cfg', '.config'];

const LANGUAGE_MAP: Record<string, string> = {
  '.js': 'JavaScript', '.ts': 'TypeScript', '.jsx': 'JSX', '.tsx': 'TSX', '.py': 'Python', '.java': 'Java',
  '.php': 'PHP', '.rb': 'Ruby', '.go': 'Go', '.rs': 'Rust', '.c': 'C', '.cpp': 'C++', '.cs': 'C#',
  '.swift': 'Swift', '.kt': 'Kotlin', '.scala': 'Scala', '.sh': 'Shell', '.bash': 'Bash', '.sql': 'SQL',
  '.html': 'HTML', '.css': 'CSS', '.scss': 'SCSS', '.sass': 'SASS', '.vue': 'Vue', '.svelte': 'Svelte',
  '.astro': 'Astro', '.graphql': 'GraphQL', '.gql': 'GraphQL', '.dart': 'Dart',
};

function safeJsonParse<T = any>(s: string): T | null {
  try { return JSON.parse(s) as T; } catch { return null; }
}

function topLevelFolders(paths: string[]): string[] {
  const set = new Set<string>();
  for (const p of paths) {
    const parts = p.split('/').filter(Boolean);
    if (parts.length > 1) set.add(parts[0]);
  }
  return Array.from(set).sort();
}

function findEntryPoints(paths: string[]): string[] {
  const candidates = [
    'src/main.tsx', 'src/main.ts', 'src/main.js', 'src/main.jsx',
    'src/index.tsx', 'src/index.ts', 'src/index.js', 'src/index.jsx',
    'src/App.tsx', 'src/App.jsx',
    'index.html', 'index.js', 'index.ts',
    'main.py', 'app.py', 'manage.py', 'wsgi.py',
    'main.go', 'cmd/main.go',
    'src/main/java/Application.java',
  ];
  const out: string[] = [];
  for (const c of candidates) {
    const hit = paths.find((p) => p === c || p.endsWith('/' + c));
    if (hit && !out.includes(hit)) out.push(hit);
  }
  return out.slice(0, 6);
}

function findNotable(paths: string[]): string[] {
  const wanted = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'CHANGELOG.md', 'CONTRIBUTING.md', 'CODE_OF_CONDUCT.md', 'SECURITY.md', 'Dockerfile', 'docker-compose.yml', '.github/workflows'];
  const out: string[] = [];
  for (const w of wanted) {
    const hit = paths.find((p) => p === w || p.endsWith('/' + w) || p.includes(w));
    if (hit && !out.includes(hit)) out.push(hit);
  }
  return out;
}

export function analyzeProject(files: Map<string, string>, filePaths: string[]): ProjectInfo {
  const info: ProjectInfo = {
    framework: 'Unknown',
    language: 'Unknown',
    packageManager: 'npm',
    type: 'Generic Project',
    installCommand: '',
    runCommand: '',
    buildCommand: '',
    description: '',
    features: [],
    suggestedGitignore: [...GITIGNORE_PATTERNS.general],
    detectedLanguages: [],
    fileStats: { total: filePaths.length, byExtension: {}, codeFiles: 0, configFiles: 0 },
    topFolders: topLevelFolders(filePaths),
    entryPoints: findEntryPoints(filePaths),
    notableFiles: findNotable(filePaths),
  };

  // ── Extension stats + language detection ────────────────────────────
  const detectedLangsSet = new Set<string>();
  filePaths.forEach((path) => {
    const dot = path.lastIndexOf('.');
    const ext = dot >= 0 ? path.slice(dot).toLowerCase() : '';
    if (ext) {
      info.fileStats.byExtension[ext] = (info.fileStats.byExtension[ext] || 0) + 1;
      if (CODE_EXTENSIONS.includes(ext)) info.fileStats.codeFiles++;
      if (CONFIG_EXTENSIONS.includes(ext)) info.fileStats.configFiles++;
      if (LANGUAGE_MAP[ext]) detectedLangsSet.add(LANGUAGE_MAP[ext]);
    }
  });
  info.detectedLanguages = Array.from(detectedLangsSet).sort();

  const extensions = Object.entries(info.fileStats.byExtension).sort((a, b) => b[1] - a[1]);
  if (extensions.length > 0) {
    const topExt = extensions[0][0];
    if (['.js', '.jsx', '.ts', '.tsx'].includes(topExt)) {
      info.language = 'JavaScript/TypeScript';
      info.suggestedGitignore.push(...GITIGNORE_PATTERNS.node);
    } else if (topExt === '.py') {
      info.language = 'Python';
      info.suggestedGitignore.push(...GITIGNORE_PATTERNS.python);
    } else if (topExt === '.java') {
      info.language = 'Java';
      info.suggestedGitignore.push(...GITIGNORE_PATTERNS.java);
    } else if (topExt === '.php') {
      info.language = 'PHP';
      info.suggestedGitignore.push(...GITIGNORE_PATTERNS.php);
    } else if (topExt === '.go') {
      info.language = 'Go';
      info.suggestedGitignore.push(...GITIGNORE_PATTERNS.go);
    }
  }

  // ── Package manager ─────────────────────────────────────────────────
  if (filePaths.some((f) => f.includes('yarn.lock'))) info.packageManager = 'yarn';
  else if (filePaths.some((f) => f.includes('pnpm-lock.yaml'))) info.packageManager = 'pnpm';
  else if (filePaths.some((f) => f.includes('bun.lockb'))) info.packageManager = 'bun';

  // ── package.json — REAL metadata ────────────────────────────────────
  const packageJsonPath = filePaths.find((p) => p.endsWith('package.json'));
  let pkg: any = null;
  if (packageJsonPath && files.has(packageJsonPath)) {
    pkg = safeJsonParse(files.get(packageJsonPath) || '');
    if (pkg && typeof pkg === 'object') {
      const repo =
        typeof pkg.repository === 'string'
          ? pkg.repository
          : pkg.repository?.url || '';
      info.packageMeta = {
        name: pkg.name,
        version: pkg.version,
        description: pkg.description,
        author: typeof pkg.author === 'string' ? pkg.author : pkg.author?.name,
        license: pkg.license,
        homepage: pkg.homepage,
        repository: repo,
        scripts: pkg.scripts || {},
        dependencies: pkg.dependencies ? Object.keys(pkg.dependencies) : [],
        devDependencies: pkg.devDependencies ? Object.keys(pkg.devDependencies) : [],
      };
    }
  }

  // ── Framework detection (file marker OR dependency indicator) ───────
  for (const [framework, patterns] of Object.entries(FRAMEWORK_PATTERNS)) {
    const hasFile = patterns.files.some((f) =>
      filePaths.some((p) => p === f || p.endsWith('/' + f)),
    );
    let hasIndicator = false;
    if (pkg) {
      const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      hasIndicator = patterns.indicators.some((ind) => ind in allDeps);
    } else if (packageJsonPath && files.has(packageJsonPath)) {
      const content = files.get(packageJsonPath) || '';
      hasIndicator = patterns.indicators.some((ind) => content.includes(`"${ind}"`));
    }
    if (hasFile || hasIndicator) {
      info.framework = framework;
      break;
    }
  }

  // ── Commands (prefer real scripts when available) ───────────────────
  const pm = info.packageManager;
  const pmRun = pm === 'npm' ? 'npm run' : pm;
  const scripts = info.packageMeta?.scripts || {};
  const has = (k: string) => typeof scripts[k] === 'string';

  const pickScript = (...names: string[]) => names.find(has);

  switch (info.framework) {
    case 'React':
    case 'Vite':
    case 'Next.js':
    case 'Astro':
    case 'Remix':
    case 'Nuxt.js':
    case 'SvelteKit':
    case 'Vue.js':
    case 'Angular':
    case 'Svelte':
      info.type = info.framework === 'Next.js' || info.framework === 'Nuxt.js' || info.framework === 'Remix' || info.framework === 'SvelteKit'
        ? 'Full-Stack Web Application'
        : 'Web Application';
      info.installCommand = `${pm} install`;
      info.runCommand = `${pmRun} ${pickScript('dev', 'start', 'serve') || 'dev'}`;
      info.buildCommand = `${pmRun} ${pickScript('build') || 'build'}`;
      break;
    case 'Express':
    case 'Fastify':
    case 'NestJS':
      info.type = 'Backend / API';
      info.installCommand = `${pm} install`;
      info.runCommand = `${pmRun} ${pickScript('dev', 'start', 'serve') || 'start'}`;
      info.buildCommand = has('build') ? `${pmRun} build` : '';
      break;
    case 'Django':
      info.type = 'Python Web Application';
      info.installCommand = 'pip install -r requirements.txt';
      info.runCommand = 'python manage.py runserver';
      info.buildCommand = '';
      break;
    case 'Flask':
    case 'FastAPI':
      info.type = 'Python Web Application';
      info.installCommand = 'pip install -r requirements.txt';
      info.runCommand = info.framework === 'Flask' ? 'flask run' : 'uvicorn main:app --reload';
      info.buildCommand = '';
      break;
    case 'Laravel':
      info.type = 'PHP Web Application';
      info.installCommand = 'composer install && npm install';
      info.runCommand = 'php artisan serve';
      info.buildCommand = 'npm run build';
      break;
    case 'Spring Boot':
      info.type = 'Java Backend';
      info.installCommand = filePaths.some((p) => p.endsWith('pom.xml')) ? 'mvn install' : './gradlew build';
      info.runCommand = filePaths.some((p) => p.endsWith('pom.xml')) ? 'mvn spring-boot:run' : './gradlew bootRun';
      info.buildCommand = filePaths.some((p) => p.endsWith('pom.xml')) ? 'mvn package' : './gradlew build';
      break;
    case 'Ruby on Rails':
      info.type = 'Ruby Web Application';
      info.installCommand = 'bundle install';
      info.runCommand = 'rails server';
      info.buildCommand = '';
      break;
    case 'Go (Gin)':
      info.type = 'Go Backend';
      info.installCommand = 'go mod download';
      info.runCommand = 'go run .';
      info.buildCommand = 'go build -o app';
      break;
    default:
      if (packageJsonPath) {
        info.installCommand = `${pm} install`;
        info.runCommand = `${pmRun} ${pickScript('dev', 'start') || 'start'}`;
        if (has('build')) info.buildCommand = `${pmRun} build`;
      }
  }

  // ── Feature detection (real, content-grounded) ──────────────────────
  const allContent = Array.from(files.values()).join(' ').toLowerCase();
  const allDepsList = [
    ...(info.packageMeta?.dependencies || []),
    ...(info.packageMeta?.devDependencies || []),
  ].join(' ').toLowerCase();

  const seen = (needle: string) =>
    allDepsList.includes(needle) || allContent.includes(needle);

  if (filePaths.some((f) => f.endsWith('.ts') || f.endsWith('.tsx')) || seen('typescript')) info.features.push('TypeScript');
  if (seen('tailwind')) info.features.push('Tailwind CSS');
  if (seen('framer-motion')) info.features.push('Framer Motion');
  if (seen('react-router')) info.features.push('React Router');
  if (seen('@tanstack/react-query')) info.features.push('React Query');
  if (seen('zod')) info.features.push('Zod validation');
  if (seen('drizzle')) info.features.push('Drizzle ORM');
  if (seen('prisma')) info.features.push('Prisma ORM');
  if (seen('mongoose') || seen('mongodb')) info.features.push('MongoDB');
  if (seen('postgres')) info.features.push('PostgreSQL');
  if (seen('mysql')) info.features.push('MySQL');
  if (seen('firebase')) info.features.push('Firebase');
  if (seen('supabase')) info.features.push('Supabase');
  if (seen('stripe')) info.features.push('Stripe');
  if (seen('clerk')) info.features.push('Clerk Auth');
  if (filePaths.some((f) => f.endsWith('.scss') || f.endsWith('.sass')) || seen('sass')) info.features.push('SASS/SCSS');
  if (filePaths.some((f) => f.toLowerCase().endsWith('dockerfile')) || seen('docker')) info.features.push('Docker');
  if (seen('jest') || seen('vitest') || seen('playwright') || seen('cypress')) info.features.push('Testing');
  if (seen('eslint')) info.features.push('ESLint');
  if (seen('prettier')) info.features.push('Prettier');
  if (filePaths.some((f) => f.includes('.github/workflows'))) info.features.push('GitHub Actions CI');

  info.description = generateDescription(info);
  info.suggestedGitignore = [...new Set(info.suggestedGitignore)];
  info.detectedLanguages = [...new Set(info.detectedLanguages)].sort();
  info.features = [...new Set(info.features)];
  return info;
}

function generateDescription(info: ProjectInfo): string {
  // Prefer the real package.json description when present
  const pkgDesc = info.packageMeta?.description?.trim();
  if (pkgDesc) return pkgDesc;

  let desc = `A ${info.language} project`;
  if (info.framework !== 'Unknown') desc = `A ${info.framework} ${info.type.toLowerCase()}`;
  if (info.features.length > 0) {
    const top = info.features.slice(0, 3).join(', ');
    desc += ` built with ${top}`;
  }
  return desc + '.';
}

function badgeUrl(label: string, value: string, color: string, logo?: string) {
  const enc = (s: string) => encodeURIComponent(s.replace(/-/g, '--'));
  const logoBit = logo ? `&logo=${encodeURIComponent(logo)}&logoColor=white` : '';
  return `https://img.shields.io/badge/${enc(label)}-${enc(value)}-${color}?style=flat-square${logoBit}`;
}

function langBadges(info: ProjectInfo): string[] {
  const out: string[] = [];
  const map: Array<[string, string, string, string?]> = [
    ['TypeScript', 'TypeScript', '3178C6', 'typescript'],
    ['React', 'React', '20232A', 'react'],
    ['Next.js', 'Next.js', '000000', 'nextdotjs'],
    ['Vite', 'Vite', '646CFF', 'vite'],
    ['Tailwind CSS', 'TailwindCSS', '38B2AC', 'tailwindcss'],
    ['Vue.js', 'Vue', '4FC08D', 'vuedotjs'],
    ['Svelte', 'Svelte', 'FF3E00', 'svelte'],
    ['Python', 'Python', '3776AB', 'python'],
    ['Django', 'Django', '092E20', 'django'],
    ['Flask', 'Flask', '000000', 'flask'],
    ['FastAPI', 'FastAPI', '009688', 'fastapi'],
    ['Java', 'Java', '007396', 'openjdk'],
    ['Spring Boot', 'SpringBoot', '6DB33F', 'springboot'],
    ['Go', 'Go', '00ADD8', 'go'],
    ['PHP', 'PHP', '777BB4', 'php'],
    ['Laravel', 'Laravel', 'FF2D20', 'laravel'],
    ['Docker', 'Docker', '2496ED', 'docker'],
  ];
  const have = (k: string) =>
    info.framework === k ||
    info.language === k ||
    info.features.includes(k) ||
    info.detectedLanguages.includes(k);
  for (const [needle, label, color, logo] of map) {
    if (have(needle)) out.push(`![${label}](${badgeUrl(label, 'ready', color, logo)})`);
  }
  return out.slice(0, 6);
}

function pickScripts(info: ProjectInfo): Array<{ name: string; cmd: string }> {
  const scripts = info.packageMeta?.scripts || {};
  const preferred = ['dev', 'start', 'build', 'preview', 'serve', 'test', 'lint', 'typecheck', 'format'];
  const out: Array<{ name: string; cmd: string }> = [];
  for (const k of preferred) if (scripts[k]) out.push({ name: k, cmd: scripts[k] });
  // Add up to 3 other custom scripts the user wrote
  for (const [k, v] of Object.entries(scripts)) {
    if (out.length >= 8) break;
    if (!preferred.includes(k)) out.push({ name: k, cmd: String(v) });
  }
  return out;
}

function topDeps(info: ProjectInfo, n: number): string[] {
  return (info.packageMeta?.dependencies || []).slice(0, n);
}

export function generateReadme(projectName: string, info: ProjectInfo): string {
  const meta = info.packageMeta;
  const displayName = meta?.name || projectName;
  const badges = langBadges(info);
  const scripts = pickScripts(info);
  const deps = topDeps(info, 12);

  const lines: string[] = [];

  // ── Header ────────────────────────────────────────────────────────
  lines.push(`# ${displayName}`);
  lines.push('');
  if (badges.length) {
    lines.push(badges.join(' '));
    lines.push('');
  }
  lines.push(`> ${info.description}`);
  lines.push('');

  if (meta?.version || meta?.author || meta?.license || meta?.homepage) {
    const bits: string[] = [];
    if (meta.version) bits.push(`**Version:** ${meta.version}`);
    if (meta.author) bits.push(`**Author:** ${meta.author}`);
    if (meta.license) bits.push(`**License:** ${meta.license}`);
    if (meta.homepage) bits.push(`**Homepage:** ${meta.homepage}`);
    lines.push(bits.join(' · '));
    lines.push('');
  }

  // ── Tech Stack ────────────────────────────────────────────────────
  lines.push('## 📦 Tech Stack');
  lines.push('');
  lines.push(`- **Framework:** ${info.framework}`);
  lines.push(`- **Language:** ${info.language}`);
  lines.push(`- **Package Manager:** ${info.packageManager}`);
  if (info.detectedLanguages.length)
    lines.push(`- **Detected Languages:** ${info.detectedLanguages.join(', ')}`);
  if (info.features.length)
    lines.push(`- **Features:** ${info.features.join(', ')}`);
  lines.push('');

  // ── Quick Start ───────────────────────────────────────────────────
  lines.push('## 🚀 Quick Start');
  lines.push('');
  if (info.installCommand) {
    lines.push('### Install dependencies');
    lines.push('');
    lines.push('```bash');
    lines.push(info.installCommand);
    lines.push('```');
    lines.push('');
  }
  if (info.runCommand) {
    lines.push('### Run in development');
    lines.push('');
    lines.push('```bash');
    lines.push(info.runCommand);
    lines.push('```');
    lines.push('');
  }
  if (info.buildCommand) {
    lines.push('### Build for production');
    lines.push('');
    lines.push('```bash');
    lines.push(info.buildCommand);
    lines.push('```');
    lines.push('');
  }

  // ── Real package.json scripts ────────────────────────────────────
  if (scripts.length) {
    lines.push('## 🧰 Available Scripts');
    lines.push('');
    lines.push('| Script | Command |');
    lines.push('| --- | --- |');
    for (const s of scripts) {
      const safeCmd = s.cmd.replace(/\|/g, '\\|');
      lines.push(`| \`${s.name}\` | \`${safeCmd}\` |`);
    }
    lines.push('');
  }

  // ── Real entry points ────────────────────────────────────────────
  if (info.entryPoints.length) {
    lines.push('## 🎯 Entry Points');
    lines.push('');
    for (const e of info.entryPoints) lines.push(`- \`${e}\``);
    lines.push('');
  }

  // ── Project structure ────────────────────────────────────────────
  if (info.topFolders.length) {
    lines.push('## 📁 Project Structure');
    lines.push('');
    lines.push('```text');
    lines.push(`${displayName}/`);
    for (const folder of info.topFolders.slice(0, 16)) lines.push(`├── ${folder}/`);
    lines.push('```');
    lines.push('');
  }

  // ── Real dependencies (top N) ────────────────────────────────────
  if (deps.length) {
    lines.push('## 📚 Key Dependencies');
    lines.push('');
    for (const d of deps) lines.push(`- \`${d}\``);
    if ((info.packageMeta?.dependencies?.length || 0) > deps.length) {
      lines.push(`- _…and ${(info.packageMeta!.dependencies!.length - deps.length)} more_`);
    }
    lines.push('');
  }

  // ── Stats ────────────────────────────────────────────────────────
  lines.push('## 📊 Project Stats');
  lines.push('');
  lines.push(`- **Total Files:** ${info.fileStats.total}`);
  lines.push(`- **Code Files:** ${info.fileStats.codeFiles}`);
  lines.push(`- **Config Files:** ${info.fileStats.configFiles}`);
  if (info.notableFiles.length)
    lines.push(`- **Notable Files:** ${info.notableFiles.join(', ')}`);
  lines.push('');

  // ── License ──────────────────────────────────────────────────────
  lines.push('## 📝 License');
  lines.push('');
  lines.push(meta?.license ? `${meta.license} License` : 'MIT License');
  lines.push('');

  // ── Attribution ──────────────────────────────────────────────────
  lines.push('---');
  lines.push('');
  lines.push('<!-- ZIP2GIT_ATTRIBUTION:DO_NOT_REMOVE -->');
  lines.push(
    '> 🚀 **Pushed to GitHub using [Zip2Git](https://zip2git.online)** — the free ZIP → GitHub converter by [codebyshareef](https://www.codebyshareef.online).',
  );
  lines.push('<!-- /ZIP2GIT_ATTRIBUTION -->');
  lines.push('');

  return lines.join('\n');
}

export function generateGitignore(info: ProjectInfo): string {
  const seen = new Set<string>();
  const out: string[] = ['# Generated by Zip2Git', ''];

  const section = (header: string, predicate: (l: string) => boolean) => {
    const matches = info.suggestedGitignore.filter(predicate).filter((l) => {
      if (seen.has(l)) return false;
      seen.add(l);
      return true;
    });
    if (matches.length) {
      out.push(`# ${header}`);
      out.push(...matches);
      out.push('');
    }
  };

  section('Dependencies', (l) => /node_modules|vendor|venv|env\//.test(l));
  section('Build outputs', (l) => /dist|build|target|\.next|\.turbo/.test(l));
  section('Environment files', (l) => /\.env/.test(l));
  section('IDE and OS files', (l) => /\.idea|\.vscode|DS_Store|Thumbs|swp|swo|~$/.test(l));
  section('Logs and caches', (l) => /log|cache/.test(l));
  // Anything left
  const leftovers = info.suggestedGitignore.filter((l) => !seen.has(l));
  if (leftovers.length) {
    out.push('# Misc');
    out.push(...leftovers);
    out.push('');
  }

  return out.join('\n');
}

export function generateCommitMessage(info: ProjectInfo, _repoName: string): string {
  const action =
    info.framework !== 'Unknown'
      ? `Initialize ${info.framework} project`
      : `Initialize ${info.language} project`;

  const details: string[] = [];
  if (info.features.length > 0) details.push(`with ${info.features.slice(0, 2).join(' and ')}`);

  return `🚀 ${action}${details.length > 0 ? ' ' + details.join(', ') : ''}

- Setup ${info.type.toLowerCase()}
- ${info.fileStats.codeFiles} code files
- Generated README.md and .gitignore
- Created via Zip2Git (https://zip2git.online)`;
}
