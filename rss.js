import "dotenv/config";
import { parseMessage } from "./parser.js";
import { updateOnPocketBase } from "./pocketbase.js";

const RSS_URL =
    "https://rss.app/feeds/v1.1/eX7NUJO3YxLKugmX.json";

let lastPostId = null;

async function checkRSS() {

    try {

        console.log(
            `[${new Date().toISOString()}] Checking RSS...`
        );

        const response = await fetch(RSS_URL);

        if (!response.ok) {
            throw new Error(
                `RSS HTTP ${response.status}`
            );
        }

        const feed = await response.json();

        if (!feed.items || feed.items.length === 0) {
            console.log("No posts found");
            return;
        }

        // RSS.app normally puts newest item first
        const post = feed.items[0];

        console.log("Latest post:");
        console.log(post);

        // RSS item ID
        const postId =
            post.id ||
            post.guid ||
            post.url ||
            post.link;

        // First execution:
        // don't process the existing latest post
        if (lastPostId === null) {

            lastPostId = postId;

            console.log(
                "Initial post detected. Waiting for new post..."
            );

            return;
        }

        // Nothing new
        if (postId === lastPostId) {

            console.log("No new post.");

            return;
        }

        // New post
        lastPostId = postId;

        console.log("🔥 NEW TELEGRAM POST");

        // RSS.app may use different fields depending on feed.
        const text =
            post.content_text ||
            post.content ||
            post.description ||
            post.title ||
            "";

        console.log(text);

        const result = parseMessage(text);

        if (!result) {

            console.log(
                "Post is not one of the four required types."
            );

            return;
        }

        console.log("Extracted:");
        console.log(result);

        await updateOnPocketBase(
            result.field,
            result.value
        );

    } catch (error) {

        console.error(
            "RSS error:",
            error.message
        );
    }
}


// Check immediately
await checkRSS();

// Then every 30 seconds
setInterval(
    checkRSS,
    3 * 1000
);