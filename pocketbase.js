import PocketBase from "pocketbase";

const pb = new PocketBase(process.env.PB_URL);

export async function loginPocketBase() {
    await pb.collection("_superusers").authWithPassword(
        process.env.PB_EMAIL,
        process.env.PB_PASSWORD
    );

    console.log("✓ PocketBase connected");
}


/**
 * Find the values record where state = true.
 */
export async function getActiveRecord() {
    try {
        const result = await pb.collection("values").getList(1, 1, {
            filter: "state = true"
        });

        if (result.items.length === 0) {
            return null;
        }

        return result.items[0];

    } catch (error) {
        console.error(
            "PocketBase read error:",
            error.message
        );

        throw error;
    }
}


/**
 * Update ONLY x/y/w/z.
 */
export async function updateValues(record, updates) {

    const allowed = ["x", "y", "w", "z"];

    const data = {};

    for (const field of allowed) {

        if (updates[field] === undefined) {
            continue;
        }

        const newValue = updates[field];
        const oldValue = record[field];

        if (newValue === oldValue) {
            console.log(
                `  ${field}: ${newValue} (unchanged)`
            );
            continue;
        }

        console.log(
            `  ${field}: ${oldValue} → ${newValue}`
        );

        data[field] = newValue;
    }


    if (Object.keys(data).length === 0) {
        console.log("No PocketBase update required.");
        return;
    }


    await pb.collection("values").update(
        record.id,
        data
    );

    console.log(
        "✓ PocketBase updated:",
        data
    );
}