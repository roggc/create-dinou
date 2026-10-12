#!/usr/bin/env node

import { Command } from "commander";
import fs from "fs-extra";
import path from "node:path";
import process from "node:process";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import * as p from "@clack/prompts";
import pc from "picocolors";

const execPromise = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Detectar package manager usado al invocar el comando (npm, pnpm, yarn, bun)
function detectPackageManager() {
  const userAgent = process.env.npm_config_user_agent || "";
  if (userAgent.startsWith("pnpm")) return "pnpm";
  if (userAgent.startsWith("yarn")) return "yarn";
  if (userAgent.startsWith("bun")) return "bun";
  return "npm";
}

// Convertir un nombre de directorio en un identificador npm válido
function toValidPackageName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/^[._]/, "")
    .replace(/[^a-z0-9-~][^a-z0-9-_.]*/g, "-");
}

// Leer package.json de create-dinou para la versión
function getCliVersion() {
  try {
    const pkg = fs.readJsonSync(path.join(__dirname, "package.json"));
    return pkg.version || "0.0.5";
  } catch {
    return "0.0.5";
  }
}

async function main() {
  const version = getCliVersion();
  const program = new Command();

  program
    .name("create-dinou")
    .description("Scaffold a new Dinou v7 application")
    .argument("[project-name]", "Name of the project directory")
    .option("-t, --template <url>", "Git repository template", "https://github.com/roggc/dinou-app.git")
    .option("-y, --yes", "Skip prompts and use defaults", false)
    .option("--no-install", "Skip dependency installation")
    .option("--no-git", "Skip git repository initialization")
    .option("--pm <package-manager>", "Package manager to use (npm, pnpm, yarn, bun)")
    .version(version, "-v, --version", "Output the current version");

  program.parse(process.argv);

  const options = program.opts();
  let projectName = program.args[0];

  // Banner inicial
  p.intro(
    `${pc.bgCyan(pc.black(" create-dinou "))} ${pc.cyan(`v${version}`)} ${pc.dim("— The React 19 Framework")}`
  );

  // 1. Preguntar nombre del proyecto si no se especificó como argumento
  if (!projectName) {
    if (options.yes) {
      projectName = "dinou-app";
    } else {
      projectName = await p.text({
        message: "What is your project named?",
        placeholder: "my-dinou-app",
        defaultValue: "my-dinou-app",
        validate(value) {
          if (!value.trim()) return "Please enter a project name.";
          if (/[<>:"/\\|?*]/.test(value)) return "Invalid directory name.";
        },
      });

      if (p.isCancel(projectName)) {
        p.cancel("Operation cancelled.");
        process.exit(0);
      }
    }
  }

  const targetDir = path.resolve(process.cwd(), projectName);
  const targetBasename = path.basename(targetDir);

  // 2. Comprobar si el directorio existe y no está vacío
  if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
    if (options.yes) {
      await fs.emptyDir(targetDir);
    } else {
      const overwrite = await p.confirm({
        message: `Directory "${projectName}" is not empty. Clean it and continue?`,
        initialValue: false,
      });

      if (p.isCancel(overwrite) || !overwrite) {
        p.cancel("Operation cancelled.");
        process.exit(0);
      }
      await fs.emptyDir(targetDir);
    }
  }

  // 3. Determinar gestor de paquetes
  const detectedPM = detectPackageManager();
  let selectedPM = options.pm || detectedPM;

  // 4. Preguntar si instalar dependencias
  let shouldInstall = options.install;
  if (!options.yes && options.install !== false) {
    shouldInstall = await p.confirm({
      message: `Install dependencies with ${pc.cyan(selectedPM)}?`,
      initialValue: true,
    });

    if (p.isCancel(shouldInstall)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }
  }

  // 5. Preguntar si inicializar Git
  let shouldGit = options.git;
  if (!options.yes && options.git !== false) {
    shouldGit = await p.confirm({
      message: "Initialize a new Git repository?",
      initialValue: true,
    });

    if (p.isCancel(shouldGit)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }
  }

  const s = p.spinner();

  // 6. Clonar plantilla con shallow clone (--depth 1)
  s.start("Cloning Dinou template repository...");
  try {
    await execPromise(`git clone --depth 1 ${options.template} "${targetDir}"`, {
      maxBuffer: 10 * 1024 * 1024,
    });
    s.stop("Template cloned successfully.");
  } catch (err) {
    s.stop(pc.red("Failed to clone repository."));
    p.cancel(`Error: ${err.message}`);
    process.exit(1);
  }

  // 7. Limpiar el historial git clonado, lockfiles y adaptar package.json
  const cleanupSpinner = p.spinner();
  cleanupSpinner.start("Configuring project...");
  try {
    // Eliminar .git de la plantilla
    await fs.remove(path.join(targetDir, ".git"));

    // Eliminar lockfiles previos de la plantilla para asegurar compatibilidad con el PM y SO del usuario
    const lockfiles = ["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lockb"];
    for (const lockfile of lockfiles) {
      await fs.remove(path.join(targetDir, lockfile));
    }

    // Actualizar nombre y resetear versión en package.json
    const appPkgPath = path.join(targetDir, "package.json");
    if (await fs.pathExists(appPkgPath)) {
      const appPkg = await fs.readJson(appPkgPath);
      appPkg.name = toValidPackageName(targetBasename);
      appPkg.version = "0.0.1";
      delete appPkg.repository;
      await fs.writeJson(appPkgPath, appPkg, { spaces: 2 });
    }
    cleanupSpinner.stop("Project configured.");
  } catch (err) {
    cleanupSpinner.stop(pc.yellow("Warning: could not configure project cleanly."));
  }

  // 8. Instalar dependencias si se eligió
  if (shouldInstall) {
    s.start(`Installing dependencies with ${selectedPM}... (this might take a moment)`);
    try {
      await execPromise(`${selectedPM} install`, {
        cwd: targetDir,
        maxBuffer: 10 * 1024 * 1024,
      });
      s.stop("Dependencies installed successfully.");
    } catch (err) {
      s.stop(pc.yellow("Dependency installation encountered a warning, but files are ready."));
    }
  }

  // 9. Inicializar Git nuevo si se eligió
  if (shouldGit) {
    s.start("Initializing fresh Git repository...");
    try {
      await execPromise("git init", { cwd: targetDir });
      await execPromise("git add -A", { cwd: targetDir });
      await execPromise('git commit -m "feat: initial commit from create-dinou"', { cwd: targetDir });
      s.stop("Git repository initialized with initial commit.");
    } catch {
      s.stop(pc.yellow("Git initialized (commit skipped)."));
    }
  }

  // 10. Pasos siguientes personalizados según gestor de paquetes
  const isCurrentDir = targetDir === process.cwd();
  const runCmd = selectedPM === "npm" ? "npm run dev" : `${selectedPM} dev`;
  const nextSteps = [];

  if (!isCurrentDir) {
    nextSteps.push(`cd ${projectName}`);
  }
  if (!shouldInstall) {
    nextSteps.push(`${selectedPM} install`);
  }
  nextSteps.push(runCmd);

  p.note(nextSteps.map((step) => pc.cyan(step)).join("\n"), "Next steps:");
  p.outro(pc.green("✨ Your Dinou app is ready to develop! Happy coding! 🦖"));
}

main().catch((err) => {
  p.cancel(pc.red(`Unexpected error: ${err.message}`));
  process.exit(1);
});
