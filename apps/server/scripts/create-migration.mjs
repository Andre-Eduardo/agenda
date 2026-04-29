import prompts from "prompts";
import { execSync } from "child_process";

const response = await prompts({
  type: "text",
  name: "migrationName",
  message: "What is the name of the migration?",
});

if (!response.migrationName) {
  console.log("No migration name provided, exiting...");
  process.exit(1);
}

// Run the prisma command to create the migration
execSync(
  `npx prisma migrate dev --create-only --name ${response.migrationName.replaceAll(" ", "_")}`,
  { stdio: "inherit" },
);
