import { seedMedia } from "./media";

async function main() {
  try {
    await seedMedia();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();