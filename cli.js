#!/usr/bin/env node

import { program } from "commander";
import { exec } from "child_process";
import path from "path";
import fs from "fs-extra";

program
  .arguments("<project-name>")
  .description(
    "Creates a React 19 SSR multi-page app (TypeScript or JavaScript)"
  )
  .option(
    "--nossr",
    "Create a React 19 SPA without SSR (TypeScript or JavaScript)"
  )
  .action((projectName, options) => {
    const projectPath = path.join(process.cwd(), projectName);
    let repositoryUrl = "https://github.com/roggc/react19ssr.git";

    if (options.nossr) {
      repositoryUrl = "https://github.com/roggc/react19.git";
    }

    console.log(`Creating a new React 19 app: ${projectName}`);

    // Clone the repository
    exec(`git clone ${repositoryUrl} ${projectName}`, (error) => {
      if (error) {
        console.error(`Error cloning the repository: ${error}`);
        return;
      }

      // Change to the project directory
      process.chdir(projectPath);

      // Remove the existing .git directory using fs-extra
      fs.remove(path.join(projectPath, ".git"), (error) => {
        if (error) {
          console.error(`Error removing the existing .git directory: ${error}`);
          return;
        }

        console.log(".git directory removed successfully.");

        // Initialize a new git repository
        exec("git init", (error) => {
          if (error) {
            console.error(`Error initializing a new git repository: ${error}`);
            return;
          }

          // Add all files to the new repository
          exec("git add .", (error) => {
            if (error) {
              console.error(`Error adding files to the repository: ${error}`);
              return;
            }

            // Commit the changes
            exec('git commit -m "Initial commit"', (error) => {
              if (error) {
                console.error(`Error creating the initial commit: ${error}`);
                return;
              }

              console.log("Initial commit created successfully.");

              // Install project dependencies
              exec("npm install", (error) => {
                if (error) {
                  console.error(`Error installing dependencies: ${error}`);
                  return;
                }

                console.log("Project setup complete.");
              });
            });
          });
        });
      });
    });
  });

program.parse(process.argv);
