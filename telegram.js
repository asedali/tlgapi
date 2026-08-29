import * as cheerio from "cheerio";

const TELEGRAM_URL =
    "https://t.me/s/abshodeh_hanzaei";


export async function getTelegramPosts() {

    console.log("Fetching Telegram channel...");

    const response = await fetch(
        TELEGRAM_URL,
        {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
                    "AppleWebKit/537.36 (KHTML, like Gecko) " +
                    "Chrome/150.0.0.0 Safari/537.36"
            }
        }
    );


    if (!response.ok) {

        throw new Error(
            `Telegram HTTP ${response.status}`
        );
    }


    const html =
        await response.text();


    console.log(
        `Telegram page received: ${html.length} bytes`
    );


    const $ =
        cheerio.load(html);


    const posts = [];


    $(".tgme_widget_message").each(
        function () {

            const post = $(this);


            const text =
                post
                    .find(".tgme_widget_message_text")
                    .text()
                    .trim();


            const link =
                post
                    .find(".tgme_widget_message_date")
                    .attr("href");


            if (!text) {
                return;
            }


            posts.push({
                content_text: text,
                url: link || null
            });
        }
    );


    console.log(
        `Telegram posts found: ${posts.length}`
    );


    return posts;
}