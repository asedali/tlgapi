function normalizeNumber(value) {

    if (!value) {
        return null;
    }

    return Number(
        value
            // Persian digits → English
            .replace(/[۰-۹]/g, d =>
                "۰۱۲۳۴۵۶۷۸۹".indexOf(d)
            )

            // Remove Persian/English commas
            .replace(/[٬,]/g, "")

            .trim()
    );
}


export function parsePost(text) {

    if (!text) {
        return null;
    }


    // ==================================================
    // نقد فردا
    // مثقال → فروش → x
    // ==================================================

    if (text.includes("نقد فردا")) {

        const match = text.match(
            /هر\s*مثقال[\s\S]*?فروش\s*:\s*([\d۰-۹,٬]+)/
        );

        if (!match) {
            return null;
        }

        return {
            field: "x",
            value: normalizeNumber(match[1])
        };
    }


    // ==================================================
    // تمام سکه 86
    // فروش → y
    // ==================================================

    if (text.includes("تمام سکه 86")) {

        const match = text.match(
            /فروش\s*:\s*([\d۰-۹,٬]+)/
        );

        if (!match) {
            return null;
        }

        return {
            field: "y",
            value: normalizeNumber(match[1])
        };
    }


    // ==================================================
    // نیم سکه 86
    // فروش → z
    // ==================================================

    if (text.includes("نیم سکه 86")) {

        const match = text.match(
            /فروش\s*:\s*([\d۰-۹,٬]+)/
        );

        if (!match) {
            return null;
        }

        return {
            field: "z",
            value: normalizeNumber(match[1])
        };
    }


    // ==================================================
    // ربع سکه 86
    // فروش → w
    // ==================================================

    if (text.includes("ربع سکه 86")) {

        const match = text.match(
            /فروش\s*:\s*([\d۰-۹,٬]+)/
        );

        if (!match) {
            return null;
        }

        return {
            field: "w",
            value: normalizeNumber(match[1])
        };
    }


    return null;
}