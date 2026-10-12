# create-dinou 🦖

The easiest way to scaffold a new **[Dinou](https://www.npmjs.com/package/dinou)** application — a React 19 framework.

## Quick Start

You can create a new Dinou app using your package manager of choice:

### npm
```bash
npm create dinou@latest
# or specifying the project name
npm create dinou@latest my-app
```

### npx
```bash
npx create-dinou@latest my-app
```

### pnpm
```bash
pnpm create dinou my-app
```

### yarn
```bash
yarn create dinou my-app
```

### bun
```bash
bun create dinou my-app
```

---

## Interactive Setup

If you run `create-dinou` without arguments, it will guide you interactively:
- **Project name**: Choose the directory name for your application.
- **Package manager**: Automatically detects whether you invoked it with `npm`, `pnpm`, `yarn`, or `bun`.
- **Install dependencies**: Choose whether to install dependencies immediately.
- **Git repository**: Choose whether to initialize a clean Git repository with an initial commit.

---

## Options & Flags

You can customize or automate project creation using the following options:

| Option | Description |
| :--- | :--- |
| `[project-name]` | Name of the project directory |
| `-y, --yes` | Skip prompts and use defaults (`dinou-app`, install dependencies, init git) |
| `--no-install` | Skip dependency installation |
| `--no-git` | Skip Git repository initialization |
| `--pm <manager>` | Specify package manager (`npm`, `pnpm`, `yarn`, `bun`) |
| `-t, --template <url>` | Custom Git repository template (default: `https://github.com/roggc/dinou-app.git`) |
| `-v, --version` | Output the current version |
| `-h, --help` | Display help information |

### Non-interactive example (CI / fast setup)

```bash
npx create-dinou@latest my-app -y
```

---

## Related Links

- [dinou on npm](https://www.npmjs.com/package/dinou)
- [dinou-app template repository](https://github.com/roggc/dinou-app)

## License

[MIT](https://opensource.org/licenses/MIT)
