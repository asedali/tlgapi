import "dotenv/config";

import input from "input";

import {
    TelegramClient,
    Api
} from "teleproto";

import {
    StringSession
} from "teleproto/sessions/index.js";

import {
    NewMessage
} from "teleproto/events/index.js";

import {
    loginPocketBase,
    getActiveRecord,
    updateValues
} from "./pocketbase.js";

import {
    parsePost
} from "./parser.js";

// ==================================================
// Configuration
// ==================================================

const API_ID =
    Number(process.env.TELEGRAM_API_ID);

const API_HASH =
    process.env.TELEGRAM_API_HASH;

const PHONE =
    process.env.TELEGRAM_PHONE;

const SAVED_SESSION =
    process.env.TELEGRAM_SESSION || "";

const CHANNEL =
    process.env.TELEGRAM_CHANNEL ||
    "abshodeh_hanzaei";


// ==================================================
// Validate configuration
// ==================================================

if (!API_ID) {
    throw new Error(
        "TELEGRAM_API_ID is missing"
    );
}

if (!API_HASH) {
    throw new Error(
        "TELEGRAM_API_HASH is missing"
    );
}

if (!PHONE) {
    throw new Error(
        "TELEGRAM_PHONE is missing"
    );
}


// ==================================================
// Telegram client
// ==================================================

const session =
    new StringSession(SAVED_SESSION);


const client =
    new TelegramClient(
        session,
        API_ID,
        API_HASH,
        {
            connectionRetries: 5,
            retryDelay: 2000,
            autoReconnect: true,
            sequentialUpdates: true
        }
    );


// ==================================================
// Login
// ==================================================

async function loginTelegram() {

    console.log(
        "Connecting to Telegram..."
    );


    await client.start({

        phoneNumber: async () => {

            return PHONE;
        },


        password: async () => {

            return await input.text(
                "Telegram 2FA password: "
            );
        },


        phoneCode: async () => {

            return await input.text(
                "Telegram login code: "
            );
        },


        onError: (error) => {

            console.error(
                "Telegram login error:",
                error
            );
        }

    });


    console.log(
        "✓ Telegram connected"
    );


    const me =
        await client.getMe();


    console.log(
        `Logged in as: ${me.username || me.firstName || me.id}`
    );


    // ------------------------------------------------
    // IMPORTANT:
    // Save this session.
    // ------------------------------------------------

    const newSession =
        client.session.save();


    if (!SAVED_SESSION) {

        console.log(
            "\n=========================================="
        );

        console.log(
            "TELEGRAM SESSION:"
        );

        console.log(
            newSession
        );

        console.log(
            "==========================================\n"
        );

        console.log(
            "Copy this value to TELEGRAM_SESSION in .env"
        );
    }
}


// ==================================================
// Find Telegram channel
// ==================================================

async function getChannel() {

    console.log(
        `Resolving channel: @${CHANNEL}`
    );


    const entity =
        await client.getEntity(
            CHANNEL.startsWith("@")
                ? CHANNEL
                : `@${CHANNEL}`
        );


    console.log(
        `✓ Channel found: ${entity.title || CHANNEL}`
    );


    console.log(
        `Channel ID: ${entity.id}`
    );


    return entity;
}


// ==================================================
// Process new Telegram post
// ==================================================

async function processNewPost(message) {

    try {

        const text =
            message.text || "";


        if (!text.trim()) {

            console.log(
                `Message ${message.id}: no text, ignored`
            );

            return;
        }


        console.log(
            "\n=========================================="
        );

        console.log(
            `New Telegram post: ${message.id}`
        );

        console.log(
            text
        );

        console.log(
            "=========================================="
        );


        // ------------------------------------------------
        // Parse the post
        // ------------------------------------------------

        const result =
            parsePost(text);


        // Not one of our four required posts
        if (!result) {

            console.log(
                "Not a required price post → ignored"
            );

            return;
        }


        console.log(
            `Parsed: ${result.field} = ${result.value}`
        );


        // ------------------------------------------------
        // Check PocketBase state
        // ------------------------------------------------

        const record =
            await getActiveRecord();


        if (!record) {

            console.log(
                "No values record with state=true."
            );

            console.log(
                "PocketBase update skipped."
            );

            return;
        }


        console.log(
            `Active PocketBase record: ${record.id}`
        );


        // ------------------------------------------------
        // Update only the parsed field
        // ------------------------------------------------

        const updates = {

            [result.field]:
                result.value

        };


        await updateValues(
            record,
            updates
        );


        console.log(
            `✓ Updated ${result.field} = ${result.value}`
        );


    } catch (error) {

        console.error(
            "Error processing Telegram post:",
            error
        );
    }
}


// ==================================================
// Start Telegram listener
// ==================================================

async function startListener() {

    await loginTelegram();


    // Resolve channel once.
    const channel =
        await getChannel();


    // ------------------------------------------------
    // Listen ONLY to this channel
    // ------------------------------------------------

    // client.addEventHandler(

    //     async (event) => {

    //         const message =
    //             event.message;


    //         /*
    //          * Extra safety:
    //          *
    //          * Make sure the event actually belongs
    //          * to our target channel.
    //          */

    //         try {

    //             const chat =
    //                 await message.getChat();


    //             const username =
    //                 chat?.username;


    //             if (
    //                 username &&
    //                 username.toLowerCase() !==
    //                 CHANNEL.replace("@", "").toLowerCase()
    //             ) {

    //                 return;
    //             }

    //         } catch (error) {

    //             console.log(
    //                 "Could not verify chat:",
    //                 error.message
    //             );

    //             return;
    //         }


    //         await processNewPost(
    //             message
    //         );

    //     },


    //     new NewMessage({
    //         chats: [CHANNEL],
    //         incoming: true
    //     })

    // );
client.addEventHandler(
    async (event) => {

        try {

            const message = event.message;

            if (!message) {
                return;
            }

            console.log(
                "\n=========================================="
            );

            console.log(
                `NEW POST: ${message.id}`
            );

            console.log(
                message.text || ""
            );

            console.log(
                "=========================================="
            );

            await processNewPost(message);

        } catch (error) {

            console.error(
                "Error processing update:",
                error
            );
        }

    },

    new NewMessage({
            chats: [CHANNEL]
        })



    );

    console.log(
        `✓ Listening for NEW posts in @${CHANNEL}`
    );


    console.log(
        "Waiting for Telegram updates..."
    );


    // ------------------------------------------------
    // Recover missed updates after restart
    // ------------------------------------------------

    try {

        await client.catchUp();

        console.log(
            "✓ Telegram catch-up completed"
        );

    } catch (error) {

        console.error(
            "Catch-up failed:",
            error.message
        );
    }
}


// ==================================================
// PocketBase + Telegram startup
// ==================================================

async function main() {

    try {

        // ------------------------------------------------
        // PocketBase
        // ------------------------------------------------

        await loginPocketBase();

        console.log(
            "✓ PocketBase connected"
        );


        // ------------------------------------------------
        // Telegram
        // ------------------------------------------------

        await startListener();


    } catch (error) {

        console.error(
            "\nFATAL ERROR:"
        );

        console.error(
            error
        );

        process.exit(1);
    }
}


main();