import { main } from "@/db/seed/media";

export async function GET() {
    main().catch((error) => {
        console.error("Error seeding media:", error);
    });
  return new Response("Hello, World!");
}